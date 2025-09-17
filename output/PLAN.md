# NewTherSession.tsx Implementation Plan

## Overview

NewTherSession.tsx is a redesigned interface that currently serves as a static presentation layer with hardcoded mock data. This document outlines the complete implementation plan to add the same functional capabilities as NewSession.tsx while maintaining the new UI design.

## Current State Analysis

### What NewTherSession.tsx Currently Has

**UI Components (Static):**
- Modern redesigned layout with sidebar navigation
- Tab-based content switching (Guidance, Evidence, Pathway, Alternatives)
- Session metrics display (hardcoded)
- Timeline visualization with event markers
- Action cards for immediate actions and contraindications
- ActionDetailsPanel for expanded views
- Session header with KPIs

**Static Data:**
- Hardcoded session metrics, pathway indicators, and guidance
- Mock patient information
- Fixed session duration and phase
- Static alert/event markers on timeline

### What NewTherSession.tsx is Missing

**Core Session Management:**
1. Audio recording/streaming capabilities
2. Real-time transcription integration
3. Live AI analysis and alert generation
4. Session state management (recording, pausing, stopping)
5. Dynamic session timing with pause tracking
6. Authentication and backend integration

**Real-time Data Integration:**
1. Live transcript processing
2. Dynamic alert generation with deduplication
3. Real-time session metrics updates
4. Pathway effectiveness monitoring
5. Evidence-based citation integration
6. Session summary generation

**Interactive Features:**
1. Transcript sidebar with live updates
2. Modal dialogs for detailed views
3. Real-time UI state updates
4. Multiple session types support
5. Manual analysis triggering

## Implementation Plan

### Phase 1: Core Infrastructure Integration

#### 1.1 Add Required Hooks and State Management

**Add to NewTherSession.tsx:**

```typescript
// Import required hooks
import { useAudioStreamingWebSocket } from '../hooks/useAudioStreamingWebSocket';
import { useTherapyAnalysis } from '../hooks/useTherapyAnalysis';
import { useAuth } from '../contexts/AuthContext';

// Import required utilities
import { processNewAlert, cleanupOldAlerts } from '../utils/alertDeduplication';
import { formatDuration } from '../utils/timeUtils';

// Add state management (mirror NewSession.tsx state structure)
const [isRecording, setIsRecording] = useState(false);
const [isPaused, setIsPaused] = useState(false);
const [sessionType, setSessionType] = useState<'microphone' | 'test' | 'audio' | null>(null);
const [authToken, setAuthToken] = useState<string | null>(null);
const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
const [pausedTime, setPausedTime] = useState(0);
const [lastPauseTime, setLastPauseTime] = useState<Date | null>(null);
const [sessionDuration, setSessionDuration] = useState(0);
const [transcript, setTranscript] = useState<Array<{text: string; timestamp: string; is_interim?: boolean;}>>([]);
const [alerts, setAlerts] = useState<IAlert[]>([]);
const [citations, setCitations] = useState<Citation[]>([]);
const [sessionMetrics, setSessionMetrics] = useState(defaultMetrics);
const [pathwayIndicators, setPathwayIndicators] = useState(defaultPathway);
const [pathwayGuidance, setPathwayGuidance] = useState(defaultGuidance);
const [wordsSinceLastAnalysis, setWordsSinceLastAnalysis] = useState(0);
const [hasReceivedComprehensiveAnalysis, setHasReceivedComprehensiveAnalysis] = useState(false);

// Session context for AI analysis
const [sessionContext] = useState<SessionContext>({
  session_type: 'CBT',
  primary_concern: 'Anxiety',
  current_approach: 'Cognitive Behavioral Therapy',
});

// Modal and UI state
const [transcriptOpen, setTranscriptOpen] = useState(false);
const [newTranscriptCount, setNewTranscriptCount] = useState(0);
const [showSessionSummary, setShowSessionSummary] = useState(false);
const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
const [summaryLoading, setSummaryLoading] = useState(false);
const [showRationaleModal, setShowRationaleModal] = useState(false);
const [citationModalOpen, setCitationModalOpen] = useState(false);
const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
```

