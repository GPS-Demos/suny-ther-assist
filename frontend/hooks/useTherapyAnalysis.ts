// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useCallback } from 'react';
import axios from 'axios';
import { AnalysisResponse, SessionContext, PathwayGuidance, SessionSummary, Alert, SessionHistory, SessionMetrics } from '../types/types';

interface UseTherapyAnalysisProps {
  onAnalysis: (analysis: AnalysisResponse) => void;
  onPathwayGuidance?: (guidance: PathwayGuidance) => void;
  onSessionSummary?: (summary: SessionSummary) => void;
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
    sessionContext: SessionContext & { is_realtime?: boolean },
    sessionDurationMinutes: number,
    previousAlert?: Alert | null
  ) => {
    // Extract is_realtime flag if present
    const { is_realtime, ...cleanContext } = sessionContext;
    const analysisType = is_realtime ? 'realtime' : 'comprehensive';
    
    const requestPayload = {
      action: 'analyze_segment',
      transcript_segment: transcriptSegment,
      session_context: cleanContext,
      session_duration_minutes: sessionDurationMinutes,
      is_realtime: is_realtime || false,
      previous_alert: previousAlert || null,
    };
    
    // Safe metadata logging only (avoid logging sensitive PHI / transcripts to console)
    const startTime = performance.now();
    
    try {
      const response = await axios.post(ANALYSIS_API, requestPayload, {
        responseType: 'text',
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` })
        }
      });

      const text = response.data;
      
      if (text) {
        const lines = text.split('\n').filter(Boolean);
        
        for (const line of lines) {
          try {
            const analysis = JSON.parse(line);
            
            // Always call onAnalysis if we have valid data
            if (analysis.alert || analysis.session_metrics || analysis.pathway_indicators) {
              onAnalysis(analysis as AnalysisResponse);
            }
          } catch {
            console.error('[Analysis] Parse error occurred');
          }
        }
      }
    } catch (error: unknown) {
      const responseTime = `${(performance.now() - startTime).toFixed(0)}ms`;
      if (axios.isAxiosError(error)) {
        console.error('[Analysis] ❌ Request failed:', {
          analysisType,
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          responseTime
        });
      } else {
        console.error('[Analysis] ❌ Request failed:', { analysisType, responseTime, error });
      }
    }
  }, [onAnalysis, ANALYSIS_API, authToken]);

  const getPathwayGuidance = useCallback(async (
    currentApproach: string,
    sessionHistory: SessionHistory[],
    presentingIssues: string[]
  ) => {
    const startTime = performance.now();
    
    try {
      const response = await axios.post(ANALYSIS_API, {
        action: 'pathway_guidance',
        current_approach: currentApproach,
        session_history: sessionHistory,
        presenting_issues: presentingIssues,
      }, {
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` })
        }
      });

      if (onPathwayGuidance && response.data) {
        onPathwayGuidance(response.data);
      }
      
      return response.data;
    } catch (error: unknown) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const message = error instanceof Error ? error.message : String(error);
      console.error('[Pathway] ❌ Request failed:', {
        message,
        status,
        responseTime: `${(performance.now() - startTime).toFixed(0)}ms`
      });
      throw error;
    }
  }, [ANALYSIS_API, onPathwayGuidance, authToken]);

  const generateSessionSummary = useCallback(async (
    fullTranscript: Array<{ speaker: string; text: string; timestamp: string }>,
    sessionMetrics: SessionMetrics
  ) => {
    const startTime = performance.now();
    
    try {
      const summaryReqBody = {
          action: 'session_summary',
          full_transcript: fullTranscript,
          session_metrics: sessionMetrics,
        };
      const response = await axios.post(ANALYSIS_API, summaryReqBody, {
        headers: {
          ...(authToken && { Authorization: `Bearer ${authToken}` })
        }
      });

      if (onSessionSummary && response.data) {
        onSessionSummary(response.data);
      }
      
      return response.data;
    } catch (error: unknown) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const message = error instanceof Error ? error.message : String(error);
      console.error('[Summary] ❌ Request failed:', {
        message,
        status,
        responseTime: `${(performance.now() - startTime).toFixed(0)}ms`
      });
      throw error;
    }
  }, [ANALYSIS_API, onSessionSummary, authToken]);

  return {
    analyzeSegment,
    getPathwayGuidance,
    generateSessionSummary,
  };
};
