# Ther-Assist: Real-time Therapy Guidance System

Ther-Assist is a generative AI multimodal tool designed to help psychotherapists deliver personalized, evidence-based treatments (EBTs) for anxiety and depression. It provides real-time feedback to help assess patients, guide treatment decision-making, and evaluate progress.

## Overview

Ther-Assist listens ambiently to therapy sessions and provides near real-time guidance based on evidence-based treatment manuals and protocols. The system uses Google Cloud services and Gemini 2.5 Flash to analyze therapy conversations and suggest interventions, pathway changes, and therapeutic techniques.

## Features

- **Real-time Transcription**: Ambient listening with speaker diarization (therapist vs patient)
- **Live Analysis**: Continuous analysis of therapy segments with EBT-based recommendations
- **Critical Alerts**: Immediate notifications for safety concerns or important pathway changes
- **Session Metrics**: Track engagement, therapeutic alliance, and emotional states
- **Evidence-Based Guidance**: References to specific manual sections and treatment protocols
- **Pathway Monitoring**: Suggests alternative approaches when current methods aren't effective

## Architecture

### Diagram
![Architecture](./assets/architecture.png)

### Frontend (React + Vite)
- **Clinician-Optimized UI**: Large, readable alerts with visual priority system
- **Live Transcript Display**: Real-time speaker-labeled conversation
- **Alert System**: Critical (red), Suggestion (yellow), Info (green) alerts
- **Session Metrics Dashboard**: Visual indicators for therapeutic progress

### Backend Services
1. **Streaming Transcription Service** (`backend/streaming-transcription-service/`)
   - FastAPI WebSocket service deployed on Cloud Run
   - Uses Google Cloud Speech-to-Text V2 API
   - Real-time audio streaming with low latency
   - Optimized for therapy conversations

2. **Therapy Analysis Service** (`backend/therapy-analysis-function/`)
   - Uses Gemini 2.5 Flash with thinking mode
   - RAG integration with EBT corpus
   - Provides real-time therapeutic guidance
   - Generates session summaries

## Deployment Instructions

### Prerequisites
- Node.js 18+ and npm
- Google Cloud Project with billing enabled
- Google Cloud CLI (`gcloud`) installed and authenticated

### 1. Google Cloud Setup

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable speech.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable discoveryengine.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Create Vertex AI Search datastore for EBT corpus
# (Follow Google Cloud Console to create a datastore and upload PDF manuals)
```

### 2. Create RAG Corpuses
Follow the instructions in the [RAG README.MD](./backend/rag/README)

### 3. Backend Deployment

Deploy Cloud Functions:

#### Deploy Streaming Transcription Service
```bash
cd backend/streaming-transcription-service
export PROJECT_ID="your-project-id"
./deploy.sh
```

#### Deploy analysis function
```bash
cd ../therapy-analysis-function
gcloud functions deploy therapy_analysis \
  --runtime python312 \
  --trigger-http \
  --allow-unauthenticated \
  --memory 1GB \
  --timeout 540s \
  --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID
```

Note: Org policies may block your functions from deploying with public access enabled. You'll have to change that setting manually.

### 4. Frontend Setup

1. Install dependencies
```bash
cd frontend

# Copy environment variables and update with your own
cp .env.example .env
```

2. Update your .env file with your project's variables

3. Enable Firebase in your project, enable Google authentication, register an app, get the Firebase config object, and use that object to create `frontend/firebase-config-object.ts`:
```javascript
export const firebaseConfig = {
  apiKey: "api-key",
  authDomain: "your-gcp-project.firebaseapp.com",
  projectId: "your-gcp-project",
  storageBucket: "your-gcp-project.firebasestorage.app",
  messagingSenderId: "message-sender-id",
  appId: "1:app-id"
};
```

4. Create the following file `frontend/firebaserc` with your own information:
```javascript
{
  "projects": {
    "default": "your-gcp-project-id"
  }
}
```

5. Build your app
```bash
npm run build
```

6. Deploy to Firebase
```bash
firebase deploy
```

## Local Dev

### Frontend
1. Create .env.development
```bash
# Backend API endpoints
VITE_ANALYSIS_API=http://localhost:8080
VITE_TRANSCRIPTION_WS=ws://localhost:8082

# Google Cloud settings
VITE_GOOGLE_CLOUD_PROJECT=your-gcp-project
```

2. Install dependencies and run frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend therapy-analysis-function
1. Navigate to the directory
```bash
cd backend/therapy-analysis-function
```
2. Configure your venv & install dependencies
3. Run the Cloud Run Function locally
```bash
export GOOGLE_CLOUD_PROJECT="your-project-id"
functions-framework --target=therapy_analysis --port=8080
```

### Backend streaming-transcription-service
1. Navigate to the directory
```bash
cd backend/streaming-transcription-service
```
2. Configure your venv & install dependencies
```bash
pip install -r requirements.txt
```
3. Run the service locally
```bash
export GOOGLE_CLOUD_PROJECT="your-project-id"
python main.py
```

## Usage

1. **Start Session**: Click "Start Session" to begin recording
2. **Real-time Monitoring**: Watch the transcript and guidance panels
3. **Critical Alerts**: Respond to red alerts immediately
4. **Pathway Changes**: Consider yellow suggestions for approach modifications
5. **End Session**: Click "End Session" to stop recording and generate summary

## EBT Corpus

Place evidence-based treatment manuals in `backend/rag/corpus/`:
- CBT manuals
- PE (Prolonged Exposure) protocols
- Social phobia treatment guides
- Other EBT resources

## Security & Privacy

- All audio processing happens in memory
- Sessions are not stored by default
- HIPAA compliance considerations:
  - Deploy in HIPAA-compliant GCP region
  - Enable VPC Service Controls
  - Use Customer-Managed Encryption Keys (CMEK)
  - Implement proper access controls

## Development

### Local Development

For local development without Google Cloud:

1. Use mock services in `frontend/services/mockServices.ts`
2. Test with pre-recorded audio files
3. Use sample transcripts for UI development

### Testing

TODO
<!-- ```bash
# Frontend tests
cd frontend
npm test

# Backend function tests
cd backend/therapy-analysis-function
python -m pytest test_scripts/
``` -->

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Acknowledgments

- SUNY for supporting this research
- Google Cloud for AI/ML infrastructure
- Evidence-based treatment manual authors
