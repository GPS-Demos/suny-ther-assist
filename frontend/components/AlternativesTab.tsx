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
                    fontSize: '20px',
                    fontWeight: 500,
                    lineHeight: '28px',
                    color: '#1f1f1f',
                    mb: 3,
                  }}
                >
                  {pathway.approach}
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <div style={{
                    fontSize: '16px',
                    lineHeight: '24px',
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
                {pathway.techniques.map((technique, techIndex) => (
                  <Box key={techIndex} sx={{ mb: techIndex === pathway.techniques.length - 1 ? 0 : 3 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#444746',
                        mb: 1,
                      }}
                    >
                      {technique}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </>
      ) : (
        // Static fallback content when no analysis data available
        <>
          {/* Safety Planning Section */}
          <Box sx={{ display: 'flex', gap: 4 }}>
            {/* Left Content */}
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: '20px',
                  fontWeight: 500,
                  lineHeight: '28px',
                  color: '#1f1f1f',
                  mb: 3,
                }}
              >
                Safety Planning
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#444746',
                  whiteSpace: 'pre-line',
                }}
              >
                Given the patient's difficulty managing overwhelming anxiety ('anxiety just takes over completely') and dissociative symptoms, integrating skills from Dialectical Behavior Therapy (DBT) such as distress tolerance (e.g., TIPP skills, self-soothing) and emotion regulation would be highly beneficial. These skills provide concrete tools for managing intense emotional states that cognitive work alone cannot address.
              </Typography>
            </Box>

            {/* Right Content */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ mb: 4 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#444746',
                    mb: 1,
                  }}
                >
                  TIPP skills (Temperature, Intense exercise, Paced breathing, Paired muscle relaxation)
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#444746',
                    mb: 1,
                  }}
                >
                  Self-soothing with the five senses
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#444746',
                    mb: 1,
                  }}
                >
                  Pros and Cons of tolerating distress
                </Typography>
              </Box>

              <Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#444746',
                    mb: 1,
                  }}
                >
                  Mindfulness of current emotion
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Systematic Graded Exposure Section */}
          <Box sx={{ display: 'flex', gap: 4 }}>
            {/* Left Content */}
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: '20px',
                  fontWeight: 500,
                  lineHeight: '28px',
                  color: '#1f1f1f',
                  mb: 3,
                }}
              >
                Systematic Graded Exposure with Skills Integration
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: '#444746',
                  whiteSpace: 'pre-line',
                }}
              >
                Exposure therapy is the most effective treatment for anxiety disorders, especially social anxiety. However, for this patient, it needs to be introduced gradually and explicitly linked with distress tolerance skills to ensure they can manage the anxiety experienced during exposure, rather than becoming overwhelmed or dissociating.
              </Typography>
            </Box>

            {/* Right Content */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ mb: 4 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#444746',
                    mb: 1,
                  }}
                >
                  Hierarchy development
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#444746',
                    mb: 1,
                  }}
                >
                  In-vivo or imaginal exposure (graduated)
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#444746',
                    mb: 1,
                  }}
                >
                  Interoceptive exposure (if panic is a significant component)
                </Typography>
              </Box>

              <Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#444746',
                    mb: 1,
                  }}
                >
                  Systematic desensitization
                </Typography>
              </Box>
            </Box>
          </Box>
        </>
      )}

      {/* Message when no alternatives are available yet */}
      {!hasAlternatives && (
        <Box sx={{ 
          textAlign: 'center', 
          py: 4,
          borderTop: '1px solid #f0f4f9',
          mt: 2,
        }}>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#6b7280',
              fontStyle: 'italic',
            }}
          >
            {hasReceivedComprehensiveAnalysis 
              ? "No alternative therapeutic pathways recommended for the current session context."
              : "Alternative therapeutic pathways will appear here once comprehensive analysis is complete."
            }
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#9ca3af',
              mt: 1,
            }}
          >
            {hasReceivedComprehensiveAnalysis 
              ? "The current therapeutic approach appears to be the most suitable for this patient."
              : "Start a session or use test data to see dynamic recommendations."
            }
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AlternativesTab;
