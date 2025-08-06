import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '../utils/icons';

interface ThinkingBoxProps {
  thinkingContent: string[];
  responseContent?: string;
  rawResponseChunks?: string[];
  isThinkingComplete?: boolean;
  initialExpanded?: boolean;
}

const ThinkingBox: React.FC<ThinkingBoxProps> = ({ 
  thinkingContent, 
  responseContent,
  rawResponseChunks,
  isThinkingComplete = true,
  initialExpanded = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  
  if (thinkingContent.length === 0) return null;

  return (
    <div className={`mb-6 transition-all duration-300 ${isThinkingComplete ? 'opacity-60' : 'opacity-100'}`}
      style={{
        background: 'linear-gradient(135deg, rgba(249, 250, 251, 0.95) 0%, rgba(243, 244, 246, 0.95) 100%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(209, 213, 219, 0.5)',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        overflow: 'visible',
        position: 'relative',
        zIndex: isExpanded ? 1000 : 1
      }}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between text-left transition-all duration-200"
        style={{
          background: 'transparent',
          borderRadius: '16px 16px 0 0'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(229, 231, 235, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></div>
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse" style={{animationDelay: '150ms'}}></div>
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse" style={{animationDelay: '300ms'}}></div>
          </div>
          <span className="text-sm font-semibold" style={{ color: '#374151' }}>
            {responseContent ? 'AI Thinking & Response' : 'AI Thinking Process'}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-slate-600" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-slate-600" />
        )}
      </button>
      
      <div className={`px-6 pb-5 transition-all duration-300 ${isExpanded ? 'h-96' : 'max-h-16 overflow-hidden'}`}>
        {isExpanded ? (
          <div 
            className="bg-gray-900 rounded-lg overflow-auto thinking-box-scroll"
            style={{ height: '350px', position: 'relative' }}
          >
            <pre className="p-3 text-gray-100 whitespace-pre-wrap font-mono select-text" style={{ fontSize: '10px', lineHeight: '1.4', userSelect: 'text' }}>
              {thinkingContent.length > 0 && (
                <>
                  <span style={{ color: '#9CA3AF' }}>{'======= THINKING =======\n\n'}</span>
                  {thinkingContent.map((thought, index) => (
                    <span key={index} style={{ display: 'block', marginBottom: '1em' }}>
                      {thought}
                    </span>
                  ))}
                </>
              )}
              {rawResponseChunks && rawResponseChunks.length > 0 ? (
                <>
                  <span style={{ color: '#9CA3AF' }}>{'\n\n======= RAW RESPONSE =======\n\n'}</span>
                  {rawResponseChunks.join('\n')}
                </>
              ) : responseContent && (
                <>
                  <span style={{ color: '#9CA3AF' }}>{'\n\n======= RESPONSE =======\n\n'}</span>
                  {responseContent}
                </>
              )}
            </pre>
          </div>
        ) : (
          <p style={{ 
            color: '#374151', 
            padding: '4px 24px 12px 24px',
            fontSize: '13px',
            fontWeight: '500',
            margin: 0
          }}>
            {(() => {
              if (responseContent) {
                const responseLines = responseContent.trim().split('\n');
                const lastLine = responseLines[responseLines.length - 1];
                const cleanResponse = lastLine.replace(/\*\*/g, '');
                return `Response: ${cleanResponse}`;
              } else if (thinkingContent.length > 0) {
                const latestContent = thinkingContent[thinkingContent.length - 1];
                const contentLines = latestContent.trim().split('\n');
                const lastLine = contentLines[contentLines.length - 1];
                const cleanContent = lastLine.replace(/\*\*/g, '');
                return cleanContent;
              } else {
                return 'AI is analyzing...';
              }
            })()}
          </p>
        )}
      </div>
    </div>
  );
};

export default ThinkingBox;
