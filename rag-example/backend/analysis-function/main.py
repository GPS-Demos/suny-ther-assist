import functions_framework
from flask import jsonify, Response
from google import genai
from google.genai import types
import os
import json
import logging
import re
from typing import List, Dict, Tuple

# --- Initialize Logging ---
logging.basicConfig(level=logging.INFO)

# --- Initialize Google GenAI ---
try:
    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "wz-case-worker-mentor")
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

# Configure RAG tool with curriculum datastore
RAG_TOOL = types.Tool(
    retrieval=types.Retrieval(
        vertex_ai_search=types.VertexAISearch(
            datastore="projects/wz-case-worker-mentor/locations/global/collections/default_collection/dataStores/curriculum_1752784944010"
        )
    )
)

@functions_framework.http
def social_work_ai(request):
    """
    HTTP Cloud Function for Social Work Coaching Simulator AI calls.
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
        
        if action == 'chat':
            return handle_chat(request_json, headers)
        elif action == 'analyze':
            return handle_analysis(request_json, headers)
        elif action == 'supervisor_analysis':
            return handle_supervisor_analysis(request_json, headers)
        else:
            return (jsonify({'error': 'Invalid action. Use "chat", "analyze", or "supervisor_analysis"'}), 400, headers)

    except Exception as e:
        logging.exception(f"An unexpected error occurred: {str(e)}")
        return (jsonify({'error': 'An internal server error occurred.'}), 500, headers)

def handle_chat(request_json, headers):
    """Handle chat simulation requests"""
    try:
        message = request_json.get('message', '')
        system_instruction = request_json.get('systemInstruction', '')
        history = request_json.get('history', [])
        
        if not message:
            return (jsonify({'error': 'Missing message field'}), 400, headers)

        # Build contents with system instruction and history
        contents = []
        
        # Add system instruction as first message if provided
        if system_instruction:
            contents.append(types.Content(
                role="user",
                parts=[types.Part(text=system_instruction)]
            ))
            contents.append(types.Content(
                role="model",
                parts=[types.Part(text="I understand. I'll follow these instructions.")]
            ))
        
        # Add conversation history
        for msg in history:
            role = "user" if msg.get('role') == 'user' else "model"
            parts_text = msg.get('parts', '')
            if parts_text:
                contents.append(types.Content(
                    role=role,
                    parts=[types.Part(text=parts_text)]
                ))
        
        # Add current message
        contents.append(types.Content(
            role="user",
            parts=[types.Part(text=message)]
        ))
        
        # Configure generation with RAG grounding
        config = types.GenerateContentConfig(
            temperature=0.7,
            max_output_tokens=1024,
            safety_settings=[
                types.SafetySetting(
                    category="HARM_CATEGORY_HARASSMENT",
                    threshold="BLOCK_ONLY_HIGH"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_HATE_SPEECH",
                    threshold="BLOCK_ONLY_HIGH"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold="BLOCK_MEDIUM_AND_ABOVE"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold="BLOCK_ONLY_HIGH"
                )
            ],
            tools=[RAG_TOOL]  # Enable RAG grounding
        )
        
        # Generate response
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents,
            config=config
        )
        
        # Extract text from response
        response_text = ""
        if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
            response_text = response.candidates[0].content.parts[0].text
        
        logging.info("Chat response generated successfully")
        return (jsonify({'text': response_text, 'success': True}), 200, headers)
        
    except Exception as e:
        logging.exception(f"Error in handle_chat: {str(e)}")
        return (jsonify({'error': f'Chat generation failed: {str(e)}'}), 500, headers)

def handle_analysis(request_json, headers):
    """Handle transcript analysis requests"""
    try:
        transcript = request_json.get('transcript', [])
        assessment = request_json.get('assessment', {})
        system_instruction = request_json.get('systemInstruction', '')
        
        logging.info(f"Analysis request received - transcript items: {len(transcript)}")
        logging.info(f"Assessment provided: {bool(assessment)}")
        
        if not transcript:
            return (jsonify({'error': 'Missing transcript field'}), 400, headers)

        # Format transcript
        transcript_text = '\n'.join([f"{msg.get('role', 'unknown')}: {msg.get('parts', '')}" for msg in transcript])
        logging.info(f"Formatted transcript length: {len(transcript_text)} characters")
        
        # Create analysis prompt with thinking instructions
        analysis_prompt = f"""<thinking>
