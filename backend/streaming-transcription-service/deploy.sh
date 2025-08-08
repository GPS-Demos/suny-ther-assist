#!/bin/bash

# Set variables
PROJECT_ID="suny-ther-assist"
REGION="us-central1"
SERVICE_NAME="therapy-streaming-transcription"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "=== Deploying Streaming Transcription Service to Cloud Run ==="
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE_NAME}"

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    --project=${PROJECT_ID}

# Build and push Docker image
echo "Building Docker image..."
gcloud builds submit --tag ${IMAGE_NAME} \
    --project=${PROJECT_ID} \
    --quiet

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --project ${PROJECT_ID} \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --timeout 3600 \
    --max-instances 100 \
    --concurrency 1000 \
    --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT_ID}" \
    --quiet

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
    --platform managed \
    --region ${REGION} \
    --project ${PROJECT_ID} \
    --format 'value(status.url)')

echo "=== Deployment Complete ==="
echo "Service URL: ${SERVICE_URL}"
echo "WebSocket endpoint: ${SERVICE_URL/https/wss}/ws/transcribe"
echo "Health check: ${SERVICE_URL}/health"
echo ""
echo "To test the WebSocket connection:"
echo "wscat -c '${SERVICE_URL/https/wss}/ws/transcribe'"