#### 1.2 Integrate Audio Streaming Hook

**Implementation:**

```typescript
// Initialize audio streaming hook
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
} = useAudioStreamingWebSocket({
  authToken,
  onTranscript: (newTranscript: any) => {
    // Process incoming transcript (same logic as NewSession)
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
    console.error('Streaming error:', error);
  }
});
```

#### 1.3 Integrate Therapy Analysis Hook

**Implementation:**

```typescript
const { analyzeSegment, generateSessionSummary } = useTherapyAnalysis({
  authToken,
  onAnalysis: (analysis) => {
    const analysisType = (analysis as any).analysis_type;
    const isRealtime = analysisType === 'realtime';
    
    if (isRealtime) {
      // Real-time analysis: Update alerts
      if (analysis.alert) {
        const newAlert = {
          ...analysis.alert,
          sessionTime: sessionDuration,
          timestamp: new Date().toISOString()
        };

        setAlerts(prev => {
          const result = processNewAlert(newAlert, prev, { debugMode: false });
          if (result.shouldAdd) {
            return [newAlert, ...prev].slice(0, 8);
          }
          return prev;
        });
      }
    } else {
      // Comprehensive analysis: Update metrics, pathway, citations
      setHasReceivedComprehensiveAnalysis(true);
      
      if (analysis.session_metrics) {
        setSessionMetrics(prev => ({ ...prev, ...analysis.session_metrics }));
      }
      
      if (analysis.pathway_indicators) {
        setPathwayIndicators(prev => ({ ...prev, ...analysis.pathway_indicators }));
      }
      
      if ((analysis as any).pathway_guidance) {
        setPathwayGuidance((analysis as any).pathway_guidance);
      }
      
      if (analysis.citations) {
        setCitations(analysis.citations);
      }
    }
  },
});
```

#### 1.4 Add Authentication Integration

**Implementation:**

```typescript
// Firebase auth integration
const { currentUser } = useAuth();

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
```

### Phase 2: Session Control Implementation

#### 2.1 Session Management Functions

**Add session control handlers:**

```typescript
const handleStartSession = async () => {
  setSessionStartTime(new Date());
  setIsRecording(true);
  setSessionType('microphone');
  setTranscript([]);
  setAlerts([]);
  setPausedTime(0);
  setIsPaused(false);
  setHasReceivedComprehensiveAnalysis(false);
  await startMicrophoneRecording();
};

const handlePauseResume = async () => {
  if (isPaused) {
    // Resume logic
    const now = new Date();
    if (lastPauseTime) {
      const pauseDuration = Math.floor((now.getTime() - lastPauseTime.getTime()) / 1000);
      setPausedTime(prev => prev + pauseDuration);
    }
    setIsPaused(false);
    setLastPauseTime(null);
    
    if (sessionType === 'microphone') {
      await startMicrophoneRecording();
    } else if (sessionType === 'audio') {
      await resumeAudioStreaming();
    }
  } else {
    // Pause logic
    setIsPaused(true);
    setLastPauseTime(new Date());
    
    if (sessionType === 'microphone') {
      await stopStreaming();
    } else if (sessionType === 'audio') {
      pauseAudioStreaming();
    }
  }
};

const handleStopSession = async () => {
  setIsRecording(false);
  setIsPaused(false);
  setSessionType(null);
  await stopStreaming();
  
  if (transcript.length > 0) {
    requestSummary();
  }
};

const requestSummary = async () => {
  setSummaryLoading(true);
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
    }
  } catch (err) {
    console.error('Error generating summary:', err);
  } finally {
    setSummaryLoading(false);
  }
};
```

#### 2.2 Real-time Analysis Integration

**Add word-based analysis triggering:**

