import functions_framework
from flask import jsonify
from google import genai
from google.genai import types
import os
import json
import logging

# --- Initialize Logging ---
logging.basicConfig(level=logging.INFO)

@functions_framework.http
def simulation_ai(request):
    """
    HTTP Cloud Function for Social Work Simulation AI calls.
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

        return handle_simulation_chat(request_json, headers)

    except Exception as e:
        logging.exception(f"An unexpected error occurred: {str(e)}")
        return (jsonify({'error': 'An internal server error occurred.'}), 500, headers)

def handle_simulation_chat(request_json, headers):
    """Handle simulation chat requests with RAG"""
    try:
        message = request_json.get('message', '')
        scenario_id = request_json.get('scenario_id', '')
        history = request_json.get('history', [])
        
        if not message:
            return (jsonify({'error': 'Missing message field'}), 400, headers)
        
        if not scenario_id:
            return (jsonify({'error': 'Missing scenario_id field'}), 400, headers)

        # Initialize the genai client
        client = genai.Client(
            vertexai=True,
            project="gb-demos",
            location="global",
        )

        # System instruction for simulation role-play
        si_text = """# AI Simulation System Instruction: Social Work Client Role-Play

## Core Directive:
You are an AI actor portraying a client in a social work simulation. Your entire personality, history, and current situation are defined exclusively by the documents provided in the context. You must fully embody the role of the person described in these files.

## Persona and Context:
- **Source of Truth:** The retrieved documents (case files, progress reports, screenings, etc.) are your complete memory and identity. Do not invent any details about your life, feelings, or history that are not supported by or cannot be reasonably inferred from these documents.
- **Scenario Identification:** The name of the folder from which these documents were retrieved is the name of your character or the title of the scenario. You will see this passed in the prompt.
- **Embodiment:** Your responses should reflect the personality, emotional state, and life circumstances detailed in the files. If the files describe you as angry and distrustful, you must act that way. If they describe you as anxious and overwhelmed, your responses should reflect that.

## Interaction Rules:
- **Role-Play:** You are to engage in a realistic conversation with a social work student. The student will be practicing their engagement and assessment skills.
- **Do Not Break Character:** You are the client. Do not refer to yourself as an AI, a model, or a simulation. Do not give the student feedback on their performance. Your role is to act, not to coach.
- **Natural Conversation:** Respond to the student's questions and statements as the client would. Your goal is to make the simulation feel as real as possible for the student.
- **Ending the Simulation:** The simulation will conclude when the student indicates they are finished or after a reasonable amount of time has passed (e.g., the student says "Thank you, that's all I have for today"). You can also naturally end the conversation if it feels appropriate for your character (e.g., "I have to go now" or "I'm not talking about this anymore").

## Example Prompt Structure (what the backend will send you):
"**Scenario:** [Folder Name/Scenario Name]
**User (Social Worker):** [The student's message]
**Retrieved Documents:** [Content of the case files for this scenario]"
"""

        model = "gemini-2.5-flash"
        
        # Build conversation history for context
        contents = []
        for msg in history:
            role = "user" if msg.get('role') == 'user' else "model"
            contents.append(types.Content(
                role=role,
                parts=[types.Part.from_text(text=msg.get('parts', ''))]
            ))
        
        # Add the current message with scenario context
        prompt_text = f"**Scenario:** {scenario_id}\n**User (Social Worker):** {message}"
        contents.append(types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt_text)]
        ))
        
        # Configure RAG tools for scenarios
        tools = [
            types.Tool(
                retrieval=types.Retrieval(
                    vertex_rag_store=types.VertexRagStore(
                        rag_resources=[
                            types.VertexRagStoreRagResource(
                                rag_corpus="projects/gb-demos/locations/us-central1/ragCorpora/4611686018427387904"
                            )
                        ],
                    )
                )
            )
        ]

        # Configure generation settings
        generate_content_config = types.GenerateContentConfig(
            temperature=0.8,
            top_p=1,
            seed=0,
            max_output_tokens=4096,
            safety_settings=[
                types.SafetySetting(
                    category="HARM_CATEGORY_HATE_SPEECH",
                    threshold="BLOCK_ONLY_HIGH"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold="BLOCK_ONLY_HIGH"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold="BLOCK_MEDIUM_AND_ABOVE"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_HARASSMENT",
                    threshold="BLOCK_ONLY_HIGH"
                )
            ],
            tools=tools,
            system_instruction=[types.Part.from_text(text=si_text)],
            thinking_config=types.ThinkingConfig(
                thinking_budget=-1,
            ),
        )

        # Generate response
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=generate_content_config,
        )
        
        # Extract text from response
        response_text = ""
        if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'text'):
                    response_text += part.text
        
        if not response_text:
            response_text = "I'm not sure what to say right now. Could you try asking me something else?"
        
        logging.info("Simulation chat response generated successfully")
        return (jsonify({'text': response_text, 'success': True}), 200, headers)
        
    except Exception as e:
        logging.exception(f"Error in handle_simulation_chat: {str(e)}")
        return (jsonify({'error': f'Simulation chat generation failed: {str(e)}'}), 500, headers)
