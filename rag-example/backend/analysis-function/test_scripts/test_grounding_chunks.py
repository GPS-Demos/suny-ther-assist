#!/usr/bin/env python3
"""
Test script to display raw chunk structure for frontend parsing
Shows how citations map to grounding chunks
"""

import json
import os
from datetime import datetime
from google import genai
from google.genai import types

# Configuration
project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "wz-case-worker-mentor")
MODEL_NAME = "gemini-2.5-flash"

# Initialize client
client = genai.Client(
    vertexai=True,
    project=project_id,
    location="global"
)

# Configure RAG tool
RAG_TOOL = types.Tool(
    retrieval=types.Retrieval(
        vertex_ai_search=types.VertexAISearch(
            datastore="projects/wz-case-worker-mentor/locations/global/collections/default_collection/dataStores/curriculum_1752784944010"
        )
    )
)

def test_grounding_metadata():
    """Test grounding metadata capture during streaming"""
    
    # Create output file with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_filename = f"test_grounding_raw_{timestamp}.txt"
    
    # Open output file
    with open(output_filename, 'w', encoding='utf-8') as f:
        def log(message=""):
            """Print to console and write to file"""
            print(message)
            f.write(message + "\n")
            f.flush()  # Ensure immediate write
        
        # Test transcript
        transcript_text = """user: Hi, I'm from CPS. We got a call about your kids. I need to come in and look around.
model: What? Who are you? Do you have some ID? What call?
user: Look, we know there's been violence in the home and drug use. Your daughter told her teacher. I need to see the kids now and check the house. This is serious.
model: I don't have to let you in! You can't just show up here making accusations! Where's your warrant? My kids are fine!"""
        
        assessment = {
            "reflection": "I realize my approach was too confrontational and I failed to properly introduce myself."
        }
        
        # Create analysis prompt
        analysis_prompt = f"""<thinking>
Analyze this social work parent interview transcript step by step:
1. Review each interaction and identify key behaviors
2. Match behaviors to the assessment criteria
3. Consider which training materials from the curriculum would be relevant
4. Focus on providing specific, actionable feedback
</thinking>

You are an expert social work educator analyzing a parent interview transcript. Use the Arkansas child welfare training materials and best practices to provide feedback.

IMPORTANT: Actively reference specific training concepts and best practices from the curriculum.

Analyze this social work parent interview transcript against these key criteria:
1. Introduction & Identification
2. Reason for Contact
3. Responsive to Parent
4. Permission to Enter
5. Information Gathering
6. Process & Next Steps

Transcript:
{transcript_text}

Self-Assessment:
{json.dumps(assessment, indent=2)}

Provide a brief analysis in JSON format with these fields:
- overallSummary (string)
- strengths (array of strings)
- areasForImprovement (array of objects with area and suggestion)

Keep the response concise but reference training materials.
"""
        
        # Build content
        contents = [types.Content(
            role="user",
            parts=[types.Part(text=analysis_prompt)]
        )]
        
        # Configure generation
        config = types.GenerateContentConfig(
            temperature=0.3,
            max_output_tokens=8192,
            tools=[RAG_TOOL],
            thinking_config=types.ThinkingConfig(
                thinking_budget=24576,
                include_thoughts=True
            )
        )
        
        log(f"Output file: {output_filename}")
        log("=" * 80)
        log("RAW CHUNK STRUCTURE (for frontend parsing)")
        log("Citation mapping: [N] in text → grounding_chunks[N-1] in array")
        log("=" * 80)
        log()
        log(f"Starting streaming at {datetime.now()}")
        log()
        
        chunk_index = 0
        
        try:
            # Stream the response
            for chunk in client.models.generate_content_stream(
                model=MODEL_NAME,
                contents=contents,
                config=config
            ):
                chunk_index += 1
                
                # Build raw chunk structure
                chunk_data = {
                    "chunk_index": chunk_index,
                    "candidates": []
                }
                
                if chunk.candidates:
                    for candidate in chunk.candidates:
                        candidate_data = {}
                        
                        # Content
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
                        
                        # Grounding metadata
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
                
                # Output raw JSON structure
                log(json.dumps(chunk_data, indent=2, ensure_ascii=False))
                log()
        
        except Exception as e:
            log(f"\nERROR: {e}")
            import traceback
            log(traceback.format_exc())
        
        log("=" * 80)
        log("END OF RAW CHUNK OUTPUT")
        log(f"Total chunks: {chunk_index}")
        log(f"\nOutput saved to: {output_filename}")

if __name__ == "__main__":
    test_grounding_metadata()
