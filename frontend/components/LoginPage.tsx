import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Container,
  CircularProgress,
} from '@mui/material';
import { Google } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'var(--background-gradient)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2,
    }}>
      <Container maxWidth="sm">
        <Paper
          sx={{
            p: 4,
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                color: 'var(--primary)',
                fontWeight: 700,
                mb: 1,
              }}
            >
              Ther-Assist
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
            >
              AI-Powered Therapy Assistant
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Google Sign In */}
          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<Google />}
            onClick={handleGoogleSignIn}
            disabled={loading}
            sx={{
              py: 1.5,
              borderColor: '#dadce0',
              color: '#3c4043',
              '&:hover': {
                borderColor: '#5f6368',
                backgroundColor: '#f8f9fa',
              },
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Authenticate with Google'}
          </Button>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography>You must sign in with a valid @google.com account.</Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
