import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  ExpandMore,
  LibraryBooks,
  Description,
  FormatQuote,
  OpenInNew,
} from '@mui/icons-material';
import CitationModal from './CitationModal';

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

interface CitationsPanelProps {
  citations: Citation[];
}

const CitationsPanel: React.FC<CitationsPanelProps> = ({ citations }) => {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  const handleCitationClick = (citation: Citation) => {
    setSelectedCitation(citation);
    setModalOpen(true);
  };

  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        mt: 3,
        pt: 2,
        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: expanded ? 2 : 0,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LibraryBooks
            sx={{
              fontSize: 20,
              color: 'var(--on-surface-variant)',
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: 'var(--on-surface-variant)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontSize: '0.75rem',
            }}
          >
            References ({citations.length})
          </Typography>
        </Box>
        <IconButton
          size="small"
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
          }}
        >
          <ExpandMore fontSize="small" />
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {citations.map((citation, index) => (
            <Box
              key={index}
              onClick={() => handleCitationClick(citation)}
              sx={{
                p: 2,
                background: 'rgba(250, 251, 253, 0.5)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: '8px',
                border: '1px solid rgba(196, 199, 205, 0.2)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                '&:hover': {
                  background: 'rgba(250, 251, 253, 0.8)',
                  boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.12)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Chip
                  label={`[${citation.citation_number}]`}
                  size="small"
                  sx={{
                    minWidth: 40,
                    height: 24,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    background: 'linear-gradient(135deg, #0b57d0 0%, #00639b 100%)',
                    color: 'white',
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  {citation.source?.title && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Description
                        sx={{
                          fontSize: 16,
                          color: 'var(--on-surface-variant)',
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: 'var(--on-surface)',
                        }}
                      >
                        {citation.source.title}
                      </Typography>
                    </Box>
                  )}

                  {citation.source?.pages && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'var(--on-surface-variant)',
                        display: 'block',
                        mb: 1,
                      }}
                    >
                      Pages: {citation.source.pages.first}
                      {citation.source.pages.last !== citation.source.pages.first &&
                        `-${citation.source.pages.last}`}
                    </Typography>
                  )}

                  {citation.source?.excerpt && (
                    <Box
                      sx={{
                        mt: 1,
                        p: 1.5,
                        background: 'rgba(255, 255, 255, 0.5)',
                        borderLeft: '3px solid rgba(11, 87, 208, 0.3)',
                        borderRadius: '4px',
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <FormatQuote
                          sx={{
                            fontSize: 16,
                            color: 'var(--on-surface-variant)',
                            opacity: 0.5,
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'var(--on-surface-variant)',
                            fontStyle: 'italic',
                            lineHeight: 1.5,
                          }}
                        >
                          "{citation.source.excerpt}..."
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                    <OpenInNew sx={{ fontSize: 14, color: 'var(--primary)' }} />
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'var(--primary)',
                        fontWeight: 600,
                      }}
                    >
                      Click to view full evidence
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Collapse>

      <CitationModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedCitation(null);
        }}
        citation={selectedCitation}
      />
    </Box>
  );
};

export default CitationsPanel;
