import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { HealthAndSafety, NaturePeople, Category, Exposure } from '@mui/icons-material';
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

const QuoteCard = ({ time, text }: { time: string, text: string }) => (
  <Paper
    sx={{
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      border: '1px solid #c4c7c5',
      borderRadius: '16px',
      flex: 1,
      minHeight: '140px',
    }}
  >
    <Typography variant="body2" sx={{ color: '#444746', fontSize: '14px', lineHeight: '20px' }}>
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

  // Extract relevant quotes from recent alerts or transcript
  const getRelevantQuotes = () => {
    const quotes: Array<{ time: string; text: string }> = [];
    
    // First, try to get quotes from recent safety alerts
    const safetyAlerts = alerts.filter(alert => 
      alert.category === 'safety' && 
      alert.evidence && 
      Array.isArray(alert.evidence)
    );
    
    safetyAlerts.slice(0, 2).forEach(alert => {
      if (alert.evidence && alert.evidence.length > 0) {
        const evidence = alert.evidence[0]; // This is a string
        if (evidence.includes('"')) {
          // Extract quoted text
          const quoteMatch = evidence.match(/"([^"]+)"/);
          if (quoteMatch) {
            quotes.push({
              time: alert.timing || 'Recent',
              text: `"${quoteMatch[1]}"`
            });
          }
        } else if (evidence.length > 50) {
          // Use the evidence text directly if it's substantial
          quotes.push({
            time: alert.timing || 'Recent',
            text: `"${evidence.length > 100 ? evidence.substring(0, 100) + '...' : evidence}"`
          });
        }
      }
    });
    
    // If we don't have enough quotes from alerts, extract from recent transcript
    if (quotes.length < 2) {
      const recentTranscript = transcript
        .filter(entry => !entry.is_interim && entry.text.length > 20)
        .slice(-10); // Last 10 entries
      
      for (const entry of recentTranscript) {
        if (quotes.length >= 2) break;
        
        // Look for concerning keywords
        const concerningKeywords = ['anxiety', 'stress', 'worried', 'scared', 'overwhelmed', 'difficult', 'hard'];
        if (concerningKeywords.some(keyword => entry.text.toLowerCase().includes(keyword))) {
          const timestamp = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent';
          quotes.push({
            time: timestamp,
            text: `"${entry.text.length > 100 ? entry.text.substring(0, 100) + '...' : entry.text}"`
          });
        }
      }
    }
    
    // Default quotes if no dynamic content available
    if (quotes.length === 0) {
      return [
        {
          time: "02:47",
          text: `"I haven't done anything, but the thoughts are getting stronger. Yesterday I was looking at my knife set in the kitchen and... I had to leave the room."`
        },
        {
          time: "03:01", 
          text: `"Sometimes when everything gets too overwhelming, I have thoughts about... hurting myself. Just to make the anxiety stop."`
        }
      ];
    }
    
    return quotes.slice(0, 2); // Return max 2 quotes
  };

  // Get dynamic evidence from alerts
  const getEvidenceContent = () => {
    const recentAlert = alerts.length > 0 ? alerts[0] : null;
    
    if (recentAlert && recentAlert.category === 'safety') {
      return {
        primary: recentAlert.message || "Safety concerns detected in the conversation requiring immediate clinical attention.",
        secondary: recentAlert.recommendation || "This requires immediate assessment and appropriate intervention protocols."
      };
    }
    
    if (recentAlert) {
      return {
        primary: recentAlert.message || "Clinical guidance available based on recent conversation analysis.",
        secondary: recentAlert.recommendation || "Consider the suggested interventions and monitor client response."
      };
    }
    
    // Default evidence
    return {
      primary: "The patient has disclosed suicidal ideation ('thoughts about hurting myself... to make the anxiety stop') and a recent specific incident ('looking at my knife set... had to leave the room').",
      secondary: "This requires immediate, direct assessment of intent, plan, and means, followed by collaborative safety planning."
    };
  };

  // Get main guidance content - prioritize real-time alerts
  const getMainGuidanceContent = () => {
    // Use the most recent real-time alert first
    if (alerts.length > 0) {
      const recentAlert = alerts[0];
      if (recentAlert.title && recentAlert.recommendation) {
        return `${recentAlert.title}\n\n${recentAlert.recommendation}`;
      }
      if (recentAlert.recommendation) {
        return recentAlert.recommendation;
      }
    }
    
    // Use currentGuidance content or default
    return currentGuidance.content || "Start a session to receive real-time therapeutic guidance.";
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
      <div style={{
        fontSize: '28px',
        fontWeight: 400,
        lineHeight: '36px',
        color: '#1f1f1f',
        whiteSpace: 'pre-line',
      }}>
        {getMainGuidanceContent()}
      </div>

      {/* Evidence and Direct Quotes sections */}
      <Box sx={{ display: 'flex', gap: 4 }}>
        {/* Evidence Section */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ 
            fontSize: '14px', 
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
            gap: 2,
            border: '1px solid #c4c7c5',
            borderRadius: '16px',
            backgroundColor: '#fff',
            minHeight: '200px',
          }}>
            <Typography variant="body1" sx={{
              fontWeight: 400,
              fontSize: '16px',
              lineHeight: '24px',
              color: '#1f1f1f',
              mb: 1,
            }}>
              {getEvidenceContent().primary}
            </Typography>
          </Paper>
        </Box>

        {/* Direct Quotes Section */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ 
            fontSize: '14px', 
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
                time={quote.time} 
                text={quote.text} 
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default GuidanceTab;
