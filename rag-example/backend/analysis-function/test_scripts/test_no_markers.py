#!/usr/bin/env python3
"""
Quick test to see if AI adds citation markers after our prompt update
"""

import requests
import json
import re

FUNCTION_URL = "http://localhost:8080"

# Simple test transcript
test_transcript = [
    {
        "role": "user",
        "parts": "Hi, I'm Willis from Child Protective Services. I need to speak with you about a report we received."
    },
    {
        "role": "model", 
        "parts": "What? What's this about?"
    }
]

test_assessment = {
    "reflection": "I think I could have done better with my introduction."
}

def test_for_markers():
    """Test if the AI adds citation markers"""
    
    payload = {
        "action": "analyze",
        "transcript": test_transcript,
        "assessment": test_assessment
    }
    
    print("Sending test request...")
    
    response = requests.post(
        FUNCTION_URL,
        json=payload,
        headers={"Content-Type": "application/json"},
        stream=True
    )
    
    if response.status_code != 200:
        print(f"ERROR: Status code {response.status_code}")
        return
    
    # Collect the full response
    full_response = ""
    for line in response.iter_lines():
        if line:
            full_response += line.decode('utf-8') + "\n"
    
    # Look for citation markers in the response
    # Pattern to find [number] or [number, number] etc but NOT [T#]
    citation_pattern = r'\[(?!T)\d+(?:,\s*\d+)*\]'
    
    markers_found = re.findall(citation_pattern, full_response)
    
    print(f"\nCitation markers found: {len(markers_found)}")
    if markers_found:
        print("Examples:", markers_found[:5])
        print("\nThe AI is still adding citation markers despite instructions!")
    else:
        print("Good! The AI is not adding citation markers.")
    
    # Also check if we got grounding chunks
    if '"citations":' in full_response:
        # Extract citations count
        match = re.search(r'"citations":\s*\[(.*?)\]', full_response, re.DOTALL)
        if match:
            citations_str = match.group(1)
            # Count citations by counting "number" fields
            citation_count = citations_str.count('"number"')
            print(f"\nGrounding chunks captured: {citation_count}")

if __name__ == "__main__":
    test_for_markers()