```typescript
// Real-time analysis trigger (word-based, same as NewSession)
useEffect(() => {
  if (!isRecording || transcript.length === 0) return;
  
  const lastEntry = transcript[transcript.length - 1];
  if (!lastEntry || lastEntry.is_interim) return;
  
  const newWords = lastEntry.text.split(' ').filter(word => word.trim()).length;
  
  setWordsSinceLastAnalysis(prev => {
    const updatedWordCount = prev + newWords;
    
    const WORDS_PER_ANALYSIS = 10;
    const TRANSCRIPT_WINDOW_MINUTES = 5;
    
    if (updatedWordCount >= WORDS_PER_ANALYSIS) {
      console.log(`Auto-analysis triggered (${updatedWordCount} words)`);
      
      const fiveMinutesAgo = new Date(Date.now() - TRANSCRIPT_WINDOW_MINUTES * 60 * 1000);
      const recentTranscript = transcript
        .filter(t => !t.is_interim && new Date(t.timestamp) > fiveMinutesAgo)
        .map(t => ({
          speaker: 'conversation',
          text: t.text,
          timestamp: t.timestamp
        }));
      
      if (recentTranscript.length > 0) {
        const recentAlert = alerts.length > 0 ? alerts[0] : null;
        
        // Trigger both real-time and comprehensive analysis
        analyzeSegment(
          recentTranscript,
          { ...sessionContext, is_realtime: true },
          Math.floor(sessionDuration / 60),
          recentAlert
        );
        
        analyzeSegment(
          recentTranscript,
          { ...sessionContext, is_realtime: false },
          Math.floor(sessionDuration / 60)
        );
      }
      
      return 0;
    }
    
    return updatedWordCount;
  });
}, [transcript, isRecording]);
```

#### 2.3 Session Duration Tracking

**Add accurate timing with pause support:**

```typescript
// Session duration tracking (same as NewSession)
useEffect(() => {
  if (!isRecording || !sessionStartTime || isPaused) return;

  const interval = setInterval(() => {
    const now = Date.now();
    const elapsed = Math.floor((now - sessionStartTime.getTime()) / 1000);
    setSessionDuration(elapsed - pausedTime);
  }, 1000);

  return () => clearInterval(interval);
}, [isRecording, sessionStartTime, isPaused, pausedTime]);
```

### Phase 3: UI Integration and Data Binding

#### 3.1 Replace Hardcoded Data with Dynamic State

**Current hardcoded sections to replace:**

```typescript
// REPLACE: Hardcoded session metrics
sessionMetrics = {
  engagement_level: 70,  // Replace with: sessionMetrics.engagement_level
  therapeutic_alliance: 'moderate',  // Replace with: sessionMetrics.therapeutic_alliance
  techniques_detected: ['CBT', 'Cognitive Restructuring'],  // Replace with: sessionMetrics.techniques_detected
  emotional_state: 'distressed',  // Replace with: sessionMetrics.emotional_state
  phase_appropriate: true,  // Replace with: sessionMetrics.phase_appropriate
}

// REPLACE: Hardcoded pathway indicators
pathwayIndicators = {
  current_approach_effectiveness: 'effective',  // Replace with: pathwayIndicators.current_approach_effectiveness
  alternative_pathways: ['Cognitive Restructuring', 'Strong adherence'],  // Replace with: pathwayIndicators.alternative_pathways
  change_urgency: 'none',  // Replace with: pathwayIndicators.change_urgency
}

// REPLACE: Hardcoded session duration
sessionDuration = 382  // Replace with: sessionDuration (from state)

// REPLACE: Hardcoded guidance
currentGuidance = {...}  // Replace with: pathwayGuidance (from state)
```

#### 3.2 Add Missing UI Components

**Add transcript sidebar:**

