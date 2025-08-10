import functions_framework
from flask import jsonify, Response
from google import genai
from google.genai import types
import os
import json
import logging
import re
from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta

# --- Initialize Logging ---
logging.basicConfig(level=logging.INFO)

# --- Initialize Google GenAI ---
try:
    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "suny-ther-assist")
    if not project_id:
        logging.warning("GOOGLE_CLOUD_PROJECT environment variable not set.")
    
    # Initialize the client
    client = genai.Client(
        vertexai=True,
        project=project_id,
        location="global",  # Using global for Discovery Engine
    )
    logging.info(f"Google GenAI initialized for project '{project_id}'")
except Exception as e:
    logging.error(f"CRITICAL: Error initializing Google GenAI: {e}", exc_info=True)

MODEL_NAME = "gemini-2.5-flash"

# Configure RAG tools with both EBT manuals and transcript patterns
# EBT Manuals RAG Tool (existing)
MANUAL_RAG_TOOL = types.Tool(
    retrieval=types.Retrieval(
        vertex_ai_search=types.VertexAISearch(
            datastore="projects/suny-ther-assist/locations/global/collections/default_collection/dataStores/ebt-corpus"
        )
    )
)

# Transcript Patterns RAG Tool (new)
TRANSCRIPT_RAG_TOOL = types.Tool(
    retrieval=types.Retrieval(
        vertex_ai_search=types.VertexAISearch(
            datastore="projects/suny-ther-assist/locations/global/collections/default_collection/dataStores/transcript-patterns"
        )
    )
)

# Therapy phase definitions
THERAPY_PHASES = {
    "beginning": {"duration_minutes": 10, "focus": "rapport building, agenda setting"},
    "middle": {"duration_minutes": 30, "focus": "core therapeutic work"},
    "end": {"duration_minutes": 10, "focus": "summary, homework, closure"}
}

@functions_framework.http
def therapy_analysis(request):
    """
    HTTP Cloud Function for real-time therapy session analysis.
    """
    # --- CORS Handling ---
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type'
    }

    if request.method != 'POST':
        logging.warning(f"Received non-POST request: {request.method}")
        return (jsonify({'error': 'Method not allowed. Use POST.'}), 405, headers)

    try:
        request_json = request.get_json(silent=True)

        if not request_json:
            logging.warning("Request JSON missing.")
            return (jsonify({'error': 'Missing JSON body'}), 400, headers)

        action = request_json.get('action')
        
        if action == 'analyze_segment':
            return handle_segment_analysis(request_json, headers)
        elif action == 'pathway_guidance':
            return handle_pathway_guidance(request_json, headers)
        elif action == 'session_summary':
            return handle_session_summary(request_json, headers)
        else:
            return (jsonify({'error': 'Invalid action. Use "analyze_segment", "pathway_guidance", or "session_summary"'}), 400, headers)

    except Exception as e:
        logging.exception(f"An unexpected error occurred: {str(e)}")
        return (jsonify({'error': 'An internal server error occurred.'}), 500, headers)