Analyze this social work parent interview transcript step by step:
1. Review each interaction and identify key behaviors
2. Match behaviors to the assessment criteria
3. Consider which training materials from the curriculum would be relevant
4. Focus on providing specific, actionable feedback
</thinking>

You are an expert social work educator analyzing a parent interview transcript. Use the Arkansas child welfare training materials and best practices to provide feedback.

IMPORTANT: 
1. Actively reference specific training concepts and best practices from the curriculum.
2. When providing feedback, quote directly from the transcript to support your analysis.
3. Include transcript citations [T1], [T2], etc. to mark specific quotes you reference.
4. When referencing curriculum/training materials, include citations like [1], [2], etc. that will map to the grounding chunks retrieved from the Arkansas child welfare training materials.

Analyze this social work parent interview transcript against these key criteria:
1. Introduction & Identification - Did worker properly introduce themselves and verify parent identity?
2. Reason for Contact - Did worker clearly explain why they're there?
3. Responsive to Parent - Did worker listen empathetically and respond to parent concerns?
4. Permission to Enter - Did worker ask permission respectfully?
5. Information Gathering - Did worker gather relevant information about the situation?
6. Process & Next Steps - Did worker explain next steps and parent rights?

Transcript:
{transcript_text}

Self-Assessment:
{json.dumps(assessment, indent=2)}

Provide constructive, encouraging feedback grounded in the training materials. Focus on specific behaviors and actionable improvements.

EXAMPLE OF A GREAT RESPONSE:
{{
  "overallSummary": "Your self-reflection demonstrates excellent professional insight and a commitment to continuous improvement. While this interaction presented challenges, your ability to recognize areas for growth is a valuable asset in social work practice. The following feedback aims to build on your strengths while providing concrete strategies based on Arkansas child welfare best practices.",
  "strengths": [
    "Demonstrated strong self-awareness by recognizing the confrontational approach and its impact on the parent's defensiveness",
    "Showed persistence in attempting to address child safety concerns despite the challenging interaction"
  ],
  "areasForImprovement": [
    {{
      "area": "Professional Introduction",
      "suggestion": "Begin every interaction with a complete introduction including your full name, specific agency division, and immediate presentation of identification. This establishes credibility and shows respect for the parent's need to verify your authority. (Refer to 'Initial Contact Guide' [1] and 'Screening and Initial Contact' curriculum [2])."
    }},
    {{
      "area": "De-escalation Techniques",
      "suggestion": "When parents become defensive, acknowledge their emotions first before proceeding. Use phrases like 'I understand this is unexpected and concerning for you' to validate their feelings while maintaining focus on child safety. (Refer to 'Trauma Informed Practice Strategies' [3] and 'Partnering for Engagement' [4])."
    }}
  ],
  "criteriaAnalysis": [
    {{
      "criterion": "Introduction & Identification",
      "met": false,
      "score": "Needs Improvement",
      "evidence": "Hi, I'm from CPS. We got a call about your kids.",
      "feedback": "The introduction lacked essential elements including your full name, specific role, and proactive presentation of identification. Best practice requires a complete professional introduction to establish trust and legitimacy from the first moment of contact."
    }},
    {{
      "criterion": "Reason for Contact",
      "met": true,
      "score": "Good",
      "evidence": "We got a call about your kids. I need to come in and look around.",
      "feedback": "While you did state there was a call about the children, the explanation could be more specific about the nature of concerns while remaining non-accusatory. Consider framing it as 'We received a report expressing concern for your children's safety, and I'm here to talk with you about that.'"
    }},
    {{
      "criterion": "Responsive to Parent",
      "met": false,
      "score": "Needs Improvement",
      "evidence": "Look, we know there's been violence in the home and drug use.",
      "feedback": "The approach was confrontational rather than responsive to the parent's confusion and concern. Active listening and empathy are essential for building rapport. When parents express confusion or defensiveness, acknowledge their feelings before proceeding."
    }},
    {{
      "criterion": "Permission to Enter",
      "met": false,
      "score": "Poor",
      "evidence": "I need to come in and look around... I need to see the kids now and check the house.",
      "feedback": "The demands for entry were forceful and did not respect the parent's rights. Best practice requires explaining the voluntary nature of home visits and seeking informed consent, or clearly stating the legal basis if entry is required."
    }},
    {{
      "criterion": "Information Gathering",
      "met": false,
      "score": "Not Attempted",
      "evidence": "No questions asked to gather information about the family situation",
      "feedback": "The confrontational approach prevented any meaningful information gathering. Effective assessment requires open-ended questions and creating a safe environment for parents to share information about their family's strengths and challenges."
    }},
    {{
      "criterion": "Process & Next Steps",
      "met": false,
      "score": "Not Attempted",
      "evidence": "No explanation of process or next steps provided",
      "feedback": "Failed to explain the child welfare process, parent rights, or what to expect next. Transparency about the assessment process helps reduce anxiety and can foster cooperation. Parents should understand their rights and the potential outcomes."
    }}
  ],
  "transcriptCitations": [
    {{
      "number": 1,
      "marker": "[T1]",
      "quote": "Hi, I'm from CPS. We got a call about your kids. I need to come in and look around.",
      "speaker": "user"
    }},
    {{
      "number": 2,
      "marker": "[T2]",
      "quote": "What? Who are you? Do you have some ID? What call?",
      "speaker": "model"
    }}
  ]
}}