```typescript
// Add transcript drawer (right sidebar)
<Drawer
  anchor="right"
  open={transcriptOpen}
  onClose={() => setTranscriptOpen(false)}
  sx={{
    '& .MuiDrawer-paper': {
      width: 400,
      p: 3,
      pt: 10,
      // Same styling as NewSession
    },
  }}
>
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
    <Typography variant="h5">Live Transcript</Typography>
    <IconButton onClick={() => setTranscriptOpen(false)}>
      <Close />
    </IconButton>
  </Box>
  
  <TranscriptDisplay transcript={transcript} />
</Drawer>

// Add floating transcript toggle button
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
    zIndex: 1201,
  }}
>
  <Badge badgeContent={newTranscriptCount} color="error">
    <Chat />
  </Badge>
</Fab>
```

**Add modal components:**

```typescript
// Add session summary modal
<SessionSummaryModal
  open={showSessionSummary}
  onClose={() => setShowSessionSummary(false)}
  summary={sessionSummary}
  loading={summaryLoading}
  error={null}
  onRetry={requestSummary}
  sessionId={sessionId}
/>

// Add rationale modal
<RationaleModal
  open={showRationaleModal}
  onClose={() => setShowRationaleModal(false)}
  rationale={pathwayGuidance.rationale}
  immediateActions={pathwayGuidance.immediate_actions}
  contraindications={pathwayGuidance.contraindications}
  citations={citations}
  onCitationClick={(citation) => {
    setSelectedCitation(citation);
    setCitationModalOpen(true);
  }}
/>

// Add citation modal
<CitationModal
  open={citationModalOpen}
  onClose={() => {
    setCitationModalOpen(false);
    setSelectedCitation(null);
  }}
  citation={selectedCitation}
/>
```

#### 3.3 Update Control Buttons

**Replace static controls with functional ones:**

```typescript
// Replace static stop button with functional controls
<Box sx={{ display: 'flex', gap: 1 }}>
  {!isRecording ? (
    <Button
      variant="contained"
      startIcon={<Mic />}
      onClick={handleStartSession}
      sx={{ 
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
      }}
    >
      Start Session
    </Button>
  ) : (
    <>
      <Button
        variant="contained"
        startIcon={isPaused ? <PlayArrow /> : <Pause />}
        onClick={handlePauseResume}
        sx={{ 
          background: isPaused 
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
        }}
      >
        {isPaused ? 'Resume' : 'Pause'}
      </Button>
      <Button
        variant="contained"
        startIcon={<Stop />}
        onClick={handleStopSession}
        sx={{ 
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
        }}
      >
        End Session
      </Button>
    </>
  )}
</Box>
```

### Phase 4: Tab Component Data Integration

#### 4.1 Update GuidanceTab Component

**Modify GuidanceTab to use real pathwayGuidance data:**

```typescript
// Pass real data instead of hardcoded currentGuidance
<GuidanceTab 
  currentGuidance={{
    title: pathwayGuidance.rationale ? "Current Guidance" : "Listening for guidance...",
    time: formatDuration(sessionDuration),
    content: pathwayGuidance.rationale || "AI analysis will provide guidance here...",
    immediateActions: pathwayGuidance.immediate_actions?.map(action => ({
      title: action,
      description: "Based on current session analysis",
      icon: 'safety' as const
    })) || [],
    contraindications: pathwayGuidance.contraindications?.map(contra => ({
      title: contra,
      description: "Avoid this approach based on current context",
      icon: 'cognitive' as const
    })) || []
  }}
  onActionClick={handleActionClick} 
/>
```

#### 4.2 Update EvidenceTab Component

**Need to examine and update EvidenceTab.tsx to display real citations:**

```typescript
// EvidenceTab should receive and display real citations from analysis
<EvidenceTab 
  citations={citations}
  selectedAlert={selectedAlert}
  onCitationClick={handleCitationClick}
/>
```

#### 4.3 Update PathwayTab Component

**Need to examine and update PathwayTab.tsx to display real pathway data:**

```typescript
// PathwayTab should receive real pathway indicators and history
<PathwayTab 
  pathwayIndicators={pathwayIndicators}
  pathwayHistory={pathwayHistory}
  sessionMetrics={sessionMetrics}
  onCitationClick={handleCitationClick}
/>
```

