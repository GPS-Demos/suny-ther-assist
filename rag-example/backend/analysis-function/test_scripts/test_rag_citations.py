#!/usr/bin/env python3
"""
Test script to show the citation mapping challenge and solution.
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

def demonstrate_citation_challenge():
    """Show why we need to prompt for citations."""
    
    print("="*80)
    print("DEMONSTRATING THE CITATION CHALLENGE")
    print("="*80)
    
    # First, a normal query without citation instructions
    print("\n1. NORMAL QUERY (no citation instructions):")
    print("-" * 40)
    
    query1 = "What are the key steps for introducing yourself during a parent interview?"
    
    contents = [types.Content(
        role="user",
        parts=[types.Part(text=query1)]
    )]
    
    config = types.GenerateContentConfig(
        temperature=0.3,
        max_output_tokens=1024,
        tools=[RAG_TOOL]
    )
    
    response1 = client.models.generate_content(
        model=MODEL_NAME,
        contents=contents,
        config=config
    )
    
    if response1.candidates and response1.candidates[0].content:
        text1 = response1.candidates[0].content.parts[0].text
        print(text1[:500] + "...")  # First 500 chars
        
    print("\n\n2. QUERY WITH CITATION INSTRUCTIONS:")
    print("-" * 40)
    
    # Now with explicit citation instructions
    query2 = """You are an expert social work educator. When answering, include citation markers [1], [2], etc. to indicate which training material each point comes from.

Question: What are the key steps for introducing yourself during a parent interview?"""
    
    contents2 = [types.Content(
        role="user",
        parts=[types.Part(text=query2)]
    )]
    
    response2 = client.models.generate_content(
        model=MODEL_NAME,
        contents=contents2,
        config=config
    )
    
    if response2.candidates and response2.candidates[0].content:
        text2 = response2.candidates[0].content.parts[0].text
        print(text2)
        
        # Show grounding metadata
        print("\n\nGROUNDING CHUNKS (What the AI actually used):")
        print("-" * 40)
        
        if response2.candidates and response2.candidates[0].grounding_metadata:
            metadata = response2.candidates[0].grounding_metadata
            
            if hasattr(metadata, 'grounding_chunks') and metadata.grounding_chunks:
                print(f"\nFound {len(metadata.grounding_chunks)} grounding chunks:")
                
                for idx, chunk in enumerate(metadata.grounding_chunks[:5]):  # First 5 chunks
                    if chunk.retrieved_context:
                        ctx = chunk.retrieved_context
                        print(f"\n[{idx+1}] {ctx.title if ctx.title else 'N/A'}")
            else:
                print("No grounding chunks found")
        else:
            print("No grounding metadata found")
                    
    print("\n\nTHE CHALLENGE:")
    print("-" * 40)
    print("""
Even when the AI includes [1], [2] markers in its response, there's NO automatic 
mapping between those numbers and the grounding chunks. The AI might say [1] but 
that doesn't necessarily correspond to grounding chunk #1.

SOLUTION: That's why in your main.py, you:
1. Make TWO calls to the AI
2. First call: Get the streaming response with citation markers
3. Second call: Get the grounding metadata
4. Map them together based on context or just use sequential numbering
""")


if __name__ == "__main__":
    demonstrate_citation_challenge()
