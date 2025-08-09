import React from 'react';
import { Box, Paper, Typography, Button, Chip } from '@mui/material';
import { SwapHoriz, CheckCircle, Warning, TrendingDown } from '@mui/icons-material';

interface PathwayIndicatorProps {
  currentApproach: string;
  effectiveness: 'effective' | 'struggling' | 'ineffective' | 'unknown';
}

const PathwayIndicator: React.FC<PathwayIndicatorProps> = ({ currentApproach, effectiveness }) => {
  const getEffectivenessColor = () => {
    switch (effectiveness) {
      case 'effective':
        return 'success';
      case 'struggling':
        return 'warning';
      case 'ineffective':
        return 'error';
      case 'unknown':
        return 'default';
      default:
        return 'default';
    }
  };

  const getEffectivenessIcon = () => {
    switch (effectiveness) {
      case 'effective':
        return <CheckCircle />;
      case 'struggling':
        return <Warning />;
      case 'ineffective':
        return <TrendingDown />;
      case 'unknown':
        return null;
      default:
        return null;
    }
  };

  const getEffectivenessGradient = () => {
    switch (effectiveness) {
      case 'effective':
        return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      case 'struggling':
        return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'ineffective':
        return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'unknown':
        return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
      default:
        return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
    }
  };

  const getEffectivenessGlow = () => {
    switch (effectiveness) {
      case 'effective':
        return '0 0 20px rgba(16, 185, 129, 0.15)';
      case 'struggling':
        return '0 0 20px rgba(245, 158, 11, 0.15)';
      case 'ineffective':
        return '0 0 30px rgba(239, 68, 68, 0.2)';
      case 'unknown':
        return 'none';
      default:
        return 'none';
    }
  };

  return (
    <Paper
      sx={{
        p: 3,
        background: effectiveness === 'ineffective' 
          ? 'rgba(255, 255, 255, 0.9)' 
          : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: effectiveness === 'ineffective'
          ? `0 20px 40px -8px rgba(239, 68, 68, 0.15), ${getEffectivenessGlow()}`
          : '0 20px 40px -8px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: effectiveness === 'ineffective'
            ? `0 25px 50px -8px rgba(239, 68, 68, 0.2), ${getEffectivenessGlow()}`
            : '0 25px 50px -8px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            color: 'var(--primary)',
            fontWeight: 600,
          }}
        >
          <SwapHoriz sx={{ 
            fontSize: 28,
            background: 'linear-gradient(135deg, #0b57d0 0%, #00639b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }} /> 
          Current Pathway
        </Typography>
        {effectiveness === 'ineffective' && (
          <Button
            size="small"
            variant="contained"
            startIcon={<SwapHoriz />}
            sx={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 600,
              px: 2,
              '&:hover': {
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 16px -4px rgba(239, 68, 68, 0.3)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            View Alternatives
          </Button>
        )}
      </Box>

      <Box sx={{ mb: 2.5 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'var(--on-surface-variant)',
            fontWeight: 500,
            mb: 0.5,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.75rem',
          }}
        >
          Approach
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            fontWeight: 600,
            color: 'var(--on-surface)',
            fontSize: '1.1rem',
          }}
        >
          {currentApproach}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={getEffectivenessIcon() ? React.cloneElement(getEffectivenessIcon() as React.ReactElement, {
            sx: {
              fontSize: 20,
              color: 'white !important',
            }
          }) : undefined}
          label={effectiveness.charAt(0).toUpperCase() + effectiveness.slice(1)}
          sx={{
            background: getEffectivenessGradient(),
            color: 'white',
            fontWeight: 600,
            border: 'none',
            boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.1)',
            '& .MuiChip-icon': {
              color: 'white',
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 12px -2px rgba(0, 0, 0, 0.15)',
            },
          }}
          size="small"
        />
      </Box>

      {effectiveness !== 'effective' && effectiveness !== 'unknown' && (
        <Box
          sx={{
            mt: 2.5,
            p: 2,
            background: effectiveness === 'struggling'
              ? 'rgba(245, 158, 11, 0.08)'
              : 'rgba(239, 68, 68, 0.08)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '12px',
            border: effectiveness === 'struggling'
              ? '1px solid rgba(245, 158, 11, 0.2)'
              : '1px solid rgba(239, 68, 68, 0.2)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 600,
              color: effectiveness === 'struggling' 
                ? '#d97706'
                : '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: effectiveness === 'struggling'
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 700,
                boxShadow: effectiveness === 'struggling'
                  ? '0 0 12px rgba(245, 158, 11, 0.3)'
                  : '0 0 12px rgba(239, 68, 68, 0.3)',
              }}
            >
              {effectiveness === 'struggling' ? '!' : '!!'}
            </Box>
            {effectiveness === 'struggling' 
              ? 'Monitor closely - Consider alternative approaches if no improvement'
              : 'Immediate pathway change recommended'}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default PathwayIndicator;
