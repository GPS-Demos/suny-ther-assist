# Ther-Assist Test Scripts

This directory contains testing scripts for the Ther-Assist therapy analysis system.

## Scripts

### 1. `websocket_transcript_simulator.py` (RECOMMENDED)

**Purpose**: Simulates a therapy session by sending transcript data directly to the frontend via WebSocket, allowing the frontend to trigger its own analysis functions. This is the most realistic test as it mimics actual transcription flow.

**What it tests**:
- Frontend transcript display updates
- Frontend-triggered analysis calls
- Real-time alert generation
- Session metrics updates
- Pathway change indicators
- Critical alert detection (dissociation, self-harm)

**Usage**:
```bash
# With typing simulation (50 chars/sec)
python websocket_transcript_simulator.py

# Instant mode (no typing delay)
python websocket_transcript_simulator.py --instant

# Custom WebSocket URL
python websocket_transcript_simulator.py --ws-url ws://localhost:8080/ws
```

**Prerequisites**:
1. Start the streaming service:
   ```bash
   cd backend/streaming-transcription-service && python main.py
   ```
2. Start the analysis function:
   ```bash
   cd backend/therapy-analysis-function && functions-framework --target=therapy_analysis --port=8081
   ```
3. Start the frontend:
   ```bash
   cd frontend && npm run dev
   ```
4. Open frontend in browser (http://localhost:5173) and click "Start Session"
5. Run the simulator

### 2. `transcript_simulator.py`

**Purpose**: Directly tests the backend analysis functions by calling the API endpoints. Useful for backend-only testing without the frontend.

**What it tests**:
- Direct API endpoint functionality
- analyze_segment endpoint
- pathway_guidance endpoint
- session_summary endpoint
- Response formatting and streaming

**Usage**:
```bash
# With typing simulation
python transcript_simulator.py

# Instant mode
python transcript_simulator.py --instant

# Custom API URL
python transcript_simulator.py --api-url http://localhost:8081
```

## Test Phases and Expected Outcomes

Both scripts simulate 8 distinct phases designed to trigger specific analytical functions:

### Phase 1: Session Beginning (0-10 min)
- **Tests**: Rapport building, agenda setting, initial assessment
- **Expected**: Session phase detection, initial metrics

### Phase 2: Anxiety Escalation (10-20 min)
- **Tests**: High anxiety detection
- **Expected**: SUGGESTION alerts for grounding techniques

### Phase 3: Cognitive Restructuring (20-30 min)
- **Tests**: CBT technique detection, cognitive distortion identification
- **Expected**: Technique detection in metrics, positive therapeutic moments (INFO alerts)

### Phase 4: Treatment Resistance (30-35 min)
- **Tests**: Resistance to current approach
- **Expected**: Pathway change indicators, alternative approach suggestions

### Phase 5: Critical - Dissociation (35-40 min)
- **Tests**: Dissociation signs
- **Expected**: CRITICAL safety alert, immediate intervention recommendations

### Phase 6: Grounding and Exposure (40-45 min)
- **Tests**: Grounding technique implementation, exposure therapy introduction
- **Expected**: Technique detection, treatment plan updates

### Phase 7: Critical - Self-Harm (45-48 min)
- **Tests**: Self-harm risk detection
- **Expected**: Immediate CRITICAL alert, safety planning recommendations

### Phase 8: Session Ending (48-50 min)
- **Tests**: Session closure, homework assignment
- **Expected**: Session summary generation, homework tracking

## Monitoring Test Results

### Frontend Monitoring (websocket_transcript_simulator.py)
- Watch the **Live Transcript** panel for text appearing
- Monitor **Real-Time Guidance** panel for alerts:
  - 🔴 Red/Critical alerts for safety concerns
  - 🟡 Yellow/Suggestion alerts for technique recommendations
  - 🟢 Green/Info alerts for positive moments
- Check **Session Metrics** panel for:
  - Engagement level percentage
  - Therapeutic alliance strength
  - Emotional state changes
  - Detected techniques
- Observe **Pathway Indicator** for approach effectiveness

### Console Output
Both scripts provide detailed console output with color coding:
- **Blue**: Phase headers
- **Yellow**: Test objectives
- **Purple**: Analysis points
- **Green**: Successful operations
- **Red**: Errors or critical alerts
- **Cyan**: Metrics and information

## Troubleshooting

### WebSocket Connection Refused
- Ensure streaming service is running: `cd backend/streaming-transcription-service && python main.py`
- Check port 8080 is not in use: `lsof -i :8080`

### No Analysis Results
- Verify analysis function is running: `cd backend/therapy-analysis-function && functions-framework --target=therapy_analysis --port=8081`
- Check port 8081 is accessible
- Ensure RAG datastore is configured properly

### Frontend Not Updating
- Confirm frontend is running: `cd frontend && npm run dev`
- Check browser console for errors (F12)
- Ensure "Start Session" was clicked before running simulator

## Performance Notes

- The typing simulation (50 chars/sec) mimics realistic speech-to-text speed
- Analysis is triggered every 30 seconds in the frontend (configurable in App.tsx)
- Instant mode is useful for rapid testing but may overwhelm the analysis pipeline
- Critical alerts should appear immediately regardless of the analysis interval

## Development Tips

1. Use `--instant` mode for quick functionality checks
2. Use normal mode for realistic timing and UI observation
3. Monitor browser DevTools Network tab to see WebSocket messages
4. Check browser Console for any JavaScript errors
5. Backend logs will show RAG queries and Gemini API calls
