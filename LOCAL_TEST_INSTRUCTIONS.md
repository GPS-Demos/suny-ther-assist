# Local Testing Instructions for Ther-Assist

## Prerequisites
- Google Cloud SDK installed and authenticated
- Node.js and npm installed
- Python 3.12+ installed

## Testing Steps

### 1. Start the Backend Locally
```bash
cd backend/streaming-transcription-service
./run_local.sh
```
This will start the WebSocket server on http://localhost:8080

### 2. Start the Frontend
In a new terminal:
```bash
cd frontend
npm run dev
```
The frontend will use `.env.local` which points to localhost:8080 for WebSocket

### 3. Test the Application
1. Open http://localhost:3000 (or 3001 if 3000 is in use)
2. Click "Start Session" button
3. Allow microphone access when prompted
4. Start speaking - you should see:
   - Real-time transcription with <500ms latency
   - Interim results shown in italic/dashed border
   - Final results with speaker labels (therapist/patient)
   - Speech activity indicators

### 4. Monitor for Issues
- Check browser console for WebSocket connection status
- Backend terminal will show streaming activity
- Look for any encoding errors

## Troubleshooting

### If WebSocket won't connect:
- Ensure backend is running on port 8080
- Check CORS settings in backend
- Verify `.env.local` is being used (not `.env`)

### If audio encoding error:
- The backend now handles WebM/Opus from browser
- Uses synchronous gRPC streaming (fixed the async issue)
- Binary WebSocket frames for low latency

### If no transcription appears:
- Check microphone permissions
- Verify Google Cloud credentials are set
- Look at backend logs for Speech API errors

## Production Deployment
The service is already deployed at:
- WebSocket: wss://therapy-streaming-transcription-mlofelg76a-uc.a.run.app/ws/transcribe
- Health: https://therapy-streaming-transcription-mlofelg76a-uc.a.run.app/health

To use production backend, update frontend/.env:
```
VITE_STREAMING_API=https://therapy-streaming-transcription-mlofelg76a-uc.a.run.app