Respond with JSON in this exact format. Do not include any text outside the JSON structure.
"""
        
        # Build content for analysis
        contents = [types.Content(
            role="user",
            parts=[types.Part(text=analysis_prompt)]
        )]
        
        logging.info(f"Analysis prompt prepared - length: {len(analysis_prompt)} characters")
        
        # Configure generation with thinking mode and RAG grounding
        config = types.GenerateContentConfig(
            temperature=0.3,
            max_output_tokens=32768,
            safety_settings=[
                types.SafetySetting(
                    category="HARM_CATEGORY_HARASSMENT",
                    threshold="BLOCK_ONLY_HIGH"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_HATE_SPEECH",
                    threshold="BLOCK_ONLY_HIGH"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold="BLOCK_MEDIUM_AND_ABOVE"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold="BLOCK_ONLY_HIGH"
                )
            ],
            tools=[RAG_TOOL],  # Enable RAG grounding for curriculum-based analysis
            thinking_config=types.ThinkingConfig(
                thinking_budget=24576,  # Maximum allowed value
                include_thoughts=True  # Include thoughts in streaming
            ),
        )
        
        # Generate analysis with streaming
        logging.info(f"Calling Gemini model '{MODEL_NAME}' for analysis with streaming...")
        
        def generate():
            """Generator function for streaming response"""
            chunk_index = 0
            raw_stream_accumulator = []  # Accumulate all chunks for final logging
            
            try:
                print("=" * 80)
                print("RAW STREAMING OUTPUT START")
                print("=" * 80)
                
                # Stream the response from the model
                for chunk in client.models.generate_content_stream(
                    model=MODEL_NAME,
                    contents=contents,
                    config=config
                ):
                    chunk_index += 1
                    
                    # Build raw chunk structure exactly like test script
                    chunk_data = {
                        "chunk_index": chunk_index,
                        "candidates": []
                    }
                    
                    if chunk.candidates:
                        for candidate in chunk.candidates:
                            candidate_data = {}
                            
                            # Content parts
                            if candidate.content and candidate.content.parts:
                                candidate_data["content"] = {
                                    "parts": []
                                }
                                
                                for part in candidate.content.parts:
                                    part_data = {}
                                    if hasattr(part, 'text') and part.text:
                                        part_data["text"] = part.text
                                    if hasattr(part, 'thought'):
                                        part_data["thought"] = part.thought
                                    
                                    if part_data:
                                        candidate_data["content"]["parts"].append(part_data)
                            
                            # Grounding metadata (usually only in final chunk)
                            if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
                                if hasattr(candidate.grounding_metadata, 'grounding_chunks') and candidate.grounding_metadata.grounding_chunks:
                                    candidate_data["grounding_metadata"] = {
                                        "grounding_chunks": []
                                    }
                                    
                                    for idx, g_chunk in enumerate(candidate.grounding_metadata.grounding_chunks):
                                        g_data = {
                                            "_array_index": idx,  # 0-based array index
                                            "_citation_number": idx + 1,  # Maps to [1], [2], etc in text
                                        }
                                        
                                        if g_chunk.retrieved_context:
                                            ctx = g_chunk.retrieved_context
                                            g_data["retrieved_context"] = {
                                                "title": ctx.title if ctx.title else None,
                                                "uri": ctx.uri if ctx.uri else None,
                                                "text": ctx.text if ctx.text else None
                                            }
                                            
                                            # Include page span if available
                                            if hasattr(ctx, 'rag_chunk') and ctx.rag_chunk:
                                                if hasattr(ctx.rag_chunk, 'page_span') and ctx.rag_chunk.page_span:
                                                    g_data["retrieved_context"]["page_span"] = {
                                                        "first_page": ctx.rag_chunk.page_span.first_page,
                                                        "last_page": ctx.rag_chunk.page_span.last_page
                                                    }
                                        
                                        candidate_data["grounding_metadata"]["grounding_chunks"].append(g_data)
                            
                            if candidate_data:
                                chunk_data["candidates"].append(candidate_data)
                    
                    # Store chunk in accumulator
                    raw_stream_accumulator.append(json.dumps(chunk_data, ensure_ascii=False))
                    
                    # Print raw chunk for debugging in cloud logs
                    print(json.dumps(chunk_data, ensure_ascii=False))
                    
                    # Output raw JSON structure with newline delimiter
                    yield json.dumps(chunk_data, ensure_ascii=False) + "\n"
                
                # Print final summary of raw stream
                print("\n" + "=" * 80)
                print("RAW STREAMING OUTPUT COMPLETE")
                print("=" * 80)
                print(f"Total chunks: {chunk_index}")
                print("=" * 80)
                print("FULL RAW STREAM:")
                print("=" * 80)
                for chunk_str in raw_stream_accumulator:
                    print(chunk_str)
                print("=" * 80)
                print("END OF RAW STREAMING OUTPUT")
                print("=" * 80)
                
                logging.info(f"Streaming complete - total chunks: {chunk_index}")
                    
            except Exception as e:
                logging.exception(f"Error during streaming: {str(e)}")
                yield json.dumps({'error': f'Streaming failed: {str(e)}'}) + "\n"
        
        # Return streaming response with newline delimiter
        return Response(generate(), mimetype='text/plain', headers=headers)
        
    except Exception as e:
        logging.exception(f"Error in handle_analysis: {str(e)}")
        return (jsonify({'error': f'Analysis failed: {str(e)}'}), 500, headers)

def handle_supervisor_analysis(request_json, headers):
    """Handle supervisor coaching analysis requests"""
    try:
        transcript = request_json.get('transcript', [])
        supervisor_feedback = request_json.get('assessment', {}).get('supervisorFeedback', '')
        
        if not transcript or not supervisor_feedback:
            return (jsonify({'error': 'Missing transcript or supervisorFeedback'}), 400, headers)

        transcript_text = '\n'.join([f"{msg.get('role', 'unknown')}: {msg.get('parts', '')}" for msg in transcript])

        # New prompt for coaching the coach
        prompt = f"""You are an expert in management coaching for social work supervisors. Your task is to analyze the feedback a supervisor gave to a caseworker and evaluate the quality of the coaching itself.

        **Transcript of Caseworker-Parent Interaction:**
        {transcript_text}

        **Supervisor's Feedback to Caseworker:**
        "{supervisor_feedback}"

        **Analysis Instructions:**
        Based on the transcript and the feedback provided, evaluate the supervisor's coaching. Your analysis should be constructive, supportive, and help the supervisor improve their coaching skills.

        - **Feedback on Acknowledging Strengths:** Did the supervisor effectively and specifically acknowledge the caseworker's strengths?
        - **Feedback on Constructive Criticism:** Is the constructive criticism clear, specific, and actionable? Does it refer to specific moments in the transcript?
        - **Overall Tone Assessment:** What is the overall tone of the feedback (e.g., 'Supportive and developmental', 'Too blunt', 'Vague and unhelpful')?
        
        IMPORTANT: 
        1. Actively reference specific training concepts and best practices from the curriculum.
        2. When providing feedback, quote directly from the transcript to support your analysis.
        3. Include transcript citations [T1], [T2], etc. to mark specific quotes you reference.
        4. When referencing curriculum/training materials, include citations like [1], [2], etc. that will map to the grounding chunks retrieved from the curriculum RAG TOOL datastore.

        Return your analysis in a JSON object with the following keys: "feedbackOnStrengths", "feedbackOnCritique", "overallTone", "transcriptCitations".

        EXAMPLE OF A GREAT RESPONSE:
        {{
          "feedbackOnStrengths": "The feedback effectively acknowledges the caseworker's strengths by highlighting a specific positive action: 'Great job building rapport by introducing yourself clearly' [T1]. By linking this praise to the caseworker's actual words from the transcript [T2], the feedback becomes more meaningful and reinforces the specific behavior. This aligns with the 'Partnering for Engagement' [1] curriculum, which emphasizes the importance of a strong introduction.",
          "feedbackOnCritique": "The constructive criticism is clear, actionable, and supportive. It pinpoints a specific area for improvement ('how you explain the next steps') and offers a concrete, alternative phrasing [T3]. This helps the caseworker understand exactly what to do differently next time. This approach is supported by the 'Trauma-Informed Practice' guide [2], which notes that clear communication about next steps can reduce client anxiety.",
          "overallTone": "Supportive and developmental",
          "transcriptCitations": [
            {{
              "number": 1,
              "marker": "[T1]",
              "quote": "Great job building rapport by introducing yourself clearly",
              "speaker": "supervisor"
            }},
            {{
              "number": 2,
              "marker": "[T2]",
              "quote": "Hi, my name is Willis Thompson. I'm with the Oregon Department of Human Services, Child Welfare. Are you Sara Cooper?",
              "speaker": "user"
            }},
            {{
              "number": 3,
              "marker": "[T3]",
              "quote": "My next step is to talk with the children, and then we can create a safety plan together.",
              "speaker": "supervisor"
            }}
          ]
        }}
        """

        contents = [types.Content(role="user", parts=[types.Part(text=prompt)])]
        
        config = types.GenerateContentConfig(
            temperature=0.3,
            max_output_tokens=32768,
            safety_settings=[
                types.SafetySetting(
                    category="HARM_CATEGORY_HARASSMENT",
                    threshold="BLOCK_ONLY_HIGH"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_HATE_SPEECH",
                    threshold="BLOCK_ONLY_HIGH"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold="BLOCK_MEDIUM_AND_ABOVE"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold="BLOCK_ONLY_HIGH"
                )
            ],
            tools=[RAG_TOOL],
            thinking_config=types.ThinkingConfig(
                thinking_budget=24576,
                include_thoughts=True
            ),
        )

        def generate():
            """Generator function for streaming response"""
            chunk_index = 0
            raw_stream_accumulator = []
            
            try:
                for chunk in client.models.generate_content_stream(
                    model=MODEL_NAME,
                    contents=contents,
                    config=config
                ):
                    chunk_index += 1
                    chunk_data = {"chunk_index": chunk_index, "candidates": []}
                    if chunk.candidates:
                        for candidate in chunk.candidates:
                            candidate_data = {}
                            if candidate.content and candidate.content.parts:
                                candidate_data["content"] = {"parts": []}
                                for part in candidate.content.parts:
                                    part_data = {}
                                    if hasattr(part, 'text') and part.text:
                                        part_data["text"] = part.text
                                    if hasattr(part, 'thought'):
                                        part_data["thought"] = part.thought
                                    if part_data:
                                        candidate_data["content"]["parts"].append(part_data)
                            if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
                                if hasattr(candidate.grounding_metadata, 'grounding_chunks') and candidate.grounding_metadata.grounding_chunks:
                                    candidate_data["grounding_metadata"] = {"grounding_chunks": []}
                                    for idx, g_chunk in enumerate(candidate.grounding_metadata.grounding_chunks):
                                        g_data = {"_array_index": idx, "_citation_number": idx + 1}
                                        if g_chunk.retrieved_context:
                                            ctx = g_chunk.retrieved_context
                                            g_data["retrieved_context"] = {
                                                "title": ctx.title if ctx.title else None,
                                                "uri": ctx.uri if ctx.uri else None,
                                                "text": ctx.text if ctx.text else None
                                            }
                                            if hasattr(ctx, 'rag_chunk') and ctx.rag_chunk and hasattr(ctx.rag_chunk, 'page_span') and ctx.rag_chunk.page_span:
                                                g_data["retrieved_context"]["page_span"] = {
                                                    "first_page": ctx.rag_chunk.page_span.first_page,
                                                    "last_page": ctx.rag_chunk.page_span.last_page
                                                }
                                        candidate_data["grounding_metadata"]["grounding_chunks"].append(g_data)
                            if candidate_data:
                                chunk_data["candidates"].append(candidate_data)
                    raw_stream_accumulator.append(json.dumps(chunk_data, ensure_ascii=False))
                    yield json.dumps(chunk_data, ensure_ascii=False) + "\n"
                logging.info(f"Streaming complete - total chunks: {chunk_index}")
            except Exception as e:
                logging.exception(f"Error during streaming: {str(e)}")
                yield json.dumps({'error': f'Streaming failed: {str(e)}'}) + "\n"
        
        return Response(generate(), mimetype='text/plain', headers=headers)

    except Exception as e:
        logging.exception(f"Error in handle_supervisor_analysis: {str(e)}")
        return (jsonify({'error': f'Supervisor analysis failed: {str(e)}'}), 500, headers)
