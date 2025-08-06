
import React, { useState, useRef, useEffect } from 'react';
import type { CaseworkerAnalysis, TranscriptCitation, CurriculumCitation } from '../types/types';
import { CheckCircleIcon, LightbulbIcon, SparklesIcon, XCircleIcon } from '../utils/icons';
import ThinkingBox from './ThinkingBox';

interface AnalysisDisplayProps {
  analysis: CaseworkerAnalysis;
  thinkingContent?: string[];
  responseContent?: string;
  rawResponseChunks?: string[];
}

interface TooltipPosition {
  top: number;
  left: number;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, thinkingContent = [], responseContent, rawResponseChunks }) => {
  const [hoveredCitation, setHoveredCitation] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCitation(null);
    }, 200);
  };

  const handleTooltipEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };
  
  // Find citation data
  const findCitationData = (marker: string) => {
    const isTranscript = marker.includes('T');
    const num = marker.replace(/[T\[\]]/g, '');
    
    if (isTranscript && analysis.transcriptCitations) {
      return analysis.transcriptCitations.find(c => c.marker === `[${marker}]`);
    } else if (analysis.citations) {
      return analysis.citations.find(c => c.number === parseInt(num));
    }
    return null;
  };
  
  // Handle tooltip positioning
  const handleMouseEnter = (event: React.MouseEvent, citationMarker: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setTooltipPosition({
        top: event.pageY,
        left: event.pageX
      });
      setHoveredCitation(citationMarker);
    }, 100);
  };
  
  // Adjust tooltip position to prevent going off-screen
  useEffect(() => {
    if (hoveredCitation && tooltipRef.current) {
      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();
      
      // Position to the right of the cursor
      let newLeft = tooltipPosition.left + 20;
      let newTop = tooltipPosition.top;

      // Adjust if it overflows the right edge
      if (newLeft + rect.width > window.innerWidth - 20) {
        newLeft = window.innerWidth - rect.width - 20;
      }
      
      // Adjust if it overflows the bottom edge
      if (newTop + rect.height > window.innerHeight - 20) {
          newTop = window.innerHeight - rect.height - 20;
      }

      tooltip.style.left = `${newLeft}px`;
      tooltip.style.top = `${newTop}px`;
    }
  }, [hoveredCitation, tooltipPosition]);
  
  // Function to parse text and replace citation markers with interactive elements
  const renderTextWithCitations = (text: string) => {
    // Updated regex to match both single citations [1] and multiple citations [1, 2, 3]
    const citationRegex = /\[([T]?\d+(?:,\s*[T]?\d+)*)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    
    while ((match = citationRegex.exec(text)) !== null) {
      // Add text before citation
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Handle multiple citations in one bracket
      const citationGroup = match[1];
      const citations = citationGroup.split(',').map(c => c.trim());
      
      // Create interactive citation elements
      const matchIndex = match.index;
      const citationElements = citations.map((citationMarker, idx) => {
        const isTranscript = citationMarker.includes('T');
        const displayNumber = citationMarker;
        
        return (
          <React.Fragment key={`${matchIndex}-${idx}`}>
            {idx > 0 && ', '}
            <span
              data-citation={citationMarker}
              className={`citation-link ${isTranscript ? 'transcript' : 'curriculum'}`}
              onMouseEnter={(e) => handleMouseEnter(e, citationMarker)}
              onMouseLeave={handleMouseLeave}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Keep tooltip open on click
                handleMouseEnter(e, citationMarker);
              }}
              style={{
                cursor: 'pointer',
                fontWeight: 600,
                color: isTranscript ? '#7c3aed' : '#2563eb',
                textDecoration: 'underline',
                textDecorationStyle: 'dotted',
                textUnderlineOffset: '2px'
              }}
            >
              {displayNumber}
            </span>
          </React.Fragment>
        );
      });
      
      // Wrap citations in brackets
      parts.push(
        <span key={matchIndex} className="citation-group">
          [
          {citationElements}
          ]
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts;
  };
  
  // Render citation tooltip
  const renderTooltip = () => {
    if (!hoveredCitation) return null;
    
    const citationData = findCitationData(hoveredCitation);
    if (!citationData) return null;
    
    const isTranscript = hoveredCitation.includes('T');
    
    return (
      <div
        ref={tooltipRef}
        className="citation-tooltip"
        onMouseEnter={handleTooltipEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'fixed',
          zIndex: 1000,
          width: '380px',
          maxHeight: '450px',
          overflowY: 'auto',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '14px',
          lineHeight: '1.6',
          pointerEvents: 'auto',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
          border: isTranscript ? '1px solid #ddd1fe' : '1px solid #bfdbfe'
        }}
      >
        {isTranscript ? (
          <div>
            <div style={{ 
              fontWeight: 600, 
              marginBottom: '8px', 
              color: '#6b21a8',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                backgroundColor: '#e9d5ff',
                color: '#6b21a8',
                borderRadius: '50%',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                T
              </span>
              Transcript Reference
            </div>
            <div style={{ 
              backgroundColor: '#faf5ff', 
              padding: '12px', 
              borderRadius: '8px',
              border: '1px solid #e9d5ff'
            }}>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ 
                  fontWeight: 600, 
                  textTransform: 'capitalize',
                  color: '#6b21a8' 
                }}>
                  {(citationData as TranscriptCitation).speaker}:
                </span>
              </div>
              <div style={{ 
                fontStyle: 'italic', 
                color: '#4b5563',
                paddingLeft: '12px'
              }}>
                "{(citationData as TranscriptCitation).quote}"
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ 
              fontWeight: 600, 
              marginBottom: '8px', 
              color: '#1e40af',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                borderRadius: '50%',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {(citationData as CurriculumCitation).number}
              </span>
              Curriculum Reference
            </div>
            <div style={{ 
              backgroundColor: '#eff6ff', 
              padding: '12px', 
              borderRadius: '8px',
              border: '1px solid #dbeafe'
            }}>
              <div style={{ 
                fontWeight: 600, 
                color: '#1e40af',
                marginBottom: '8px' 
              }}>
                {(citationData as CurriculumCitation).source}
              </div>
              {(citationData as CurriculumCitation).text && (
                <div style={{ 
                  fontStyle: 'italic', 
                  color: '#4b5563',
                  paddingLeft: '12px',
                  borderLeft: '3px solid #dbeafe',
                  marginBottom: '8px'
                }}>
                  "{(citationData as CurriculumCitation).text}"
                </div>
              )}
              {(citationData as CurriculumCitation).pages && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6b7280',
                  marginTop: '8px'
                }}>
                  📄 {(citationData as CurriculumCitation).pages}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200 h-full overflow-y-auto">
      {renderTooltip()}
      <div className="flex items-center gap-3 mb-4">
        <SparklesIcon className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-slate-800">Feedback Analysis</h2>
      </div>
      
      {/* AI Thinking Process */}
      <ThinkingBox 
        thinkingContent={thinkingContent}
        responseContent={responseContent}
        rawResponseChunks={rawResponseChunks}
        isThinkingComplete={true}
      />
      
      <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Overall Summary</h3>
        <p className="text-blue-700">{renderTextWithCitations(analysis.overallSummary)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="p-5 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
            <CheckCircleIcon className="w-6 h-6" />
            Strengths
          </h3>
          <ul className="space-y-3 list-disc list-outside pl-5 text-green-700">
            {analysis.strengths.map((strength, index) => (
              <li key={index}>{renderTextWithCitations(strength)}</li>
            ))}
          </ul>
        </div>

        <div className="p-5 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
            <LightbulbIcon className="w-6 h-6" />
            Areas for Improvement
          </h3>
          <ul className="space-y-4 list-disc list-outside pl-5 text-amber-700">
            {analysis.areasForImprovement.map((item, index) => (
              <li key={index} className="mb-2">
                <span className="font-semibold">{item.area}:</span>
                <p className="text-sm leading-relaxed">{renderTextWithCitations(item.suggestion)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Criteria Analysis Table */}
      {analysis.criteriaAnalysis && analysis.criteriaAnalysis.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Criteria Assessment</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Criterion</th>
                  <th className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 w-24">Status</th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Evidence</th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Feedback</th>
                </tr>
              </thead>
              <tbody>
                {analysis.criteriaAnalysis.map((criterion, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800">
                      {criterion.criterion}
                    </td>
                    <td className={`border border-gray-200 px-4 py-3 text-center ${criterion.met ? 'bg-green-100' : 'bg-red-100'}`}>
                      {criterion.met ? (
                        <CheckCircleIcon className="w-6 h-6 text-green-700 mx-auto" />
                      ) : (
                        <XCircleIcon className="w-6 h-6 text-red-700 mx-auto" />
                      )}
                      <div className="text-xs mt-1 text-gray-600">{criterion.score}</div>
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">
                      <div className="max-w-xs">
                        {renderTextWithCitations(criterion.evidence)}
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">
                      <div className="max-w-md">
                        {renderTextWithCitations(criterion.feedback)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default AnalysisDisplay;
