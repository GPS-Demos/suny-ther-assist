import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Collapse,
  Button,
  Fade,
} from '@mui/material';
import {
  Warning,
  Info,
  CheckCircle,
  Close,
  ExpandMore,
  ExpandLess,
  MenuBook,
  SwapHoriz,
  Psychology,
} from '@mui/icons-material';
import { Alert } from '../types/types';

interface AlertDisplayProps {
  alert: Alert;
  onDismiss: () => void;
}

const AlertDisplay: React.FC<AlertDisplayProps> = ({ alert, onDismiss }) => {
  const [expanded, setExpanded] = React.useState(false);

  const getAlertIcon = () => {
    switch (alert.level) {
      case 'critical':
        return <Warning sx={{ fontSize: 32 }} />;
      case 'suggestion':
        return <Info sx={{ fontSize: 28 }} />;
      case 'info':
        return <CheckCircle sx={{ fontSize: 24 }} />;
      default:
        return <Info />;
    }
  };

  const getAlertColor = () => {
    switch (alert.level) {
      case 'critical':
        return '#d32f2f';
      case 'suggestion':
        return '#f57c00';
      case 'info':
        return '#388e3c';
      default:
        return '#1976d2';
    }
  };

  const getCategoryIcon = () => {
    switch (alert.category) {
      case 'pathway_change':
        return <SwapHoriz />;
      case 'technique':
        return <Psychology />;
      default:
        return null;
    }
  };

  const alertColor = getAlertColor();

  return (
    <Fade in timeout={300}>
      <Paper
        elevation={alert.level === 'critical' ? 6 : 2}
        sx={{
          border: alert.level === 'critical' ? `3px solid ${alertColor}` : `1px solid ${alertColor}`,
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          animation: alert.level === 'critical' ? 'criticalPulse 2s infinite' : 'none',
          '@keyframes criticalPulse': {
            '0%': { borderColor: alertColor },
            '50%': { borderColor: `${alertColor}66` },
            '100%': { borderColor: alertColor },
          },
        }}
      >
        {/* Alert Header */}
        <Box
          sx={{
            bgcolor: `${alertColor}15`,
            p: 2,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
          }}
        >
          <Box sx={{ color: alertColor }}>{getAlertIcon()}</Box>
          
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: alert.level === 'critical' ? '1.25rem' : '1rem',
                  color: alertColor,
                }}
              >
                {alert.title}
              </Typography>
              {getCategoryIcon() && (
                <Box sx={{ color: alertColor, display: 'flex' }}>
                  {getCategoryIcon()}
                </Box>
              )}
            </Box>
            
            <Typography
              variant="body1"
              sx={{
                fontSize: alert.level === 'critical' ? '1rem' : '0.875rem',
                lineHeight: 1.6,
              }}
            >
              {alert.message}
            </Typography>

            {/* Evidence */}
            {alert.evidence && alert.evidence.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  EVIDENCE:
                </Typography>
                {alert.evidence.map((ev, idx) => (
                  <Typography
                    key={idx}
                    variant="body2"
                    sx={{
                      mt: 0.5,
                      pl: 2,
                      fontStyle: 'italic',
                      color: 'text.secondary',
                      borderLeft: `3px solid ${alertColor}33`,
                    }}
                  >
                    "{ev}"
                  </Typography>
                ))}
              </Box>
            )}

            {/* Recommendation */}
            {alert.recommendation && (
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Recommended Action:
                </Typography>
                <Typography variant="body2">{alert.recommendation}</Typography>
              </Box>
            )}
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <IconButton size="small" onClick={onDismiss}>
              <Close fontSize="small" />
            </IconButton>
            {alert.manual_reference && (
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                sx={{ color: alertColor }}
              >
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Manual Reference (Expandable) */}
        {alert.manual_reference && (
          <Collapse in={expanded}>
            <Box
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <MenuBook fontSize="small" color="action" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Manual Reference
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {alert.manual_reference.source}
              </Typography>
              {alert.manual_reference.page && (
                <Typography variant="body2" color="text.secondary">
                  Page {alert.manual_reference.page}
                </Typography>
              )}
              {alert.manual_reference.section && (
                <Typography variant="body2" color="text.secondary">
                  Section: {alert.manual_reference.section}
                </Typography>
              )}
              <Button
                size="small"
                startIcon={<MenuBook />}
                sx={{ mt: 1 }}
                variant="outlined"
              >
                View in Manual
              </Button>
            </Box>
          </Collapse>
        )}

        {/* Urgency Indicator */}
        {alert.urgency && (
          <Box
            sx={{
              bgcolor: alert.urgency === 'immediate' ? alertColor : 'grey.200',
              color: alert.urgency === 'immediate' ? 'white' : 'text.secondary',
              px: 2,
              py: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" fontWeight={600} textTransform="uppercase">
              {alert.urgency === 'immediate' && '⚡ '}
              {alert.urgency.replace('_', ' ')}
            </Typography>
          </Box>
        )}
      </Paper>
    </Fade>
  );
};

export default AlertDisplay;
