#!/usr/bin/env python3
"""
Test script demonstrating thinking mode and single-pass citation handling.
Based on the patent project approach to eliminate the second API call.
"""

import json
import requests
import time
from google import genai
from google.genai import types
import os

# Initialize the client
project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "wz-case-worker-mentor")
client = genai.Client(
    vertexai=True,
    project=project_id,
    location="global",
)

MODEL_NAME = "gemini-2.5-flash"  # Using thinking model

# Configure RAG tool
RAG_TOOL = types.Tool(
    retrieval=types.Retrieval(
        vertex_ai_search=types.VertexAISearch(
            datastore="projects/wz-case-worker-mentor/locations/global/collections/default_collection/dataStores/curriculum_1752784944010"
        )
    )
)

def test_thinking_mode_analysis():
    """Test analysis with thinking mode enabled."""
    
    print("Testing Social Work Analysis with Thinking Mode")
    print("=" * 80)
    print("\nThis test demonstrates:")
    print("1. How to get grounding metadata from streaming chunks")
    print("2. How to use that metadata to add citations to the generation")
    print("3. Eliminating the need for a second API call")
    print("\n" + "=" * 80)
    
    # Sample transcript
    transcript = [
        {
            "role": "user",
            "parts": "Hello, I'm from Child Protective Services. Are you Sara Cooper?"
        },
        {
            "role": "model",
            "parts": "Yes, I'm Sara Cooper. What's this about?"
        },
        {
            "role": "user",
            "parts": "We received a report about your children. May I come in to discuss this?"
        },
        {
            "role": "model",
            "parts": "I guess so. Come in."
        }
    ]
    
    # Sample assessment
    assessment = {
        "introduction": "I introduced myself as being from CPS and verified identity.",
        "reasonForContact": "I mentioned we received a report but wasn't very specific.",
        "responsiveToParent": "I didn't acknowledge the parent's confusion or concern.",
        "permissionToEnter": "I asked permission to enter which was good.",
        "gatheringInformation": "Haven't started gathering information yet.",
        "processAndNextSteps": "Haven't explained the process or next steps."
    }
    
    # Format transcript
    transcript_text = '\n'.join([f"{msg['role']}: {msg['parts']}" for msg in transcript])
    
    # Create analysis prompt with thinking instructions
    analysis_prompt = f"""<thinking>
Analyze this social work parent interview transcript step by step:
1. Review each interaction and identify key behaviors
2. Match behaviors to the assessment criteria
3. Identify which training materials from the curriculum would be relevant
4. Plan what citations to include based on best practices
</thinking>

You are an expert social work educator analyzing a parent interview transcript. Use the Arkansas child welfare training materials and best practices to provide feedback.

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

Provide constructive, encouraging feedback grounded in the training materials. When you reference training materials or best practices, the system will automatically add citation links.

Respond with JSON in this exact format:
{{
  "overallSummary": "Brief encouraging overview of performance",
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "areasForImprovement": [
    {{"area": "Area name", "suggestion": "Specific actionable suggestion"}},
    {{"area": "Area name", "suggestion": "Specific actionable suggestion"}}
  ],
  "criteriaAnalysis": [
    {{"criterion": "Introduction & Identification", "met": true, "score": "Good", "evidence": "Direct quote from transcript", "feedback": "Specific feedback"}},
    {{"criterion": "Reason for Contact", "met": false, "score": "Needs Improvement", "evidence": "Direct quote or 'Not demonstrated'", "feedback": "Specific feedback"}},
    // ... other criteria
  ],
  "transcriptCitations": [
    {{
      "number": 1,
      "marker": "[T1]",
      "quote": "Hello, I'm from Child Protective Services. Are you Sara Cooper?",
      "speaker": "user"
    }},
    {{
      "number": 2,
      "marker": "[T2]",
      "quote": "Yes, I'm Sara Cooper. What's this about?",
      "speaker": "model"
    }}
  ]
}}"""

    # Prepare content
    contents = [types.Content(
        role="user",
        parts=[types.Part(text=analysis_prompt)]
    )]
    
    # Configure generation with thinking mode
    config = types.GenerateContentConfig(
        temperature=0.3,
        max_output_tokens=8192,
        tools=[RAG_TOOL],
        thinking_config=types.ThinkingConfig(
            thinking_budget=24576,  # Maximum allowed value
            include_thoughts=True  # Include thoughts in streaming
        ),
    )
    
    print("Calling Gemini with thinking mode enabled...")
    print("-" * 40)
    
    # Track state
    thinking_complete = False
    final_text_buffer = []
    grounding_metadata = None
    full_response = ""
    grounding_chunks_collected = []
    chunk_count = 0
    
    try:
        # Generate content with streaming
        response_stream = client.models.generate_content_stream(
            model=MODEL_NAME,
            contents=contents,
            config=config,
        )
        
        print("\n--- STREAMING RESPONSE ---\n")
        
        for chunk in response_stream:
            chunk_count += 1
            if not chunk.candidates or not chunk.candidates[0].content:
                continue
            
            # POINT 1: Check for grounding metadata in streaming chunks
            if hasattr(chunk.candidates[0], 'grounding_metadata') and chunk.candidates[0].grounding_metadata:
                grounding_metadata = chunk.candidates[0].grounding_metadata
                
                # Extract grounding chunks immediately when we find them
                if hasattr(grounding_metadata, 'grounding_chunks') and grounding_metadata.grounding_chunks:
                    print(f"\n\n🎯 POINT 1: GROUNDING METADATA FOUND in chunk #{chunk_count}")
                    print(f"   Found {len(grounding_metadata.grounding_chunks)} grounding chunks")
                    
                    # Collect the chunks for citation formatting
                    for idx, g_chunk in enumerate(grounding_metadata.grounding_chunks):
                        if g_chunk.retrieved_context:
                            ctx = g_chunk.retrieved_context
                            chunk_info = {
                                'index': idx,
                                'title': ctx.title if hasattr(ctx, 'title') else 'Unknown',
                                'text': ctx.text if hasattr(ctx, 'text') else 'No text',
                                'uri': ctx.uri if hasattr(ctx, 'uri') else '#'
                            }
                            grounding_chunks_collected.append(chunk_info)
                            print(f"\n   Chunk {idx + 1}: {chunk_info['title']}")
                            print(f"   Text: {chunk_info['text']}")
                            print("   " + "-" * 80)
            
            # Process parts
            if chunk.candidates[0].content.parts:
                for part in chunk.candidates[0].content.parts:
                    if hasattr(part, 'thought') and part.thought:
                        # This is thinking content
                        if not thinking_complete and part.text:
                            print(f"THINKING: {part.text}", end="", flush=True)
                            full_response += f"THINKING: {part.text}"
                    elif part.text:
                        # This is final content
                        if not thinking_complete:
                            thinking_complete = True
                            print("\n\nTHINKING_COMPLETE\n")
                            full_response += "\n\nTHINKING_COMPLETE\n\n"
                        
                        print(part.text, end="", flush=True)
                        final_text_buffer.append(part.text)
                        full_response += part.text
        
        print("\n\n--- PROCESSING COMPLETE ---\n")
        
        # Combine final text
        final_text = ''.join(final_text_buffer)
        
        # POINT 2: Use grounding metadata to add citations to the generation
        if grounding_metadata:
            print("\n\n🎯 POINT 2: USING METADATA TO ADD CITATIONS")
            print(f"   We have {len(grounding_chunks_collected)} chunks to work with")
            
            # Show how to format citations inline
            formatted_text = format_citation_response(final_text, grounding_metadata)
            
            # Count how many citations were added
            import re
            original_citations = len(re.findall(r'\[\d+\]', final_text))
            new_citations = len(re.findall(r'\[\d+\]', formatted_text))
            print(f"   Added {new_citations - original_citations} inline citations to the text")
            
            print("\n   Example of formatted text with citations:")
            print("   " + "-" * 60)
            # Show a snippet that contains citations
            citation_example = re.search(r'[^.]*\[\d+\][^.]*\.', formatted_text)
            if citation_example:
                print(f"   ...{citation_example.group()}...")
            else:
                print(f"   {formatted_text[:200]}...")
        else:
            print("\n❌ No grounding metadata was found in the streaming response")
            formatted_text = final_text
        
        # Try to parse as JSON
        try:
            # Remove markdown code blocks if present
            json_text = formatted_text.strip()
            if json_text.startswith('```json'):
                json_text = json_text[7:]
                if json_text.endswith('```'):
                    json_text = json_text[:-3]
            elif json_text.startswith('```'):
                json_text = json_text[3:]
                if json_text.endswith('```'):
                    json_text = json_text[:-3]
            
            analysis = json.loads(json_text)
            print("\n\nPARSED ANALYSIS:")
            print(json.dumps(analysis, indent=2))
            
            # Show how citations would be included in the final response
            if grounding_metadata and hasattr(grounding_metadata, 'grounding_chunks'):
                citations = []
                for idx, chunk in enumerate(grounding_metadata.grounding_chunks):
                    if chunk.retrieved_context:
                        ctx = chunk.retrieved_context
                        citation = {
                            "number": idx + 1,
                            "marker": f"[{idx + 1}]",
                            "source": ctx.title if ctx.title else "Training Material",
                            "text": ctx.text[:300] if ctx.text else "",
                            "uri": ctx.uri if ctx.uri else ""
                        }
                        citations.append(citation)
                
                # Add citations to the analysis
                analysis["citations"] = citations
                
                print(f"\n\n✅ COMPLETE: CITATIONS ADDED TO ANALYSIS")
                print(f"   Total citations extracted: {len(citations)}")
                print(f"   These would be sent with the analysis - NO SECOND API CALL NEEDED!")
                
                print("\n   Sample citations:")
                for citation in citations[:3]:  # Show first 3
                    print(f"   [{citation['number']}] {citation['source'][:50]}...")
                    
                print("\n🎉 RESULT: Everything done in ONE streaming response!")
                print("   - Thinking process streamed ✓")
                print("   - Analysis generated ✓") 
                print("   - Grounding metadata captured ✓")
                print("   - Citations formatted and added ✓")
                print("   - NO second API call needed ✓")
                
        except json.JSONDecodeError as e:
            print(f"\n\nNote: Response may not be valid JSON: {e}")
        
        # Save full response for analysis
        with open('thinking_mode_response.txt', 'w') as f:
            f.write(full_response)
        print("\n\nFull response saved to thinking_mode_response.txt")
        
    except Exception as e:
        print(f"\n\nError during generation: {e}")
        import traceback
        traceback.print_exc()


