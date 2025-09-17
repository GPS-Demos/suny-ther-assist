import React from 'react';
import { Box, Typography, Chip, Paper } from '@mui/material';
import { 
  HealthAndSafety, 
  NaturePeople, 
  Category, 
  Exposure,
  Shield,
  Psychology,
  SwapHoriz,
  Build,
  Lightbulb,
  Assessment
} from '@mui/icons-material';
import { renderTextWithCitations } from '../utils/textRendering';

interface PathwayTabProps {
  onCitationClick?: (citation: any) => void;
  onActionClick?: (action: any, isContraindication: boolean) => void;
  currentGuidance?: {
    title: string;
    time: string;
    content: string;
    immediateActions: Array<{
      title: string;
      description: string;
      icon: 'safety' | 'grounding';
    }>;
    contraindications: Array<{
      title: string;
      description: string;
      icon: 'cognitive' | 'exposure';
    }>;
    isLive: boolean;
  };
  citations?: Array<{
    citation_number: number;
    source?: {
      title?: string;
      uri?: string;
      excerpt?: string;
      pages?: {
        first: number;
        last: number;
      };
    };
  }>;
  techniques?: string[];
  currentAlert?: {
    title: string;
    category: string;
    timing: string;
  } | null;
}

const PathwayTab: React.FC<PathwayTabProps> = ({ 
  onCitationClick, 
  onActionClick,
  currentGuidance,
  citations = [],
  techniques = [],
  currentAlert
}) => {
  const handleCitationClick = () => {
    const citationData = {
      citation_number: 1,
      source: {
        title: 'Comprehensive-CBT-for-Social-Phobia-Manual.pdf',
        excerpt: `Exposure Therapy Manuals and Guidebooks General Application as well as in particular disorder:

Abramowitz, J. S., Deacon, B. J., & Whiteside, S. P. H. (2019). Exposure therapy for anxiety: Principles and Practice. The Guilford Press. Davis, C. S., Lauterbach, D. (2018). Handbook of exposure therapies. Academic Press. Smits, J. A. J., Powers, M. B., & Otto, M. W. (2019). Exposure therapy for anxiety disorders: A practitioner-centered transdiagnostic approach. Oxford University Press. Stille, H., Jacqueut, J., & Aflamendi, J. (2022). Clinical Guide to Exposure Therapy Beyond Specific Phobias. Springer Publications. P. & Margraf, J. (2002). Clinical Guide to Exposure Therapy. Beyond Specific Phobias. Springer Publications. P. Obsessive-Compulsive Disorder Foa, E. B., Yadin, E., & Lichner, T. K. (2012). Exposure and response prevention for obsessive-compulsive disorder: Therapist guide. Oxford University Press. Steketee, G., & Frost, R. O. (2019). Prolonged exposure therapy for PTSD. Therapist Guide. Oxford University Press. Tull, C. L. (2006). Managing social anxiety: A cognitive behavioral guide. Social Phobia/Social Anxiety Disorder Foa, E. B., Hembree, E. A., & Rothbaum, B. O., and Rauch, S.A.M. (2019). Prolonged exposure therapy for PTSD. Therapist Guide. (2nd ed.). Oxford University Press.`,
        pages: {
          first: 1,
          last: 3
        }
      }
    };
    
    if (onCitationClick) {
      onCitationClick(citationData);
    }
  };

  const getActionIcon = (iconType: string) => {
    switch (iconType) {
      case 'safety': return <HealthAndSafety sx={{ fontSize: 24, color: '#128937' }} />;
      case 'grounding': return <NaturePeople sx={{ fontSize: 24, color: '#128937' }} />;
      case 'cognitive': return <Category sx={{ fontSize: 24, color: '#b3261e' }} />;
      case 'exposure': return <Exposure sx={{ fontSize: 24, color: '#b3261e' }} />;
      default: return <HealthAndSafety sx={{ fontSize: 24, color: '#128937' }} />;
    }
  };

  // Get alert icon based on category and timing
  const getAlertIcon = (category: string, timing: string) => {
    // Color based on timing: now=red, pause=orange, info=green
    const getColor = () => {
      switch (timing?.toLowerCase()) {
        case 'now': return '#dc2626'; // Red
        case 'pause': return '#d97706'; // Orange
        case 'info': return '#059669'; // Green
        default: return '#6b7280'; // Gray
      }
    };

    const iconColor = getColor();
    const iconSize = 36; // Match Guidance tab size

    switch (category) {
      case 'safety':
        return <Shield sx={{ fontSize: iconSize, color: iconColor }} />;
      case 'technique':
        return <Build sx={{ fontSize: iconSize, color: iconColor }} />;
      case 'pathway_change':
        return <SwapHoriz sx={{ fontSize: iconSize, color: iconColor }} />;
      case 'engagement':
        return <Lightbulb sx={{ fontSize: iconSize, color: iconColor }} />;
      case 'process':
        return <Assessment sx={{ fontSize: iconSize, color: iconColor }} />;
      default:
        return <Psychology sx={{ fontSize: iconSize, color: iconColor }} />;
    }
  };

  const ActionCard = ({ action, isContraindication = false }: { 
    action: any; 
    isContraindication?: boolean; 
  }) => (
    <Paper
      onClick={() => onActionClick && onActionClick(action, isContraindication)}
      sx={{
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: '1px solid #c4c7c5',
        borderRadius: '16px',
        minHeight: '120px',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 2 }}>
        {getActionIcon(action.icon)}
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <div style={{ 
          fontWeight: 400, 
          fontSize: '18px', 
          lineHeight: '26px',
          color: '#1f1f1f',
        }}>
          {renderTextWithCitations(action.title, {
            citations,
            onCitationClick: onCitationClick || (() => {}),
            markdown: true
          })}
        </div>
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      pb: 4,
      position: 'relative',
    }}>
      {/* Alert Connection Header */}
      {currentAlert && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getAlertIcon(currentAlert.category, currentAlert.timing)}
          <Typography
            variant="h4"
            sx={{
              fontSize: '32px',
              fontWeight: 600,
              lineHeight: '40px',
              color: '#1f1f1f',
            }}
          >
            {currentAlert.title}
          </Typography>
        </Box>
      )}

      {/* Main pathway content - comprehensive analysis */}
      {currentGuidance && currentGuidance.isLive ? (
        <div style={{
          fontSize: '24px',
          fontWeight: 400,
          lineHeight: '32px',
          color: '#1f1f1f',
          whiteSpace: 'pre-line',
        }}>
          {renderTextWithCitations(currentGuidance.content, {
            citations,
            onCitationClick: onCitationClick || (() => {}),
            markdown: true
          })}
        </div>
      ) : (
        // Default content when no analysis data available
        <div style={{
          fontSize: '28px',
          fontWeight: 400,
          lineHeight: '36px',
          color: '#1f1f1f',
          whiteSpace: 'pre-line',
        }}>
          {currentGuidance?.content}
        </div>
      )}

      {/* Action Cards */}
      <Box sx={{ display: 'flex', gap: 4 }}>
        {/* Immediate Actions */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ 
            fontSize: '16px', 
            fontWeight: 600, 
            color: '#444746',
            mb: 2,
            letterSpacing: '0.5px',
          }}>
            IMMEDIATE ACTIONS
          </Typography>
          {currentGuidance && currentGuidance.immediateActions?.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 2 }}>
              {currentGuidance.immediateActions.slice(0, 2).map((action, index) => (
                <Box key={index} sx={{ flex: 1 }}>
                  <ActionCard action={action} />
                </Box>
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
              No immediate actions available yet
            </Typography>
          )}
        </Box>

        {/* Contraindications */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ 
            fontSize: '16px', 
            fontWeight: 600, 
            color: '#444746',
            mb: 2,
            letterSpacing: '0.5px',
          }}>
            CONTRAINDICATIONS
          </Typography>
          {currentGuidance && currentGuidance.contraindications?.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 2 }}>
              {currentGuidance.contraindications.slice(0, 2).map((action, index) => (
                <Box key={index} sx={{ flex: 1 }}>
                  <ActionCard action={action} isContraindication />
                </Box>
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
              No contraindications available yet
            </Typography>
          )}
        </Box>
      </Box>

      {/* Citations and Techniques Row */}
      <Box sx={{ display: 'flex', gap: 6, mt: 2 }}>
        {/* Citations */}
        <Box sx={{ flex: 1 }}>
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

        {/* Techniques Detected */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ 
            fontSize: '16px', 
            fontWeight: 600, 
            color: '#444746',
            mb: 2,
            letterSpacing: '0.5px',
          }}>
            TECHNIQUES DETECTED
          </Typography>
          {techniques.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {techniques.map((technique, index) => (
                <Chip
                  key={index}
                  label={technique}
                  size="medium"
                  sx={{
                    backgroundColor: '#e8f0fe',
                    border: '1px solid #c4c7c5',
                    borderRadius: '20px',
                    '& .MuiChip-label': { 
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#1f1f1f',
                    },
                  }}
                />
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
              No techniques available yet
            </Typography>
          )}
        </Box>
      </Box>

    </Box>
  );
};

export default PathwayTab;
