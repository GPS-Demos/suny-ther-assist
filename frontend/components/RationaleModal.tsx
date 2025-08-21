import React from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Paper,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { renderMarkdown } from '../utils/textRendering';

interface RationaleModalProps {
  open: boolean;
  onClose: () => void;
  rationale: string | undefined;
}

const RationaleModal: React.FC<RationaleModalProps> = ({ open, onClose, rationale }) => {
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
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
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
        <Typography id="rationale-modal-title" variant="h6" component="h2" sx={{ color: 'var(--primary)', fontWeight: 600 }}>
          Rationale
        </Typography>
        <Paper
          sx={{
            p: 2,
            mt: 2,
            border: '1px solid rgba(0, 0, 0, 0.12)',
            boxShadow: 'none',
          }}
        >
          <Typography id="rationale-modal-description" component="div" sx={{ mt: 2 }}>
            {rationale ? renderMarkdown(rationale) : 'No rationale available.'}
          </Typography>
        </Paper>
      </Box>
    </Modal>
  );
};

export default RationaleModal;
