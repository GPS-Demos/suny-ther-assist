# NewSession.tsx - Detailed Technical Review

## Overview

The `NewSession.tsx` component is the core interface for conducting live therapy sessions with real-time AI analysis. It orchestrates audio streaming, live transcription, AI-powered therapeutic analysis, and dynamic UI updates to provide therapists with evidence-based guidance during sessions.

## Component Architecture

### Core State Management

The component manages extensive state for:

- **Session Control**: `isRecording`, `isPaused`, `sessionType`, `sessionStartTime`, `sessionDuration`
- **Audio/Transcription**: `transcript`, `newTranscriptCount`, `wordsSinceLastAnalysis`
- **AI Analysis Results**: `alerts`, `sessionMetrics`, `pathwayIndicators`, `pathwayGuidance`, `citations`
- **UI State**: `transcriptOpen`, `selectedAlertIndex`, `showSessionSummary`, various modal states

### Session Types

The component supports three distinct session modes:

1. **Microphone Recording** (`sessionType: 'microphone'`)
   - Live audio capture from user's microphone
   - Real-time streaming to transcription service

2. **Audio File Streaming** (`sessionType: 'audio'`)
   - Playback and analysis of pre-recorded audio files
   - Progress tracking and pause/resume functionality

3. **Test Mode** (`sessionType: 'test'`)
   - Simulated session using mock transcript data
   - Automated transcript generation at 2-second intervals

## Backend Communication & Payloads

### 1. Audio Streaming & Transcription

**WebSocket Connection** (`useAudioStreamingWebSocket`)

- **Endpoint**: `VITE_STREAMING_API/ws/transcribe`
- **Protocol**: WebSocket with binary audio streaming
- **Authentication**: Firebase JWT token

**Session Initialization Payload**:
```json
{
  "session_id": "session-1726511162543",
  "auth_token": "Firebase_JWT_Token",
  "config": {
    "sample_rate": 48000,
    "encoding": "WEBM_OPUS"
  }
}
```

**Real-time Audio Chunks**: Binary WebM/Opus audio data streamed every 100ms

**Received Messages**:
```json
{
  "type": "transcript",
  "transcript": "Client text here...",
  "confidence": 0.95,
  "is_final": true,
  "speaker": "conversation",
  "timestamp": "2024-09-16T19:24:30.000Z",
  "words": [...],
  "result_end_offset": 1500
}
```

### 2. AI Therapy Analysis

**HTTP Endpoint**: `VITE_ANALYSIS_API/therapy_analysis`

The component makes two types of analysis requests:

#### A. Real-time Analysis (Fast)

**Request Payload**:
```json
{
  "action": "analyze_segment",
  "transcript_segment": [
    {
      "speaker": "conversation",
      "text": "I've been feeling really anxious lately...",
      "timestamp": "2024-09-16T19:24:30.000Z"
    }
  ],
  "session_context": {
    "session_type": "CBT",
    "primary_concern": "Anxiety",
    "current_approach": "Cognitive Behavioral Therapy"
  },
  "session_duration_minutes": 15,
  "is_realtime": true,
  "previous_alert": {
    "title": "Consider Anxiety Grounding Technique",
    "category": "technique",
    "timing": "info"
  }
}
```

**Response** (Streaming text with JSON objects):
```json
{
  "alert": {
    "timing": "now",
    "category": "technique",
    "title": "Deep Breathing Exercise Recommended",
    "message": "Client showing signs of acute anxiety",
    "evidence": ["rapid speech", "worry themes"],
    "recommendation": "Guide client through 4-7-8 breathing technique"
  },
  "timestamp": "2024-09-16T19:24:32.000Z",
  "session_phase": "middle",
  "analysis_type": "realtime"
}
```

#### B. Comprehensive Analysis (Full RAG)

**Request Payload** (same structure but `"is_realtime": false`)

**Response** (includes additional metrics):
```json
{
  "session_metrics": {
    "engagement_level": 0.8,
    "therapeutic_alliance": "strong",
    "techniques_detected": ["cognitive restructuring", "behavioral activation"],
    "emotional_state": "anxious",
    "phase_appropriate": true
  },
  "pathway_indicators": {
    "current_approach_effectiveness": "effective",
    "alternative_pathways": ["DBT skills training"],
    "change_urgency": "monitor"
  },
  "pathway_guidance": {
    "rationale": "Current CBT approach showing effectiveness...",
    "immediate_actions": ["Continue exposure work", "Assign thought record"],
    "contraindications": ["Avoid overwhelming homework"]
  },
  "citations": [
    {
      "citation_number": 1,
      "source": {
        "title": "CBT Manual for Anxiety Disorders",
        "uri": "gs://bucket/manual.pdf",
        "excerpt": "Cognitive restructuring techniques...",
        "pages": { "first": 45, "last": 47 }
      }
    }
  ]
}
```