def handle_segment_analysis(request_json, headers):
    """Handle real-time analysis of therapy session segments with streaming"""
    try:
        transcript_segment = request_json.get('transcript_segment', [])
        session_context = request_json.get('session_context', {})
        session_duration = request_json.get('session_duration_minutes', 0)
        is_realtime = request_json.get('is_realtime', False)  # Flag for fast real-time analysis
        
        logging.info(f"Segment analysis request - duration: {session_duration} minutes, segments: {len(transcript_segment)}, realtime: {is_realtime}")
        
        if not transcript_segment:
            return (jsonify({'error': 'Missing transcript_segment'}), 400, headers)

        # Determine therapy phase
        phase = determine_therapy_phase(session_duration)
        
        # Format transcript
        transcript_text = format_transcript_segment(transcript_segment)
        
        # Log timing for diagnostics
        analysis_start = datetime.now()
        logging.info(f"[TIMING] Analysis started at: {analysis_start.isoformat()}")
        
        # Choose analysis mode based on is_realtime flag
        if is_realtime:
            # FAST PATH: Real-time guidance - both safety and helpful suggestions
            analysis_prompt = f"""Analyze this therapy segment for real-time guidance.

TRANSCRIPT (last 5 minutes):
{transcript_text}

Provide guidance based on timing priority:
1. NOW (immediate intervention needed): dissociation, panic, suicidal ideation, self-harm, severe distress
2. PAUSE (wait for natural pause): therapeutic opportunities, technique suggestions, process observations  
3. INFO (informational only): positive moments, progress indicators, engagement observations

Return the MOST RELEVANT guidance (max 1-2 alerts). Format:
{{
    "alerts": [{{
        "timing": "now|pause|info",
        "category": "safety|technique|pathway_change",
        "title": "Brief descriptive title",
        "message": "Specific action or observation (1-3 sentences max)",
        "evidence": ["relevant quote if applicable"],
        "recommendation": "Action to take if applicable"
    }}],
    "session_metrics": {{
        "engagement_level": 0.0-1.0,
        "therapeutic_alliance": "weak|moderate|strong",
        "emotional_state": "calm|anxious|distressed|dissociated|engaged"
    }}
}}

Prioritize actionable guidance. Even routine moments can have helpful suggestions."""
        else:
            # COMPREHENSIVE PATH: Full analysis with RAG
            analysis_prompt = f"""<thinking>
Analyze this therapy session segment step by step:
1. Check for any safety concerns (dissociation, panic, suicidal ideation)
2. Evaluate therapeutic process metrics (engagement, alliance, techniques)
3. Assess if current approach is effective or needs adjustment
4. Search for similar patterns in clinical transcripts (Beck sessions, PTSD sessions)
5. Reference EBT manuals for evidence-based protocols
</thinking>

You are an expert clinical supervisor providing real-time guidance during a therapy session. Analyze this segment comprehensively using BOTH:
1. EBT manuals for evidence-based protocols and techniques
2. Clinical transcripts for real-world examples of similar therapeutic moments

CURRENT SESSION CONTEXT:
- Phase: {phase} ({THERAPY_PHASES[phase]['focus']})
- Duration: {session_duration} minutes
- Session Type: {session_context.get('session_type', 'General Therapy')}
- Primary Concern: {session_context.get('primary_concern', 'Not specified')}
- Current Therapeutic Approach: {session_context.get('current_approach', 'Not specified')}

TRANSCRIPT SEGMENT:
{transcript_text}

IMPORTANT: 
- Look for similar patterns in the transcript database (e.g., "client resistance", "overwhelm", "not ready")
- Reference EBT manual protocols with citations [1], [2], etc.
- If you find a similar moment in Beck or PTSD sessions, mention how it was handled

Provide analysis in this JSON format:
{{
    "alerts": [
        {{
            "timing": "now|pause|info",
            "category": "safety|technique|pathway_change",
            "title": "Brief alert title",
            "message": "Detailed guidance message",
            "evidence": ["Direct quote from transcript"],
            "recommendation": "Specific action to take"
        }}
    ],
    "session_metrics": {{
        "engagement_level": 0.0-1.0,
        "therapeutic_alliance": "weak|moderate|strong",
        "techniques_detected": ["technique1", "technique2"],
        "emotional_state": "calm|anxious|distressed|dissociated",
        "phase_appropriate": true|false
    }},
    "pathway_indicators": {{
        "current_approach_effectiveness": "effective|struggling|ineffective",
        "alternative_pathways": ["pathway1", "pathway2"],
        "change_urgency": "none|monitor|consider|recommended"
    }}
}}

Focus on clinically actionable insights. Only surface critical information that requires immediate attention."""
        
        # Build content for analysis
        contents = [types.Content(
            role="user",
            parts=[types.Part(text=analysis_prompt)]
        )]
        
        logging.info(f"Analysis prompt prepared - length: {len(analysis_prompt)} characters")
        
        # Configure generation based on analysis mode
        if is_realtime:
            # FAST configuration for real-time guidance
            config = types.GenerateContentConfig(
                temperature=0.0,  # Deterministic for speed
                max_output_tokens=300,  # Minimal output
                safety_settings=[
                    types.SafetySetting(
                        category="HARM_CATEGORY_HARASSMENT",
                        threshold="OFF"
                    ),
                    types.SafetySetting(
                        category="HARM_CATEGORY_HATE_SPEECH",
                        threshold="OFF"
                    ),
                    types.SafetySetting(
                        category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold="OFF"
                    ),
                    types.SafetySetting(
                        category="HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold="OFF"
                    )
                ],
                tools=[],  # No RAG for speed
                thinking_config=types.ThinkingConfig(
                    thinking_budget=0,  # Zero thinking for fastest response
                    include_thoughts=False
                ),
            )
        else:
            # COMPREHENSIVE configuration for full analysis
            thinking_budget = 8192  # Moderate complexity for balanced analysis
            
            # Determine if we need more complex reasoning
            if "suicide" in transcript_text.lower() or "self-harm" in transcript_text.lower():
                thinking_budget = 24576  # Maximum for critical situations
            elif session_duration < 5:
                thinking_budget = 4096  # Fast for early session
            
            config = types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=4096,
                safety_settings=[
                    types.SafetySetting(
                        category="HARM_CATEGORY_HARASSMENT",
                        threshold="OFF"
                    ),
                    types.SafetySetting(
                        category="HARM_CATEGORY_HATE_SPEECH",
                        threshold="OFF"
                    ),
                    types.SafetySetting(
                        category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold="OFF"
                    ),
                    types.SafetySetting(
                        category="HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold="OFF"
                    )
                ],
                tools=[MANUAL_RAG_TOOL, TRANSCRIPT_RAG_TOOL],
                thinking_config=types.ThinkingConfig(
                    thinking_budget=thinking_budget,
                    include_thoughts=False  # Don't include thoughts in response
                ),
            )
        
        # Generate analysis with streaming
        thinking_budget_log = 0 if is_realtime else config.thinking_config.thinking_budget if hasattr(config, 'thinking_config') else 0
        logging.info(f"[TIMING] Calling Gemini model '{MODEL_NAME}' - realtime: {is_realtime}, thinking_budget: {thinking_budget_log}")
        
        def generate():
            """Generator function for streaming response"""
            chunk_index = 0
            accumulated_text = ""
            grounding_chunks = []
            
            try:
                # Stream the response from the model
                for chunk in client.models.generate_content_stream(
                    model=MODEL_NAME,
                    contents=contents,
                    config=config
                ):
                    chunk_index += 1
                    
                    # Extract text from chunk
                    if chunk.candidates and chunk.candidates[0].content and chunk.candidates[0].content.parts:
                        for part in chunk.candidates[0].content.parts:
                            if hasattr(part, 'text') and part.text:
                                accumulated_text += part.text
                    
                    # Check for grounding metadata (usually only in final chunk)
                    if chunk.candidates and hasattr(chunk.candidates[0], 'grounding_metadata'):
                        metadata = chunk.candidates[0].grounding_metadata
                        if hasattr(metadata, 'grounding_chunks') and metadata.grounding_chunks:
                            logging.info(f"Found {len(metadata.grounding_chunks)} grounding chunks in chunk {chunk_index}")
                            
                            for idx, g_chunk in enumerate(metadata.grounding_chunks):
                                g_data = {
                                    "citation_number": idx + 1,  # Maps to [1], [2], etc in text
                                }
                                
                                if g_chunk.retrieved_context:
                                    ctx = g_chunk.retrieved_context
                                    g_data["source"] = {
                                        "title": ctx.title if hasattr(ctx, 'title') and ctx.title else "EBT Manual",
                                        "uri": ctx.uri if hasattr(ctx, 'uri') and ctx.uri else None,
                                        "excerpt": ctx.text[:200] if hasattr(ctx, 'text') and ctx.text else None
                                    }
                                    
                                    # Include page information if available
                                    if hasattr(ctx, 'rag_chunk') and ctx.rag_chunk:
                                        if hasattr(ctx.rag_chunk, 'page_span') and ctx.rag_chunk.page_span:
                                            g_data["source"]["pages"] = {
                                                "first": ctx.rag_chunk.page_span.first_page,
                                                "last": ctx.rag_chunk.page_span.last_page
                                            }
                                
                                grounding_chunks.append(g_data)
                
                logging.info(f"Streaming complete - {chunk_index} chunks, {len(accumulated_text)} characters")
                
                # Parse the accumulated JSON response
                try:
                    # Extract JSON from the accumulated text
                    json_match = re.search(r'\{.*\}', accumulated_text, re.DOTALL)
                    if json_match:
                        parsed = json.loads(json_match.group())
                        
                        # Add metadata
                        parsed['timestamp'] = datetime.now().isoformat()
                        parsed['session_phase'] = phase
                        
                        # Add grounding citations if available
                        if grounding_chunks:
                            parsed['citations'] = grounding_chunks
                            logging.info(f"Added {len(grounding_chunks)} citations to response")
                        
                        yield json.dumps(parsed) + "\n"
                    else:
                        logging.error(f"No JSON found in response: {accumulated_text[:500]}...")
                        yield json.dumps({
                            'error': 'Failed to parse analysis response',
                            'alerts': [],
                            'session_metrics': {
                                'engagement_level': 0.8,
                                'therapeutic_alliance': 'moderate',
                                'techniques_detected': [],
                                'emotional_state': 'unknown',
                                'phase_appropriate': True
                            },
                            'pathway_indicators': {
                                'current_approach_effectiveness': 'effective',
                                'alternative_pathways': [],
                                'change_urgency': 'none'
                            }
                        }) + "\n"
                        
                except json.JSONDecodeError as e:
                    logging.error(f"JSON decode error: {e}, Response: {accumulated_text[:500]}...")
                    yield json.dumps({
                        'error': f'JSON parsing failed: {str(e)}',
                        'alerts': [],
                        'session_metrics': {},
                        'pathway_indicators': {}
                    }) + "\n"
                    
            except Exception as e:
                logging.exception(f"Error during streaming: {str(e)}")
                yield json.dumps({'error': f'Analysis failed: {str(e)}'}) + "\n"
        
        return Response(generate(), mimetype='text/plain', headers=headers)
        
    except Exception as e:
        logging.exception(f"Error in handle_segment_analysis: {str(e)}")
        return (jsonify({'error': f'Segment analysis failed: {str(e)}'}), 500, headers)

