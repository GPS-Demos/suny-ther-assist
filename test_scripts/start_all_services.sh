#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}Starting Ther-Assist Testing Environment${NC}"
echo -e "${GREEN}==================================================${NC}"

# Set Google Cloud project
export GOOGLE_CLOUD_PROJECT=suny-ther-assist

# Function to setup and start a service
setup_service() {
    local service_name=$1
    local service_path=$2
    local start_command=$3
    
    echo -e "\n${YELLOW}Setting up $service_name...${NC}"
    cd "$service_path" || exit 1
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment for $service_name..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment and install requirements
    source venv/bin/activate
    echo "Installing requirements for $service_name..."
    pip install -q -r requirements.txt
    
    # Start the service in background
    echo -e "${GREEN}Starting $service_name...${NC}"
    eval "$start_command" &
    
    # Return to root directory
    cd - > /dev/null
}

# Start from project root
cd "$(dirname "$0")/.." || exit 1

# 1. Start Therapy Analysis Function
echo -e "\n${YELLOW}1. Starting Therapy Analysis Function${NC}"
cd backend/therapy-analysis-function || exit 1

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "Installing requirements..."
pip install -q -r requirements.txt
pip install -q functions-framework

echo -e "${GREEN}Starting analysis function on port 8081...${NC}"
functions-framework --target=therapy_analysis --port=8081 &
ANALYSIS_PID=$!
cd ../.. || exit 1

# Give it a moment to start
sleep 2

# 2. Start Streaming Transcription Service
echo -e "\n${YELLOW}2. Starting Streaming Transcription Service${NC}"
cd backend/streaming-transcription-service || exit 1

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "Installing requirements..."
pip install -q -r requirements.txt

echo -e "${GREEN}Starting streaming service on port 8080...${NC}"
python main.py &
STREAMING_PID=$!
cd ../.. || exit 1

# Give it a moment to start
sleep 2

# 3. Start Frontend
echo -e "\n${YELLOW}3. Starting Frontend${NC}"
cd frontend || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo -e "${GREEN}Starting frontend dev server...${NC}"
npm run dev &
FRONTEND_PID=$!
cd .. || exit 1

# Give frontend time to start
sleep 3

# Print status
echo -e "\n${GREEN}==================================================${NC}"
echo -e "${GREEN}All services started successfully!${NC}"
echo -e "${GREEN}==================================================${NC}"
echo ""
echo "Service URLs:"
echo -e "  ${YELLOW}Frontend:${NC} http://localhost:5173"
echo -e "  ${YELLOW}Analysis API:${NC} http://localhost:8081"
echo -e "  ${YELLOW}WebSocket:${NC} ws://localhost:8080/ws/{session_id}"
echo ""
echo "Process IDs:"
echo "  Analysis Function PID: $ANALYSIS_PID"
echo "  Streaming Service PID: $STREAMING_PID"
echo "  Frontend PID: $FRONTEND_PID"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Click 'Start Session' button"
echo "3. In another terminal, run:"
echo -e "   ${GREEN}cd test_scripts && python websocket_transcript_simulator.py${NC}"
echo ""
echo -e "${RED}To stop all services, press Ctrl+C or run:${NC}"
echo "  kill $ANALYSIS_PID $STREAMING_PID $FRONTEND_PID"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping all services...${NC}"
    kill $ANALYSIS_PID $STREAMING_PID $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Set up trap to cleanup on Ctrl+C
trap cleanup INT

# Wait for user to stop
echo ""
echo "Press Ctrl+C to stop all services..."
wait
