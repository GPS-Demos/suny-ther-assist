
import type { CaseworkerAnalysis, SelfAssessment, SupervisorAnalysis, Message } from '../types/types';
import { 
  CASEWORKER_ANALYSIS_PROMPT, 
  CASEWORKER_ANALYSIS_SCHEMA,
  SUPERVISOR_ANALYSIS_PROMPT,
  SUPERVISOR_ANALYSIS_SCHEMA
} from '../utils/constants';

// Temporarily commented out for local development
// if (!import.meta.env.VITE_CLOUD_FUNCTION_URL) {
//   throw new Error("CLOUD_FUNCTION_URL environment variable not set.");
// }

// Cloud Function configuration
const CLOUD_FUNCTION_URL = import.meta.env.VITE_CLOUD_FUNCTION_URL || 'https://us-central1-wz-case-worker-mentor.cloudfunctions.net/analysis-function';
const MENTORSHIP_FUNCTION_URL = import.meta.env.VITE_MENTORSHIP_FUNCTION_URL || 'https://psu-mentor-demo-807576987550.us-central1.run.app';
const SIMULATION_FUNCTION_URL = import.meta.env.VITE_SIMULATION_FUNCTION_URL || 'https://psu-simulation-807576987550.us-central1.run.app';

// Simple chat session simulation using Cloud Function
export function createChatSession(systemInstruction: string, history: Message[] = []) {
  return {
    history: [...history],
    systemInstruction,
    async sendMessageStream({ message }: { message: string }) {
      const response = await callCloudFunction(message, systemInstruction, [...history, { role: 'user', parts: message }]);
      
      // Simulate streaming by yielding the response
      async function* streamGenerator() {
        yield { text: response };
      }
      
      return streamGenerator();
    }
  };
}

async function callCloudFunction(message: string, systemInstruction: string, history: Message[]): Promise<string> {
  const requestBody = {
    action: 'chat',
    message,
    systemInstruction,
    history
  };

  try {
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    return data.text || 'No response generated';
  } catch (error) {
    console.error('Cloud Function API error:', error);
    throw new Error(`Failed to call Cloud Function: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function callCloudFunctionForAnalysis(
  transcript: Message[], 
  assessment: SelfAssessment, 
  systemInstruction: string,
  onStreamUpdate?: (text: string, metadata?: { isThinking?: boolean, thinkingComplete?: boolean, groundingChunks?: any[], rawResponseChunks?: string[] }) => void,
  action: 'analyze' | 'supervisor_analysis' = 'analyze'
): Promise<{ streamingText: string, analysisData: any, rawResponseChunks: string[] }> {
  const requestBody = {
    action,
    transcript,
    assessment,
    systemInstruction
  };

  try {
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    // Handle streaming response
    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullRawStream = '';
    let thinkingChunks: string[] = [];
    let contentChunks: string[] = [];
    let rawResponseChunks: string[] = [];
    let groundingChunks: any[] = [];
    let isThinking = true;
    let thinkingComplete = false;
    let analysisData: any = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        fullRawStream += chunk; // Accumulate raw stream
        buffer += chunk;
        
        // Process complete lines (newline-delimited JSON)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const chunkData = JSON.parse(line);
            
            if (chunkData.candidates && chunkData.candidates.length > 0) {
              const candidate = chunkData.candidates[0];
              
              // Process content parts
              if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                  if (part.thought === true) {
                    // This is a thinking chunk
                    if (part.text) {
                      thinkingChunks.push(part.text);
                      isThinking = true;
                    }
                  } else if (part.text) {
                    // This is a content chunk
                    contentChunks.push(part.text);
                    rawResponseChunks.push(line);
                    if (isThinking) {
                      isThinking = false;
                      thinkingComplete = true;
                    }
                  }
                }
              }
              
              // Process grounding metadata (usually in final chunk)
              if (candidate.grounding_metadata && candidate.grounding_metadata.grounding_chunks) {
                groundingChunks = candidate.grounding_metadata.grounding_chunks;
                // Also add the raw chunk containing grounding metadata for debugging
                rawResponseChunks.push(line);
              }
            }
            
            // Update streaming display
            if (onStreamUpdate) {
              const streamingText = isThinking 
                ? thinkingChunks.join('') 
                : thinkingChunks.join('') + '\n\nTHINKING_COMPLETE\n\n' + contentChunks.join('');
                
              onStreamUpdate(streamingText, { 
                isThinking, 
                thinkingComplete,
                groundingChunks: groundingChunks.length > 0 ? groundingChunks : undefined,
                rawResponseChunks: rawResponseChunks.length > 0 ? rawResponseChunks : undefined
              });
            }
          } catch (e) {
            console.error('Error parsing chunk:', e, 'Line:', line);
          }
        }
      }
      
      // Process any remaining data in buffer
      if (buffer.trim()) {
        try {
          const chunkData = JSON.parse(buffer);
          if (chunkData.candidates && chunkData.candidates.length > 0) {
            const candidate = chunkData.candidates[0];
            if (candidate.content && candidate.content.parts) {
              for (const part of candidate.content.parts) {
                if (part.text && part.thought !== true) {
                  contentChunks.push(part.text);
                }
              }
            }
          }
        } catch (e) {
          console.error('Error parsing final buffer:', e);
        }
      }
      
      // Parse the final JSON content
      const fullContent = contentChunks.join('');
      if (fullContent) {
        try {
          // Remove the closing ``` if present
          const jsonContent = fullContent.replace(/```\s*$/, '').replace(/^```json\s*/, '');
          analysisData = JSON.parse(jsonContent);
          
          // Add grounding chunks as citations if available
          if (groundingChunks.length > 0) {
            analysisData.citations = groundingChunks.map((chunk: any) => ({
              number: chunk._citation_number,
              source: chunk.retrieved_context?.title || 'Unknown source',
              text: chunk.retrieved_context?.text || '',
              pages: chunk.retrieved_context?.page_span 
                ? `Pages ${chunk.retrieved_context.page_span.first_page}-${chunk.retrieved_context.page_span.last_page}`
                : undefined,
              uri: chunk.retrieved_context?.uri
            }));
          }
        } catch (e) {
          console.error('Error parsing analysis JSON:', e);
          console.error('Content:', fullContent);
        }
      }
      
      // Log the full raw stream for debugging
      console.log("========================================\nRAW RESPONSE STREAM:\n========================================\n", fullRawStream);

    } finally {
      reader.releaseLock();
    }

    return {
      streamingText: thinkingChunks.join('') + (contentChunks.length > 0 ? '\n\nTHINKING_COMPLETE\n\n' + contentChunks.join('') : ''),
      analysisData: analysisData || null,
      rawResponseChunks: rawResponseChunks
    };
  } catch (error) {
    console.error('Cloud Function API error:', error);
    throw new Error(`Failed to call Cloud Function: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function analyzeCaseworkerPerformance(
  transcript: Message[], 
  assessment: SelfAssessment,
  onStreamUpdate?: (text: string, metadata?: { isThinking?: boolean, thinkingComplete?: boolean, groundingChunks?: any[], rawResponseChunks?: string[] }) => void
): Promise<{ analysis: CaseworkerAnalysis, rawResponseChunks: string[] }> {
  try {
    const { analysisData, rawResponseChunks } = await callCloudFunctionForAnalysis(
      transcript, 
      assessment, 
      CASEWORKER_ANALYSIS_PROMPT, 
      onStreamUpdate
    );
    
    if (!analysisData) {
      throw new Error('No analysis data received from server');
    }
    
    // The analysisData object from callCloudFunctionForAnalysis now contains the complete
    // analysis, including curriculum citations. We can return it directly.
    // The legacy conversion code below has been removed as it was stripping out
    // necessary data for tooltips.
    return {
      analysis: analysisData as CaseworkerAnalysis,
      rawResponseChunks: rawResponseChunks
    };
  } catch (error) {
    console.error("Error analyzing caseworker performance:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get analysis from AI. Reason: ${error.message}`);
    }
    throw new Error("An unknown error occurred during analysis.");
  }
}

