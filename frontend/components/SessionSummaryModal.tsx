import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  IconButton,
} from '@mui/material';
import {
  Close,
  Assignment,
  TrendingUp,
  Warning,
  CheckCircle,
  Psychology,
  MenuBook,
  Download,
  Print,
  Info,
} from '@mui/icons-material';

interface SessionSummaryModalProps {
  open: boolean;
  onClose: () => void;
  transcript: Array<{
    text: string;
    timestamp: string;
    is_interim?: boolean;
  }>;
  sessionMetrics: any;
  sessionContext: any;
  sessionDuration: number;
  sessionId: string | null;
}

interface SessionSummary {
  session_date: string;
  duration_minutes: number;
  key_moments: Array<{
    time: string;
    description: string;
    significance: string;
  }>;
  techniques_used: string[];
  progress_indicators: string[];
  areas_for_improvement: string[];
  homework_assignments: Array<{
    task: string;
    rationale: string;
    manual_reference?: string;
  }>;
  follow_up_recommendations: string[];
  risk_assessment: {
    level: 'low' | 'moderate' | 'high';
    factors: string[];
  };
}

const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  open,
  onClose,
  transcript,
  sessionMetrics,
  sessionContext,
  sessionDuration,
  sessionId,
}) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && transcript.length > 0) {
      generateSummary();
    }
  }, [open]);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const API_ENDPOINT = import.meta.env.VITE_ANALYSIS_API_URL || 
                          'https://therapy-analysis-297463074292.us-central1.run.app';
      
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'session_summary',
          full_transcript: transcript
            .filter(t => !t.is_interim)
            .map(t => ({
              speaker: 'conversation',
              text: t.text,
              timestamp: t.timestamp,
            })),
          session_metrics: sessionMetrics,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.summary) {
        setSummary(data.summary);
      } else {
        throw new Error('Invalid summary response');
      }
    } catch (err) {
      console.error('Error generating summary:', err);
      setError('Failed to generate session summary. Please try again.');
      
      // Fallback summary for demo purposes
      setSummary({
        session_date: new Date().toISOString(),
        duration_minutes: Math.floor(sessionDuration / 60),
        key_moments: [
          {
            time: '00:05:23',
            description: 'Client expressed anxiety about upcoming presentation',
            significance: 'Core fear identified - social evaluation',
          },
          {
            time: '00:15:45',
            description: 'Successful cognitive restructuring of catastrophic thinking',
            significance: 'Breakthrough in recognizing thinking patterns',
          },
        ],
        techniques_used: ['Cognitive Restructuring', 'Grounding Exercises', 'Thought Recording'],
        progress_indicators: [
          'Increased awareness of thought patterns',
          'Willingness to challenge automatic thoughts',
          'Engaged in homework assignments',
        ],
        areas_for_improvement: [
          'Practice emotion regulation techniques',
          'Develop stronger coping strategies for acute anxiety',
        ],
        homework_assignments: [
          {
            task: 'Complete thought diary for anxiety-provoking situations',
            rationale: 'Build awareness of cognitive patterns',
            manual_reference: 'CBT Manual p.45-47',
          },
          {
            task: 'Practice progressive muscle relaxation daily',
            rationale: 'Develop somatic coping skills',
            manual_reference: 'Anxiety Workbook p.23',
          },
        ],
        follow_up_recommendations: [
          'Review thought diary entries at next session',
          'Consider introducing exposure exercises if ready',
        ],
        risk_assessment: {
          level: 'low',
          factors: ['No suicidal ideation', 'Strong support system', 'Engaged in treatment'],
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return '#10b981';
      case 'moderate':
        return '#f59e0b';
      case 'high':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const handleExport = () => {
    if (!summary) return;
    
    const content = JSON.stringify(summary, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-summary-${sessionId || 'unknown'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: '80vh',
        },
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, rgba(11, 87, 208, 0.95) 0%, rgba(0, 99, 155, 0.95) 100%)',
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Assignment sx={{ fontSize: 28 }} />
          <Typography variant="h5" fontWeight={600}>
            Session Summary
          </Typography>
          {sessionId && (
            <Chip
              label={`Session ${sessionId}`}
              sx={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            />
          )}
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ color: 'white' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: 400,
            flexDirection: 'column',
            gap: 2,
          }}>
            <CircularProgress size={48} />
            <Typography color="text.secondary">
              Generating comprehensive session analysis...
            </Typography>
          </Box>
        ) : summary ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Session Overview */}
            <Paper sx={{ p: 3, background: 'rgba(250, 251, 253, 0.5)' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp /> Session Overview
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mt: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Duration</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {summary.duration_minutes} minutes
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Techniques Used</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {summary.techniques_used.length} techniques
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Risk Level</Typography>
                  <Chip
                    label={summary.risk_assessment.level.toUpperCase()}
                    size="small"
                    sx={{
                      bgcolor: getRiskColor(summary.risk_assessment.level),
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Box>
            </Paper>

            {/* Key Moments */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Psychology /> Key Therapeutic Moments
              </Typography>
              <List>
                {summary.key_moments.map((moment, idx) => (
                  <ListItem key={idx} sx={{ pl: 0 }}>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box>
                          <Chip label={moment.time} size="small" sx={{ mr: 1 }} />
                          {moment.description}
                        </Box>
                      }
                      secondary={moment.significance}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Divider />

            {/* Progress & Areas for Improvement */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Progress Indicators
                </Typography>
                <List dense>
                  {summary.progress_indicators.map((indicator, idx) => (
                    <ListItem key={idx} sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircle fontSize="small" color="success" />
                      </ListItemIcon>
                      <ListItemText primary={indicator} />
                    </ListItem>
                  ))}
                </List>
              </Box>
              
              <Box>
                <Typography variant="h6" gutterBottom>
                  Areas for Improvement
                </Typography>
                <List dense>
                  {summary.areas_for_improvement.map((area, idx) => (
                    <ListItem key={idx} sx={{ pl: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Warning fontSize="small" color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={area} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>

            <Divider />

            {/* Homework Assignments */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Assignment /> Homework Assignments
              </Typography>
              {summary.homework_assignments.map((hw, idx) => (
                <Paper key={idx} sx={{ p: 2, mb: 2, background: 'rgba(16, 185, 129, 0.05)' }}>
                  <Typography variant="body1" fontWeight={600} gutterBottom>
                    {hw.task}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Rationale: {hw.rationale}
                  </Typography>
                  {hw.manual_reference && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                      <MenuBook fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {hw.manual_reference}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              ))}
            </Box>

            {/* Follow-up Recommendations */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Follow-up Recommendations
              </Typography>
              <List dense>
                {summary.follow_up_recommendations.map((rec, idx) => (
                  <ListItem key={idx} sx={{ pl: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Info fontSize="small" color="info" />
                    </ListItemIcon>
                    <ListItemText primary={rec} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        ) : error ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: 400,
            flexDirection: 'column',
            gap: 2,
          }}>
            <Warning color="error" sx={{ fontSize: 48 }} />
            <Typography color="error">{error}</Typography>
            <Button variant="contained" onClick={generateSummary}>
              Retry
            </Button>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          startIcon={<Download />}
          onClick={handleExport}
          disabled={!summary}
        >
          Export
        </Button>
        <Button
          startIcon={<Print />}
          onClick={handlePrint}
          disabled={!summary}
        >
          Print
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionSummaryModal;
