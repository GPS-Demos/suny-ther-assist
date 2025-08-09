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
} from '@mui/icons-material';
import TranscriptDisplay from './TranscriptDisplay';
import AlertDisplay from './AlertDisplay';
import SessionMetrics from './SessionMetrics';
import PathwayIndicator from './PathwayIndicator';
import { useAudioRecorderWebSocket } from '../hooks/useAudioRecorderWebSocket';
import { useTherapyAnalysis } from '../hooks/useTherapyAnalysis';
import { formatDuration } from '../utils/timeUtils';
import { SessionContext, Alert as IAlert } from '../types/types';
import { testTranscriptData } from '../utils/testTranscript';

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const [newTranscriptCount, setNewTranscriptCount] = useState(0);
  const [sessionContext, setSessionContext] = useState<SessionContext>({
    session_type: 'CBT',
    primary_concern: 'Anxiety',
    current_approach: 'Cognitive Behavioral Therapy',
  });

  const [transcript, setTranscript] = useState<Array<{
    text: string;
    timestamp: string;
    is_interim?: boolean;
  }>>([]);

  const [alerts, setAlerts] = useState<IAlert[]>([]);
  const [sessionMetrics, setSessionMetrics] = useState({
    engagement_level: 0.0,  // Start with 0, not hardcoded 0.8
    therapeutic_alliance: 'moderate' as 'strong' | 'moderate' | 'weak',  // Start neutral
    techniques_detected: [] as string[],
    emotional_state: 'unknown' as 'calm' | 'anxious' | 'distressed' | 'dissociated' | 'unknown',
    phase_appropriate: false,  // Start false until analyzed
  });
  const [pathwayIndicators, setPathwayIndicators] = useState({
    current_approach_effectiveness: 'unknown' as 'effective' | 'struggling' | 'ineffective' | 'unknown',
    alternative_pathways: [] as string[],
    change_urgency: 'monitor' as 'none' | 'monitor' | 'consider' | 'recommended',
  });
  
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
        // For interim results, update or add as the last entry
        setTranscript(prev => {
          const newEntry = {
            text: newTranscript.transcript || '',
            timestamp: newTranscript.timestamp || new Date().toISOString(),
            is_interim: true,
          };
          
          // If last entry is interim, replace it
          if (prev.length > 0 && prev[prev.length - 1].is_interim) {
            return [...prev.slice(0, -1), newEntry];
          }
          // Otherwise add it
          return [...prev, newEntry];
        });
      } else {
        // For final results, remove any interim and add final
        setTranscript(prev => {
          const filtered = prev.filter(entry => !entry.is_interim);
          return [...filtered, {
            text: newTranscript.transcript || '',
            timestamp: newTranscript.timestamp || new Date().toISOString(),
            is_interim: false,
          }];
        });
        
        // Increment new transcript count if panel is collapsed
        if (!transcriptExpanded) {
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
        hasPathway: !!analysis.pathway_indicators
      });
      
      if (analysis.alerts) {
        setAlerts(prev => [...analysis.alerts, ...prev].slice(0, 5)); // Keep last 5 alerts
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
    },
    onPathwayGuidance: (guidance) => {
      console.log('[App] Received pathway guidance:', guidance);
      // Update pathway indicators based on guidance
      if (guidance) {
        setPathwayIndicators({
          current_approach_effectiveness: guidance.continue_current ? 'effective' : 'ineffective',
          alternative_pathways: guidance.alternative_pathways || [],
          change_urgency: guidance.continue_current ? 'none' : 'recommended',
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
    
    // Only run analysis if we're recording
    if (!isRecording) {
      console.log('[Analysis Effect] Not recording, skipping analysis setup');
      return;
    }

    // For test mode, wait a bit for initial transcript entries
    const startupDelay = isTestMode ? 4000 : 2000; // Wait 4 seconds in test mode for transcript to populate
    
    console.log(`[Analysis Effect] Waiting ${startupDelay}ms before starting analysis...`);
    
    let intervalRefs: { safety?: number; metrics?: number; pathway?: number } = {};
    
    const startupTimer = setTimeout(() => {
      console.log('[Analysis Effect] Starting analysis intervals after delay');
      
      // Check if we have transcript entries now
      if (transcript.length === 0) {
        console.log('[Analysis Effect] Still no transcript after delay, but starting intervals anyway');
      }

      // Different intervals for different analysis types
      const SAFETY_INTERVAL = 5000;  // 5 seconds for critical alerts
      const METRICS_INTERVAL = 10000; // 10 seconds for metrics
      const PATHWAY_INTERVAL = 15000; // 15 seconds for pathway evaluation

      // Triple Stream Analysis Architecture
      
      // Stream 1: Safety Analysis (Fast, 5s interval)
      intervalRefs.safety = setInterval(() => {
        console.log(`[Safety Stream] ⏰ Interval fired at ${new Date().toISOString()}`);
        const currentTranscript = transcriptRef.current.slice(-5); // Use ref to get current transcript
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
            
            // Call with current ref values
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

      // Stream 2: Metrics Analysis (Moderate, 10s interval)
      intervalRefs.metrics = setInterval(() => {
        console.log(`[Metrics Stream] ⏰ Interval fired at ${new Date().toISOString()}`);
        const currentTranscript = transcriptRef.current.slice(-10); // Use ref to get current transcript
        console.log(`[Metrics Stream] Analyzing last 10 entries: ${currentTranscript.length}`);
        
        if (currentTranscript.length >= 3) { // Need at least 3 entries for meaningful metrics
          const formattedTranscript = currentTranscript
            .filter(t => !t.is_interim)
            .map(t => ({
              speaker: 'conversation',
              text: t.text,
              timestamp: t.timestamp
            }));
          
          if (formattedTranscript.length >= 3) {
            console.log(`[Metrics Stream] 📊 TRIGGERING METRICS ANALYSIS`);
            
            // Call with current ref values
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

      // Stream 3: Pathway Evaluation (Complex, conditional)
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
  }, [isRecording, isTestMode]); // Removed transcript.length and functions from dependencies

  const handleStartSession = async () => {
    setSessionStartTime(new Date());
    setIsRecording(true);
    await startRecording();
  };

  const handleStopSession = async () => {
    setIsRecording(false);
    await stopRecording();
    // Stop test mode if running
    if (isTestMode) {
      stopTestMode();
    }
    // Generate session summary
  };

  // Load test transcript progressively
  const loadTestTranscript = () => {
    setIsTestMode(true);
    setIsRecording(true); // Simulate recording state
    setSessionStartTime(new Date());
    setTranscript([]); // Clear existing transcript
    setTestTranscriptIndex(0);
    
    // Start loading transcript entries progressively
    testIntervalRef.current = setInterval(() => {
      setTestTranscriptIndex(prevIndex => {
        if (prevIndex >= testTranscriptData.length) {
          // All entries loaded
          if (testIntervalRef.current) {
            clearInterval(testIntervalRef.current);
            testIntervalRef.current = null;
          }
          setIsTestMode(false);
          return prevIndex;
        }
        
        // Add the next transcript entry
        const entry = testTranscriptData[prevIndex];
        const formattedEntry = {
          text: entry.speaker ? `${entry.speaker}: ${entry.text}` : entry.text,
          timestamp: new Date().toISOString(),
          is_interim: false,
        };
        
        setTranscript(prev => [...prev, formattedEntry]);
        
        // Increment new transcript count if panel is collapsed
        if (!transcriptExpanded) {
          setNewTranscriptCount(prev => prev + 1);
        }
        
        return prevIndex + 1;
      });
    }, 2000); // Add new entry every 2 seconds
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

  const handleToggleTranscript = () => {
    setTranscriptExpanded(!transcriptExpanded);
    if (!transcriptExpanded) {
      setNewTranscriptCount(0); // Reset count when opening
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
        overflow: 'auto',
        paddingBottom: transcriptExpanded ? '360px' : '60px',
        transition: 'padding-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Left Panel - Real-Time Guidance */}
        <Paper 
          sx={{ 
            flex: '1 1 50%', 
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
              alerts.map((alert, index) => (
                <AlertDisplay
                  key={`${alert.timestamp}-${index}`}
                  alert={alert}
                  onDismiss={() => handleDismissAlert(index)}
                />
              ))
            )}
          </Box>
        </Paper>

        {/* Right Panel - Session Metrics and Pathway */}
        <Box sx={{ 
          flex: '1 1 50%', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 3,
        }}>
          {/* Session Metrics */}
          <Paper 
            sx={{ 
              flex: 1,
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
          </Paper>

          {/* Pathway Indicator */}
          <PathwayIndicator 
            currentApproach={sessionContext.current_approach}
            effectiveness={pathwayIndicators.current_approach_effectiveness || (sessionMetrics.phase_appropriate ? 'effective' : 'struggling')}
          />
        </Box>
      </Box>

      {/* Bottom Transcript Panel - Collapsible */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
        }}
      >
        {/* Transcript Header Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            px: 3,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 251, 253, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 -4px 20px -4px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(250, 251, 253, 1) 100%)',
              boxShadow: '0 -4px 24px -4px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          <Box 
            sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}
            onClick={handleToggleTranscript}
          >
            <Article sx={{ 
              fontSize: 24,
              background: 'linear-gradient(135deg, #0b57d0 0%, #00639b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--primary)' }}>
              Live Transcript
            </Typography>
            {!transcriptExpanded && newTranscriptCount > 0 && (
              <Badge 
                badgeContent={newTranscriptCount} 
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    background: 'linear-gradient(135deg, #0b57d0 0%, #00639b 100%)',
                    color: 'white',
                    fontWeight: 600,
                    animation: 'pulse-soft 2s infinite',
                  }
                }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {!isRecording && !isTestMode && (
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
            )}
            {(isRecording || isTestMode) && transcript.length > 0 && (
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
            )}
            <IconButton 
              size="small"
              onClick={handleToggleTranscript}
              sx={{
                color: 'var(--primary)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: transcriptExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <ExpandLess />
            </IconButton>
          </Box>
        </Box>

        {/* Collapsible Transcript Content */}
        <Collapse in={transcriptExpanded} timeout={300}>
          <Box
            sx={{
              height: 300,
              overflow: 'auto',
              p: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(0, 0, 0, 0.05)',
            }}
          >
            <TranscriptDisplay transcript={transcript} />
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

export default App;
