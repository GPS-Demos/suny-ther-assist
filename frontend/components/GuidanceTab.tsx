import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
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
import { Alert as IAlert } from '../types/types';

interface GuidanceTabProps {
  currentGuidance: {
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
  };
  alerts?: IAlert[];
  transcript?: Array<{
    text: string;
    timestamp: string;
    is_interim?: boolean;
  }>;
  pathwayGuidance?: {
    rationale?: string;
    immediate_actions?: string[];
    contraindications?: string[];
  };
  onActionClick: (action: any, isContraindication: boolean) => void;
}

const QuoteCard = ({ text }: { text: string }) => (
  <Paper
    sx={{
      p: 3,
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #c4c7c5',
      borderRadius: '16px',
      flex: 1,
    }}
  >
    <Typography variant="body1" sx={{
      fontWeight: 400,
      fontSize: '18px',
      lineHeight: '26px',
      color: '#1f1f1f',
      fontStyle: 'italic',
    }}>
      {text}
    </Typography>
  </Paper>
);

const GuidanceTab: React.FC<GuidanceTabProps> = ({ 
  currentGuidance, 
  alerts = [], 
  transcript = [], 
  pathwayGuidance,
  onActionClick 
}) => {
  const getActionIcon = (iconType: string) => {
    switch (iconType) {
      case 'safety': return <HealthAndSafety sx={{ fontSize: 24, color: '#128937' }} />;
      case 'grounding': return <NaturePeople sx={{ fontSize: 24, color: '#128937' }} />;
      case 'cognitive': return <Category sx={{ fontSize: 24, color: '#b3261e' }} />;
      case 'exposure': return <Exposure sx={{ fontSize: 24, color: '#b3261e' }} />;
      default: return <HealthAndSafety sx={{ fontSize: 24, color: '#128937' }} />;
    }
  };

  // Get alert icon based on category and timing (matching AlertDisplay.tsx logic)
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
    const iconSize = 36;

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

  // Extract relevant quotes from recent alerts
  const getRelevantQuotes = () => {
    const quotes: string[] = [];
    
    // Get evidence from any alert that has evidence
    const alertsWithEvidence = alerts.filter(alert => 
      alert.evidence && 
      Array.isArray(alert.evidence) && 
      alert.evidence.length > 0
    );
    
    if (alertsWithEvidence.length > 0) {
      const recentAlert = alertsWithEvidence[0];
      // Add all evidence from the most recent alert
      recentAlert.evidence?.forEach(evidence => {
        if (typeof evidence === 'string' && evidence.trim().length > 0) {
          quotes.push(`"${evidence.trim()}"`);
        }
      });
    }
    
    // Default if no evidence available
    if (quotes.length === 0) {
      quotes.push("Direct quotes will appear here.");
    }
    
    return quotes;
  };

  // Get dynamic evidence from alerts
  const getEvidenceContent = () => {
    const recentAlert = alerts.length > 0 ? alerts[0] : null;
    
    if (recentAlert && recentAlert.category === 'safety') {
      return recentAlert.message || "Safety concerns detected in the conversation requiring immediate clinical attention.";
    }
    
    if (recentAlert) {
      return recentAlert.message || "Clinical guidance available based on recent conversation analysis.";
    }
    
    // Default evidence
    return "Evidence will appear here.";
  };

  // Get main guidance content - prioritize real-time alerts
  const getMainGuidanceContent = () => {
    // Use the most recent real-time alert first
    if (alerts.length > 0) {
      const recentAlert = alerts[0];
      return {
        hasAlert: true,
        alert: recentAlert,
        content: recentAlert.recommendation || recentAlert.message || "Alert detected",
      };
    }
    
    // Use currentGuidance content or default
    return {
      hasAlert: false,
      alert: null,
      content: currentGuidance.content || "Start a session to receive real-time therapeutic guidance.",
    };
  };

  const ActionCard = ({ action, isContraindication = false }: { 
    action: any; 
    isContraindication?: boolean; 
  }) => (
    <Paper
      onClick={() => onActionClick(action, isContraindication)}
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
        <Typography 
          variant="body1" 
          sx={{ 
            fontWeight: 600, 
            fontSize: '16px', 
            lineHeight: '24px',
            color: '#1f1f1f',
          }}
        >
          {action.title}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: '14px', 
            lineHeight: '20px',
            color: '#444746',
          }}
        >
          {action.description}
        </Typography>
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
      {/* Main guidance content - large text */}
      {(() => {
        const mainContent = getMainGuidanceContent();
        
        if (mainContent.hasAlert && mainContent.alert) {
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Alert title with icon */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getAlertIcon(mainContent.alert.category, mainContent.alert.timing || 'info')}
                <Typography
                  variant="h4"
                  sx={{
                    fontSize: '32px',
                    fontWeight: 600,
                    lineHeight: '40px',
                    color: '#1f1f1f',
                  }}
                >
                  {mainContent.alert.title}
                </Typography>
              </Box>
              
              {/* Alert content */}
              <div style={{
                fontSize: '28px',
                fontWeight: 400,
                lineHeight: '36px',
                color: '#1f1f1f',
                whiteSpace: 'pre-line',
              }}>
                {mainContent.content}
              </div>
            </Box>
          );
        }
        
        // Default content without alert
        return (
          <div style={{
            fontSize: '28px',
            fontWeight: 400,
            lineHeight: '36px',
            color: '#1f1f1f',
            whiteSpace: 'pre-line',
          }}>
            {mainContent.content}
          </div>
        );
      })()}

      {/* Evidence and Direct Quotes sections */}
      <Box sx={{ display: 'flex', gap: 4 }}>
        {/* Evidence Section */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ 
            fontSize: '16px', 
            fontWeight: 600, 
            color: '#444746',
            mb: 2,
            letterSpacing: '0.5px',
          }}>
            EVIDENCE
          </Typography>
          <Paper sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #c4c7c5',
            borderRadius: '16px',
            backgroundColor: '#fff',
          }}>
            <Typography variant="body1" sx={{
              fontWeight: 400,
              fontSize: '18px',
              lineHeight: '26px',
              color: '#1f1f1f',
            }}>
              {getEvidenceContent()}
            </Typography>
          </Paper>
        </Box>

        {/* Direct Quotes Section */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ 
            fontSize: '16px', 
            fontWeight: 600, 
            color: '#444746',
            mb: 2,
            letterSpacing: '0.5px',
          }}>
            DIRECT QUOTES
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2,
          }}>
            {getRelevantQuotes().map((quote, index) => (
              <QuoteCard 
                key={index}
                text={quote} 
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default GuidanceTab;
