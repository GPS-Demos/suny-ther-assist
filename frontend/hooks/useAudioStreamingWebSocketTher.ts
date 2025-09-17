import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioStreamingProps {
  onTranscript: (transcript: any) => void;
  onError?: (error: string) => void;
  authToken?: string | null;
}

interface AudioStreamingResult {
  isRecording: boolean;
  isConnected: boolean;
  isPlayingAudio: boolean;
  audioProgress: number;
  startMicrophoneRecording: () => Promise<void>;
  startAudioFileStreaming: (audioUrl: string) => Promise<void>;
  pauseAudioStreaming: () => void;
  resumeAudioStreaming: () => Promise<void>;
  stopStreaming: () => void;
  sessionId: string;
}

export const useAudioStreamingWebSocketTher = ({ 
  onTranscript, 
  onError, 
  authToken 
}: UseAudioStreamingProps): AudioStreamingResult => {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStreamingFileRef = useRef<boolean>(false);
  const currentAudioUrlRef = useRef<string>('');

  // Get WebSocket URL from environment
  const getWebSocketUrl = () => {
    const baseUrl = import.meta.env.VITE_STREAMING_API;
    // Handle both HTTP (localhost) and HTTPS (production)
    return baseUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://') + '/ws/transcribe';
  };

  // Connect to WebSocket
  const connectWebSocket = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = getWebSocketUrl();
        console.log('Connecting to WebSocket:', wsUrl);
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          
          // Send session initialization
          sessionIdRef.current = `session-${Date.now()}`;
          ws.send(JSON.stringify({
            session_id: sessionIdRef.current,
            auth_token: authToken,
            config: {
              sample_rate: 48000,
              encoding: 'WEBM_OPUS'
            }
          }));
          
          resolve();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'ready') {
              console.log('Session ready:', data.session_id);
            } else if (data.type === 'transcript') {
              onTranscript({
                transcript: data.transcript,
                confidence: data.confidence || 1.0,
                is_final: data.is_final !== false,
                is_interim: !data.is_final,
                speaker: data.speaker || 'conversation',
                timestamp: data.timestamp || new Date().toISOString(),
                words: data.words,
                result_end_offset: data.result_end_offset
              });
            } else if (data.type === 'speech_event') {
              console.log('Speech event:', data.event);
            } else if (data.type === 'error') {
              console.error('Transcription error:', data.error);
              onError?.(data.error);
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          onError?.('WebSocket connection error');
          reject(error);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          wsRef.current = null;
        };

      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        onError?.('Failed to connect to transcription service');
        reject(error);
      }
    });
  }, [authToken, onTranscript, onError]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'stop' }));
      }
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Start microphone recording
  const startMicrophoneRecording = useCallback(async () => {
    try {
      // Connect WebSocket if not connected
      if (!isConnected) {
        await connectWebSocket();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 48000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;

      // Create MediaRecorder
      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      // Send audio chunks to WebSocket
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        console.log('Recording stopped');
      };

      // Start recording with 100ms chunks for low latency
      mediaRecorder.start(100);
      setIsRecording(true);
      isStreamingFileRef.current = false;
      console.log('Microphone recording started');

    } catch (error) {
      console.error('Error starting recording:', error);
      onError?.('Failed to start recording. Please check microphone permissions.');
      setIsRecording(false);
    }
  }, [isConnected, connectWebSocket, onError]);

  // Convert MP3 to WAV format for better compatibility
  const convertAudioToWAV = useCallback(async (audioUrl: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audio = new Audio(audioUrl);
      audio.crossOrigin = 'anonymous';
      
      audio.onloadeddata = async () => {
        try {
          // Decode the audio file
          const response = await fetch(audioUrl);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Convert to WAV format
          const length = audioBuffer.length;
          const sampleRate = audioBuffer.sampleRate;
          const channels = audioBuffer.numberOfChannels;
          
          // Create a new buffer with the desired sample rate (48kHz)
          const targetSampleRate = 48000;
          const targetLength = Math.floor(length * targetSampleRate / sampleRate);
          const targetBuffer = audioContext.createBuffer(1, targetLength, targetSampleRate);
          
          // Resample and mix down to mono
          const sourceData = audioBuffer.getChannelData(0);
          const targetData = targetBuffer.getChannelData(0);
          
          for (let i = 0; i < targetLength; i++) {
            const sourceIndex = Math.floor(i * length / targetLength);
            let sample = sourceData[sourceIndex] || 0;
            
            // Mix additional channels if present
            for (let ch = 1; ch < channels; ch++) {
              sample += (audioBuffer.getChannelData(ch)[sourceIndex] || 0);
            }
            sample /= channels;
            
            targetData[i] = sample;
          }
          
          // Convert to WAV blob
          const wavBlob = audioBufferToWav(targetBuffer);
          resolve(wavBlob);
          
        } catch (error) {
          reject(error);
        }
      };
      
      audio.onerror = () => reject(new Error('Failed to load audio file'));
      audio.load();
    });
  }, []);

  // Helper function to convert AudioBuffer to WAV blob
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    const channelData = buffer.getChannelData(0);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  // Start audio file streaming with improved MP3 handling
  const startAudioFileStreaming = useCallback(async (audioUrl: string) => {
    try {
      // Connect WebSocket if not connected
      if (!isConnected) {
        await connectWebSocket();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Store audio URL for resume functionality
      currentAudioUrlRef.current = audioUrl;

      console.log('Converting MP3 to WAV for better compatibility...');
      const wavBlob = await convertAudioToWAV(audioUrl);
      const wavUrl = URL.createObjectURL(wavBlob);

      // Create audio context for processing
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create audio element for playback using original MP3 for user hearing
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.volume = 1.0;
      audioElementRef.current.crossOrigin = 'anonymous';
      
      // Track progress
      audioElementRef.current.addEventListener('timeupdate', () => {
        if (audioElementRef.current) {
          const progress = (audioElementRef.current.currentTime / audioElementRef.current.duration) * 100;
          setAudioProgress(progress);
        }
      });

      // Create a separate audio element for capturing that uses the WAV version
      const captureAudio = new Audio(wavUrl);
      captureAudio.crossOrigin = 'anonymous';
      
      // Create audio source from WAV element for capturing
      audioSourceRef.current = audioContextRef.current.createMediaElementSource(captureAudio);
      
      // Create a destination that captures the audio
      const dest = audioContextRef.current.createMediaStreamDestination();
      audioSourceRef.current.connect(dest);

      // Create MediaRecorder from the stream
      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };

      const mediaRecorder = new MediaRecorder(dest.stream, options);
      mediaRecorderRef.current = mediaRecorder;

      // Send audio chunks to WebSocket
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Audio file streaming stopped');
        URL.revokeObjectURL(wavUrl); // Clean up
      };

      // Handle audio end
      audioElementRef.current.addEventListener('ended', () => {
        setIsPlayingAudio(false);
        setAudioProgress(100);
        stopStreaming();
      });

      // Synchronize both audio elements
      const syncAudio = () => {
        if (audioElementRef.current && captureAudio) {
          captureAudio.currentTime = audioElementRef.current.currentTime;
        }
      };

      audioElementRef.current.addEventListener('seeked', syncAudio);
      audioElementRef.current.addEventListener('play', () => {
        captureAudio.play().catch(console.error);
      });
      audioElementRef.current.addEventListener('pause', () => {
        captureAudio.pause();
      });

      // Start recording and playback
      mediaRecorder.start(100); // 100ms chunks
      await audioElementRef.current.play();
      
      setIsRecording(true);
      setIsPlayingAudio(true);
      isStreamingFileRef.current = true;
      console.log('Audio file streaming started with improved MP3 handling');

    } catch (error) {
      console.error('Error streaming audio file:', error);
      onError?.('Failed to stream audio file');
      setIsRecording(false);
      setIsPlayingAudio(false);
    }
  }, [isConnected, connectWebSocket, onError, convertAudioToWAV]);

  // Pause audio streaming
  const pauseAudioStreaming = useCallback(() => {
    try {
      if (audioElementRef.current && isPlayingAudio) {
        // Pause audio playback
        audioElementRef.current.pause();
        setIsPlayingAudio(false);
        
        // Stop MediaRecorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current = null;
        }
        
        // Disconnect WebSocket cleanly
        disconnectWebSocket();
        
        setIsRecording(false);
        console.log('Audio streaming paused successfully - WebSocket disconnected');
      }
    } catch (error) {
      console.error('Error during pause (non-critical):', error);
      // Don't call onError for pause operations as they're not critical failures
    }
  }, [isPlayingAudio, disconnectWebSocket]);

  // Resume audio streaming
  const resumeAudioStreaming = useCallback(async () => {
    try {
      if (audioElementRef.current && !isPlayingAudio && isStreamingFileRef.current) {
        // Reconnect WebSocket first
        console.log('Reconnecting WebSocket for resume...');
        await connectWebSocket();
        await new Promise(resolve => setTimeout(resolve, 500));

        // Restart MediaRecorder with fresh connection
        if (audioContextRef.current && audioSourceRef.current) {
          // Create new destination
          const dest = audioContextRef.current.createMediaStreamDestination();
          audioSourceRef.current.connect(dest);
          
          const options: MediaRecorderOptions = {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 128000
          };

          const mediaRecorder = new MediaRecorder(dest.stream, options);
          mediaRecorderRef.current = mediaRecorder;

          // Send audio chunks to WebSocket
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(event.data);
            }
          };

          mediaRecorder.start(100);
          setIsRecording(true);
        }
        
        // Resume audio playback from current position
        await audioElementRef.current.play();
        setIsPlayingAudio(true);
        
        console.log('Audio streaming resumed successfully from position:', audioElementRef.current.currentTime, '- WebSocket reconnected');
      }
    } catch (error) {
      console.error('Error resuming audio streaming:', error);
      onError?.('Failed to resume audio streaming');
    }
  }, [isPlayingAudio, onError, connectWebSocket]);

  // Stop any streaming
  const stopStreaming = useCallback(() => {
    // Stop MediaRecorder
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    // Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Stop audio playback
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    // Close audio context - but only if we're truly stopping, not pausing
    if (audioContextRef.current && !isStreamingFileRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsRecording(false);
    setIsPlayingAudio(false);
    setAudioProgress(0);
    isStreamingFileRef.current = false;

    // Disconnect WebSocket after a delay to receive final transcripts
    setTimeout(() => {
      disconnectWebSocket();
    }, 1000);
  }, [disconnectWebSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
      disconnectWebSocket();
    };
  }, [stopStreaming, disconnectWebSocket]);

  return {
    isRecording,
    isConnected,
    isPlayingAudio,
    audioProgress,
    startMicrophoneRecording,
    startAudioFileStreaming,
    pauseAudioStreaming,
    resumeAudioStreaming,
    stopStreaming,
    sessionId: sessionIdRef.current
  };
};
