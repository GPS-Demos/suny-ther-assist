import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
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
import SessionSummaryModal from './SessionSummaryModal';
import { useAudioRecorderWebSocket } from '../hooks/useAudioRecorderWebSocket';
import { useTherapyAnalysis } from '../hooks/useTherapyAnalysis';
import { formatDuration } from '../utils/timeUtils';
import { SessionContext, Alert as IAlert, Citation } from '../types/types';
import { testTranscriptData } from '../utils/testTranscript';

const App: React.FC = () => {
  const isDesktop = useMediaQuery(useTheme().breakpoints.up('lg'));
  const isWideScreen = useMediaQuery('(min-width:1024px)');
  
  const [isRecording, setIsRecording] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [newTranscriptCount, setNewTranscriptCount] = useState(0);
  const [sessionContext] = useState<SessionContext>({
    session_type: 'CBT',
    primary_concern: 'Anxiety',
    current_approach: 'Cognitive Behavioral Therapy',
  });
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [wordsSinceLastAnalysis, setWordsSinceLastAnalysis] = useState(0);

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
  const [pathwayHistory, setPathwayHistory] = useState<Array<{
    timestamp: string;
    effectiveness: 'effective' | 'struggling' | 'ineffective' | 'unknown';
    change_urgency: 'none' | 'monitor' | 'consider' | 'recommended';
    rationale?: string;
  }>>([]);
  const [riskLevel] = useState<'low' | 'moderate' | 'high' | null>(null);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  
  // Test mode state
  const [isTestMode, setIsTestMode] = useState(false);
  const testIntervalRef = useRef<number | null>(null);

  // Audio recording hook with WebSocket streaming
  const { 
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
        timing: 'now' as const,  // System errors need immediate attention
        category: 'safety' as const,
        title: 'System Error',
        message: error,
        timestamp: new Date().toISOString()
      }]);
    }
  });

  const { analyzeSegment } = useTherapyAnalysis({
    onAnalysis: (analysis) => {
      const analysisType = (analysis as any).analysis_type;
      const isRealtime = analysisType === 'realtime';
      
      console.log('[App] Received analysis:', {
        type: analysisType,
        isRealtime,
        hasAlerts: !!analysis.alerts,
        hasMetrics: !!analysis.session_metrics,
        hasPathway: !!analysis.pathway_indicators,
        hasCitations: !!analysis.citations
      });
      
      if (isRealtime) {
        // Real-time analysis: Only update alerts and basic metrics
        if (analysis.alerts && analysis.alerts.length > 0) {
          setAlerts(prev => [...analysis.alerts!, ...prev].slice(0, 5));
        }
        if (analysis.session_metrics) {
          setSessionMetrics(prev => ({
            ...prev,
            engagement_level: analysis.session_metrics!.engagement_level || prev.engagement_level,
            therapeutic_alliance: analysis.session_metrics!.therapeutic_alliance || prev.therapeutic_alliance,
            emotional_state: analysis.session_metrics!.emotional_state || prev.emotional_state,
            // Don't update complex metrics from real-time
            techniques_detected: prev.techniques_detected,
            phase_appropriate: prev.phase_appropriate,
          }));
        }
      } else {
        // Comprehensive RAG analysis: Update pathway indicators and citations
        // Don't update alerts from RAG analysis - keep those real-time only
        if (analysis.session_metrics) {
          setSessionMetrics(prev => ({
            ...prev,
            ...analysis.session_metrics
          }));
        }
        if (analysis.pathway_indicators) {
          const newIndicators = analysis.pathway_indicators;
          
          // Check if there's a change in urgency or effectiveness to add to history
          if (pathwayIndicators.change_urgency !== newIndicators.change_urgency ||
              pathwayIndicators.current_approach_effectiveness !== newIndicators.current_approach_effectiveness) {
            setPathwayHistory(prev => [...prev, {
              timestamp: new Date().toISOString(),
              effectiveness: newIndicators.current_approach_effectiveness || 'unknown',
              change_urgency: newIndicators.change_urgency || 'none',
              rationale: (analysis as any).pathway_guidance?.rationale
            }].slice(-10)); // Keep last 10 history items
          }
          
          setPathwayIndicators(prev => ({
            ...prev,
            ...newIndicators
          }));
        }
        
        // Handle pathway guidance from the same response
        if ((analysis as any).pathway_guidance) {
          setPathwayGuidance((analysis as any).pathway_guidance);
        }
        
        if (analysis.citations) {
          setCitations(analysis.citations);
        }
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
  
  // Store transcript in ref to avoid stale closures
  const transcriptRef = useRef(transcript);
  const sessionMetricsRef = useRef(sessionMetrics);
  const alertsRef = useRef(alerts);
  const sessionContextRef = useRef(sessionContext);
  const sessionDurationRef = useRef(sessionDuration);
  
  useEffect(() => {
    analyzeSegmentRef.current = analyzeSegment;
  }, [analyzeSegment]);
  
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

  // Word-based real-time analysis trigger (simplified)
  useEffect(() => {
    if (!isRecording || transcript.length === 0) return;
    
    const lastEntry = transcript[transcript.length - 1];
    if (!lastEntry || lastEntry.is_interim) return;
    
    // Count words in the new entry
    const newWords = lastEntry.text.split(' ').filter(word => word.trim()).length;
    
    setWordsSinceLastAnalysis(prev => {
      const updatedWordCount = prev + newWords;
      console.log(`[Word Trigger] New words: ${newWords}, Total since last analysis: ${updatedWordCount}`);
      
      // Trigger analysis every 10 words
      const WORDS_PER_ANALYSIS = 10;
      const TRANSCRIPT_WINDOW_MINUTES = 5;
      
      if (updatedWordCount >= WORDS_PER_ANALYSIS) {
        console.log(`[Word Trigger] 🚀 Triggering real-time guidance and pathway analysis after ${updatedWordCount} words`);
        
        // Get last 5 minutes of transcript
        const fiveMinutesAgo = new Date(Date.now() - TRANSCRIPT_WINDOW_MINUTES * 60 * 1000);
        const recentTranscript = transcript
          .filter(t => !t.is_interim && new Date(t.timestamp) > fiveMinutesAgo)
          .map(t => ({
            speaker: 'conversation',
            text: t.text,
            timestamp: t.timestamp
          }));
        
        console.log(`[Word Trigger] Sending ${recentTranscript.length} entries from last 5 minutes`);
        
        if (recentTranscript.length > 0) {
          // 1. Real-time analysis (fast, no RAG) - for immediate guidance
          console.log('[Word Trigger] Triggering REAL-TIME analysis (unRAGed)');
          analyzeSegmentRef.current(
            recentTranscript,
            { ...sessionContextRef.current, is_realtime: true },
            Math.floor(sessionDurationRef.current / 60)
          );
          
          // 2. Comprehensive analysis (with RAG) - for pathway evaluation
          console.log('[Word Trigger] Triggering COMPREHENSIVE analysis (RAGed)');
          analyzeSegmentRef.current(
            recentTranscript,
            { ...sessionContextRef.current, is_realtime: false },
            Math.floor(sessionDurationRef.current / 60)
          );
        }
        
        // Reset word count
        return 0;
      }
      
      return updatedWordCount;
    });
  }, [transcript, isRecording]);

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
    // Show session summary modal if we have transcript data
    if (transcript.length > 0) {
      setShowSessionSummary(true);
    }
  };

  const loadTestTranscript = () => {
    setIsTestMode(true);
    setIsRecording(true);
    setSessionStartTime(new Date());
    setTranscript([]);
    
    let currentIndex = 0;
    testIntervalRef.current = setInterval(() => {
        if (currentIndex >= testTranscriptData.length) {
          if (testIntervalRef.current) {
            clearInterval(testIntervalRef.current);
            testIntervalRef.current = null;
          }
          setIsTestMode(false);
          return;
        }
        
        const entry = testTranscriptData[currentIndex];
        const formattedEntry = {
          text: entry.speaker ? `${entry.speaker}: ${entry.text}` : entry.text,
          timestamp: new Date().toISOString(),
          is_interim: false,
        };
        
        setTranscript(prev => [...prev, formattedEntry]);
        
        if (!transcriptOpen) {
          setNewTranscriptCount(prev => prev + 1);
        }
        
        currentIndex++;
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
                fontSize: 28,
                color: 'rgba(11, 87, 208, 0.6)',
                opacity: 0.8,
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
                      citations={citations}
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
                                citations={citations}
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
                  fontSize: 28,
                  color: 'rgba(11, 87, 208, 0.6)',
                  opacity: 0.8,
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
              changeUrgency={pathwayIndicators.change_urgency}
              rationale={pathwayGuidance.rationale}
              immediateActions={pathwayGuidance.immediate_actions}
              contraindications={pathwayGuidance.contraindications}
              alternativePathways={pathwayGuidance.alternative_pathways}
              citations={citations}
              history={pathwayHistory}
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
                console.log('[Manual Analysis] Triggering both real-time and comprehensive analyses');
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
                    // Trigger both analyses like the automatic word trigger does
                    analyzeSegment(
                      formattedTranscript, 
                      { ...sessionContext, is_realtime: true }, 
                      Math.floor(sessionDuration / 60)
                    );
                    analyzeSegment(
                      formattedTranscript, 
                      { ...sessionContext, is_realtime: false }, 
                      Math.floor(sessionDuration / 60)
                    );
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

      {/* Session Summary Modal */}
      <SessionSummaryModal
        open={showSessionSummary}
        onClose={() => setShowSessionSummary(false)}
        transcript={transcript}
        sessionMetrics={sessionMetrics}
        sessionContext={sessionContext}
        sessionDuration={sessionDuration}
        sessionId={sessionId}
      />
    </Box>
  );
};

export default App;
