package com.email.writer.app;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class emailGeneratorService {

    private final WebClient webClient;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    public emailGeneratorService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }


    public String generateEmailReply(EmailRequest emailRequest) {
        long totalStart = System.nanoTime();

        long promptStart = System.nanoTime();

        String prompt = buildPrompt(emailRequest);

        Map<String, Object> requestBody = Map.of(
                "contents", new Object[]{
                        Map.of("parts", new Object[]{
                                Map.of("text", prompt)
                        })
                }
        );

        long requestBuildMs =
                (System.nanoTime() - promptStart) / 1_000_000;

        String finalUrl = geminiApiUrl + "?key=" + geminiApiKey;

        long geminiStart = System.nanoTime();

        String response = webClient.post()
                .uri(finalUrl)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .onStatus(
                        status -> status.isError(),
                        clientResponse -> clientResponse.bodyToMono(String.class)
                                .map(errorBody -> new RuntimeException(
                                        "Gemini API error "
                                                + clientResponse.statusCode()
                                                + ": " + errorBody
                                ))
                )
                .bodyToMono(String.class)
                .block();

        long geminiMs =
                (System.nanoTime() - geminiStart) / 1_000_000;

        long extractStart = System.nanoTime();

        String result = extractResponseContent(response);

        long extractMs =
                (System.nanoTime() - extractStart) / 1_000_000;

        long totalMs =
                (System.nanoTime() - totalStart) / 1_000_000;

        System.out.println("===== EMAIL GENERATION TIMING =====");
        System.out.println("Prompt + request build: " + requestBuildMs + " ms");
        System.out.println("Gemini API call: " + geminiMs + " ms");
        System.out.println("Response extraction: " + extractMs + " ms");
        System.out.println("Total backend time: " + totalMs + " ms");
        System.out.println("===================================");

        return result;
    }


    private String extractResponseContent(String response) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootnode = mapper.readTree(response);
            return rootnode.path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();
        } catch(Exception e) {
            return "Error processing request: " + e.getMessage();
        }
    }




    private String buildPrompt(EmailRequest emailRequest) {
        String tone = emailRequest.getTone();
        String mode = emailRequest.getEmailMode();
        String content = emailRequest.getEmailContent();

        if (tone == null || tone.isBlank()) {
            tone = "Professional";
        }

        if (mode == null || mode.isBlank()) {
            mode = "WRITE";
        }

        if ("REPLY".equalsIgnoreCase(mode)) {
            return """
                You are an intelligent email reply assistant.

                The user has provided an email they received.
                Write a suitable reply to that email.
                - Address the original sender by name only if clearly available.
                - Respond directly to the sender's message.
                - Do not invent facts or commitments.
                - Do not include a subject line.
                - Return only the email reply.

                Use this tone: %s.

                Received email:
                %s
                """.formatted(tone, content);
        }

        return """
            You are an intelligent email writing assistant.

            The user wants you to WRITE A NEW EMAIL based on their instructions.
            Treat the input as notes and instructions for the email, NOT as an
            email received from another person.
            Rewrite rough, emotional, informal, or unstructured wording into
            a clear, appropriate email while preserving the user's intended meaning.
            Address the recipient specified by the user when available.
            Include a suitable subject line.
            Do not invent facts, dates, times, or commitments.
            Return only the generated email, without explaining your process.

            Use this tone: %s.

            User's instructions:
            %s
            """.formatted(tone, content);
    }


}