### 3. Session Summary Generation

**Request Payload**:
```json
{
  "action": "session_summary",
  "full_transcript": [
    {
      "speaker": "Therapist",
      "text": "How have you been feeling since our last session?",
      "timestamp": "2024-09-16T19:00:00.000Z"
    }
  ],
  "session_metrics": {
    "engagement_level": 0.85,
    "therapeutic_alliance": "strong"
  }
}
```

**Response**:
```json
{
  "summary": {
    "session_date": "2024-09-16",
    "duration_minutes": 45,
    "key_moments": [
      {
        "time": "10:15",
        "description": "Client breakthrough regarding anxiety triggers",
        "significance": "Major insight into cognitive patterns"
      }
    ],
    "techniques_used": ["cognitive restructuring", "behavioral experiments"],
    "progress_indicators": ["Increased self-awareness", "Homework completion"],
    "areas_for_improvement": ["Session pacing"],
    "follow_up_recommendations": ["Continue exposure therapy"]
  }
}
```

## External Components and Dependencies

### Custom Components Used

1. **`TranscriptDisplay`** - Renders live transcript with speaker identification
2. **`SessionVitals`** - Displays therapeutic alliance, emotional state, engagement metrics
3. **`AlertDisplay`** - Shows current alerts/recommendations
4. **`SessionMetrics`** - Comprehensive session analytics
5. **`PathwayIndicator`** - Treatment pathway effectiveness visualization
6. **`SessionSummaryModal`** - End-of-session summary and recommendations
7. **`RationaleModal`** - Detailed clinical reasoning for pathway decisions
8. **`CitationModal`** - Evidence-based citations from clinical manuals

### Custom Hooks

1. **`useAudioStreamingWebSocket`**
   - WebSocket management for audio streaming
   - Microphone access and MediaRecorder API integration
   - Audio file playback with real-time capture
   - Pause/resume functionality across different media types

2. **`useTherapyAnalysis`**
   - HTTP client for backend AI analysis
   - Request/response logging and error handling
   - Support for multiple analysis types (realtime, comprehensive, summary)

### Utility Functions

1. **`alertDeduplication.ts`**
   - Prevents duplicate alerts using multiple algorithms:
     - Exact title matching
     - Jaccard similarity for text comparison
     - Semantic key phrase extraction
     - Category throttling with time windows
     - Hard 7-second blocking regardless of content

2. **`colorUtils.ts`** - Status-based color coding for UI elements
3. **`timeUtils.ts`** - Duration formatting and time calculations
4. **`textRendering.tsx`** - Markdown rendering for recommendations

## Core Logic Flow

### 1. Session Initialization

```typescript
const handleStartSession = async () => {
  setSessionStartTime(new Date());
  setIsRecording(true);
  setSessionType('microphone');
  // Reset all session state
  setSessionSummaryClosed(false);
  setSessionSummary(null);
  setPausedTime(0);
  setHasReceivedComprehensiveAnalysis(false);
  
  await startMicrophoneRecording(); // Initializes WebSocket and MediaRecorder
};
```

### 2. Real-time Transcript Processing

The component uses a sophisticated word-counting system for triggering analysis:

```typescript
useEffect(() => {
  if (!isRecording || transcript.length === 0) return;
  
  const lastEntry = transcript[transcript.length - 1];
  if (!lastEntry || lastEntry.is_interim) return;
  
  const newWords = lastEntry.text.split(' ').filter(word => word.trim()).length;
  
  setWordsSinceLastAnalysis(prev => {
    const updatedWordCount = prev + newWords;
    
    if (updatedWordCount >= WORDS_PER_ANALYSIS) { // Trigger every 10 words
      // Get last 5 minutes of transcript
      const recentTranscript = transcript
        .filter(t => !t.is_interim && new Date(t.timestamp) > fiveMinutesAgo)
        .map(t => ({
          speaker: 'conversation',
          text: t.text,
          timestamp: t.timestamp
        }));
      
      // Trigger both real-time and comprehensive analysis
      analyzeSegment(recentTranscript, { ...sessionContext, is_realtime: true }, sessionDuration, recentAlert);
      analyzeSegment(recentTranscript, { ...sessionContext, is_realtime: false }, sessionDuration);
      
      return 0; // Reset word count
    }
    return updatedWordCount;
  });
}, [transcript, isRecording]);
```

