#!/bin/bash

# Ther-Assist Deployment Script
# This script deploys the backend services and sets up the frontend

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_ID="${PROJECT_ID}"
REGION="us-central1"

echo -e "${GREEN}=== Ther-Assist Deployment Script ===${NC}"
echo -e "${YELLOW}Project ID: $PROJECT_ID${NC}"
echo -e "${YELLOW}Region: $REGION${NC}"
echo ""

# Check if gcloud is configured correctly
CURRENT_PROJECT=$(gcloud config get-value project)
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    echo -e "${YELLOW}Setting gcloud project to $PROJECT_ID...${NC}"
    gcloud config set project $PROJECT_ID
fi

# Enable required APIs
echo -e "${GREEN}Enabling required Google Cloud APIs...${NC}"
gcloud services enable speech.googleapis.com --project=$PROJECT_ID
gcloud services enable aiplatform.googleapis.com --project=$PROJECT_ID
gcloud services enable discoveryengine.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudfunctions.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
gcloud services enable run.googleapis.com --project=$PROJECT_ID

echo -e "${GREEN}APIs enabled successfully!${NC}"
echo ""

# Deploy services
echo -e "${GREEN}Deploying backend services...${NC}"

# Deploy streaming transcription service
echo -e "${YELLOW}Deploying streaming transcription service...${NC}"
cd backend/streaming-transcription-service

# Build and deploy to Cloud Run
gcloud run deploy streaming-transcription-service \
  --source . \
  --platform managed \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=2 \
  --timeout=3600 \
  --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID \
  --project=$PROJECT_ID

# Get the streaming service URL
STREAMING_URL=$(gcloud run services describe streaming-transcription-service --region=$REGION --format='value(status.url)' --project=$PROJECT_ID)
echo -e "${GREEN}Streaming transcription service deployed at: $STREAMING_URL${NC}"

# Deploy therapy analysis function
echo -e "${YELLOW}Deploying therapy analysis function...${NC}"
cd ../therapy-analysis-function
gcloud functions deploy therapy_analysis \
  --gen2 \
  --runtime python312 \
  --region=$REGION \
  --source=. \
  --entry-point=therapy_analysis \
  --trigger-http \
  --allow-unauthenticated \
  --memory=1GB \
  --timeout=540s \
  --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID \
  --project=$PROJECT_ID

# Get the analysis function URL
ANALYSIS_URL=$(gcloud functions describe therapy_analysis --region=$REGION --format='value(serviceConfig.uri)' --project=$PROJECT_ID)
echo -e "${GREEN}Analysis function deployed at: $ANALYSIS_URL${NC}"

cd ../..

# Create .env file for frontend
echo -e "${YELLOW}Creating frontend .env file...${NC}"
cat > frontend/.env << EOF
# Backend API endpoints
VITE_WEBSOCKET_URL=${STREAMING_URL/https/wss}/ws/transcribe
VITE_ANALYSIS_API=$ANALYSIS_URL

# Google Cloud settings
VITE_GOOGLE_CLOUD_PROJECT=$PROJECT_ID
EOF

echo -e "${GREEN}Frontend .env file created!${NC}"
echo ""

# Create Vertex AI Search datastore
echo -e "${YELLOW}=== Vertex AI Search RAG Datastore Setup ===${NC}"
echo "Would you like to automatically create and configure the RAG datastore? (y/n)"
read -r CREATE_DATASTORE

if [[ "$CREATE_DATASTORE" == "y" || "$CREATE_DATASTORE" == "Y" ]]; then
    echo -e "${YELLOW}Setting up RAG datastore with EBT corpus...${NC}"
    
    # Ensure required Python packages are installed
    pip install google-auth google-auth-httplib2 google-cloud-storage requests PyPDF2 >/dev/null 2>&1
    
    # Run the datastore setup script
    python backend/setup_rag_datastore.py
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}RAG datastore setup complete!${NC}"
    else
        echo -e "${RED}RAG datastore setup failed. Please check the error messages above.${NC}"
    fi
else
    echo -e "${YELLOW}Skipping automatic datastore setup.${NC}"
    echo ""
    echo "To manually create the datastore later:"
    echo "1. Run: python backend/setup_rag_datastore.py"
    echo "OR"
    echo "2. Go to https://console.cloud.google.com/gen-app-builder/data-stores"
    echo "3. Create a datastore named 'ebt-corpus' with chunking enabled"
    echo "4. Upload your EBT corpus PDFs"
fi
echo ""

echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo ""
echo "Next steps:"
echo "1. Ensure the RAG datastore is created (see instructions above)"
echo "2. Install frontend dependencies: cd frontend && npm install"
echo "3. Run the frontend: npm run dev"
echo ""
echo -e "${GREEN}Service URLs:${NC}"
echo "Streaming Transcription: $STREAMING_URL"
echo "Analysis: $ANALYSIS_URL"
