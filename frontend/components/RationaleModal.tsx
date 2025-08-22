import React from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Close, PlayCircle, CheckCircle, ErrorOutline, Warning, Info } from '@mui/icons-material';
import { renderTextWithCitations } from '../utils/textRendering';
import { Citation } from '../types/types';

interface RationaleModalProps {
  open: boolean;
  onClose: () => void;
  rationale: string | undefined;
  immediateActions?: string[];
  contraindications?: string[];
  citations?: Citation[];
  onCitationClick: (citation: Citation) => void;
}

const RationaleModal: React.FC<RationaleModalProps> = ({ open, onClose, rationale, immediateActions, contraindications, citations = [], onCitationClick }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="rationale-modal-title"
      aria-describedby="rationale-modal-description"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          bgcolor: 'rgba(255, 255, 255, 0.9)', // Less opaque background
          backdropFilter: 'blur(5px)', // Blur the background
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <Close />
        </IconButton>
        <Typography id="rationale-modal-title" variant="h6" component="h2" sx={{ color: 'var(--primary)', fontWeight: 600, mb: 2 }}>
          Rationale Details
        </Typography>
        
        <Box>
          {rationale && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <Info sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  RATIONALE
                </Typography>
              </Box>
              <Paper
                sx={{
                  p: 2,
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  boxShadow: 'none',
                }}
              >
                <Typography component="div">
                  {renderTextWithCitations(rationale, {
                    citations,
                    onCitationClick: onCitationClick,
                    markdown: true
                  })}
                </Typography>
              </Paper>
            </Box>
          )}

          {immediateActions && immediateActions.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <PlayCircle sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  IMMEDIATE ACTIONS
                </Typography>
              </Box>
              <List dense sx={{ p: 0 }}>
                {immediateActions.map((action, idx) => (
                  <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Typography component="div">{renderTextWithCitations(action, {
                        citations,
                        onCitationClick: onCitationClick,
                        markdown: true
                      })}</Typography>}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {contraindications && contraindications.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <ErrorOutline sx={{ fontSize: 16, color: 'error.main' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  CONTRAINDICATIONS
                </Typography>
              </Box>
              <List dense sx={{ p: 0 }}>
                {contraindications.map((contraindication, idx) => (
                  <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <Warning sx={{ fontSize: 14, color: 'error.main' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Typography component="div">{renderTextWithCitations(contraindication, {
                        citations,
                        onCitationClick: onCitationClick,
                        markdown: true
                      })}</Typography>}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default RationaleModal;
