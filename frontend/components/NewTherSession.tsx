import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Tooltip,
  Drawer,
  Badge,
  CircularProgress,
  Alert as MuiAlert,
  Collapse,
  LinearProgress,
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
  Search,
  CallSplit,
  Route,
  Mic,
  Pause,
  PlayArrow,
  Chat,
  Close,
  VolumeUp,
  Article,
  Info,
  TrendingUp,
  ExpandLess,
  ExpandMore,
  Shield,
  SwapHoriz,
  Lightbulb,
  Assessment,
  Build,
  ContactSupport,
  Explore,
} from '@mui/icons-material';
import { Alert, SessionMetrics, PathwayIndicators, SessionContext, Alert as IAlert, Citation, SessionSummary } from '../types/types';
import { formatDuration } from '../utils/timeUtils';
import { getStatusColor } from '../utils/colorUtils';
import { renderMarkdown } from '../utils/textRendering';
import { processNewAlert, cleanupOldAlerts } from '../utils/alertDeduplication';
import { mockPatients } from '../utils/mockPatients';
import { testTranscriptData } from '../utils/mockTranscript';
import SessionLineChart from './SessionLineChart';
import ActionDetailsPanel from './ActionDetailsPanel';
import EvidenceTab from './EvidenceTab';
import PathwayTab from './PathwayTab';
import GuidanceTab from './GuidanceTab';
import AlternativesTab from './AlternativesTab';
import TranscriptDisplay from './TranscriptDisplay';
import SessionSummaryModal from './SessionSummaryModal';
import RationaleModal from './RationaleModal';
import CitationModal from './CitationModal';
import { useAudioStreamingWebSocketTher } from '../hooks/useAudioStreamingWebSocketTher';
import { useTherapyAnalysis } from '../hooks/useTherapyAnalysis';
import { useAuth } from '../contexts/AuthContext';

