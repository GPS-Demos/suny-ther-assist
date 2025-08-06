#!/usr/bin/env python3
"""
Test script to verify the citation insertion functionality.
"""

from google import genai
from google.genai import types
import json
import os

# Initialize the client
project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "wz-case-worker-mentor")
client = genai.Client(
    vertexai=True,
    project=project_id,
    location="global",
)

MODEL_NAME = "gemini-2.5-flash"

# Configure RAG tool
RAG_TOOL = types.Tool(
    retrieval=types.Retrieval(
        vertex_ai_search=types.VertexAISearch(
            datastore="projects/wz-case-worker-mentor/locations/global/collections/default_collection/dataStores/curriculum_1752784944010"
        )
    )
)

def test_citation_insertion():
    """Test the citation insertion flow."""
    
    print("Testing Citation Insertion")
    print("=" * 80)
    
    # Sample analysis without citations (simulating what we get from first LLM call)
    sample_analysis = {
        "overallSummary": "The caseworker demonstrated good initial contact skills by introducing themselves and explaining the reason for their visit. However, they missed the crucial step of asking permission to enter the home.",
        "strengths": [
            "Clearly introduced themselves with full name and agency [T1]",
            "Explained the reason for contact in a transparent manner [T2]"
        ],
        "areasForImprovement": [
            {
                "area": "Permission to Enter",
                "suggestion": "Always ask permission before entering a family's home. This shows respect and follows best practices for home visits."
            }
        ]
    }
    
    # Get a real response with grounding chunks
    prompt = """What are the best practices for conducting a parent interview, including:
    1. How to properly introduce yourself
    2. Asking permission to enter the home
    3. Explaining the reason for contact"""
    
    contents = [types.Content(
        role="user",
        parts=[types.Part(text=prompt)]
    )]
    
    config = types.GenerateContentConfig(
        temperature=0.3,
        max_output_tokens=1024,
        tools=[RAG_TOOL]
    )
    
    print("1. Getting response with grounding chunks...")
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=contents,
        config=config
    )
    
    # Extract grounding chunks
    grounding_chunks = []
    if (response.candidates and 
        response.candidates[0].grounding_metadata and 
        response.candidates[0].grounding_metadata.grounding_chunks):
        
        for idx, chunk in enumerate(response.candidates[0].grounding_metadata.grounding_chunks):
            if chunk.retrieved_context:
                ctx = chunk.retrieved_context
                grounding_chunks.append({
                    "text": ctx.text if ctx.text else "",
                    "citation_num": idx + 1,
                    "source": ctx.title if ctx.title else "Training Material"
                })
                print(f"\nChunk [{idx + 1}] from {ctx.title}:")
                print(f"{ctx.text[:200]}..." if ctx.text else "No text")
    
    print(f"\n\nFound {len(grounding_chunks)} grounding chunks")
    
    # Now test adding citations
    print("\n2. Testing citation insertion with LLM...")
    print("-" * 40)
    
    # Create citation prompt
    citation_prompt = f"""
Given this analysis JSON and these grounding chunks from training materials, add citation markers [1], [2], etc. 
where the analysis references concepts from the chunks.

Analysis to update:
{json.dumps(sample_analysis, indent=2)}

Grounding chunks used by the AI:
"""
    for chunk in grounding_chunks[:3]:  # Use first 3 chunks for testing
        citation_prompt += f"\n[{chunk['citation_num']}]: {chunk['text'][:300]}..."
    
    citation_prompt += """

Instructions:
1. Add citation markers [1], [2], etc. in the text where concepts from the grounding chunks are referenced
2. Only add citations where there's a clear connection to the chunk content
3. Return the complete updated JSON with citation markers added
4. Keep all existing [T#] transcript citations as they are
5. Respond with ONLY the JSON, no other text
"""
    
    # Call LLM to add citations
    contents = [types.Content(
        role="user",
        parts=[types.Part(text=citation_prompt)]
    )]
    
    config = types.GenerateContentConfig(
        temperature=0.1,
        max_output_tokens=8192,
        response_mime_type="application/json"
    )
    
    citation_response = client.models.generate_content(
        model=MODEL_NAME,
        contents=contents,
        config=config
    )
    
    if citation_response.candidates and citation_response.candidates[0].content:
        response_text = citation_response.candidates[0].content.parts[0].text
        updated_analysis = json.loads(response_text)
        
        print("\nORIGINAL ANALYSIS:")
        print(json.dumps(sample_analysis, indent=2))
        
        print("\n\nUPDATED ANALYSIS WITH CITATIONS:")
        print(json.dumps(updated_analysis, indent=2))
        
        # Count added citations
        original_text = json.dumps(sample_analysis)
        updated_text = json.dumps(updated_analysis)
        
        import re
        original_citations = len(re.findall(r'\[\d+\]', original_text))
        updated_citations = len(re.findall(r'\[\d+\]', updated_text))
        
        print(f"\n\nCitations added: {updated_citations - original_citations}")
        print(f"(Excluding [T#] transcript citations)")
        

if __name__ == "__main__":
    test_citation_insertion()