#### 4.4 Update AlternativesTab Component

**Need to examine and update AlternativesTab.tsx:**

```typescript
// AlternativesTab should display alternative pathways from analysis
<AlternativesTab 
  alternativePathways={pathwayIndicators.alternative_pathways}
  currentEffectiveness={pathwayIndicators.current_approach_effectiveness}
  changeUrgency={pathwayIndicators.change_urgency}
/>
```

### Phase 5: Session Management Features

#### 5.1 Add Test Mode Support

**Add test mode functionality (same as NewSession):**

```typescript
// Test mode with mock transcript loading
const loadTestTranscript = () => {
  setIsRecording(true);
  setSessionType('test');
  setSessionStartTime(new Date());
  setTranscript([]);
  
  let currentIndex = 0;
  const testInterval = setInterval(() => {
    if (currentIndex >= testTranscriptData.length) {
      clearInterval(testInterval);
      setIsRecording(false);
      return;
    }
    
    const entry = testTranscriptData[currentIndex];
    const formattedEntry = {
      text: entry.speaker ? `${entry.speaker}: ${entry.text}` : entry.text,
      timestamp: new Date().toISOString(),
      is_interim: false,
    };
    
    setTranscript(prev => [...prev, formattedEntry]);
    currentIndex++;
  }, 2000);
};

// Add test buttons in UI
{!isRecording && (
  <Box sx={{ position: 'fixed', bottom: 24, left: 24 }}>
    <Button onClick={loadTestTranscript}>Load Test Transcript</Button>
  </Box>
)}
```

#### 5.2 Add Audio File Support

**Add audio file streaming functionality:**

```typescript
const loadExampleAudio = async () => {
  setIsRecording(true);
  setSessionType('audio');
  setSessionStartTime(new Date());
  setTranscript([]);
  
  await startAudioFileStreaming('/audio/suny-good-audio.mp3');
};

// Add audio file button
<Button onClick={loadExampleAudio}>Load Example Audio</Button>
```

#### 5.3 Add Alert Integration

**Display real alerts instead of static timeline markers:**

```typescript
// Replace static timeline markers with dynamic alert-based markers
{alerts.map((alert, index) => {
  const alertPosition = (alert.sessionTime / sessionDuration) * 100;
  return (
    <Tooltip key={index} title={alert.title}>
      <IconButton 
        sx={{ 
          position: 'absolute', 
          bottom: -10, 
          left: `${alertPosition}%`, 
          transform: 'translateX(-50%)' 
        }}
        onClick={() => setSelectedAlertIndex(index)}
      >
        {getCategoryIcon(alert.category)}
      </IconButton>
    </Tooltip>
  );
})}
```

### Phase 6: Component Dependencies Updates

#### 6.1 Components That Need Examination/Updates

**These components are used by NewTherSession but may need data integration:**

1. **EvidenceTab.tsx** - Needs real citations and evidence data
2. **PathwayTab.tsx** - Needs real pathway indicators and history
3. **AlternativesTab.tsx** - Needs real alternative pathways data
4. **SessionLineChart.tsx** - May need real session data integration
5. **ActionDetailsPanel.tsx** - May need real action/citation data

#### 6.2 Import Additional Components

**Add missing imports that NewSession uses:**

```typescript
import TranscriptDisplay from './TranscriptDisplay';
import SessionSummaryModal from './SessionSummaryModal';
import RationaleModal from './RationaleModal';
import CitationModal from './CitationModal';
import { testTranscriptData } from '../utils/mockTranscript';
```

### Phase 7: Error Handling and Loading States

#### 7.1 Add Loading States

**Add loading indicators for various states:**