### 3. Alert Processing and Deduplication

The component implements sophisticated alert deduplication:

```typescript
const { analyzeSegment } = useTherapyAnalysis({
  onAnalysis: (analysis) => {
    if (analysis.alert) {
      const newAlert = {
        ...analysis.alert,
        sessionTime: sessionDuration,
        timestamp: new Date().toISOString()
      };

      setAlerts(prev => {
        const result = processNewAlert(newAlert, prev, { debugMode: false });
        
        if (result.shouldAdd) {
          return [newAlert, ...prev].slice(0, 8); // Keep max 8 alerts
        } else {
          console.log(`Alert filtered: ${result.debugInfo?.reason}`);
          return prev;
        }
      });
    }
  }
});
```

### 4. Pause/Resume Logic

The component handles pause/resume differently based on session type:

```typescript
const handlePauseResume = async () => {
  if (isPaused) {
    // Calculate accumulated pause time
    const pauseDuration = Math.floor((now.getTime() - lastPauseTime.getTime()) / 1000);
    setPausedTime(prev => prev + pauseDuration);
    
    // Resume based on session type
    if (sessionType === 'microphone') {
      await startMicrophoneRecording();
    } else if (sessionType === 'audio') {
      await resumeAudioStreaming();
    } else if (sessionType === 'test') {
      resumeTestMode();
    }
  } else {
    // Pause and record pause start time
    setLastPauseTime(new Date());
    // Stop appropriate streaming method
  }
};
```

### 5. Session Duration Tracking

Accurate time tracking accounts for paused periods:

```typescript
useEffect(() => {
  if (!isRecording || !sessionStartTime || isPaused) return;

  const interval = setInterval(() => {
    const now = Date.now();
    const elapsed = Math.floor((now - sessionStartTime.getTime()) / 1000);
    setSessionDuration(elapsed - pausedTime); // Subtract total paused time
  }, 1000);

  return () => clearInterval(interval);
}, [isRecording, sessionStartTime, isPaused, pausedTime]);
```

## Key Features

### 1. Dual Analysis Pipeline

- **Real-time Analysis**: Fast alerts for immediate intervention (timing: 'now', 'pause', 'info')
- **Comprehensive Analysis**: Full RAG-enhanced analysis with clinical citations

### 2. Intelligent Alert System

- Multi-algorithm deduplication prevents alert spam
- Category-based filtering (safety, technique, pathway_change, engagement, process)
- Time-based throttling with exceptions for critical safety alerts

### 3. Multi-Modal Session Support

- Live microphone recording with WebRTC
- Audio file streaming with synchronized playback/analysis
- Test mode with simulated transcript generation

### 4. Evidence-Based Recommendations

- RAG integration with therapy manuals (CBT, PE, DBT)
- Clinical citations with page references
- Treatment pathway effectiveness monitoring

### 5. Comprehensive Session Management

- Real-time metrics tracking (engagement, alliance, emotional state)
- Session phase detection (beginning/middle/end)
- Automated session summary generation
- Patient context integration

### 6. Responsive UI with Real-time Updates

- Floating transcript sidebar with live updates
- Alert selection and detailed recommendation display
- Progress tracking with pause-adjusted timing
- Modal dialogs for detailed clinical reasoning

## Technical Considerations

### Performance Optimizations

- Ref-based state management to prevent stale closures in intervals
- Streaming responses for faster analysis feedback
- Word-based triggering rather than time-based for relevant analysis
- Efficient transcript windowing (5-minute segments)

### Error Handling

- Graceful WebSocket reconnection on network issues
- Fallback UI states for loading/error conditions
- Non-blocking error logging for streaming failures
- User-friendly error messages for critical failures

### Security

- Firebase JWT authentication for all backend requests
- Email-based authorization (whitelist + @google.com domain)
- CORS configuration for cross-origin requests
- Secure WebSocket connections (WSS in production)

This architecture provides a robust, real-time therapy assistance platform that combines live audio processing, AI analysis, and evidence-based clinical guidance in a unified interface.