interface NewTherSessionProps {
  onNavigateBack?: () => void;
  onStopRecording?: () => void;
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
}) => {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isWideScreen = useMediaQuery('(min-width:1024px)');
  
  // Core session state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionType, setSessionType] = useState<'microphone' | 'test' | 'audio' | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [pausedTime, setPausedTime] = useState(0);
  const [lastPauseTime, setLastPauseTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  
  // Transcript and analysis state
  const [transcript, setTranscript] = useState<Array<{
    text: string;
    timestamp: string;
    is_interim?: boolean;
  }>>([]);
  const [alerts, setAlerts] = useState<IAlert[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [sessionMetrics, setSessionMetrics] = useState({
    engagement_level: 0.0,
    therapeutic_alliance: 'unknown' as 'strong' | 'moderate' | 'weak' | 'unknown',
    techniques_detected: [] as string[],
    emotional_state: 'unknown' as 'calm' | 'anxious' | 'distressed' | 'dissociated' | 'engaged' | 'unknown',
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
  
  // UI state
  const [activeTab, setActiveTab] = useState<'guidance' | 'evidence' | 'pathway' | 'alternatives'>('guidance');
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [selectedCitation, setSelectedCitation] = useState<any>(null);
  const [isContraindication, setIsContraindication] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [newTranscriptCount, setNewTranscriptCount] = useState(0);
  const [selectedAlertIndex, setSelectedAlertIndex] = useState<number | null>(null);
  
  // Session context for AI analysis
  const [sessionContext] = useState<SessionContext>({
    session_type: 'CBT',
    primary_concern: 'Anxiety',
    current_approach: 'Cognitive Behavioral Therapy',
  });
  
  // Analysis tracking
  const [wordsSinceLastAnalysis, setWordsSinceLastAnalysis] = useState(0);
  const [hasReceivedComprehensiveAnalysis, setHasReceivedComprehensiveAnalysis] = useState(false);
  
  // Analysis job ID tracking - counter to relate realtime and comprehensive results
  const analysisJobCounterRef = useRef(0);
  
  // Track currently displayed job IDs to ensure realtime and comprehensive results match
  const [displayedRealtimeJobId, setDisplayedRealtimeJobId] = useState<number | null>(null);
  const [displayedComprehensiveJobId, setDisplayedComprehensiveJobId] = useState<number | null>(null);
  const [waitingForComprehensiveJobId, setWaitingForComprehensiveJobId] = useState<number | null>(null);
  
  // Use refs to avoid closure issues in useTherapyAnalysis callback
  const waitingForComprehensiveJobIdRef = useRef<number | null>(null);
  const displayedRealtimeJobIdRef = useRef<number | null>(null);
  const displayedComprehensiveJobIdRef = useRef<number | null>(null);
  
  // Session summary state
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [sessionSummaryClosed, setSessionSummaryClosed] = useState(false);
  
  // Modal state
  const [showRationaleModal, setShowRationaleModal] = useState(false);
  const [citationModalOpen, setCitationModalOpen] = useState(false);
  const [selectedCitationModal, setSelectedCitationModal] = useState<Citation | null>(null);
  
  // Test mode state
  const [isTestMode, setIsTestMode] = useState(false);
  const testIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Error and loading state
  const [error, setError] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Audio streaming hook with WebSocket for both microphone and file
  const { 
    isConnected, 
    startMicrophoneRecording, 
    startAudioFileStreaming,
    pauseAudioStreaming,
    resumeAudioStreaming,
    stopStreaming, 
    isPlayingAudio,
    audioProgress,
    sessionId 
  } = useAudioStreamingWebSocketTher({
    authToken,
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
      console.error('Streaming error (not shown to user):', error);
    }
  });

  // Get Firebase auth token
  useEffect(() => {
    const getAuthToken = async () => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          setAuthToken(token);
        } catch (error) {
          console.error('Error getting auth token:', error);
          setAuthToken(null);
        }
      } else {
        setAuthToken(null);
      }
    };

    getAuthToken();
  }, [currentUser]);

  // Track logged analyses to prevent duplicate logs in Strict Mode
  const lastLoggedAnalysisRef = useRef<Set<string>>(new Set());

  const { analyzeSegment, generateSessionSummary } = useTherapyAnalysis({
    authToken,
    onAnalysis: (analysis) => {
      const analysisType = (analysis as any).analysis_type;
      const isRealtime = analysisType === 'realtime';
      const jobId = (analysis as any).job_id;
      
      // Create a unique identifier for this analysis to prevent duplicate logs
      const analysisId = `${analysisType}-${Date.now()}-${JSON.stringify(analysis).length}`;
      
      // Only log if we haven't logged this analysis before (prevents Strict Mode duplicate logs)
      if (!lastLoggedAnalysisRef.current.has(analysisId)) {
        lastLoggedAnalysisRef.current.add(analysisId);
        
        // Clean up old entries to prevent memory leaks (keep only last 50)
        if (lastLoggedAnalysisRef.current.size > 50) {
          const entries = Array.from(lastLoggedAnalysisRef.current);
          lastLoggedAnalysisRef.current = new Set(entries.slice(-25));
        }
      }
      
      if (isRealtime) {
        // Real-time analysis: Only update alerts and set up for comprehensive results
        if (analysis.alert) {
          const newAlert = {
            ...analysis.alert,
            sessionTime: sessionDuration,
            timestamp: new Date().toISOString(),
            jobId: jobId // Store jobId with alert
          };

          setAlerts(prev => {
            const result = processNewAlert(newAlert, prev);

            if (result.shouldAdd) {
              const updatedAlerts = [newAlert, ...prev].slice(0, 8);
              
              // Update displayed realtime job ID and prepare for comprehensive results
              setDisplayedRealtimeJobId(jobId);
              setWaitingForComprehensiveJobId(jobId);
              
              // Clear previous comprehensive results since we have new realtime results
              setDisplayedComprehensiveJobId(null);
              setPathwayGuidance({});
              setCitations([]);
              
              // Create unique log identifier for this specific alert
              const alertLogId = `new-alert-${newAlert.timestamp}-${newAlert.title}`;
              if (!lastLoggedAnalysisRef.current.has(alertLogId)) {
                lastLoggedAnalysisRef.current.add(alertLogId);
                console.log(`[Session] ⚠️ New ${newAlert.category} alert: "${newAlert.title}" (${newAlert.timing}) - Job ID: ${jobId}`);
              }
              
              return updatedAlerts;
            } else {
              const reason = result.reason || 'deduplication rules';
              
              // Create unique log identifier for this specific filter event
              const filterLogId = `filter-alert-${Date.now()}-${analysis.alert?.title || 'unknown'}`;
              if (!lastLoggedAnalysisRef.current.has(filterLogId)) {
                lastLoggedAnalysisRef.current.add(filterLogId);
                console.log(`[Session] 🚫 Realtime alert filtered: ${reason} - Job ID: ${jobId}`, analysis.alert);
              }
              
              return prev;
            }
          });
        }
      } else {
        // Comprehensive RAG analysis: Only update if jobId matches waiting comprehensive jobId
        const currentWaitingJobId = waitingForComprehensiveJobIdRef.current;
        if (jobId && jobId === currentWaitingJobId) {
          setHasReceivedComprehensiveAnalysis(true);
          setDisplayedComprehensiveJobId(jobId);
          setWaitingForComprehensiveJobId(null);
          
          console.log(`[Session] 📋 Comprehensive results matched and displayed - Job ID: ${jobId}`);
          
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
              }].slice(-10));
            }
            
            setPathwayIndicators(prev => ({
              ...prev,
              ...newIndicators
            }));
          }
          
          if ((analysis as any).pathway_guidance) {
            setPathwayGuidance((analysis as any).pathway_guidance);
          }
          
          if (analysis.citations) {
            setCitations(analysis.citations);
          }
        } else {
          console.log(`[Session] 🚫 Comprehensive results ignored - Job ID: ${jobId} (waiting for: ${currentWaitingJobId})`);
        }
      }
    },
  });

  // Update session duration every second (accounting for paused time)
  useEffect(() => {
    if (!isRecording || !sessionStartTime || isPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - sessionStartTime.getTime()) / 1000);
      setSessionDuration(elapsed - pausedTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, sessionStartTime, isPaused, pausedTime]);

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
  
  // Update job tracking refs when state changes
  useEffect(() => {
    waitingForComprehensiveJobIdRef.current = waitingForComprehensiveJobId;
  }, [waitingForComprehensiveJobId]);
  
  useEffect(() => {
    displayedRealtimeJobIdRef.current = displayedRealtimeJobId;
  }, [displayedRealtimeJobId]);
  
  useEffect(() => {
    displayedComprehensiveJobIdRef.current = displayedComprehensiveJobId;
  }, [displayedComprehensiveJobId]);

  // Helper function to trigger both realtime and comprehensive analysis with shared ID
  const triggerPairedAnalysis = useCallback((transcriptSegment: any[], triggerSource: string) => {
    if (transcriptSegment.length === 0) return;
    
    // Increment job counter and get shared ID for both analyses
    analysisJobCounterRef.current += 1;
    const sharedJobId = analysisJobCounterRef.current;
    
    console.log(`[Session] 🔄 ${triggerSource} triggered - Job ID: ${sharedJobId}`);
    
    // Get the most recent alert for backend deduplication (realtime only)
    const recentAlert = alertsRef.current.length > 0 ? alertsRef.current[0] : null;
    
    // Trigger both analyses with the same job ID
    analyzeSegmentRef.current(
      transcriptSegment,
      { ...sessionContextRef.current, is_realtime: true },
      Math.floor(sessionDurationRef.current / 60),
      recentAlert,
      sharedJobId
    );
    
    analyzeSegmentRef.current(
      transcriptSegment,
      { ...sessionContextRef.current, is_realtime: false },
      Math.floor(sessionDurationRef.current / 60),
      undefined, // no previous alert for comprehensive
      sharedJobId
    );
  }, []);

  // Word-based real-time analysis trigger (simplified)
  useEffect(() => {
    if (!isRecording || transcript.length === 0) return;
    
    const lastEntry = transcript[transcript.length - 1];
    if (!lastEntry || lastEntry.is_interim) return;
    
    // Count words in the new entry
    const newWords = lastEntry.text.split(' ').filter(word => word.trim()).length;
    
    setWordsSinceLastAnalysis(prev => {
      const updatedWordCount = prev + newWords;
      
      // Trigger analysis every 10 words minimum
      const WORDS_PER_ANALYSIS = 10;
      const TRANSCRIPT_WINDOW_MINUTES = 5;
      
      if (updatedWordCount >= WORDS_PER_ANALYSIS) {
        // Get last 5 minutes of transcript
        const fiveMinutesAgo = new Date(Date.now() - TRANSCRIPT_WINDOW_MINUTES * 60 * 1000);
        const recentTranscript = transcript
          .filter(t => !t.is_interim && new Date(t.timestamp) > fiveMinutesAgo)
          .map(t => ({
            speaker: 'conversation',
            text: t.text,
            timestamp: t.timestamp
          }));
        
        if (recentTranscript.length > 0) {
          triggerPairedAnalysis(recentTranscript, `Auto-analysis (${updatedWordCount} words)`);
        }
        
        // Reset word count
        return 0;
      }
      
      return updatedWordCount;
    });
  }, [transcript, isRecording, triggerPairedAnalysis]);

  // Generate current date in the format "Month Day, Year"
  const getCurrentDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get patient name from patientId
  const getPatientName = () => {
    if (patientId) {
      const patient = mockPatients.find(p => p.id === patientId);
      return patient?.name || 'John Doe';
    }
    return 'John Doe';
  };

  // Determine therapy phase
  const determineTherapyPhase = (duration: number) => {
    if (duration <= 10 * 60) {
      return "Beginning (1-10 minutes)";
    } else if (duration <= 40 * 60) {
      return "Middle (10-40 minutes)";
    } else {
      return "End (40+ minutes)";
    }
  };

  // Get current alert for tab display
  const getCurrentAlert = () => {
    if (alerts.length > 0 && displayedRealtimeJobId !== null) {
      const recentAlert = alerts[0];
      return {
        title: recentAlert.title || "Current Alert",
        category: recentAlert.category || "general",
        timing: recentAlert.timing || "info"
      };
    }
    return null;
  };

  // Get current guidance for Guidance tab (realtime analysis only)
  const getCurrentGuidance = () => {
    // Show real-time alerts for Guidance tab
    if (alerts.length > 0) {
      const recentAlert = alerts[0];
      const recommendationText = Array.isArray(recentAlert.recommendation) 
        ? recentAlert.recommendation.join('\n') 
        : recentAlert.recommendation;
      
      return {
        title: recentAlert.title || "Current Clinical Guidance",
        time: formatDuration(sessionDuration),
        content: recentAlert.message || "Real-time guidance available.",
        immediateActions: recommendationText ? [{
          title: recommendationText,
          description: recommendationText,
          icon: 'safety' as const
        }] : [],
        contraindications: []
      };
    }
    
    // Default guidance when no realtime alerts available
    return {
      title: isRecording ? "Listening for guidance..." : "No guidance available",
      time: formatDuration(sessionDuration),
      content: isRecording 
        ? "Listening..."
        : "Start a session to receive real-time therapeutic guidance.",
      immediateActions: [],
      contraindications: []
    };
  };

  // Get pathway guidance for Pathway tab (comprehensive analysis only)
  const getPathwayGuidance = () => {
    // Show comprehensive results if available and job IDs match
    if (pathwayGuidance.rationale && displayedComprehensiveJobId === displayedRealtimeJobId) {
      return {
        title: "Current Clinical Guidance",
        time: formatDuration(sessionDuration),
        content: pathwayGuidance.rationale,
        immediateActions: pathwayGuidance.immediate_actions?.map(action => ({
          title: action,
          description: action,
          icon: 'safety' as const
        })) || [],
        contraindications: pathwayGuidance.contraindications?.map(contra => ({
          title: contra,
          description: contra,
          icon: 'cognitive' as const
        })) || [],
        isLive: true,
        jobId: displayedComprehensiveJobId
      };
    }
    
    // Show loading state when waiting for comprehensive results
    if (waitingForComprehensiveJobId !== null) {
      return {
        title: "Creating comprehensive therapeutic guidance...",
        time: formatDuration(sessionDuration),
        content: "Creating comprehensive therapeutic guidance...",
        immediateActions: [],
        contraindications: [],
        isLive: false,
        isLoading: true,
        jobId: waitingForComprehensiveJobId
      };
    }
    
    // Default when no analysis available yet
    return {
      title: hasReceivedComprehensiveAnalysis ? "No pathway guidance available" : "Waiting for analysis...",
      time: formatDuration(sessionDuration),
      content: hasReceivedComprehensiveAnalysis 
        ? "Start a session to receive comprehensive therapeutic guidance."
        : "Start a session to receive comprehensive therapeutic guidance.",
      immediateActions: [],
      contraindications: [],
      isLive: false,
      jobId: null
    };
  };

  // Session control functions
  const handleStartSession = async () => {
    setSessionStartTime(new Date());
    setIsRecording(true);
    setSessionType('microphone');
    setSessionSummaryClosed(false);
    setSessionSummary(null);
    setSummaryError(null);
    setPausedTime(0);
    setIsPaused(false);
    setHasReceivedComprehensiveAnalysis(false);
    setTranscript([]);
    setAlerts([]);
    
    // Reset job tracking state
    setDisplayedRealtimeJobId(null);
    setDisplayedComprehensiveJobId(null);
    setWaitingForComprehensiveJobId(null);
    setPathwayGuidance({});
    setCitations([]);
    
    await startMicrophoneRecording();
  };

  const handlePauseResume = async () => {
    if (isPaused) {
      // Resume
      const now = new Date();
      if (lastPauseTime) {
        const pauseDuration = Math.floor((now.getTime() - lastPauseTime.getTime()) / 1000);
        setPausedTime(prev => prev + pauseDuration);
      }
      setIsPaused(false);
      setLastPauseTime(null);
      
      // Resume based on session type
      if (sessionType === 'microphone') {
        await startMicrophoneRecording();
      } else if (sessionType === 'audio') {
        await resumeAudioStreaming();
      } else if (sessionType === 'test') {
        resumeTestMode();
      }
    } else {
      // Pause
      setIsPaused(true);
      setLastPauseTime(new Date());
      
      // Pause based on session type
      if (sessionType === 'microphone') {
        await stopStreaming();
      } else if (sessionType === 'audio') {
        pauseAudioStreaming();
      } else if (sessionType === 'test') {
        pauseTestMode();
      }
    }
  };

  const handleStopSession = async () => {
    setIsRecording(false);
    setIsPaused(false);
    setSessionType(null);
    await stopStreaming();
    if (isTestMode) {
      stopTestMode();
    }
    if (transcript.length > 0) {
      requestSummary();
    }
  };

  const requestSummary = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    setSessionSummaryClosed(true);
    try {
      const fullTranscript = transcript
        .filter(t => !t.is_interim)
        .map(t => ({
          speaker: 'conversation',
          text: t.text,
          timestamp: t.timestamp,
        }));
      
      const result = await generateSessionSummary(fullTranscript, sessionMetrics);

      if (result.summary) {
        setSessionSummary(result.summary);
        setShowSessionSummary(true);
      } else {
        throw new Error('Invalid summary response');
      }
    } catch (err) {
      console.error('Error generating summary:', err);
      setSummaryError('Failed to generate session summary. Please try again.');
    } finally {
      setSummaryLoading(false);
    }
  };

  // Test mode functions
  const loadTestTranscript = () => {
    setIsTestMode(true);
    setIsRecording(true);
    setSessionType('test');
    setSessionStartTime(new Date());
    setTranscript([]);
    setPausedTime(0);
    setIsPaused(false);
    setHasReceivedComprehensiveAnalysis(false);
    
    // Reset job tracking state
    setDisplayedRealtimeJobId(null);
    setDisplayedComprehensiveJobId(null);
    setWaitingForComprehensiveJobId(null);
    setPathwayGuidance({});
    setCitations([]);
    
    // Set test pathway guidance (will be overridden by real analysis)
    setPathwayGuidance({
      rationale: "This is a test rationale for the loaded transcript. The pathway is being monitored based on the current interaction.",
      immediate_actions: ["Test Action: Build more rapport with the client.", "Test Action: Validate the client's feelings about the situation."],
      contraindications: ["Test Contraindication: Avoid challenging the client's core beliefs at this early stage.", "Test Contraindication: Do not assign homework that is too demanding."],
    });
    
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

  const pauseTestMode = () => {
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }
  };

  const resumeTestMode = () => {
    if (isTestMode && !testIntervalRef.current) {
      // Resume from where we left off
      const currentTranscriptLength = transcript.filter(t => !t.is_interim).length;
      let currentIndex = currentTranscriptLength;
      
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
    }
  };

  const stopTestMode = () => {
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }
    setIsTestMode(false);
    setIsRecording(false);
  };

  const loadExampleAudio = async () => {
    setIsRecording(true);
    setSessionType('audio');
    setSessionStartTime(new Date());
    setTranscript([]);
    setSessionSummaryClosed(false);
    setSessionSummary(null);
    setSummaryError(null);
    setPausedTime(0);
    setIsPaused(false);
    setHasReceivedComprehensiveAnalysis(false);
    
    // Reset job tracking state
    setDisplayedRealtimeJobId(null);
    setDisplayedComprehensiveJobId(null);
    setWaitingForComprehensiveJobId(null);
    setPathwayGuidance({});
    setCitations([]);
    
    // Start streaming the example audio file
    await startAudioFileStreaming('/audio/suny-good-audio.mp3');
  };

  const handleActionClick = (action: any, isContra: boolean) => {
    setSelectedAction(action);
    setSelectedCitation(null); // Clear citation if action is selected
    setIsContraindication(isContra);
  };

  const handleCitationClick = (citation: any) => {
    setSelectedCitation(citation);
    setSelectedAction(null); // Clear action if citation is selected
  };

  const handleClosePanel = () => {
    setSelectedAction(null);
    setSelectedCitation(null);
  };

  const handleCitationModalClick = (citation: Citation) => {
    setSelectedCitationModal(citation);
    setCitationModalOpen(true);
  };

  const getEmotionalStateColor = (state: string) => {
    switch (state) {
      case 'calm': return '#128937';
      case 'anxious': return '#f59e0b';
      case 'distressed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Get alert category icon
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'safety':
        return <Shield sx={{ fontSize: 20, color: '#dc2626' }} />;
      case 'technique':
        return <Psychology sx={{ fontSize: 20, color: '#c05a01' }} />;
      case 'pathway_change':
        return <SwapHoriz sx={{ fontSize: 20, color: '#f59e0b' }} />;
      case 'engagement':
        return <Lightbulb sx={{ fontSize: 20, color: '#10b981' }} />;
      case 'process':
        return <Assessment sx={{ fontSize: 20, color: '#6366f1' }} />;
      default:
        return <Build sx={{ fontSize: 20, color: '#6b7280' }} />;
    }
  };

  // Helper function to ensure recommendations are formatted as bullet points
  const normalizeRecommendationFormat = (recommendation: string): string => {
    if (!recommendation) return recommendation;
    
    // If it already contains markdown bullet points, return as-is
    if (recommendation.includes('- ') || recommendation.includes('* ')) {
      return recommendation;
    }
    
    // Split by periods or newlines to create separate bullet points
    const lines = recommendation
      .split(/[.\n]/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // If we only have one line, return as-is (might be a single sentence)
    if (lines.length <= 1) {
      return recommendation;
    }
    
    // Convert to markdown bullet points
    return lines.map(line => `- ${line}`).join('\n');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
      if (testIntervalRef.current) {
        clearInterval(testIntervalRef.current);
      }
    };
  }, [stopStreaming]);

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
          position: 'relative',
        }}>
          <ActionDetailsPanel
            action={selectedAction}
            citation={selectedCitation}
            onClose={handleClosePanel}
            isContraindication={isContraindication}
          />
          {/* Sidebar */}
          <Box sx={{ 
            width: 351,
            display: 'flex',
            transform: (selectedAction || selectedCitation) ? 'translateX(-100%)' : 'translateX(0)',
            transition: 'transform 0.3s ease-in-out',
            flexDirection: 'column',
            gap: 6,
            p: 3,
          }}>
            {/* Title Section */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                {onNavigateBack && (
                  <Button
                    startIcon={<ArrowBack />}
                    onClick={onNavigateBack}
                    sx={{
                      color: '#0b57d0',
                      textTransform: 'none',
                      fontSize: '14px',
                      fontWeight: 500,
                      minWidth: 'auto',
                      px: 1,
                      py: 0.5,
                      '&:hover': {
                        backgroundColor: 'rgba(11, 87, 208, 0.04)',
                      },
                    }}
                  >
                  </Button>
                )}
                <Typography variant="h6" sx={{ 
                  fontSize: '28px', 
                  fontWeight: 600, 
                  color: '#1f1f1f',
                }}>
                  {getPatientName()}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ 
                fontSize: '16px', 
                color: '#444746',
                mb: 2,
              }}>
                {getCurrentDate()}
              </Typography>
            </Box>

            {/* Navigation Menu */}
            <Box>
            {[
              { key: 'guidance', label: 'Guidance', icon: <Explore sx={{ fontSize: 24, color: '#444746' }} /> },
              { key: 'pathway', label: 'Pathway', icon: <Route sx={{ fontSize: 24, color: '#444746' }} /> },
              { key: 'alternatives', label: 'Alternatives', icon: <CallSplit sx={{ fontSize: 24, color: '#444746' }} /> },
            ].map((item) => (
                <Box
                  key={item.key}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    height: 56,
                    px: 1.5,
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
                  <Box sx={{ mr: 1.5, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {activeTab === item.key ? item.icon : null}
                  </Box>
                  <Typography variant="body1" sx={{ fontSize: '18px', color: '#1f1f1f' }}>
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
            {activeTab === 'guidance' && (
              <GuidanceTab 
                currentGuidance={getCurrentGuidance()} 
                alerts={alerts}
                transcript={transcript}
                pathwayGuidance={pathwayGuidance}
                onActionClick={handleActionClick} 
              />
            )}
            {activeTab === 'evidence' && <EvidenceTab />}
            {activeTab === 'pathway' && (
              <PathwayTab 
                onCitationClick={handleCitationClick} 
                onActionClick={handleActionClick}
                currentGuidance={getPathwayGuidance()}
                citations={citations}
                techniques={sessionMetrics.techniques_detected}
                currentAlert={getCurrentAlert()}
              />
            )}
            {activeTab === 'alternatives' && (
              <AlternativesTab 
                alternativePathways={pathwayGuidance.alternative_pathways}
                citations={citations}
                onCitationClick={handleCitationClick}
                hasReceivedComprehensiveAnalysis={hasReceivedComprehensiveAnalysis}
                waitingForComprehensiveJobId={waitingForComprehensiveJobId}
                displayedComprehensiveJobId={displayedComprehensiveJobId}
                displayedRealtimeJobId={displayedRealtimeJobId}
                currentAlert={getCurrentAlert()}
              />
            )}
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
            <Tooltip title="Explore Patient's Internal Experience">
              <IconButton sx={{ position: 'absolute', bottom: -10, left: 86, transform: 'translateX(-50%)' }}>
                <Psychology sx={{ fontSize: 20, color: '#c05a01' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Suicidal Ideation Detected">
              <IconButton sx={{ position: 'absolute', bottom: -10, left: 151, transform: 'translateX(-50%)' }}>
                <Warning sx={{ fontSize: 20, color: '#db372d' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Explore Patient's Internal Experience">
              <IconButton sx={{ position: 'absolute', bottom: -10, left: 414, transform: 'translateX(-50%)' }}>
                <Psychology sx={{ fontSize: 20, color: '#c05a01' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Safety Plan Initiated">
              <IconButton sx={{ position: 'absolute', bottom: -10, right: 180, transform: 'translateX(50%)' }}>
                <HealthAndSafety sx={{ fontSize: 20, color: '#128937' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Grounding Exercise">
              <IconButton sx={{ position: 'absolute', bottom: -10, right: 60, transform: 'translateX(50%)' }}>
                <NaturePeople sx={{ fontSize: 20, color: '#128937' }} />
              </IconButton>
            </Tooltip>
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 2, 
              py: 2, 
              borderRight: '1px solid #f0f4f9',
            }}>
              <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '24px', color: '#1e1e1e' }}>
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
                  {determineTherapyPhase(sessionDuration)}
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
              {!isRecording ? (
                <Button
                  variant="contained"
                  startIcon={<Mic />}
                  onClick={handleStartSession}
                  sx={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    },
                  }}
                >
                  Start Session
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={isPaused ? <PlayArrow /> : <Pause />}
                    onClick={handlePauseResume}
                    sx={{ 
                      background: isPaused 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      '&:hover': { 
                        background: isPaused
                          ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                          : 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                      },
                    }}
                  >
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <IconButton
                    onClick={handleStopSession}
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
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1201, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
        {/* Reopen Session Summary Button */}
        {sessionSummaryClosed && !showSessionSummary && (
          <Fab
            color="secondary"
            variant="extended"
            aria-label="reopen session summary"
            onClick={() => setShowSessionSummary(true)}
            sx={{
              background: 'linear-gradient(135deg, #673ab7 0%, #512da8 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #512da8 0%, #673ab7 100%)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 8px 20px -4px rgba(103, 58, 183, 0.35)',
            }}
          >
            <Article sx={{ mr: 1 }} />
            Summary
          </Fab>
        )}

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
            background: 'linear-gradient(135deg, #0b57d0 0%, #00639b 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #00639b 0%, #0b57d0 100%)',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 8px 20px -4px rgba(11, 87, 208, 0.35)',
          }}
        >
          <Badge badgeContent={newTranscriptCount} color="error">
            <Chat />
          </Badge>
        </Fab>
      </Box>

      {/* Test Buttons */}
      {!isRecording && !isTestMode && (
        <Box sx={{ 
          position: 'fixed', 
          bottom: 24, 
          left: 24,
          zIndex: 1201,
          display: 'flex',
          gap: 1,
          flexDirection: 'column',
        }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<VolumeUp />}
            onClick={loadExampleAudio}
            sx={{ 
              borderColor: '#6366f1',
              color: '#6366f1',
              '&:hover': {
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(99, 102, 241, 0.04)',
              },
              fontWeight: 600,
              borderRadius: '16px',
              px: 2,
              py: 0.5,
            }}
          >
            Load Example Audio
          </Button>
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
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(248, 250, 252, 0.85) 100%)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            boxShadow: '-8px 0 32px -4px rgba(0, 0, 0, 0.12)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.5)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%)',
              pointerEvents: 'none',
            },
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
        
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <TranscriptDisplay transcript={transcript} />
        </Box>
      </Drawer>

      {/* Error Display */}
      {error && (
        <Box sx={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 1300 }}>
          <MuiAlert severity="error" onClose={() => setError(null)}>
            {error}
          </MuiAlert>
        </Box>
      )}

      {/* Session Summary Modal */}
      <SessionSummaryModal
        open={showSessionSummary}
        onClose={() => setShowSessionSummary(false)}
        summary={sessionSummary}
        loading={summaryLoading}
        error={summaryError}
        onRetry={requestSummary}
        sessionId={sessionId}
      />

      <RationaleModal
        open={showRationaleModal}
        onClose={() => setShowRationaleModal(false)}
        rationale={pathwayGuidance.rationale}
        immediateActions={pathwayGuidance.immediate_actions}
        contraindications={pathwayGuidance.contraindications}
        citations={citations}
        onCitationClick={handleCitationModalClick}
      />

      <CitationModal
        open={citationModalOpen}
        onClose={() => {
          setCitationModalOpen(false);
          setSelectedCitationModal(null);
        }}
        citation={selectedCitationModal}
      />

    </Box>
  );
};

export default NewTherSession;