```typescript
// Loading states for different components
const [analysisLoading, setAnalysisLoading] = useState(false);
const [connectionLoading, setConnectionLoading] = useState(false);

// Show loading states in UI
{analysisLoading && (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <CircularProgress size={16} />
    <Typography variant="caption">Analyzing...</Typography>
  </Box>
)}
```

#### 7.2 Add Error Handling

**Add error states and handling:**

```typescript
const [error, setError] = useState<string | null>(null);

// Error display component
{error && (
  <Alert severity="error" onClose={() => setError(null)}>
    {error}
  </Alert>
)}
```

### Phase 8: Performance Optimizations

#### 8.1 Add Ref-based State Management

**Prevent stale closures (same pattern as NewSession):**

```typescript
// Store functions and state in refs for intervals
const analyzeSegmentRef = useRef(analyzeSegment);
const transcriptRef = useRef(transcript);
const sessionMetricsRef = useRef(sessionMetrics);
const alertsRef = useRef(alerts);

useEffect(() => {
  analyzeSegmentRef.current = analyzeSegment;
}, [analyzeSegment]);

useEffect(() => {
  transcriptRef.current = transcript;
}, [transcript]);
```

#### 8.2 Add Cleanup Effects

**Proper cleanup on unmount:**

```typescript
useEffect(() => {
  return () => {
    stopStreaming();
    // Clean up any intervals
  };
}, []);
```

## Implementation Timeline

### Week 1: Core Infrastructure
- Phase 1: Add hooks, state management, authentication
- Phase 2: Basic session control implementation

### Week 2: Data Integration
- Phase 3: Replace hardcoded data with dynamic state
- Phase 4: Update tab components with real data

### Week 3: Feature Completion
- Phase 5: Add session management features (test mode, audio files)
- Phase 6: Update component dependencies

### Week 4: Polish and Optimization
- Phase 7: Error handling and loading states
- Phase 8: Performance optimizations and testing

## Files That Need Updates

### New Files to Create
- None (all utilities and components already exist)

### Existing Files to Modify

**Primary:**
1. `frontend/components/NewTherSession.tsx` - Main implementation

**Secondary (May Need Updates):**
2. `frontend/components/EvidenceTab.tsx` - Add real data integration
3. `frontend/components/PathwayTab.tsx` - Add real data integration  
4. `frontend/components/AlternativesTab.tsx` - Add real data integration
5. `frontend/components/SessionLineChart.tsx` - Verify data integration
6. `frontend/components/ActionDetailsPanel.tsx` - Verify data integration

### Dependencies Available (No Changes Needed)
- `useAudioStreamingWebSocket` hook
- `useTherapyAnalysis` hook
- `useAuth` context
- `alertDeduplication` utilities
- All UI components (TranscriptDisplay, modals, etc.)
- All utility functions (timeUtils, colorUtils, etc.)

## Risk Assessment

### Low Risk
- Core state management integration (patterns already established)
- Audio streaming integration (hook already exists)
- UI component integration (components already exist)

### Medium Risk  
- Tab component data binding (may need component updates)
- Real-time analysis integration (complex timing dependencies)
- Error handling coverage

### High Risk
- Session timing synchronization between old and new interfaces
- Ensuring feature parity without breaking existing functionality
- Performance with new UI layout under real-time updates

## Success Criteria

1. **Functional Parity**: NewTherSession supports all session types (microphone, audio, test)
2. **Real-time Updates**: All UI components update dynamically with live data
3. **Analysis Integration**: Both real-time and comprehensive analysis work correctly
4. **Session Management**: Start/pause/stop functionality works identically to NewSession
5. **Data Accuracy**: All metrics, alerts, and pathways display real analysis results
6. **Performance**: No performance degradation compared to NewSession
7. **Error Handling**: Graceful handling of all error conditions
8. **UI Responsiveness**: Maintains smooth UI updates during real-time operations

This implementation plan provides a comprehensive roadmap to transform NewTherSession.tsx from a static presentation layer into a fully functional therapy session interface with the same capabilities as NewSession.tsx while maintaining its modern redesigned UI.
