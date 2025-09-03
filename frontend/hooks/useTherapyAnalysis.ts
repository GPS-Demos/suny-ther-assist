import { useCallback } from 'react';
import axios from 'axios';
import { AnalysisResponse, SessionContext } from '../types/types';

interface UseTherapyAnalysisProps {
  onAnalysis: (analysis: AnalysisResponse) => void;
  onPathwayGuidance?: (guidance: any) => void;
  onSessionSummary?: (summary: any) => void;
  authToken?: string | null;
}

export const useTherapyAnalysis = ({ 
  onAnalysis, 
  onPathwayGuidance,
  onSessionSummary,
  authToken
}: UseTherapyAnalysisProps) => {
  const ANALYSIS_API = import.meta.env.VITE_ANALYSIS_API;

  const analyzeSegment = useCallback(async (
    transcriptSegment: Array<{ speaker: string; text: string; timestamp: string }>,
    sessionContext: SessionContext | { is_realtime?: boolean } & SessionContext,
    sessionDurationMinutes: number
  ) => {
    // Extract is_realtime flag if present
    const { is_realtime, ...cleanContext } = sessionContext as any;
    
    console.log(`[useTherapyAnalysis] Starting segment analysis with ${transcriptSegment.length} entries, realtime: ${is_realtime || false}`);
    const startTime = performance.now();
    
    try {
      const response = await axios.post(`${ANALYSIS_API}/therapy_analysis`, {
        action: 'analyze_segment',
        transcript_segment: transcriptSegment,
        session_context: cleanContext,
        session_duration_minutes: sessionDurationMinutes,
        is_realtime: is_realtime || false,  // Pass as top-level parameter
      }, {
        responseType: 'text',
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` })
        }
      });

      const responseTime = performance.now() - startTime;
      console.log(`[useTherapyAnalysis] Analysis response received in ${responseTime.toFixed(0)}ms`);

      // Process streaming response
      const text = response.data;
      if (text) {
        const lines = text.split('\n').filter(Boolean);
        console.log(`[useTherapyAnalysis] Processing ${lines.length} response lines`);
        
        for (const line of lines) {
          try {
            const analysis = JSON.parse(line);
            
            // Log what we received
            const hasAlerts = analysis.alerts && analysis.alerts.length > 0;
            const hasMetrics = analysis.session_metrics !== undefined;
            const hasPathway = analysis.pathway_indicators !== undefined;
            
            console.log(`[useTherapyAnalysis] Parsed response:`, {
              hasAlerts,
              alertCount: hasAlerts ? analysis.alerts.length : 0,
              hasMetrics,
              hasPathway
            });
            
            // Always call onAnalysis if we have valid data
            if (hasAlerts || hasMetrics || hasPathway) {
              onAnalysis(analysis as AnalysisResponse);
            }
          } catch (e) {
            console.error('[useTherapyAnalysis] Error parsing analysis line:', e, 'Line:', line.substring(0, 100));
          }
        }
      } else {
        console.warn('[useTherapyAnalysis] Empty response from analysis API');
      }
    } catch (error: any) {
      console.error('[useTherapyAnalysis] Error analyzing segment:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
  }, [onAnalysis, ANALYSIS_API]);

  const getPathwayGuidance = useCallback(async (
    currentApproach: string,
    sessionHistory: any[],
    presentingIssues: string[]
  ) => {
    console.log(`[useTherapyAnalysis] Requesting pathway guidance for ${currentApproach}`);
    const startTime = performance.now();
    
    try {
      const response = await axios.post(`${ANALYSIS_API}/therapy_analysis`, {
        action: 'pathway_guidance',
        current_approach: currentApproach,
        session_history: sessionHistory,
        presenting_issues: presentingIssues,
      }, {
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` })
        }
      });

      const responseTime = performance.now() - startTime;
      console.log(`[useTherapyAnalysis] Pathway guidance received in ${responseTime.toFixed(0)}ms`);
      
      if (onPathwayGuidance && response.data) {
        onPathwayGuidance(response.data);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('[useTherapyAnalysis] Error getting pathway guidance:', {
        message: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }, [ANALYSIS_API, onPathwayGuidance]);

  const generateSessionSummary = useCallback(async (
    fullTranscript: Array<{ speaker: string; text: string; timestamp: string }>,
    sessionMetrics: any
  ) => {
    console.log(`[useTherapyAnalysis] Generating session summary for ${fullTranscript.length} transcript entries`);
    
    try {
      const response = await axios.post(`${ANALYSIS_API}/therapy_analysis`, {
        action: 'session_summary',
        full_transcript: fullTranscript,
        session_metrics: sessionMetrics,
      }, {
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` })
        }
      });

      console.log('[useTherapyAnalysis] Session summary generated successfully');
      
      if (onSessionSummary && response.data) {
        onSessionSummary(response.data);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('[useTherapyAnalysis] Error generating session summary:', {
        message: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }, [ANALYSIS_API, onSessionSummary]);

  return {
    analyzeSegment,
    getPathwayGuidance,
    generateSessionSummary,
  };
};
