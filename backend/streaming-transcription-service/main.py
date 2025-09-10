import os
import json
import asyncio
import logging
import threading
import queue
from typing import Generator, Optional
from datetime import datetime
import base64

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from google.cloud import speech_v2
from google.cloud.speech_v2 import types
import google.auth

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Therapy Transcription Streaming Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get project ID from environment variable (required)
project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")
if not project_id:
    raise ValueError("GOOGLE_CLOUD_PROJECT environment variable must be set")
logger.info(f"Using Google Cloud project: {project_id}")
location = "global"

# Initialize Speech client
speech_client = speech_v2.SpeechClient()

class StreamingTranscriptionSession:
    """Manages a true streaming transcription session with low latency"""
    
    def __init__(self, session_id: str, websocket: WebSocket):
        self.session_id = session_id
        self.websocket = websocket
        self.is_active = True
        self.recognizer_name = f"projects/{project_id}/locations/{location}/recognizers/_"
        # Use thread-safe queue for audio data
        self.audio_queue = queue.Queue()
        self.response_queue = asyncio.Queue()
        self.streaming_thread = None
        # Store the main event loop for cross-thread communication
        self.main_loop = asyncio.get_event_loop()
        
    def get_streaming_config(self) -> types.StreamingRecognitionConfig:
        """Get streaming recognition config optimized for low latency"""
        return types.StreamingRecognitionConfig(
            config=types.RecognitionConfig(
                # Auto-detect encoding from browser
                auto_decoding_config=types.AutoDetectDecodingConfig(),
                language_codes=["en-US"],
                model="latest_long",  # Best model for medical/therapy conversations
                features=types.RecognitionFeatures(
                    enable_automatic_punctuation=True,
                    profanity_filter=False,
                    enable_word_time_offsets=True,
                    enable_word_confidence=True,
                    # Note: Speaker diarization not supported in streaming
                    # The LLM will identify speakers from context
                    max_alternatives=1,
                ),
            ),
            streaming_features=types.StreamingRecognitionFeatures(
                interim_results=True,  # Critical for low latency
                enable_voice_activity_events=True,
                voice_activity_timeout=types.StreamingRecognitionFeatures.VoiceActivityTimeout(
                    speech_start_timeout={"seconds": 30},  # Wait longer for initial speech
                    speech_end_timeout={"seconds": 3},      # Natural pause between segments
                ),
            ),
        )
    
    def audio_generator(self) -> Generator[types.StreamingRecognizeRequest, None, None]:
        """Synchronous generator for streaming requests"""
        # First request contains config
        yield types.StreamingRecognizeRequest(
            recognizer=self.recognizer_name,
            streaming_config=self.get_streaming_config(),
        )
        
        # Subsequent requests contain audio
        while self.is_active:
            try:
                # Get audio from queue with timeout (blocking)
                audio_data = self.audio_queue.get(timeout=0.1)
                
                if audio_data is None:  # Poison pill to stop
                    break
                    
                yield types.StreamingRecognizeRequest(audio=audio_data)
                
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Error in audio generator: {e}")
                break
    
    def streaming_recognize_thread(self):
        """Run the synchronous gRPC streaming in a separate thread"""
        try:
            logger.info("Starting streaming recognition thread")
            # Create the request generator
            request_generator = self.audio_generator()
            
            # Call the synchronous streaming_recognize
            responses = speech_client.streaming_recognize(
                requests=request_generator,
            )
            
            # Process responses
            response_count = 0
            for response in responses:
                response_count += 1
                logger.debug(f"Received response #{response_count}")
                # Put response in async queue for WebSocket processing
                asyncio.run_coroutine_threadsafe(
                    self.response_queue.put(response),
                    self.main_loop
                )
                
        except Exception as e:
            logger.error(f"Streaming thread error: {e}", exc_info=True)
            # Put error in response queue using the main loop
            asyncio.run_coroutine_threadsafe(
                self.response_queue.put({"error": str(e)}),
                self.main_loop
            )
    
    async def process_responses(self):
        """Process responses from the queue and send to WebSocket"""
        try:
            while self.is_active:
                try:
                    # Get response from queue with timeout
                    response = await asyncio.wait_for(
                        self.response_queue.get(),
                        timeout=0.1
                    )
                    
                    # Check for error
                    if isinstance(response, dict) and "error" in response:
                        await self.websocket.send_json({
                            "type": "error",
                            "error": response["error"],
                            "timestamp": datetime.now().isoformat()
                        })
                        continue
                    
                    # Process speech recognition results
                    for result in response.results:
                        for alternative in result.alternatives:
                            # Log transcript for debugging
                            logger.info(f"Transcript: {'[FINAL]' if result.is_final else '[INTERIM]'} {alternative.transcript}")
                            
                            # Send transcript result (no speaker labeling needed)
                            result_data = {
                                "type": "transcript",
                                "transcript": alternative.transcript,
                                "confidence": alternative.confidence if hasattr(alternative, 'confidence') else 1.0,
                                "is_final": result.is_final,
                                "timestamp": datetime.now().isoformat(),
                                "result_end_offset": result.result_end_offset.total_seconds() if hasattr(result, 'result_end_offset') else 0,
                            }
                            
                            # Add word-level timing for final results
                            if result.is_final and hasattr(alternative, 'words'):
                                result_data["words"] = [
                                    {
                                        "word": word.word,
                                        "start_time": word.start_offset.total_seconds() if hasattr(word, 'start_offset') else 0,
                                        "end_time": word.end_offset.total_seconds() if hasattr(word, 'end_offset') else 0,
                                        "confidence": word.confidence if hasattr(word, 'confidence') else 1.0,
                                        "speaker": word.speaker_label if hasattr(word, 'speaker_label') else 0,
                                    }
                                    for word in alternative.words
                                ]
                            
                            await self.websocket.send_json(result_data)
                    
                    # Handle voice activity events
                    if hasattr(response, 'speech_event_type'):
                        event_type = response.speech_event_type
                        if event_type == types.StreamingRecognizeResponse.SpeechEventType.SPEECH_ACTIVITY_BEGIN:
                            await self.websocket.send_json({
                                "type": "speech_event",
                                "event": "speech_start",
                                "timestamp": datetime.now().isoformat()
                            })
                        elif event_type == types.StreamingRecognizeResponse.SpeechEventType.SPEECH_ACTIVITY_END:
                            await self.websocket.send_json({
                                "type": "speech_event",
                                "event": "speech_end",
                                "timestamp": datetime.now().isoformat()
                            })
                            
                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    logger.error(f"Error processing response: {e}")
                    
        except Exception as e:
            logger.error(f"Response processor error: {e}")
    
    def start_streaming(self):
        """Start the streaming recognition in a separate thread"""
        self.streaming_thread = threading.Thread(
            target=self.streaming_recognize_thread,
            daemon=True
        )
        self.streaming_thread.start()
    
    def add_audio(self, audio_data: bytes):
        """Add audio to the queue for streaming"""
        try:
            self.audio_queue.put(audio_data, block=False)
        except queue.Full:
            logger.warning("Audio queue is full, dropping audio chunk")
    
    def stop(self):
        """Stop the streaming session"""
        self.is_active = False
        self.audio_queue.put(None)  # Poison pill
        if self.streaming_thread:
            self.streaming_thread.join(timeout=2)

