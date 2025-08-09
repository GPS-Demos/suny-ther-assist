import React from 'react';
import { Box, Typography, LinearProgress, Chip } from '@mui/material';
import { AccessTime, PlayCircleOutline, Summarize } from '@mui/icons-material';

interface SessionPhaseIndicatorProps {
  duration: number; // in seconds
}

const SessionPhaseIndicator: React.FC<SessionPhaseIndicatorProps> = ({ duration }) => {
  const durationMinutes = Math.floor(duration / 60);
  
  // Determine current phase based on duration
  const getCurrentPhase = () => {
    if (durationMinutes <= 10) return 'beginning';
    if (durationMinutes <= 40) return 'middle';
    return 'end';
  };
  
  const getPhaseProgress = () => {
    if (durationMinutes <= 10) {
      return (durationMinutes / 10) * 100;
    } else if (durationMinutes <= 40) {
      return ((durationMinutes - 10) / 30) * 100;
    } else {
      return Math.min(((durationMinutes - 40) / 10) * 100, 100);
    }
  };
  
  const getPhaseDetails = () => {
    const phase = getCurrentPhase();
    switch (phase) {
      case 'beginning':
        return {
          label: 'Beginning',
          icon: <PlayCircleOutline />,
          color: '#10b981',
          focus: 'Rapport building, agenda setting',
          gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        };
      case 'middle':
        return {
          label: 'Middle',
          icon: <AccessTime />,
          color: '#0b57d0',
          focus: 'Core therapeutic work',
          gradient: 'linear-gradient(135deg, #0b57d0 0%, #00639b 100%)',
        };
      case 'end':
        return {
          label: 'End',
          icon: <Summarize />,
          color: '#f59e0b',
          focus: 'Summary, homework, closure',
          gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        };
    }
  };
  
  const phaseDetails = getPhaseDetails();
  const progress = getPhaseProgress();
  
  return (
    <Box
      sx={{
        p: 2.5,
        background: 'rgba(250, 251, 253, 0.5)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(196, 199, 205, 0.2)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 600,
            color: 'var(--on-surface-variant)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.75rem',
          }}
        >
          Session Phase
        </Typography>
        <Chip
          icon={React.cloneElement(phaseDetails.icon as React.ReactElement, {
            sx: { fontSize: 18, color: 'white !important' }
          })}
          label={phaseDetails.label}
          size="small"
          sx={{
            background: phaseDetails.gradient,
            color: 'white',
            fontWeight: 600,
            '& .MuiChip-icon': {
              color: 'white',
            },
            boxShadow: '0 4px 8px -2px rgba(0, 0, 0, 0.1)',
          }}
        />
      </Box>
      
      <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'var(--on-surface-variant)',
              fontWeight: 500,
            }}
          >
            {durationMinutes} min
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'var(--on-surface-variant)',
              fontWeight: 500,
            }}
          >
            {Math.round(progress)}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress}
          sx={{
            height: 8,
            borderRadius: '4px',
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
            '& .MuiLinearProgress-bar': {
              background: phaseDetails.gradient,
              borderRadius: '4px',
            },
          }}
        />
      </Box>
      
      <Typography 
        variant="body2" 
        sx={{ 
          color: 'var(--on-surface-variant)',
          fontSize: '0.875rem',
          fontStyle: 'italic',
        }}
      >
        Focus: {phaseDetails.focus}
      </Typography>
      
      {/* Phase Timeline */}
      <Box sx={{ 
        mt: 2, 
        pt: 2, 
        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <Box sx={{ textAlign: 'center', flex: 1 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: getCurrentPhase() === 'beginning' ? 700 : 400,
              color: getCurrentPhase() === 'beginning' ? '#10b981' : 'var(--on-surface-variant)',
            }}
          >
            0-10 min
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', flex: 1 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: getCurrentPhase() === 'middle' ? 700 : 400,
              color: getCurrentPhase() === 'middle' ? '#0b57d0' : 'var(--on-surface-variant)',
            }}
          >
            10-40 min
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center', flex: 1 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: getCurrentPhase() === 'end' ? 700 : 400,
              color: getCurrentPhase() === 'end' ? '#f59e0b' : 'var(--on-surface-variant)',
            }}
          >
            40+ min
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default SessionPhaseIndicator;