def handle_pathway_guidance(request_json, headers):
    """Provide specific pathway guidance based on current session state"""
    try:
        current_approach = request_json.get('current_approach', '')
        session_history = request_json.get('session_history', [])
        presenting_issues = request_json.get('presenting_issues', [])
        
        logging.info(f"Pathway guidance request for approach: {current_approach}")
        
        # Format session history
        history_summary = summarize_session_history(session_history)
        
        # Create pathway guidance prompt
        guidance_prompt = f"""You are a clinical supervisor providing pathway guidance for a therapy session.

CURRENT SITUATION:
- Current Approach: {current_approach}
- Presenting Issues: {', '.join(presenting_issues)}
- Recent Session History: {history_summary}

Based on evidence-based treatment protocols, provide specific guidance on:
1. Whether to continue with current approach
2. Alternative pathways if change is needed
3. Specific techniques to implement
4. Contraindications to watch for

IMPORTANT: When referencing EBT manuals or research, use inline citations in the format [1], [2], etc. 
For example: "Consider graded exposure therapy [1] as outlined in the PE manual [2]."

Provide response in JSON format:
{{
    "continue_current": true|false,
    "rationale": "Explanation with citations [1], [2] embedded in text",
    "alternative_pathways": [
        {{
            "approach": "Approach name",
            "reason": "Why this alternative with citations [3]",
            "techniques": ["technique1", "technique2"]
        }}
    ],
    "immediate_actions": ["action1 with citation [4]", "action2"],
    "contraindications": ["contraindication1 [5]", "contraindication2"]
}}"""
        
        contents = [types.Content(
            role="user",
            parts=[types.Part(text=guidance_prompt)]
        )]
        
        config = types.GenerateContentConfig(
            temperature=0.2,
            max_output_tokens=2048,
            tools=[MANUAL_RAG_TOOL],
            thinking_config=types.ThinkingConfig(
                thinking_budget=24576,  # Complex clinical reasoning
                include_thoughts=False
            ),
            safety_settings=[
                types.SafetySetting(
                    category="HARM_CATEGORY_HARASSMENT",
                    threshold="OFF"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_HATE_SPEECH",
                    threshold="OFF"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold="OFF"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold="OFF"
                )
            ]
        )
        
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents,
            config=config
        )
        
        response_text = ""
        if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
            response_text = response.candidates[0].content.parts[0].text
        
        # Parse JSON response
        try:
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                parsed_response = json.loads(json_match.group())
                
                # Add grounding metadata if available (same format as segment analysis)
                if response.candidates[0].grounding_metadata:
                    metadata = response.candidates[0].grounding_metadata
                    if hasattr(metadata, 'grounding_chunks') and metadata.grounding_chunks:
                        citations = []
                        for idx, g_chunk in enumerate(metadata.grounding_chunks):
                            citation_data = {
                                "citation_number": idx + 1,  # Maps to [1], [2], etc in text
                            }
                            
                            if g_chunk.retrieved_context:
                                ctx = g_chunk.retrieved_context
                                citation_data["source"] = {
                                    "title": ctx.title if hasattr(ctx, 'title') and ctx.title else "EBT Manual",
                                    "uri": ctx.uri if hasattr(ctx, 'uri') and ctx.uri else None,
                                    "excerpt": ctx.text[:200] if hasattr(ctx, 'text') and ctx.text else None
                                }
                                
                                # Include page information if available
                                if hasattr(ctx, 'rag_chunk') and ctx.rag_chunk:
                                    if hasattr(ctx.rag_chunk, 'page_span') and ctx.rag_chunk.page_span:
                                        citation_data["source"]["pages"] = {
                                            "first": ctx.rag_chunk.page_span.first_page,
                                            "last": ctx.rag_chunk.page_span.last_page
                                        }
                            
                            citations.append(citation_data)
                        
                        parsed_response['citations'] = citations
                        logging.info(f"Added {len(citations)} citations to pathway guidance response")
                
                return (jsonify(parsed_response), 200, headers)
            else:
                return (jsonify({'error': 'Invalid response format'}), 500, headers)
        except json.JSONDecodeError as e:
            logging.error(f"JSON decode error: {e}")
            return (jsonify({'error': 'Failed to parse guidance'}), 500, headers)
        
    except Exception as e:
        logging.exception(f"Error in handle_pathway_guidance: {str(e)}")
        return (jsonify({'error': f'Pathway guidance failed: {str(e)}'}), 500, headers)

