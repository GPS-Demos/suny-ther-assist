import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  useTheme,
  useMediaQuery,
  IconButton,
  Fab,
} from '@mui/material';
import {
  HealthAndSafety,
  NaturePeople,
  Category,
  Exposure,
  Check,
  Warning,
  Psychology,
  Timeline,
  Stop,
  FiberManualRecord,
  ArrowBack,
} from '@mui/icons-material';
import { Alert, SessionMetrics, PathwayIndicators } from '../types/types';
import { formatDuration } from '../utils/timeUtils';
import { getStatusColor } from '../utils/colorUtils';
import SessionLineChart from './SessionLineChart';

interface NewTherSessionProps {
  onNavigateBack?: () => void;
  patientId?: string | null;
  alerts?: Alert[];
  sessionMetrics?: SessionMetrics;
  pathwayIndicators?: PathwayIndicators;
  sessionDuration?: number;
  sessionPhase?: string;
  sessionId?: string;
  currentGuidance?: {
    title: string;
    time: string;
    content: string;
    immediateActions: Array<{
      title: string;
      description: string;
      icon: 'safety' | 'grounding';
    }>;
    contraindications: Array<{
      title: string;
      description: string;
      icon: 'cognitive' | 'exposure';
    }>;
  };
}

const NewTherSession: React.FC<NewTherSessionProps> = ({
  onNavigateBack,
  patientId,
  alerts = [],
  sessionMetrics = {
    engagement_level: 70,
    therapeutic_alliance: 'moderate',
    techniques_detected: ['CBT', 'Cognitive Restructuring'],
    emotional_state: 'distressed',
    phase_appropriate: true,
  },
  pathwayIndicators = {
    current_approach_effectiveness: 'effective',
    alternative_pathways: ['Cognitive Restructuring', 'Strong adherence'],
    change_urgency: 'none',
  },
  sessionDuration = 382, // 06:22 in seconds
  sessionPhase = 'Beginning (1 - 10 minutes)',
  sessionId = 'Session ID',
  currentGuidance = {
    title: "Explore Patient's Internal Experience",
    time: '03:22',
    content: `Consider asking: 'When your heart started racing and you felt like you had to leave, what was going through your mind at that exact moment?'

Alternatively, 'What was it like to experience those physical sensations in that situation?'

This can help connect physical sensations to thoughts / emotions and identify specific triggers or fears.`,
    immediateActions: [
      {
        title: 'Safety Planning',
        description: 'Immediately complete a comprehensive safety plan with the patient',
        icon: 'safety',
      },
      {
        title: 'Reinforce Grounding',
        description: 'Continue and reinforce the use of grounding techniques (e.g., 5-4-3-2-1).',
        icon: 'grounding',
      },
    ],
    contraindications: [
      {
        title: 'Over-reliance on Cognitive Restructuring',
        description: 'Continuing to push cognitive restructuring is contraindicated.',
        icon: 'cognitive',
      },
      {
        title: 'Premature or Unsupported Exposure',
        description: 'While exposure is indicated and proposed, proceeding with exposure exercises could be counterproductive.',
        icon: 'exposure',
      },
    ],
  },
}) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [activeTab, setActiveTab] = useState<'guidance' | 'evidence' | 'pathway' | 'alternatives'>('guidance');

  const getActionIcon = (iconType: string) => {
    switch (iconType) {
      case 'safety': return <HealthAndSafety sx={{ fontSize: 24, color: '#128937' }} />;
      case 'grounding': return <NaturePeople sx={{ fontSize: 24, color: '#128937' }} />;
      case 'cognitive': return <Category sx={{ fontSize: 24, color: '#b3261e' }} />;
      case 'exposure': return <Exposure sx={{ fontSize: 24, color: '#b3261e' }} />;
      default: return <HealthAndSafety sx={{ fontSize: 24, color: '#128937' }} />;
    }
  };

  const getEmotionalStateColor = (state: string) => {
    switch (state) {
      case 'calm': return '#128937';
      case 'anxious': return '#f59e0b';
      case 'distressed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const ActionCard = ({ action, isContraindication = false }: { 
    action: any; 
    isContraindication?: boolean; 
  }) => (
    <Paper
      sx={{
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: '1px solid #c4c7c5',
        borderRadius: '16px',
        minHeight: '120px',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 2 }}>
        {getActionIcon(action.icon)}
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography 
          variant="body1" 
          sx={{ 
            fontWeight: 600, 
            fontSize: '16px', 
            lineHeight: '24px',
            color: '#1f1f1f',
          }}
        >
          {action.title}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: '14px', 
            lineHeight: '20px',
            color: '#444746',
          }}
        >
          {action.description}
        </Typography>
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      background: '#f0f4f9',
      p: 2,
    }}>
      {/* Main Container */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1,
        backgroundColor: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        {/* Main Content Area */}
        <Box sx={{ 
          display: 'flex', 
          flex: 1,
          overflow: 'hidden',
        }}>
          {/* Sidebar */}
          <Box sx={{ 
            width: 351,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            p: 3,
          }}>
            {/* Title Section */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {onNavigateBack && (
                  <IconButton
                    onClick={onNavigateBack}
                    sx={{
                      width: 24,
                      height: 24,
                      color: '#444746',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    <ArrowBack sx={{ fontSize: 18 }} />
                  </IconButton>
                )}
                <Typography variant="h6" sx={{ 
                  fontSize: '24px', 
                  fontWeight: 600, 
                  color: '#1f1f1f',
                }}>
                  John Doe
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ 
                fontSize: '14px', 
                color: '#444746',
                mb: 2,
              }}>
                Session #1
              </Typography>
              <Typography variant="h5" sx={{ 
                fontSize: '22px', 
                fontWeight: 500, 
                lineHeight: '28px',
                color: '#444746',
              }}>
                {currentGuidance.title}
              </Typography>
            </Box>

            {/* Navigation Menu */}
            <Box>
              {[
                { key: 'guidance', label: 'Guidance', hasIcon: true },
                { key: 'evidence', label: 'Evidence', hasIcon: false },
                { key: 'pathway', label: 'Pathway', hasIcon: false },
                { key: 'alternatives', label: 'Alternatives', hasIcon: false },
              ].map((item) => (
                <Box
                  key={item.key}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    height: 56,
                    px: item.hasIcon ? 1.5 : 0,
                    py: 1,
                    cursor: 'pointer',
                    backgroundColor: activeTab === item.key ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                    borderBottom: item.key !== 'alternatives' ? '1px solid rgba(196, 199, 197, 0.3)' : 'none',
                  }}
                  onClick={() => setActiveTab(item.key as any)}
                >
                  {item.hasIcon && (
                    <Box sx={{ mr: 1.5 }}>
                      <Category sx={{ fontSize: 24, color: '#444746' }} />
                    </Box>
                  )}
                  <Typography variant="body1" sx={{ fontSize: '16px', color: '#1f1f1f' }}>
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Main Content */}
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            p: 3,
            gap: 2,
            overflow: 'auto',
            minHeight: 0, // Important for proper flex behavior
          }}>
            {/* Guidance Content */}
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              pb: 4, // Add padding bottom to prevent cutoff
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: '24px',
                  fontWeight: 400,
                  lineHeight: '28px',
                  color: '#1f1f1f',
                  whiteSpace: 'pre-line',
                }}
              >
                {currentGuidance.content}
              </Typography>

              {/* Action Cards */}
              <Box sx={{ display: 'flex', gap: 4 }}>
                {/* Immediate Actions */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: '#444746',
                    mb: 2,
                    letterSpacing: '0.5px',
                  }}>
                    IMMEDIATE ACTIONS
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {currentGuidance.immediateActions.map((action, index) => (
                      <Box key={index} sx={{ flex: 1 }}>
                        <ActionCard action={action} />
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Contraindications */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: '#444746',
                    mb: 2,
                    letterSpacing: '0.5px',
                  }}>
                    CONTRAINDICATIONS
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {currentGuidance.contraindications.map((action, index) => (
                      <Box key={index} sx={{ flex: 1 }}>
                        <ActionCard action={action} isContraindication />
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Timeline Section */}
        <Box sx={{ 
          backgroundColor: 'white',
          p: 2,
          borderTop: '1px solid #f0f4f9',
        }}>
          {/* Chart Grid */}
          <Box sx={{ position: 'relative', mb: 2 }}>
            <Box sx={{ 
              height: 84,
              backgroundColor: 'white',
              border: '1px solid #e9ebf1',
              borderRadius: 1,
              position: 'relative',
            }}>
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <Box
                  key={i}
                  sx={{
                    position: 'absolute',
                    top: i * 16,
                    left: 0,
                    right: 0,
                    height: '1px',
                    backgroundColor: '#e9ebf1',
                  }}
                />
              ))}
              
              <SessionLineChart duration={sessionDuration} />
            </Box>

            {/* Event markers */}
            <Box sx={{ position: 'absolute', bottom: -10, left: 86, transform: 'translateX(-50%)' }}>
              <Psychology sx={{ fontSize: 20, color: '#c05a01' }} />
            </Box>
            <Box sx={{ position: 'absolute', bottom: -10, left: 151, transform: 'translateX(-50%)' }}>
              <Warning sx={{ fontSize: 20, color: '#db372d' }} />
            </Box>
            <Box sx={{ position: 'absolute', bottom: -10, left: 414, transform: 'translateX(-50%)' }}>
              <Psychology sx={{ fontSize: 20, color: '#c05a01' }} />
            </Box>
            <Box sx={{ position: 'absolute', bottom: -10, right: 180, transform: 'translateX(50%)' }}>
              <HealthAndSafety sx={{ fontSize: 20, color: '#128937' }} />
            </Box>
            <Box sx={{ position: 'absolute', bottom: -10, right: 60, transform: 'translateX(50%)' }}>
              <NaturePeople sx={{ fontSize: 20, color: '#128937' }} />
            </Box>
          </Box>

        </Box>

        {/* Session Header with KPIs - Now at Bottom */}
        <Box sx={{ 
          backgroundColor: 'white',
          borderTop: '1px solid #f0f4f9',
          borderRadius: '0 0 8px 8px',
        }}>
          {/* Pathway Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            borderBottom: '1px solid #f0f4f9',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Timeline sx={{ fontSize: 24, color: '#444746' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f1f1f' }}>
                Cognitive Behavioral Therapy
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                icon={<Check sx={{ fontSize: 18, color: '#0b57d0' }} />}
                label="Cognitive Restructuring +3"
                size="small"
                sx={{
                  backgroundColor: 'transparent',
                  border: '1px solid #c4c7c5',
                  borderRadius: '8px',
                  '& .MuiChip-icon': { color: '#0b57d0' },
                  '& .MuiChip-label': { 
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#0b57d0',
                  },
                }}
              />
              <Chip
                icon={<Check sx={{ fontSize: 18, color: '#128937' }} />}
                label="Strong Adherence"
                size="small"
                sx={{
                  backgroundColor: '#ddf8d8',
                  border: '1px solid #beefbb',
                  borderRadius: '8px',
                  '& .MuiChip-icon': { color: '#128937' },
                  '& .MuiChip-label': { 
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#128937',
                  },
                }}
              />
            </Box>
          </Box>

          {/* Session Metrics Row */}
          <Box sx={{ 
            display: 'flex',
            '& > *': { flex: 1 },
          }}>
            {/* Session ID */}
            <Box sx={{ 
              px: 3, 
              py: 2, 
              borderRight: '1px solid #f0f4f9',
            }}>
              <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '28px', color: '#1e1e1e' }}>
                {sessionId}
              </Typography>
            </Box>

            {/* Emotional State */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              px: 3, 
              py: 2,
              borderRight: '1px solid #f0f4f9',
            }}>
              <Box sx={{ 
                width: 20, 
                height: 20, 
                borderRadius: '50%', 
                backgroundColor: getEmotionalStateColor(sessionMetrics.emotional_state),
              }} />
              <Box>
                <Typography variant="caption" sx={{ 
                  fontSize: '11px', 
                  color: '#444746',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1px',
                }}>
                  Emotional State
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1f1f1f', textTransform: 'capitalize' }}>
                  {sessionMetrics.emotional_state}
                </Typography>
              </Box>
            </Box>

            {/* Engagement Level */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              px: 3, 
              py: 2,
              borderRight: '1px solid #f0f4f9',
            }}>
              <Box sx={{ 
                width: 20, 
                height: 20, 
                borderRadius: '50%', 
                backgroundColor: '#0b57d0',
              }} />
              <Box>
                <Typography variant="caption" sx={{ 
                  fontSize: '11px', 
                  color: '#444746',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1px',
                }}>
                  Engagement Level
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1f1f1f' }}>
                  {sessionMetrics.engagement_level}%
                </Typography>
              </Box>
            </Box>

            {/* Therapeutic Alliance */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              px: 3, 
              py: 2,
              borderRight: '1px solid #f0f4f9',
            }}>
              <Box sx={{ 
                width: 20, 
                height: 20, 
                borderRadius: '50%', 
                backgroundColor: '#9254ea',
              }} />
              <Box>
                <Typography variant="caption" sx={{ 
                  fontSize: '11px', 
                  color: '#444746',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1px',
                }}>
                  Therapeutic Alliance
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1f1f1f', textTransform: 'capitalize' }}>
                  {sessionMetrics.therapeutic_alliance}
                </Typography>
              </Box>
            </Box>

            {/* Phase Indicator */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              px: 3, 
              py: 2,
              borderRight: '1px solid #f0f4f9',
            }}>
              <Check sx={{ fontSize: 24, color: '#128937' }} />
              <Box>
                <Typography variant="caption" sx={{ 
                  fontSize: '11px', 
                  color: '#444746',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1px',
                }}>
                  {sessionPhase}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#1f1f1f' }}>
                  Phase-appropriate
                </Typography>
              </Box>
            </Box>

            {/* Timer and Controls */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-end',
              gap: 2, 
              px: 3, 
              py: 2,
            }}>
              <Typography variant="h6" sx={{ fontWeight: 400, fontSize: '28px', color: '#444746' }}>
                {formatDuration(sessionDuration)}
              </Typography>
              <Box sx={{ 
                position: 'relative',
                width: 40,
                height: 40,
              }}>
                {/* Progress circle would go here */}
                <Box sx={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: '3px solid #e0e0e0',
                  borderTop: '3px solid #0b57d0',
                  transform: 'rotate(45deg)',
                }} />
              </Box>
              <IconButton
                sx={{
                  backgroundColor: '#f9dedc',
                  color: '#8c1d18',
                  width: 40,
                  height: 40,
                  '&:hover': {
                    backgroundColor: '#f5c6c6',
                  },
                }}
              >
                <Stop />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>

    </Box>
  );
};

export default NewTherSession;