# WebSocket endpoint for streaming transcription
@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    """WebSocket endpoint for real-time audio streaming and transcription"""
    await websocket.accept()
    session: Optional[StreamingTranscriptionSession] = None
    response_task = None
    
    try:
        # Wait for initial session configuration
        init_message = await websocket.receive()
        
        # Parse initialization
        if init_message["type"] == "websocket.receive" and "text" in init_message:
            init_data = json.loads(init_message["text"])
            session_id = init_data.get("session_id", datetime.now().strftime("%Y%m%d-%H%M%S"))
            logger.info(f"Session initialized: {session_id}")
            logger.info(f"Client config: {init_data.get('config', {})}")
        else:
            session_id = datetime.now().strftime("%Y%m%d-%H%M%S")
        
        # Create transcription session
        session = StreamingTranscriptionSession(session_id, websocket)
        
        # Start streaming in background thread
        session.start_streaming()
        
        # Start response processor
        response_task = asyncio.create_task(session.process_responses())
        
        # Send ready signal
        await websocket.send_json({
            "type": "ready",
            "session_id": session_id,
            "timestamp": datetime.now().isoformat(),
            "config": {
                "sample_rate": 48000,
                "encoding": "WEBM_OPUS",
                "chunk_duration_ms": 100,
                "features": {
                    "interim_results": True,
                }
            }
        })
        
        # Handle incoming messages
        while session.is_active:
            try:
                message = await websocket.receive()
                
                if message["type"] == "websocket.disconnect":
                    break
                    
                if message["type"] == "websocket.receive":
                    if "bytes" in message:
                        # Handle binary audio data
                        audio_size = len(message["bytes"])
                        logger.debug(f"Received audio chunk: {audio_size} bytes")
                        session.add_audio(message["bytes"])
                    elif "text" in message:
                        # Handle control messages
                        data = json.loads(message["text"])
                        if data.get("type") == "stop":
                            logger.info("Received stop signal")
                            break
                        elif data.get("type") == "audio" and "data" in data:
                            # Handle base64 audio if sent as JSON
                            audio_bytes = base64.b64decode(data["data"])
                            logger.debug(f"Received base64 audio: {len(audio_bytes)} bytes")
                            session.add_audio(audio_bytes)
                    
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error receiving message: {e}")
                continue
        
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if websocket.client_state.value == 1:  # OPEN
            await websocket.send_json({
                "type": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
    finally:
        # Clean up
        if session:
            session.stop()
        if response_task:
            response_task.cancel()
            try:
                await response_task
            except asyncio.CancelledError:
                pass

# REST endpoints for health checks and info
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Therapy Transcription Streaming Service (Low Latency)",
        "features": {
            "streaming": True,
            "interim_results": True,
            "latency": "200-500ms"
        },
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    """Detailed health check"""
    try:
        # Test Speech API connectivity
        parent = f"projects/{project_id}/locations/{location}"
        recognizers = speech_client.list_recognizers(parent=parent)
        api_status = "connected"
    except Exception as e:
        api_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "speech_api": api_status,
        "project_id": project_id,
        "streaming_enabled": True,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