def handle_session_summary(request_json, headers):
    """Generate session summary with key therapeutic moments"""
    try:
        full_transcript = request_json.get('full_transcript', [])
        session_metrics = request_json.get('session_metrics', {})
        
        logging.info(f"Session summary request - transcript length: {len(full_transcript)}")
        
        transcript_text = format_transcript_segment(full_transcript)
        
        summary_prompt = f"""Generate a comprehensive session summary for the therapist's records.

SESSION TRANSCRIPT:
{transcript_text}

SESSION METRICS:
{json.dumps(session_metrics, indent=2)}

Create a summary including:
1. Key therapeutic moments with timestamps
2. Techniques used effectively
3. Areas for improvement
4. Patient progress indicators
5. Recommended follow-up actions
6. Homework assignments based on EBT protocols

Reference specific EBT manual sections for homework and follow-up recommendations.

Format as structured JSON:
{{
    "session_date": "ISO date",
    "duration_minutes": number,
    "key_moments": [
        {{
            "time": "timestamp",
            "description": "what happened",
            "significance": "why it matters"
        }}
    ],
    "techniques_used": ["technique1", "technique2"],
    "progress_indicators": ["indicator1", "indicator2"],
    "areas_for_improvement": ["area1", "area2"],
    "homework_assignments": [
        {{
            "task": "description",
            "rationale": "why",
            "manual_reference": "CBT Manual p.X"
        }}
    ],
    "follow_up_recommendations": ["recommendation1", "recommendation2"],
    "risk_assessment": {{
        "level": "low|moderate|high",
        "factors": ["factor1", "factor2"]
    }}
}}"""
        
        contents = [types.Content(
            role="user",
            parts=[types.Part(text=summary_prompt)]
        )]
        
        config = types.GenerateContentConfig(
            temperature=0.3,
            max_output_tokens=4096,
            tools=[MANUAL_RAG_TOOL],
            thinking_config=types.ThinkingConfig(
                thinking_budget=16384,  # Moderate complexity for summary
                include_thoughts=False
            ),
            safety_settings=[
                types.SafetySetting(
                    category="HARM_CATEGORY_HARASSMENT",
                    threshold="OFF"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_HATE_SPEECH",
                    threshold="OFF"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold="OFF"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold="OFF"
                )
            ]
        )
        
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents,
            config=config
        )
        
        response_text = ""
        if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
            response_text = response.candidates[0].content.parts[0].text
        
        # Parse JSON response
        try:
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                parsed_response = json.loads(json_match.group())
                return (jsonify({'summary': parsed_response}), 200, headers)
            else:
                return (jsonify({'summary': response_text}), 200, headers)
        except json.JSONDecodeError:
            # Return raw text if JSON parsing fails
            return (jsonify({'summary': response_text}), 200, headers)
        
    except Exception as e:
        logging.exception(f"Error in handle_session_summary: {str(e)}")
        return (jsonify({'error': f'Session summary failed: {str(e)}'}), 500, headers)