def format_citation_response(response_text: str, grounding_metadata) -> str:
    """
    Format the response with inline citations based on grounding metadata.
    Adapted from the patent project.
    """
    if not grounding_metadata:
        return response_text
    
    try:
        # Check if we have the necessary attributes
        if not hasattr(grounding_metadata, 'grounding_supports') or not hasattr(grounding_metadata, 'grounding_chunks'):
            print("Grounding metadata missing supports or chunks")
            return response_text
            
        supports = grounding_metadata.grounding_supports
        chunks = grounding_metadata.grounding_chunks
        
        if not supports or not chunks:
            print("No supports or chunks found")
            return response_text
        
        # Sort supports by end_index in descending order
        sorted_supports = sorted(supports, key=lambda s: s.segment.end_index if hasattr(s, 'segment') else 0, reverse=True)
        
        text_with_citations = response_text
        for support in sorted_supports:
            if not hasattr(support, 'segment'):
                continue
                
            end_index = support.segment.end_index
            if hasattr(support, 'grounding_chunk_indices') and support.grounding_chunk_indices:
                # Create citation links
                citation_links = []
                for i in support.grounding_chunk_indices:
                    if i < len(chunks):
                        chunk = chunks[i]
                        if hasattr(chunk, 'retrieved_context') and chunk.retrieved_context:
                            ctx = chunk.retrieved_context
                            uri = ctx.uri if hasattr(ctx, 'uri') else '#'
                            title = ctx.title if hasattr(ctx, 'title') else 'Training Material'
                            citation_links.append(f"[{i + 1}]({uri} '{title}')")
                
                if citation_links:
                    citation_string = " " + ", ".join(citation_links)
                    # Insert citation at the appropriate position
                    if end_index <= len(text_with_citations):
                        text_with_citations = text_with_citations[:end_index] + citation_string + text_with_citations[end_index:]
        
        return text_with_citations
    except Exception as e:
        print(f"Error formatting citations: {e}")
        return response_text


