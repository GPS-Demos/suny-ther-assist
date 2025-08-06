#!/usr/bin/env python3
"""
Simple test script to verify RAG datastore connectivity and response structure.
"""

from google import genai
from google.genai import types
import json
import os

# Initialize the client with the same settings as main.py
project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "wz-case-worker-mentor")
client = genai.Client(
    vertexai=True,
    project=project_id,
    location="global",
)

MODEL_NAME = "gemini-2.5-flash"

# Configure RAG tool with the same curriculum datastore
RAG_TOOL = types.Tool(
    retrieval=types.Retrieval(
        vertex_ai_search=types.VertexAISearch(
            datastore="projects/wz-case-worker-mentor/locations/global/collections/default_collection/dataStores/curriculum_1752784944010"
        )
    )
)

def test_simple_rag_query():
    """Test a simple query to the RAG datastore."""
    
    print("Testing RAG datastore connectivity...")
    print(f"Project: {project_id}")
    print(f"Model: {MODEL_NAME}")
    print("-" * 80)
    
    # Simple test query about social work practices
    query = "What are the key steps for introducing yourself during a parent interview?"
    
    contents = [types.Content(
        role="user",
        parts=[types.Part(text=query)]
    )]
    
    config = types.GenerateContentConfig(
        temperature=0.3,
        max_output_tokens=1024,
        tools=[RAG_TOOL]
    )
    
    try:
        # Generate response
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents,
            config=config
        )
        
        print(f"\nQuery: {query}")
        print("\n" + "="*80)
        print("RESPONSE TEXT:")
        print("="*80)
        
        # Extract and display response text
        if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
            response_text = response.candidates[0].content.parts[0].text
            print(response_text)
        else:
            print("No response text found")
        
        # Check for grounding metadata
        print("\n" + "="*80)
        print("GROUNDING METADATA:")
        print("="*80)
        
        if response.candidates and response.candidates[0].grounding_metadata:
            metadata = response.candidates[0].grounding_metadata
            
            if hasattr(metadata, 'grounding_chunks') and metadata.grounding_chunks:
                print(f"\nFound {len(metadata.grounding_chunks)} grounding chunks:")
                
                for idx, chunk in enumerate(metadata.grounding_chunks):
                    print(f"\n--- Chunk {idx + 1} ---")
                    
                    if chunk.retrieved_context:
                        ctx = chunk.retrieved_context
                        print(f"Title: {ctx.title if ctx.title else 'N/A'}")
                        print(f"URI: {ctx.uri if ctx.uri else 'N/A'}")
                        print(f"Text preview: {ctx.text[:200] if ctx.text else 'N/A'}...")
                        
                        # Check for page information
                        if hasattr(ctx, 'rag_chunk') and ctx.rag_chunk:
                            rag_chunk = ctx.rag_chunk
                            if hasattr(rag_chunk, 'page_span') and rag_chunk.page_span:
                                print(f"Pages: {rag_chunk.page_span.first_page}-{rag_chunk.page_span.last_page}")
            else:
                print("No grounding chunks found")
                
            # Check for search queries
            if hasattr(metadata, 'search_entry_point') and metadata.search_entry_point:
                print(f"\nSearch query used: {metadata.search_entry_point.search_query}")
        else:
            print("No grounding metadata found")
            
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()


def test_with_citations():
#     """Test with citation markers like the analysis function."""
#     
#     print("\n\n" + "="*80)
#     print("TESTING WITH CITATION MARKERS")
#     print("="*80)
#     
#     # Use a prompt that encourages citation usage
#     prompt = """
# You are an expert social work educator. Please answer this question using the training materials available to you. 
# Include citation markers [1], [2], etc. when referencing specific materials.
# 
# Question: What are the best practices for conducting a parent interview, including introduction, permission to enter, and explaining the process?
# """
#     
#     contents = [types.Content(
#         role="user",
#         parts=[types.Part(text=prompt)]
#     )]
#     
#     config = types.GenerateContentConfig(
#         temperature=0.3,
#         max_output_tokens=2048,
#         tools=[RAG_TOOL]
#     )
#     
#     try:
#         response = client.models.generate_content(
#             model=MODEL_NAME,
#             contents=contents,
#             config=config
#         )
#         
#         print("\nRESPONSE WITH CITATIONS:")
#         print("-" * 80)
#         
#         if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
#             response_text = response.candidates[0].content.parts[0].text
#             print(response_text)
#             
#             # Extract citations from grounding metadata
#             print("\n\nEXTRACTED CITATIONS:")
#             print("-" * 80)
#             
#             citations = []
#             if response.candidates and response.candidates[0].grounding_metadata:
#                 metadata = response.candidates[0].grounding_metadata
#                 
#                 if hasattr(metadata, 'grounding_chunks') and metadata.grounding_chunks:
#                     for idx, chunk in enumerate(metadata.grounding_chunks):
#                         if chunk.retrieved_context:
#                             ctx = chunk.retrieved_context
#                             citation = {
#                                 "number": idx + 1,
#                                 "source": ctx.title if ctx.title else "Training Material",
#                                 "text": ctx.text[:300] if ctx.text else "",
#                                 "uri": ctx.uri if ctx.uri else ""
#                             }
#                             
#                             # Add page info if available
#                             if hasattr(ctx, 'rag_chunk') and ctx.rag_chunk:
#                                 rag_chunk = ctx.rag_chunk
#                                 if hasattr(rag_chunk, 'page_span') and rag_chunk.page_span:
#                                     citation["pages"] = f"Pages {rag_chunk.page_span.first_page}-{rag_chunk.page_span.last_page}"
#                             
#                             citations.append(citation)
#             
#             print(json.dumps(citations, indent=2))
#             
#     except Exception as e:
#         print(f"\nError: {e}")
#         import traceback
#         traceback.print_exc()


if __name__ == "__main__":
    print("RAG Datastore Test Script")
    print("=" * 80)
    
    # Run simple test
    test_simple_rag_query()
    
    # Run citation test (commented out for now)
    test_with_citations()
