import React, { useState, useEffect } from 'react';
import { SparklesIcon } from '../utils/icons';
import ThinkingBox from './ThinkingBox';

interface StreamingAnalysisDisplayProps {
  streamingText: string;
  isComplete: boolean;
  isThinking?: boolean;
  thinkingComplete?: boolean;
  rawResponseChunks?: string[];
}

const StreamingAnalysisDisplay: React.FC<StreamingAnalysisDisplayProps> = ({ 
  streamingText, 
  isComplete, 
  isThinking = false,
  thinkingComplete = false,
  rawResponseChunks = []
}) => {
  const [thinkingContent, setThinkingContent] = useState<string[]>([]);
  const [finalContent, setFinalContent] = useState('');
  const [rawChunks, setRawChunks] = useState<string[]>([]);
  
  // Add shimmer animation style
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Process streaming text based on whether it's thinking or final content
  useEffect(() => {
    if (isThinking && !thinkingComplete) {
      // For the new format, thinking content comes directly without markers
      // Split the thinking content into chunks based on double newlines for better display
      const thinkingSections = streamingText
        .split(/\n\n+/)
        .filter(section => section.trim())
        .map(section => section.trim());
      
      if (thinkingSections.length > 0) {
        setThinkingContent(thinkingSections);
      }
    } 
    
    // Process final content when thinking is complete
    // Important: Don't clear thinking content when final content arrives
    if (thinkingComplete && streamingText) {
      // When thinking is complete, the streamingText contains both thinking and final content
      // separated by THINKING_COMPLETE marker
      const parts = streamingText.split('THINKING_COMPLETE');
      
      if (parts.length >= 2) {
        // Extract thinking content if not already set
        const thinkingPart = parts[0].trim();
        if (thinkingPart) {
          const thinkingSections = thinkingPart
            .split(/\n\n+/)
            .filter(section => section.trim())
            .map(section => section.trim());
          
          if (thinkingSections.length > 0) {
            setThinkingContent(thinkingSections);
          }
        }
        
        // Extract final content (everything after THINKING_COMPLETE)
        const finalPart = parts.slice(1).join('THINKING_COMPLETE').trim();
        setFinalContent(finalPart);
      } else {
        // Fallback: treat entire content as final if no THINKING_COMPLETE marker
        setFinalContent(streamingText);
      }
    } else if (!isThinking && streamingText && !streamingText.includes('THINKING_COMPLETE')) {
      // If we're not in thinking mode at all, just set the final content
      setFinalContent(streamingText);
    }

    if (rawResponseChunks.length > 0) {
      setRawChunks(rawResponseChunks);
    }
  }, [streamingText, isThinking, thinkingComplete, rawResponseChunks]);

  const latestThinkingChunk = thinkingContent[thinkingContent.length - 1] || '';
  const showThinking = thinkingContent.length > 0;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <SparklesIcon className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-slate-800">
          {isComplete ? 'Analysis Complete' : 'Analyzing Your Performance'}
        </h2>
      </div>
      
      {/* Thinking Section */}
      <ThinkingBox 
        thinkingContent={thinkingContent}
        responseContent={finalContent}
        rawResponseChunks={rawChunks}
        isThinkingComplete={thinkingComplete}
      />
      
      
      {/* Prettier progress bar when thinking complete */}
      {!isComplete && thinkingComplete && (
        <div className="mb-6">
          <div className="relative">
            <div className="w-full bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{
                  width: '85%',
                  background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                }}
              >
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
                    animation: 'shimmer 2s infinite'
                  }}
                />
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2 text-center">Generating your personalized feedback...</p>
          </div>
        </div>
      )}


      {/* Show placeholder if no content yet */}
      {!finalContent && !showThinking && (
        <div className="text-center py-8">
          <p className="text-slate-500">Preparing analysis...</p>
        </div>
      )}

      {/* Completion message */}
      {isComplete && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm font-medium">
            ✓ Analysis complete! Switching to detailed view...
          </p>
        </div>
      )}
    </div>
  );
};

export default StreamingAnalysisDisplay;
