import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Citation } from '../types/types';
import { renderTextWithCitations } from '../utils/textRendering';

interface AlternativePathway {
  approach: string;
  reason: string;
  techniques: string[];
}

interface AlternativesTabProps {
  alternativePathways?: AlternativePathway[];
  citations?: Citation[];
  onCitationClick?: (citation: Citation) => void;
  hasReceivedComprehensiveAnalysis?: boolean;
}

const AlternativesTab: React.FC<AlternativesTabProps> = ({ 
  alternativePathways = [], 
  citations = [], 
  onCitationClick,
  hasReceivedComprehensiveAnalysis = false
}) => {
  // Helper function to handle citation clicks in rendered markdown
  const handleCitationClick = (citationNumber: number) => {
    const citation = citations.find(c => c.citation_number === citationNumber);
    if (citation && onCitationClick) {
      onCitationClick(citation);
    }
  };

  // Show dynamic content if available, otherwise show static content
  const hasAlternatives = alternativePathways && alternativePathways.length > 0;
  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      pb: 4,
    }}>
      {hasAlternatives ? (
        // Dynamic content from comprehensive analysis
        <>
          {alternativePathways.map((pathway, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 4 }}>
              {/* Left Content */}
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontSize: '22px',
                    fontWeight: 500,
                    lineHeight: '30px',
                    color: '#1f1f1f',
                    mb: 3,
                  }}
                >
                  {pathway.approach}
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <div style={{
                    fontSize: '18px',
                    lineHeight: '26px',
                    color: '#444746',
                  }}>
                    {renderTextWithCitations(pathway.reason, {
                      citations,
                      onCitationClick: onCitationClick || (() => {}),
                      markdown: true
                    })}
                  </div>
                </Box>
              </Box>

              {/* Right Content - Techniques */}
              <Box sx={{ flex: 1 }}>
                {pathway.techniques.slice(0, 4).map((technique, techIndex) => (
                  <Box key={techIndex} sx={{ mb: techIndex === Math.min(pathway.techniques.length, 4) - 1 ? 0 : 3 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#444746',
                      marginBottom: '4px',
                    }}>
                      {renderTextWithCitations(technique, {
                        citations,
                        onCitationClick: onCitationClick || (() => {}),
                        markdown: true
                      })}
                    </div>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </>
      ) : (
        // Default content when no analysis data available
        <div style={{
          fontSize: '28px',
          fontWeight: 400,
          lineHeight: '36px',
          color: '#1f1f1f',
          whiteSpace: 'pre-line',
        }}>
          Start a session to receive alternative therapeutic pathway guidance.
        </div>
      )}
      
      {/* Citations section */}
      {hasReceivedComprehensiveAnalysis && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="body2" sx={{ 
            fontSize: '16px', 
            fontWeight: 600, 
            color: '#444746',
            mb: 2,
            letterSpacing: '0.5px',
          }}>
            CITATIONS
          </Typography>
          {citations.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {citations.map((citation, index) => (
                <Typography 
                  key={index}
                  variant="body2" 
                  onClick={() => onCitationClick && onCitationClick(citation)}
                  sx={{ 
                    fontSize: '16px',
                    color: '#0b57d0',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'none',
                    },
                  }}
                >
                  {citation.citation_number}. {citation.source?.title || 'Unknown Source'}
                </Typography>
              ))}
            </Box>
          ) : (
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: '16px',
                color: '#6b7280',
                fontStyle: 'italic',
              }}
            >
              No citations available yet
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AlternativesTab;