# Helper functions
def determine_therapy_phase(duration_minutes: int) -> str:
    """Determine current phase of therapy session based on duration"""
    if duration_minutes <= 10:
        return "beginning"
    elif duration_minutes <= 40:
        return "middle"
    else:
        return "end"

def format_transcript_segment(segment: List[Dict]) -> str:
    """Format transcript segment for analysis"""
    formatted = []
    for entry in segment:
        speaker = entry.get('speaker', 'Unknown')
        text = entry.get('text', '')
        timestamp = entry.get('timestamp', '')
        
        # Clean up speaker labels
        if speaker == 'conversation':
            # Try to infer speaker from text
            if text.startswith('Therapist:') or text.startswith('T:'):
                speaker = 'Therapist'
                text = text.split(':', 1)[1].strip() if ':' in text else text
            elif text.startswith('Client:') or text.startswith('C:') or text.startswith('Patient:') or text.startswith('P:'):
                speaker = 'Client'
                text = text.split(':', 1)[1].strip() if ':' in text else text
        
        if timestamp:
            formatted.append(f"[{timestamp}] {speaker}: {text}")
        else:
            formatted.append(f"{speaker}: {text}")
    
    return '\n'.join(formatted)

def summarize_session_history(history: List[Dict]) -> str:
    """Create brief summary of session history"""
    if not history:
        return "No previous sessions"
    
    summary_points = []
    for session in history[-3:]:  # Last 3 sessions
        date = session.get('date', 'Unknown date')
        main_topics = session.get('main_topics', [])
        summary_points.append(f"{date}: {', '.join(main_topics)}")
    
    return '; '.join(summary_points) if summary_points else "Recent session data"