export async function analyzeSupervisorCoaching(
  feedback: string, 
  transcript: Message[],
  onStreamUpdate?: (text: string, metadata?: { isThinking?: boolean, thinkingComplete?: boolean, groundingChunks?: any[], rawResponseChunks?: string[] }) => void
): Promise<SupervisorAnalysis> {
  try {
    const mockAssessment = { supervisorFeedback: feedback };
    const { analysisData } = await callCloudFunctionForAnalysis(
      transcript, 
      mockAssessment, 
      SUPERVISOR_ANALYSIS_PROMPT, 
      onStreamUpdate,
      'supervisor_analysis'
    );
    
    if (!analysisData) {
      throw new Error('No analysis data received from server');
    }
    
    return analysisData as SupervisorAnalysis;
  } catch (error) {
    console.error("Error analyzing supervisor coaching:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get coaching analysis from AI. Reason: ${error.message}`);
    }
    throw new Error("An unknown error occurred during coaching analysis.");
  }
}

// Mentorship chat session using dedicated mentorship function
export function createMentorshipChatSession(systemInstruction: string, history: Message[] = []) {
  return {
    history: [...history],
    systemInstruction,
    async sendMessageStream({ message }: { message: string }) {
      const response = await callMentorshipFunction(message, systemInstruction, [...history, { role: 'user', parts: message }]);
      
      // Simulate streaming by yielding the response
      async function* streamGenerator() {
        yield { text: response };
      }
      
      return streamGenerator();
    }
  };
}

async function callMentorshipFunction(message: string, systemInstruction: string, history: Message[]): Promise<string> {
  const requestBody = {
    message,
    systemInstruction,
    history
  };

  try {
    const response = await fetch(MENTORSHIP_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    return data.text || 'No response generated';
  } catch (error) {
    console.error('Mentorship Function API error:', error);
    throw new Error(`Failed to call Mentorship Function: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Simulation chat session using dedicated simulation function
export function createSimulationChatSession(scenarioId: string, history: Message[] = []) {
  return {
    history: [...history],
    scenarioId,
    async sendMessageStream({ message }: { message: string }) {
      const response = await callSimulationFunction(message, scenarioId, [...history, { role: 'user', parts: message }]);
      
      // Simulate streaming by yielding the response
      async function* streamGenerator() {
        yield { text: response };
      }
      
      return streamGenerator();
    }
  };
}

async function callSimulationFunction(message: string, scenarioId: string, history: Message[]): Promise<string> {
  const requestBody = {
    message,
    scenario_id: scenarioId,
    history
  };

  try {
    const response = await fetch(SIMULATION_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    return data.text || 'No response generated';
  } catch (error) {
    console.error('Simulation Function API error:', error);
    throw new Error(`Failed to call Simulation Function: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
