#!/usr/bin/env python3
"""
Test the streaming response format that the frontend expects.
This helps verify the backend is sending data in the correct format.
"""

import asyncio
import aiohttp
import json

CLOUD_FUNCTION_URL = "https://us-central1-wz-case-worker-mentor.cloudfunctions.net/analysis-function"

# Test data
test_transcript = [
    {"role": "model", "parts": "Can I help you?"},
    {"role": "user", "parts": "Hi, I'm from Child Protective Services. I'm here to check on your children."},
    {"role": "model", "parts": "What? Why are you here? My kids are fine."},
    {"role": "user", "parts": "We received a report of concern. May I come in to talk with you?"},
    {"role": "model", "parts": "I guess so. Come in."}
]

test_assessment = {
    "introduction": "I introduced myself as being from CPS.",
    "reason": "I explained we received a report of concern.",
    "responsive": "I tried to be calm when the parent was defensive.",
    "permission": "I asked permission to enter.",
    "information": "I didn't gather much information yet.",
    "process": "I haven't explained next steps yet."
}

async def test_streaming():
    """Test the streaming response from the cloud function."""
    
    request_data = {
        "action": "analyze",
        "transcript": test_transcript,
        "assessment": test_assessment,
        "systemInstruction": "You are an expert social work educator..."
    }
    
    async with aiohttp.ClientSession() as session:
        print("Sending request to cloud function...")
        
        async with session.post(
            CLOUD_FUNCTION_URL,
            json=request_data,
            headers={"Content-Type": "application/json"}
        ) as response:
            print(f"Response status: {response.status}")
            
            if response.status != 200:
                error_text = await response.text()
                print(f"Error response: {error_text}")
                return
            
            # Read the streaming response
            full_text = ""
            analysis_json = None
            citations_json = None
            
            print("\n--- Streaming Response ---")
            async for chunk in response.content.iter_any():
                chunk_text = chunk.decode('utf-8')
                full_text += chunk_text
                print(chunk_text, end='', flush=True)
                
                # Check for complete analysis marker
                if '[ANALYSIS_COMPLETE]\n' in full_text and not analysis_json:
                    analysis_start = full_text.find('[ANALYSIS_COMPLETE]\n') + len('[ANALYSIS_COMPLETE]\n')
                    citations_marker = full_text.find('[CITATIONS_COMPLETE]\n')
                    
                    if citations_marker != -1:
                        analysis_text = full_text[analysis_start:citations_marker].strip()
                    else:
                        # See if we have a complete JSON by checking for balanced braces
                        analysis_text = full_text[analysis_start:].strip()
                        if analysis_text.count('{') == analysis_text.count('}') and analysis_text.endswith('}'):
                            pass  # We have complete JSON
                        else:
                            continue  # Wait for more data
                    
                    try:
                        analysis_json = json.loads(analysis_text)
                        print(f"\n\n✅ Successfully parsed analysis JSON with {len(analysis_json)} keys")
                    except json.JSONDecodeError as e:
                        print(f"\n\n❌ Failed to parse analysis JSON: {e}")
                        print(f"Text length: {len(analysis_text)}")
                        print(f"First 100 chars: {analysis_text[:100]}...")
                        print(f"Last 100 chars: ...{analysis_text[-100:]}")
                
                # Check for complete citations marker
                if '[CITATIONS_COMPLETE]\n' in full_text and not citations_json:
                    citations_start = full_text.find('[CITATIONS_COMPLETE]\n') + len('[CITATIONS_COMPLETE]\n')
                    citations_text = full_text[citations_start:].strip()
                    
                    # Check if we have complete JSON
                    if citations_text and citations_text.count('{') == citations_text.count('}') and citations_text.endswith('}'):
                        try:
                            citations_json = json.loads(citations_text)
                            print(f"\n✅ Successfully parsed citations JSON with {len(citations_json.get('citations', []))} citations")
                        except json.JSONDecodeError as e:
                            print(f"\n❌ Failed to parse citations JSON: {e}")
            
            print("\n\n--- Final Results ---")
            print(f"Total response length: {len(full_text)} characters")
            
            if analysis_json:
                print(f"\nAnalysis JSON keys: {list(analysis_json.keys())}")
                if 'overallSummary' in analysis_json:
                    print(f"Overall Summary: {analysis_json['overallSummary'][:100]}...")
                if 'strengths' in analysis_json:
                    print(f"Number of strengths: {len(analysis_json['strengths'])}")
                if 'areasForImprovement' in analysis_json:
                    print(f"Number of areas for improvement: {len(analysis_json['areasForImprovement'])}")
            
            if citations_json and 'citations' in citations_json:
                print(f"\nNumber of citations: {len(citations_json['citations'])}")
                for i, citation in enumerate(citations_json['citations'][:3]):
                    print(f"  Citation {i+1}: {citation.get('source', 'Unknown source')}")


if __name__ == "__main__":
    print("Testing streaming response format...")
    asyncio.run(test_streaming())
