import React from 'react';
import { Box, Typography, LinearProgress, Chip, Grid } from '@mui/material';
import {
  TrendingUp,
  Mood,
  MoodBad,
  SentimentSatisfied,
  SentimentVeryDissatisfied,
  Lightbulb,
  Groups,
} from '@mui/icons-material';

interface SessionMetricsProps {
  metrics: {
    engagement_level: number;
    therapeutic_alliance: 'weak' | 'moderate' | 'strong';
    techniques_detected: string[];
    emotional_state: 'calm' | 'anxious' | 'distressed' | 'dissociated' | 'unknown';
    phase_appropriate: boolean;
  };
}

const SessionMetrics: React.FC<SessionMetricsProps> = ({ metrics }) => {
  const getEmotionIcon = () => {
    switch (metrics.emotional_state) {
      case 'calm':
        return <Mood color="success" />;
      case 'anxious':
        return <SentimentSatisfied color="warning" />;
      case 'distressed':
        return <MoodBad color="error" />;
      case 'dissociated':
        return <SentimentVeryDissatisfied color="error" />;
      case 'unknown':
        return <SentimentSatisfied color="disabled" />;
      default:
        return <SentimentSatisfied color="disabled" />;
    }
  };

  const getAllianceColor = () => {
    switch (metrics.therapeutic_alliance) {
      case 'strong':
        return 'success';
      case 'moderate':
        return 'warning';
      case 'weak':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Engagement Level */}
        <Grid item xs={12}>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Engagement Level
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {Math.round(metrics.engagement_level * 100)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={metrics.engagement_level * 100}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: metrics.engagement_level > 0.7 ? 'success.main' : 
                          metrics.engagement_level > 0.4 ? 'warning.main' : 'error.main',
                },
              }}
            />
          </Box>
        </Grid>

        {/* Therapeutic Alliance */}
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Groups fontSize="small" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Alliance
              </Typography>
              <Chip
                label={metrics.therapeutic_alliance}
                size="small"
                color={getAllianceColor() as any}
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Box>
        </Grid>

        {/* Emotional State */}
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getEmotionIcon()}
            <Box>
              <Typography variant="caption" color="text.secondary">
                Emotional State
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {metrics.emotional_state}
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Techniques Detected */}
        <Grid item xs={12}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <Lightbulb fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Techniques Detected
              </Typography>
            </Box>
            {metrics.techniques_detected.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {metrics.techniques_detected.map((technique, idx) => (
                  <Chip
                    key={idx}
                    label={technique}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary">
                No techniques detected yet
              </Typography>
            )}
          </Box>
        </Grid>

        {/* Phase Appropriate */}
        <Grid item xs={12}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: metrics.phase_appropriate ? 'success.light' : 'warning.light',
              color: metrics.phase_appropriate ? 'success.dark' : 'warning.dark',
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" fontWeight={600}>
              {metrics.phase_appropriate 
                ? '✓ Phase-Appropriate Progress' 
                : '⚠ Consider Phase Adjustment'}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SessionMetrics;