def test_local_streaming_endpoint():
    """Test the streaming endpoint locally to see the response format."""
    
    print("\n\n" + "=" * 80)
    print("TESTING LOCAL STREAMING ENDPOINT")
    print("=" * 80)
    
    # Simple test data
    transcript = [
        {
            "role": "user",
            "parts": "Hello, I'm from Child Protective Services. Are you Sara Cooper?"
        },
        {
            "role": "model",
            "parts": "Yes, I'm Sara Cooper. What's this about?"
        }
    ]
    
    assessment = {
        "introduction": "I introduced myself and verified identity.",
        "reasonForContact": "Not yet explained.",
        "responsiveToParent": "N/A",
        "permissionToEnter": "Not yet asked.",
        "gatheringInformation": "Not started.",
        "processAndNextSteps": "Not explained."
    }
    
    payload = {
        "action": "analyze",
        "transcript": transcript,
        "assessment": assessment,
        "systemInstruction": "You are an expert social work educator. Be brief in your response."
    }
    
    url = "http://localhost:8080"
    headers = {"Content-Type": "application/json"}
    
    print(f"Calling {url} with streaming...")
    print("-" * 40)
    
    try:
        response = requests.post(url, json=payload, headers=headers, stream=True)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print("Error response:")
            print(response.text)
            return
        
        # Read the streamed response
        full_response = ""
        for chunk in response.iter_content(chunk_size=None, decode_unicode=True):
            if chunk:
                full_response += chunk
                # Show first 100 chars of each chunk
                preview = chunk[:100] + "..." if len(chunk) > 100 else chunk
                print(f"CHUNK: {preview}")
        
        print(f"\n\nTotal response length: {len(full_response)} characters")
        
        # Check for the markers
        if "[ANALYSIS_COMPLETE]" in full_response:
            print("✓ Found [ANALYSIS_COMPLETE] marker")
        if "[CITATIONS_COMPLETE]" in full_response:
            print("✓ Found [CITATIONS_COMPLETE] marker")
            
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    print("Social Work Analysis - Thinking Mode Test")
    print("This demonstrates how to use thinking mode and single-pass citations\n")
    
    # Test the thinking mode approach
    test_thinking_mode_analysis()
