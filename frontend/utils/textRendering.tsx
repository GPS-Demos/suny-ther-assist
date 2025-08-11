import React from 'react';
import { Chip } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { Citation } from '../types/types';

interface RenderTextWithCitationsOptions {
  citations: Citation[];
  onCitationClick: (citation: Citation) => void;
  markdown?: boolean;
}

/**
 * Renders text with clickable citation chips
 * @param text - The text containing citation markers like [1], [2], [3, 6, 9]
 * @param options - Options for rendering including citations array and click handler
 * @returns JSX element with rendered text and clickable citations
 */
export const renderTextWithCitations = (
  text: string,
  options: RenderTextWithCitationsOptions
): JSX.Element => {
  const { citations, onCitationClick, markdown = false } = options;
  
  // If markdown is enabled, process markdown first then citations
  if (markdown) {
    // Split text by citation pattern to preserve them
    const segments: { type: 'text' | 'citation'; content: string }[] = [];
    const citationPattern = /\[(\d+(?:\s*,\s*\d+)*)\]/g;
    let lastIndex = 0;
    let match;
    
    while ((match = citationPattern.exec(text)) !== null) {
      // Add text before citation
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }
      
      // Add citation
      segments.push({
        type: 'citation',
        content: match[1]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }
    
    // If no segments were created, treat entire text as one segment
    if (segments.length === 0) {
      segments.push({
        type: 'text',
        content: text
      });
    }
    
    // Render segments
    return (
      <>
        {segments.map((segment, index) => {
          if (segment.type === 'citation') {
            const citationNumbers = segment.content.split(',').map(num => parseInt(num.trim()));
            
            return (
              <Chip
                key={`citation-${index}`}
                label={`[${segment.content}]`}
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  // Find the citation with the matching number
                  const citation = citations.find(c => citationNumbers.includes(c.citation_number));
                  if (citation) {
                    onCitationClick(citation);
                  }
                }}
                sx={{
                  height: 20,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #0b57d0 0%, #00639b 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #00639b 0%, #0b57d0 100%)',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease',
                  mx: 0.5,
                  verticalAlign: 'middle',
                  display: 'inline-flex',
                }}
              />
            );
          } else {
            // Render markdown for text segments
            return (
              <ReactMarkdown
                key={`text-${index}`}
                components={{
                  p: ({ children }) => <span style={{ display: 'inline' }}>{children}</span>,
                  ul: ({ children }) => <ul style={{ display: 'inline-block', marginTop: '0.5em', marginBottom: '0.5em', paddingLeft: '1.5em' }}>{children}</ul>,
                  ol: ({ children }) => <ol style={{ display: 'inline-block', marginTop: '0.5em', marginBottom: '0.5em', paddingLeft: '1.5em' }}>{children}</ol>,
                  li: ({ children }) => <li style={{ marginBottom: '0.25em' }}>{children}</li>,
                  strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                  em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
                  code: ({ children }) => (
                    <code style={{ 
                      background: 'rgba(0, 0, 0, 0.05)', 
                      padding: '0.1em 0.3em', 
                      borderRadius: '3px',
                      fontSize: '0.9em',
                      fontFamily: 'monospace'
                    }}>
                      {children}
                    </code>
                  ),
                }}
              >
                {segment.content}
              </ReactMarkdown>
            );
          }
        })}
      </>
    );
  }
  
  // Non-markdown version
  const citationPattern = /\[(\d+(?:\s*,\s*\d+)*)\]/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;
  let keyCounter = 0;

  while ((match = citationPattern.exec(text)) !== null) {
    // Add text before the citation
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Parse citation numbers
    const citationNumbers = match[1].split(',').map(num => parseInt(num.trim()));
    
    // Create clickable citation chip
    parts.push(
      <Chip
        key={`citation-${keyCounter++}`}
        label={`[${match[1]}]`}
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          // Find the citation with the matching number
          const citation = citations.find(c => citationNumbers.includes(c.citation_number));
          if (citation) {
            onCitationClick(citation);
          }
        }}
        sx={{
          height: 20,
          fontSize: '0.8rem',
          fontWeight: 700,
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #0b57d0 0%, #00639b 100%)',
          color: 'white',
          '&:hover': {
            background: 'linear-gradient(135deg, #00639b 0%, #0b57d0 100%)',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.2s ease',
          mx: 0.5,
          verticalAlign: 'middle',
        }}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last citation
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no citations found, return the original text
  if (parts.length === 0) {
    return <>{text}</>;
  }

  return <>{parts}</>;
};

/**
 * Simple markdown renderer without citation support
 * @param text - The markdown text to render
 * @returns JSX element with rendered markdown
 */
export const renderMarkdown = (text: string): JSX.Element => {
  return (
    <ReactMarkdown
      components={{
        // Customize components as needed
        p: ({ children }) => <span style={{ display: 'block', marginBottom: '0.5em' }}>{children}</span>,
        ul: ({ children }) => <ul style={{ marginTop: '0.5em', marginBottom: '0.5em', paddingLeft: '1.5em' }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ marginTop: '0.5em', marginBottom: '0.5em', paddingLeft: '1.5em' }}>{children}</ol>,
        li: ({ children }) => <li style={{ marginBottom: '0.25em' }}>{children}</li>,
        strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
        em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
        code: ({ children }) => (
          <code style={{ 
            background: 'rgba(0, 0, 0, 0.05)', 
            padding: '0.1em 0.3em', 
            borderRadius: '3px',
            fontSize: '0.9em',
            fontFamily: 'monospace'
          }}>
            {children}
          </code>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
};
