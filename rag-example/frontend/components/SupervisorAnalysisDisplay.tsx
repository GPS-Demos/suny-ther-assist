import React, { useState, useRef, useEffect } from 'react';
import type { SupervisorAnalysis, TranscriptCitation, CurriculumCitation } from '../types/types';
import ThinkingBox from './ThinkingBox';
import { SparklesIcon } from '../utils/icons';

interface TooltipPosition {
  top: number;
  left: number;
}

const SupervisorAnalysisDisplay = ({
    analysis,
    thinkingContent,
    responseContent,
    rawResponseChunks
}: {
    analysis: SupervisorAnalysis;
    thinkingContent: string[];
    responseContent: string;
    rawResponseChunks: string[];
}) => {
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

    useEffect(() => {
        if (hoveredCitation && tooltipRef.current) {
            const tooltip = tooltipRef.current;
            const rect = tooltip.getBoundingClientRect();
            
            let newLeft = tooltipPosition.left + 20;
            let newTop = tooltipPosition.top;

            if (newLeft + rect.width > window.innerWidth - 20) {
                newLeft = window.innerWidth - rect.width - 20;
            }
            
            if (newTop + rect.height > window.innerHeight - 20) {
                newTop = window.innerHeight - rect.height - 20;
            }

            tooltip.style.left = `${newLeft}px`;
            tooltip.style.top = `${newTop}px`;
        }
    }, [hoveredCitation, tooltipPosition]);

    const renderTextWithCitations = (text: string) => {
        const citationRegex = /\[([T]?\d+(?:,\s*[T]?\d+)*)\]/g;
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        
        while ((match = citationRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
            }
            
            const citationGroup = match[1];
            const citations = citationGroup.split(',').map(c => c.trim());
            
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
            
            parts.push(
                <span key={matchIndex} className="citation-group">
                    [{citationElements}]
                </span>
            );
            
            lastIndex = match.index + match[0].length;
        }
        
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }
        
        return parts;
    };

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
                        <div style={{ fontWeight: 600, marginBottom: '8px', color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', backgroundColor: '#e9d5ff', color: '#6b21a8', borderRadius: '50%', fontSize: '12px', fontWeight: 'bold' }}>T</span>
                            Transcript Reference
                        </div>
                        <div style={{ backgroundColor: '#faf5ff', padding: '12px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                            <div style={{ marginBottom: '4px' }}>
                                <span style={{ fontWeight: 600, textTransform: 'capitalize', color: '#6b21a8' }}>{(citationData as TranscriptCitation).speaker}:</span>
                            </div>
                            <div style={{ fontStyle: 'italic', color: '#4b5563', paddingLeft: '12px' }}>
                                "{(citationData as TranscriptCitation).quote}"
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div style={{ fontWeight: 600, marginBottom: '8px', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '50%', fontSize: '12px', fontWeight: 'bold' }}>{(citationData as CurriculumCitation).number}</span>
                            Curriculum Reference
                        </div>
                        <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #dbeafe' }}>
                            <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: '8px' }}>{(citationData as CurriculumCitation).source}</div>
                            {(citationData as CurriculumCitation).text && (
                                <div style={{ fontStyle: 'italic', color: '#4b5563', paddingLeft: '12px', borderLeft: '3px solid #dbeafe', marginBottom: '8px' }}>
                                    "{(citationData as CurriculumCitation).text}"
                                </div>
                            )}
                            {(citationData as CurriculumCitation).pages && (
                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
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
        <div className="space-y-6">
            {renderTooltip()}
            <div className="card">
                <h3 className="h3 mb-4">AI Analysis of Your Coaching</h3>
                
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">Feedback on Acknowledging Strengths</h4>
                        <p className="text-blue-700">{renderTextWithCitations(analysis.feedbackOnStrengths)}</p>
                    </div>

                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h4 className="font-semibold text-purple-800 mb-2">Feedback on Constructive Criticism</h4>
                        <p className="text-purple-700">{renderTextWithCitations(analysis.feedbackOnCritique)}</p>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">Overall Tone Assessment</h4>
                        <p className="text-green-700 font-medium">{renderTextWithCitations(analysis.overallTone)}</p>
                    </div>
                </div>
            </div>

            {(thinkingContent.length > 0 || responseContent) && (
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <SparklesIcon className="w-8 h-8 text-blue-600" />
                        <h2 className="text-2xl font-bold text-slate-800">AI Processing Log</h2>
                    </div>
                    <ThinkingBox 
                        thinkingContent={thinkingContent}
                        responseContent={responseContent}
                        rawResponseChunks={rawResponseChunks}
                        isThinkingComplete={true}
                        initialExpanded={false}
                    />
                </div>
            )}
        </div>
    );
};

export default SupervisorAnalysisDisplay;
