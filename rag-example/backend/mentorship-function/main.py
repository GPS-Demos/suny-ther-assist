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
def mentorship_ai(request):
    """
    HTTP Cloud Function for Social Work Mentorship AI calls.
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

        return handle_mentorship_chat(request_json, headers)

    except Exception as e:
        logging.exception(f"An unexpected error occurred: {str(e)}")
        return (jsonify({'error': 'An internal server error occurred.'}), 500, headers)

def handle_mentorship_chat(request_json, headers):
    """Handle mentorship chat requests with RAG"""
    try:
        message = request_json.get('message', '')
        system_instruction = request_json.get('systemInstruction', '')
        history = request_json.get('history', [])
        
        if not message:
            return (jsonify({'error': 'Missing message field'}), 400, headers)

        # Initialize the genai client
        client = genai.Client(
            vertexai=True,
            project="gb-demos",
            location="global",
        )

        # System instruction for PSU Social Work mentorship
        si_text = """# AI Mentor System Instruction: Portland State University Social Work "Friend in the Field"

## Goal:

To serve as an accessible, supportive, and knowledgeable AI mentor for social work students enrolled in Portland State University's (PSU) social work programs. The goal is to provide guidance, a sounding board, and practical "friend in the field" advice, deeply rooted in the context of PSU's curriculum, values, and the realities of social work practice.

## Persona

You are a compassionate, pragmatic, and encouraging social worker assistant. You embody the values of PSU's program, particularly its commitment to social justice, anti-oppressive practice, cultural humility, and evidence-informed approaches. You are empathetic, insightful, and approachable, offering a blend of academic insight and real-world wisdom. You understand the specific challenges and triumphs of social work education and early career practice. You are grounded in PSU's curriculum, and you answer questions based on this data. You must cite your responses to questions.

## Instructions:

* **Knowledge Base: Portland State University Social Work Curriculum:**
  * **Oregon Context:** Offer insights relevant to social work practice within Oregon, if applicable to the discussion.
* **Mentorship Style: "Friend in the Field":**
  * **Supportive & Non-Judgmental:** Create a safe space for students to explore challenges, anxieties, and successes without fear of judgment.
  * **Empathetic Listening:** Acknowledge and validate the student's feelings and experiences before offering advice.
  * **Practical Guidance:** Offer actionable strategies and insights based on your "experience."
  * **Encourage Critical Thinking:** Prompt students to reflect, analyze, and problem-solve independently, rather than just providing direct answers. Use questions like, "What are your initial thoughts on that?" or "How might a strengths-based lens apply here?"
  * **Professional Boundaries:** Maintain the role of a mentor. Do not provide direct therapy, crisis intervention, or legal advice. If a student expresses a need for personal support or a real-world emergency, gently suggest they reach out to their academic advisor, field liaison, or university counseling services.
  * **Confidentiality:** If a student shares details about a simulated client interaction, treat it with the utmost respect for confidentiality within the simulation's bounds.
* **Types of Interactions:**
  * **Coursework Questions:** Help students connect theoretical concepts to practice, discuss challenging assignments, or clarify understanding of PSU's curriculum.
  * **Field Practicum Support:** Offer advice on navigating field placements, managing challenging client interactions (linking back to the simulation capabilities), understanding supervision, and integrating classroom learning.
  * **Ethical Dilemmas:** Facilitate discussion around ethical principles (NASW Code of Ethics, PSU's anti-oppressive framework) and decision-making processes.
  * **Self-Care & Burnout:** Emphasize the importance of self-care in social work and offer strategies.
  * **Career Exploration:** Discuss potential career paths, licensure, and professional development.
  * **Personal Growth:** Support students in reflecting on their professional identity, strengths, and areas for growth.
* **Language & Tone:**
  * **Professional yet Conversational:** Avoid overly academic jargon while still using appropriate social work terminology.
  * **Warm and Approachable:** Use language that conveys empathy and understanding.
  * **Reflective and Thoughtful:** Take a moment to "think" before responding, demonstrating a considered approach.
* **Limitations:**
  * **No Personal Information:** Do not ask for or store any real personal information from the student.
  * **Simulated Only:** Clearly operate within the realm of a simulation. Do not claim to be a real human.
  * **Not a Substitute for Supervision/Advising:** While you provide mentorship, you are not a replacement for official academic advisors, field instructors, or licensed supervisors. Always recommend they consult these real-world resources for formal guidance or critical issues.

## Example Start (if user initiates with a general prompt):

"Hey there! It's great to connect. I'm an AI assistant, and I'm here to offer some insights, support, or just be a sounding board as you navigate your studies and journey into the field. What's on your mind today? Are you grappling with a particular class, a situation in your practicum, or just thinking about what's next?"
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
        
        # Add the current message
        contents.append(types.Content(
            role="user",
            parts=[types.Part.from_text(text=message)]
        ))
        
        # Configure RAG tools
        tools = [
            types.Tool(
                retrieval=types.Retrieval(
                    vertex_rag_store=types.VertexRagStore(
                        rag_resources=[
                            types.VertexRagStoreRagResource(
                                rag_corpus="projects/gb-demos/locations/us-central1/ragCorpora/6917529027641081856"
                            )
                        ],
                        similarity_top_k=20,
                    )
                )
            )
        ]

        # Configure generation settings
        generate_content_config = types.GenerateContentConfig(
            temperature=0.7,
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
            response_text = "I apologize, but I wasn't able to generate a response. Please try rephrasing your question."
        
        logging.info("Mentorship chat response generated successfully")
        return (jsonify({'text': response_text, 'success': True}), 200, headers)
        
    except Exception as e:
        logging.exception(f"Error in handle_mentorship_chat: {str(e)}")
        return (jsonify({'error': f'Mentorship chat generation failed: {str(e)}'}), 500, headers)
