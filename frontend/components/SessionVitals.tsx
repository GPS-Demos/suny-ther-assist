import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { getStatusColor } from '../utils/colorUtils';

interface SessionVitalsProps {
  metrics: {
    therapeutic_alliance: 'strong' | 'moderate' | 'weak';
    emotional_state: 'calm' | 'anxious' | 'distressed' | 'dissociated' | 'unknown';
    engagement_level: number;
  };
}

const SessionVitals: React.FC<SessionVitalsProps> = ({ metrics }) => {
  const { therapeutic_alliance, emotional_state, engagement_level } = metrics;

  const getEngagementStatus = (level: number): 'strong' | 'moderate' | 'weak' => {
    if (level > 0.7) return 'strong';
    if (level > 0.4) return 'moderate';
    return 'weak';
  };

  return (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        gap: 2,
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">Therapeutic Alliance</Typography>
        <Typography variant="h6" sx={{ fontWeight: 600, textTransform: 'capitalize', color: getStatusColor(therapeutic_alliance) }}>
          {therapeutic_alliance}
        </Typography>
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">Emotional State</Typography>
        <Typography variant="h6" sx={{ fontWeight: 600, textTransform: 'capitalize', color: getStatusColor(emotional_state) }}>
          {emotional_state}
        </Typography>
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">Engagement Level</Typography>
        <Typography variant="h6" sx={{ fontWeight: 600, color: getStatusColor(getEngagementStatus(engagement_level)) }}>
          {(engagement_level * 100).toFixed(0)}%
        </Typography>
      </Box>
    </Paper>
  );
};

export default SessionVitals;
