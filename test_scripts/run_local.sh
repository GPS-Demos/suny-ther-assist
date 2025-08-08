#!/bin/bash

echo "Starting local streaming transcription service..."

# Set Google Cloud project
export GOOGLE_CLOUD_PROJECT=suny-ther-assist

# Navigate to the streaming-transcription-service directory
cd backend/streaming-transcription-service

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install requirements
echo "Installing requirements..."
pip install -q -r requirements.txt

# Run the service locally
echo "Starting service on http://localhost:8080"
echo "WebSocket endpoint: ws://localhost:8080/ws/{session_id}"
echo "Health check: http://localhost:8080/health"
echo ""
echo "Press Ctrl+C to stop"

# Run with uvicorn
python main.py
