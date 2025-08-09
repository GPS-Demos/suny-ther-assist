import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  Fade,
  Grow,
  Collapse,
  Badge,
  Drawer,
  Fab,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Mic,
  Stop,
  Info,
  Psychology,
  TrendingUp,
  FiberManualRecord,
  ExpandLess,
  ExpandMore,
  Article,
  Shield,
  Close,
  Chat,
} from '@mui/icons-material';
import TranscriptDisplay from './TranscriptDisplay';
import AlertDisplay from './AlertDisplay';
import SessionMetrics from './SessionMetrics';
import PathwayIndicator from './PathwayIndicator';
import SessionPhaseIndicator from './SessionPhaseIndicator.tsx';
import CitationsPanel from './CitationsPanel.tsx';
import { useAudioRecorderWebSocket } from '../hooks/useAudioRecorderWebSocket';
import { useTherapyAnalysis } from '../hooks/useTherapyAnalysis';
import { formatDuration } from '../utils/timeUtils';
import { SessionContext, Alert as IAlert, Citation } from '../types/types';
import { testTranscriptData } from '../utils/testTranscript';

const App: React.FC = () => {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isWideScreen = useMediaQuery('(min-width:1024px)');
  
  const [isRecording, setIsRecording] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [newTranscriptCount, setNewTranscriptCount] = useState(0);
  const [sessionContext, setSessionContext] = useState<SessionContext>({
    session_type: 'CBT',
    primary_concern: 'Anxiety',
    current_approach: 'Cognitive Behavioral Therapy',
  });
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const [transcript, setTranscript] = useState<Array<{
    text: string;
    timestamp: string;
    is_interim?: boolean;
  }>>([]);

  const [alerts, setAlerts] = useState<IAlert[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [sessionMetrics, setSessionMetrics] = useState({
    engagement_level: 0.0,
    therapeutic_alliance: 'moderate' as 'strong' | 'moderate' | 'weak',
    techniques_detected: [] as string[],
    emotional_state: 'unknown' as 'calm' | 'anxious' | 'distressed' | 'dissociated' | 'unknown',
    phase_appropriate: false,
  });
  const [pathwayIndicators, setPathwayIndicators] = useState({
    current_approach_effectiveness: 'unknown' as 'effective' | 'struggling' | 'ineffective' | 'unknown',
    alternative_pathways: [] as string[],
    change_urgency: 'monitor' as 'none' | 'monitor' | 'consider' | 'recommended',
  });
  const [pathwayGuidance, setPathwayGuidance] = useState<{
    rationale?: string;
    immediate_actions?: string[];
    contraindications?: string[];
    alternative_pathways?: Array<{
      approach: string;
      reason: string;
      techniques: string[];
    }>;
  }>({});
  const [riskLevel, setRiskLevel] = useState<'low' | 'moderate' | 'high' | null>(null);
  
  // Test mode state
  const [isTestMode, setIsTestMode] = useState(false);
  const [testTranscriptIndex, setTestTranscriptIndex] = useState(0);
  const testIntervalRef = useRef<number | null>(null);

  // Audio recording hook with WebSocket streaming
  const { 
    isRecording: isRecordingAudio, 
    isConnected, 
    startRecording, 
    stopRecording, 
    sessionId 
  } = useAudioRecorderWebSocket({
    onTranscript: (newTranscript: any) => {
      if (newTranscript.is_interim) {
        setTranscript(prev => {
          const newEntry = {
            text: newTranscript.transcript || '',
            timestamp: newTranscript.timestamp || new Date().toISOString(),
            is_interim: true,
          };
          
          if (prev.length > 0 && prev[prev.length - 1].is_interim) {
            return [...prev.slice(0, -1), newEntry];
          }
          return [...prev, newEntry];
        });
      } else {
        setTranscript(prev => {
          const filtered = prev.filter(entry => !entry.is_interim);
          return [...filtered, {
            text: newTranscript.transcript || '',
            timestamp: newTranscript.timestamp || new Date().toISOString(),
            is_interim: false,
          }];
        });
        
        if (!transcriptOpen) {
          setNewTranscriptCount(prev => prev + 1);
        }
      }
    },
    onError: (error: string) => {
      setAlerts(prev => [...prev, {
        id: Date.now().toString(),
        type: 'error' as const,
        level: 'critical' as const,
        category: 'safety' as const,
        title: 'System Error',
        message: error,
        timestamp: new Date().toISOString()
      }]);
    }
  });

  const { analyzeSegment, getPathwayGuidance } = useTherapyAnalysis({
    onAnalysis: (analysis) => {
      console.log('[App] Received analysis:', {
        hasAlerts: !!analysis.alerts,
        hasMetrics: !!analysis.session_metrics,
        hasPathway: !!analysis.pathway_indicators,
        hasCitations: !!analysis.citations
      });
      
      if (analysis.alerts) {
        setAlerts(prev => [...analysis.alerts, ...prev].slice(0, 5));
      }
      if (analysis.session_metrics) {
        setSessionMetrics(prev => ({
          ...prev,
          ...analysis.session_metrics
        }));
      }
      if (analysis.pathway_indicators) {
        setPathwayIndicators(prev => ({
          ...prev,
          ...analysis.pathway_indicators
        }));
      }
      if (analysis.citations) {
        setCitations(analysis.citations);
      }
    },
    onPathwayGuidance: (guidance) => {
      console.log('[App] Received pathway guidance:', guidance);
      if (guidance) {
        setPathwayIndicators({
          current_approach_effectiveness: guidance.continue_current ? 'effective' : 'ineffective',
          alternative_pathways: guidance.alternative_pathways?.map((p: any) => p.approach) || [],
          change_urgency: guidance.continue_current ? 'none' : 'recommended',
        });
        setPathwayGuidance({
          rationale: guidance.rationale,
          immediate_actions: guidance.immediate_actions,
          contraindications: guidance.contraindications,
          alternative_pathways: guidance.alternative_pathways,
        });
      }
    },
  });

  // Update session duration every second
  useEffect(() => {
    if (!isRecording || !sessionStartTime) return;

    const interval = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - sessionStartTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, sessionStartTime]);

  // Store analysis functions in refs to avoid recreating intervals
  const analyzeSegmentRef = useRef(analyzeSegment);
  const getPathwayGuidanceRef = useRef(getPathwayGuidance);
  
  // Store transcript in ref to avoid stale closures
  const transcriptRef = useRef(transcript);
  const sessionMetricsRef = useRef(sessionMetrics);
  const alertsRef = useRef(alerts);
  const sessionContextRef = useRef(sessionContext);
  const sessionDurationRef = useRef(sessionDuration);
  
  useEffect(() => {
    analyzeSegmentRef.current = analyzeSegment;
    getPathwayGuidanceRef.current = getPathwayGuidance;
  }, [analyzeSegment, getPathwayGuidance]);
  
  // Update refs when state changes
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);
  
  useEffect(() => {
    sessionMetricsRef.current = sessionMetrics;
  }, [sessionMetrics]);
  
  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);
  
  useEffect(() => {
    sessionContextRef.current = sessionContext;
  }, [sessionContext]);
  
  useEffect(() => {
    sessionDurationRef.current = sessionDuration;
  }, [sessionDuration]);

  // Analyze transcript segments for real-time feedback
  useEffect(() => {
    console.log(`[Analysis Effect] State:`, {
      isRecording,
      isTestMode,
      transcriptLength: transcript.length,
      sessionDuration
    });
    
    if (!isRecording) {
      console.log('[Analysis Effect] Not recording, skipping analysis setup');
      return;
    }

    const startupDelay = isTestMode ? 4000 : 2000;
    
    console.log(`[Analysis Effect] Waiting ${startupDelay}ms before starting analysis...`);
    
    let intervalRefs: { safety?: number; metrics?: number; pathway?: number } = {};
    
    const startupTimer = setTimeout(() => {
      console.log('[Analysis Effect] Starting analysis intervals after delay');
      
      if (transcript.length === 0) {
        console.log('[Analysis Effect] Still no transcript after delay, but starting intervals anyway');
      }

      const SAFETY_INTERVAL = 5000;
      const METRICS_INTERVAL = 10000;
      const PATHWAY_INTERVAL = 15000;

      intervalRefs.safety = setInterval(() => {
        console.log(`[Safety Stream] ⏰ Interval fired at ${new Date().toISOString()}`);
        const currentTranscript = transcriptRef.current.slice(-5);
        console.log(`[Safety Stream] Current transcript length: ${transcriptRef.current.length}, analyzing last 5: ${currentTranscript.length}`);
        
        if (currentTranscript.length > 0) {
          const formattedTranscript = currentTranscript
            .filter(t => !t.is_interim)
            .map(t => ({
              speaker: 'conversation',
              text: t.text,
              timestamp: t.timestamp
            }));
          
          if (formattedTranscript.length > 0) {
            console.log(`[Safety Stream] 🚨 TRIGGERING SAFETY ANALYSIS`);
            console.log(`[Safety Stream] Formatted entries:`, formattedTranscript);
            
            analyzeSegmentRef.current(
              formattedTranscript, 
              sessionContextRef.current, 
              Math.floor(sessionDurationRef.current / 60)
            );
          } else {
            console.log('[Safety Stream] All entries are interim, skipping');
          }
        } else {
          console.log('[Safety Stream] No transcript entries available yet');
        }
      }, isTestMode ? 3000 : SAFETY_INTERVAL);

      intervalRefs.metrics = setInterval(() => {
        console.log(`[Metrics Stream] ⏰ Interval fired at ${new Date().toISOString()}`);
        const currentTranscript = transcriptRef.current.slice(-10);
        console.log(`[Metrics Stream] Analyzing last 10 entries: ${currentTranscript.length}`);
        
        if (currentTranscript.length >= 3) {
          const formattedTranscript = currentTranscript
            .filter(t => !t.is_interim)
            .map(t => ({
              speaker: 'conversation',
              text: t.text,
              timestamp: t.timestamp
            }));
          
          if (formattedTranscript.length >= 3) {
            console.log(`[Metrics Stream] 📊 TRIGGERING METRICS ANALYSIS`);
            
            analyzeSegmentRef.current(
              formattedTranscript, 
              sessionContextRef.current, 
              Math.floor(sessionDurationRef.current / 60)
            );
          }
        } else {
          console.log('[Metrics Stream] Not enough entries for metrics analysis');
        }
      }, isTestMode ? 5000 : METRICS_INTERVAL);

      intervalRefs.pathway = setInterval(() => {
        console.log(`[Pathway Stream] ⏰ Checking pathway conditions...`);
        const currentMetrics = sessionMetricsRef.current;
        const currentAlerts = alertsRef.current;
        const shouldEvaluate = currentMetrics.phase_appropriate === false || 
                              currentMetrics.engagement_level < 0.5 ||
                              currentAlerts.some(a => a.category === 'pathway_change');
        
        console.log(`[Pathway Stream] Evaluation needed: ${shouldEvaluate}`, {
          phase_appropriate: currentMetrics.phase_appropriate,
          engagement_level: currentMetrics.engagement_level,
          has_pathway_alert: currentAlerts.some(a => a.category === 'pathway_change')
        });
        
        if (shouldEvaluate && transcriptRef.current.length > 0) {
          console.log(`[Pathway Stream] 🛤️ TRIGGERING PATHWAY EVALUATION`);
          const extendedTranscript = transcriptRef.current.slice(-20)
            .filter(t => !t.is_interim);
          
          if (extendedTranscript.length > 0) {
            getPathwayGuidanceRef.current(
              sessionContextRef.current.current_approach,
              extendedTranscript,
              [sessionContextRef.current.primary_concern]
            );
          }
        }
      }, isTestMode ? 8000 : PATHWAY_INTERVAL);

      console.log('[Analysis Effect] All 3 analysis streams started');
    }, startupDelay);

    return () => {
      console.log('[Analysis Effect] Cleaning up startup timer and intervals');
      clearTimeout(startupTimer);
      if (intervalRefs.safety) clearInterval(intervalRefs.safety);
      if (intervalRefs.metrics) clearInterval(intervalRefs.metrics);
      if (intervalRefs.pathway) clearInterval(intervalRefs.pathway);
    };
  }, [isRecording, isTestMode]);

  const handleStartSession = async () => {
    setSessionStartTime(new Date());
    setIsRecording(true);
    await startRecording();
  };

  const handleStopSession = async () => {
    setIsRecording(false);
    await stopRecording();
    if (isTestMode) {
      stopTestMode();
    }
  };

  const loadTestTranscript = () => {
    setIsTestMode(true);
    setIsRecording(true);
    setSessionStartTime(new Date());
    setTranscript([]);
    setTestTranscriptIndex(0);
    
    testIntervalRef.current = setInterval(() => {
      setTestTranscriptIndex(prevIndex => {
        if (prevIndex >= testTranscriptData.length) {
          if (testIntervalRef.current) {
            clearInterval(testIntervalRef.current);
            testIntervalRef.current = null;
          }
          setIsTestMode(false);
          return prevIndex;
        }
        
        const entry = testTranscriptData[prevIndex];
        const formattedEntry = {
          text: entry.speaker ? `${entry.speaker}: ${entry.text}` : entry.text,
          timestamp: new Date().toISOString(),
          is_interim: false,
        };
        
        setTranscript(prev => [...prev, formattedEntry]);
        
        if (!transcriptOpen) {
          setNewTranscriptCount(prev => prev + 1);
        }
        
        return prevIndex + 1;
      });
    }, 2000);
  };

  const stopTestMode = () => {
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }
    setIsTestMode(false);
    setIsRecording(false);
  };

  const handleDismissAlert = (index: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== index));
  };

  const getRiskIndicatorColor = () => {
    switch (riskLevel) {
      case 'low': return '#10b981';
      case 'moderate': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      background: 'var(--background-gradient)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <Box 
        sx={{ 
          p: 3,
          background: 'linear-gradient(135deg, rgba(11, 87, 208, 0.95) 0%, rgba(0, 99, 155, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {isRecording ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FiberManualRecord 
                    sx={{ 
                      fontSize: 16,
                      color: '#ff4444',
                      animation: 'pulse-soft 1.5s infinite',
                      filter: 'drop-shadow(0 0 8px rgba(255, 68, 68, 0.6))',
                    }} 
                  />
                  <Typography 
                    variant="body1" 
                    fontWeight="600"
                    sx={{ 
                      color: 'white',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Recording
                  </Typography>
                </Box>
              ) : (
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 500,
                  }}
                >
                  Ready to Record
                </Typography>
              )}
            </Box>
            
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'white',
                fontWeight: 500,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {formatDuration(sessionDuration)}
            </Typography>

            {riskLevel && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Shield 
                  sx={{ 
                    fontSize: 24,
                    color: getRiskIndicatorColor(),
                    filter: `drop-shadow(0 0 8px ${getRiskIndicatorColor()}40)`,
                  }} 
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                >
                  {riskLevel} Risk
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {sessionId && (
              <Chip
                label={`Session: ${sessionId}`}
                sx={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                }}
              />
            )}
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: isConnected || isTestMode ? '#10b981' : '#9ca3af',
                boxShadow: isConnected || isTestMode
                  ? '0 0 12px rgba(16, 185, 129, 0.6)' 
                  : '0 0 8px rgba(156, 163, 175, 0.4)',
                transition: 'all 0.3s ease',
              }} 
              title={isConnected || isTestMode ? 'Connected' : 'Disconnected'}
            />
            {!isRecording ? (
              <Button
                variant="contained"
                size="large"
                startIcon={<Mic />}
                onClick={handleStartSession}
                sx={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 20px -5px rgba(16, 185, 129, 0.35)',
                  },
                  minWidth: 160,
                  height: 48,
                  fontWeight: 600,
                  borderRadius: '24px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                Start Session
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                startIcon={<Stop />}
                onClick={handleStopSession}
                sx={{ 
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  '&:hover': { 
                    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 20px -5px rgba(239, 68, 68, 0.35)',
                  },
                  minWidth: 160, 
                  height: 48,
                  fontWeight: 600,
                  borderRadius: '24px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {isTestMode ? 'Stop Test' : 'End Session'}
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        gap: 3, 
        p: 3, 
        overflow: 'hidden', // Changed from 'auto' to 'hidden' to prevent main scrolling
        pr: transcriptOpen ? '450px' : '100px', // Space for right sidebar
        transition: 'padding-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Content Grid - Responsive for tablets */}
        <Box sx={{ 
          flex: 1,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: isWideScreen ? 'minmax(400px, 2fr) minmax(300px, 1.5fr) minmax(300px, 1.5fr)' : '1fr',
          gridAutoRows: 'min-content',
        }}>
          {/* Left Panel - Real-Time Guidance */}
          <Paper 
            sx={{ 
              p: 3, 
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.08)',
              '&:hover': {
                boxShadow: '0 25px 50px -8px rgba(0, 0, 0, 0.1)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              gridRow: isWideScreen ? 'span 2' : 'auto',
              maxHeight: 'calc(100vh - 200px)',
              overflow: 'hidden',
            }}
          >
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                color: 'var(--primary)',
                fontWeight: 600,
                mb: 3,
                flexShrink: 0,
              }}
            >
              <Info sx={{ 
                fontSize: 32,
                background: 'linear-gradient(135deg, #0b57d0 0%, #00639b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }} /> 
              Real-Time Guidance
            </Typography>
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2,
              overflow: 'auto',
              minHeight: 0,
              // Custom scrollbar
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(11, 87, 208, 0.2)',
                borderRadius: '4px',
                '&:hover': {
                  background: 'rgba(11, 87, 208, 0.3)',
                },
              },
            }}>
              {alerts.length === 0 ? (
                <Box sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  py: 6,
                  px: 3,
                  background: 'rgba(250, 251, 253, 0.5)',
                  borderRadius: '12px',
                  border: '1px dashed rgba(196, 199, 205, 0.3)',
                }}>
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    Guidance will appear here during the session
                  </Typography>
                </Box>
              ) : (
                <>
                  {/* Current Alert */}
                  <Box sx={{ flexShrink: 0 }}>
                    <AlertDisplay
                      key={`${alerts[0].timestamp}-0`}
                      alert={alerts[0]}
                      onDismiss={() => handleDismissAlert(0)}
                    />
                  </Box>

                  {/* History Section */}
                  {alerts.length > 1 && (
                    <Box sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      flexShrink: 0,
                    }}>
                      {/* History Toggle Button */}
                      <Button
                        onClick={() => setHistoryExpanded(!historyExpanded)}
                        startIcon={historyExpanded ? <ExpandLess /> : <ExpandMore />}
                        sx={{
                          justifyContent: 'flex-start',
                          textTransform: 'none',
                          color: 'text.secondary',
                          fontWeight: 500,
                          mt: 2,
                          mb: 1,
                          flexShrink: 0,
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      >
                        {historyExpanded ? 'Hide' : 'See'} history ({alerts.length - 1} previous {alerts.length - 1 === 1 ? 'alert' : 'alerts'})
                      </Button>

                      {/* History Content */}
                      <Collapse in={historyExpanded} timeout="auto">
                        <Box sx={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                          pb: 2,
                        }}>
                          {alerts.slice(1).map((alert, index) => (
                            <Box
                              key={`${alert.timestamp}-${index + 1}`}
                              sx={{
                                opacity: 0.85,
                                transition: 'opacity 0.2s',
                                '&:hover': {
                                  opacity: 1,
                                },
                              }}
                            >
                              <AlertDisplay
                                alert={alert}
                                onDismiss={() => handleDismissAlert(index + 1)}
                              />
                            </Box>
                          ))}
                        </Box>
                      </Collapse>
                    </Box>
                  )}
                </>
              )}
            </Box>
            
            {/* Citations Panel */}
            {citations.length > 0 && (
              <Box sx={{ flexShrink: 0, mt: 2 }}>
                <CitationsPanel citations={citations} />
              </Box>
            )}
          </Paper>

          {/* Middle Panel - Session Metrics & Phase */}
          <Paper 
            sx={{ 
              p: 3,
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.08)',
              '&:hover': {
                boxShadow: '0 25px 50px -8px rgba(0, 0, 0, 0.1)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              maxHeight: 'calc(100vh - 200px)',
              overflow: 'auto',
              // Custom scrollbar
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(16, 185, 129, 0.2)',
                borderRadius: '4px',
                '&:hover': {
                  background: 'rgba(16, 185, 129, 0.3)',
                },
              },
            }}
          >
            <Box>
              <Typography 
                variant="h5" 
                gutterBottom 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  color: 'var(--primary)',
                  fontWeight: 600,
                  mb: 3,
                }}
              >
                <TrendingUp sx={{ 
                  fontSize: 32,
                  background: 'linear-gradient(135deg, #0b57d0 0%, #00639b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }} /> 
                Session Metrics
              </Typography>
              <SessionMetrics metrics={sessionMetrics} />
            </Box>
            
            {/* Session Phase Indicator */}
            <SessionPhaseIndicator duration={sessionDuration} />
          </Paper>

          {/* Right Panel - Current Pathway */}
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}>
            <PathwayIndicator 
              currentApproach={sessionContext.current_approach}
              effectiveness={pathwayIndicators.current_approach_effectiveness || (sessionMetrics.phase_appropriate ? 'effective' : 'struggling')}
              rationale={pathwayGuidance.rationale}
              immediateActions={pathwayGuidance.immediate_actions}
              contraindications={pathwayGuidance.contraindications}
              alternativePathways={pathwayGuidance.alternative_pathways}
            />
          </Box>
        </Box>
      </Box>

      {/* Floating Transcript Toggle Button */}
      <Fab
        color="primary"
        aria-label="transcript"
        onClick={() => {
          setTranscriptOpen(!transcriptOpen);
          if (!transcriptOpen) {
            setNewTranscriptCount(0);
          }
        }}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #0b57d0 0%, #00639b 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #00639b 0%, #0b57d0 100%)',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 8px 20px -4px rgba(11, 87, 208, 0.35)',
          zIndex: 1201,
        }}
      >
        <Badge badgeContent={newTranscriptCount} color="error">
          <Chat />
        </Badge>
      </Fab>

      {/* Test Transcript Button */}
      {!isRecording && !isTestMode && (
        <Box sx={{ 
          position: 'fixed', 
          bottom: 24, 
          left: 24,
          zIndex: 1201,
        }}>
          <Button
            variant="outlined"
            size="small"
            onClick={loadTestTranscript}
            sx={{ 
              borderColor: '#0b57d0',
              color: '#0b57d0',
              '&:hover': {
                borderColor: '#00639b',
                backgroundColor: 'rgba(11, 87, 208, 0.04)',
              },
              fontWeight: 600,
              borderRadius: '16px',
              px: 2,
              py: 0.5,
            }}
          >
            Load Test Transcript
          </Button>
        </Box>
      )}

      {/* Right Sidebar - Transcript */}
      <Drawer
        anchor="right"
        open={transcriptOpen}
        onClose={() => setTranscriptOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: isDesktop ? 400 : 350,
            p: 3,
            pt: 10,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '-4px 0 20px -4px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              color: 'var(--primary)',
              fontWeight: 600,
            }}
          >
            <Article sx={{ 
              fontSize: 28,
              background: 'linear-gradient(135deg, #0b57d0 0%, #00639b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }} />
            Live Transcript
          </Typography>
          <IconButton 
            onClick={() => setTranscriptOpen(false)}
            sx={{ 
              color: 'var(--on-surface-variant)',
              '&:hover': {
                background: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <Close />
          </IconButton>
        </Box>
        
        {(isRecording || isTestMode) && transcript.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                console.log('[Manual Analysis] Triggering immediate analysis');
                const recentTranscript = transcript.slice(-10);
                if (recentTranscript.length > 0) {
                  const formattedTranscript = recentTranscript
                    .filter(t => !t.is_interim)
                    .map(t => ({
                      speaker: 'conversation',
                      text: t.text,
                      timestamp: t.timestamp
                    }));
                  
                  if (formattedTranscript.length > 0) {
                    analyzeSegment(formattedTranscript, sessionContext, Math.floor(sessionDuration / 60));
                  }
                }
              }}
              sx={{ 
                borderColor: '#10b981',
                color: '#10b981',
                '&:hover': {
                  borderColor: '#059669',
                  backgroundColor: 'rgba(16, 185, 129, 0.04)',
                },
                fontWeight: 600,
                borderRadius: '16px',
                px: 2,
                py: 0.5,
              }}
            >
              Analyze Now
            </Button>
          </Box>
        )}
        
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <TranscriptDisplay transcript={transcript} />
        </Box>
      </Drawer>
    </Box>
  );
};

export default App;
