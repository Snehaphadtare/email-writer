
import React, { useState } from 'react';
import './App.css';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Chip,
  Divider
} from '@mui/material';
import axios from 'axios';

const tones = ['Professional', 'Friendly', 'Casual', 'Concise'];

function App() {
  const [emailContent, setEmailContent] = useState('');
  const [tone, setTone] = useState('Professional');
  const [emailMode, setEmailMode] = useState('WRITE');
  const [generatedReply, setGeneratedReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!emailContent.trim()) {
      setError('Please paste an email or describe the email you want to write.');
      return;
    }

    setLoading(true);
    setError('');
    setCopied(false);
    setGeneratedReply('');

    try {
      
const response = await axios.post(
  'https://email-writer-112d.onrender.com/api/email/generate',
  {
    emailContent: emailContent.trim(),
    tone: tone.toLowerCase(),
    emailMode: emailMode
  }
);

      const result = typeof response.data === 'string'
        ? response.data
        : response.data?.message || response.data?.response || '';

      if (!result) {
        throw new Error('Empty response received');
      }

      setGeneratedReply(result);
    } catch (err) {
      console.error('Email generation failed:', err);

      if (err.response?.status === 429) {
        setError('Too many requests. Please wait a little before trying again.');
      } else {
        setError(
          err.response?.data?.message ||
          'Unable to generate your email right now. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedReply) return;

    try {
      await navigator.clipboard.writeText(generatedReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy the response. Please select and copy it manually.');
    }
  };

  return (
    <Box className="app-background">
      <Container
  maxWidth={false}
  sx={{
    width: '100%',
    maxWidth: '1600px',
    mx: 'auto',
    px: { xs: 2, sm: 3, md: 4 },
    py: { xs: 2, md: 3 }
  }}
>
        <Paper elevation={0} className="main-card">
          <Typography className="eyebrow">
            SMART EMAIL ASSISTANT
          </Typography>

          <Typography
            variant="h3"
            component="h1"
            className="main-heading"
          >
            Effortlessly generate responses with AI
          </Typography>

          <Typography className="subtitle">
            Write better emails in seconds with your personal AI-powered email assistant.
          </Typography>

          <Paper elevation={0} className="workspace">

            
<Typography variant="h6" className="section-heading">
  What would you like to do?
</Typography>

<Box className="tone-options" sx={{ mb: 2 }}>
  <Chip
    label="Write a new email"
    clickable
    color={emailMode === 'WRITE' ? 'primary' : 'default'}
    variant={emailMode === 'WRITE' ? 'filled' : 'outlined'}
    onClick={() => setEmailMode('WRITE')}
    disabled={loading}
  />

  <Chip
    label="Reply to a received email"
    clickable
    color={emailMode === 'REPLY' ? 'primary' : 'default'}
    variant={emailMode === 'REPLY' ? 'filled' : 'outlined'}
    onClick={() => setEmailMode('REPLY')}
    disabled={loading}
  />
</Box>

            <Typography variant="h6" className="section-heading">
              Your email or instructions
            </Typography>

            <TextField
              fullWidth
              multiline
              minRows={4}
              maxRows={10}
              placeholder="Paste an email you received, or describe the email you want to write..."
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              disabled={loading}
              className="email-input"
              inputProps={{ 'aria-label': 'Email content or writing instructions' }}
            />

            <Typography variant="h6" className="section-heading tone-heading">
              Choose a tone
            </Typography>

            <Box className="tone-options">
              {tones.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  clickable
                  color={tone === item ? 'primary' : 'default'}
                  variant={tone === item ? 'filled' : 'outlined'}
                  onClick={() => setTone(item)}
                  disabled={loading}
                  aria-pressed={tone === item}
                  className={`tone-chip ${tone === item ? 'selected' : ''}`}
                />
              ))}
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmit}
              disabled={!emailContent.trim() || loading}
              className="generate-button"
              startIcon={
                loading ? (
                  <CircularProgress size={19} color="inherit" />
                ) : (
                  <span aria-hidden="true">✧</span>
                )
              }
            >
              {loading ? 'Generating your reply...' : 'Generate Reply'}
            </Button>

            {error && (
              <Box role="alert" className="error-message">
                {error}
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Box className="response-header">
              <Typography variant="h6" className="section-heading">
                Generated response
              </Typography>

              <Button
                variant="text"
                onClick={handleCopy}
                disabled={!generatedReply || loading}
                className="copy-button"
              >
                {copied ? '✓ Copied!' : '▢ Copy'}
              </Button>
            </Box>

            <Paper elevation={0} className="response-box">
              {generatedReply ? (
                <Typography
                  component="div"
                  className="response-text"
                  sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                >
                  {generatedReply}
                </Typography>
              ) : (
                <Typography className="response-placeholder">
                  Your AI-generated email will appear here, ready to review and copy.
                </Typography>
              )}
            </Paper>
          </Paper>
        </Paper>
      </Container>
    </Box>
  );
}

export default App;
