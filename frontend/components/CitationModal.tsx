import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Close,
  Description,
  FormatQuote,
  MenuBook,
  Article,
} from '@mui/icons-material';
import { getStorageAccessUrl } from '../utils/storageUtils';

interface Citation {
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
}

interface CitationModalProps {
  open: boolean;
  onClose: () => void;
  citation: Citation | null;
}

const CitationModal: React.FC<CitationModalProps> = ({ open, onClose, citation }) => {
  if (!citation) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MenuBook sx={{ 
            fontSize: 28,
            background: 'linear-gradient(135deg, #0b57d0 0%, #00639b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }} />
          <Box>
            <Typography variant="h6" fontWeight={600} color="text.primary">
              Evidence Reference
            </Typography>
            <Chip
              label={`Citation [${citation.citation_number}]`}
              size="small"
              sx={{
                mt: 0.5,
                fontWeight: 700,
                fontSize: '0.75rem',
                background: 'linear-gradient(135deg, #0b57d0 0%, #00639b 100%)',
                color: 'white',
              }}
            />
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {citation.source?.title && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Description sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                SOURCE DOCUMENT
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {citation.source.title}
            </Typography>
            {citation.source.pages && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Pages: {citation.source.pages.first}
                {citation.source.pages.last !== citation.source.pages.first &&
                  `-${citation.source.pages.last}`}
              </Typography>
            )}
          </Box>
        )}

        {citation.source?.excerpt && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FormatQuote sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                EXCERPT
              </Typography>
            </Box>
            <Box
              sx={{
                p: 3,
                background: 'rgba(250, 251, 253, 0.8)',
                borderLeft: '4px solid rgba(11, 87, 208, 0.3)',
                borderRadius: '8px',
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: 'text.primary',
                  fontStyle: 'italic',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                }}
              >
                "{citation.source.excerpt}..."
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
        {citation.source?.uri && (
          <Button
            variant="outlined"
            startIcon={<Article />}
            href={getStorageAccessUrl(citation.source.uri)}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ mr: 'auto' }}
          >
            View Full Source
          </Button>
        )}
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CitationModal;
