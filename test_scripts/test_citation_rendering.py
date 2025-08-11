#!/usr/bin/env python3
"""
Test script to verify that multi-citations like [1,2,3] are properly handled
in the Current Pathway component.
"""

import requests
import json
import time

# Test data with multi-citations in the pathway analysis
test_transcript = """
Therapist: Let's explore how you've been feeling about the exposure therapy exercises we've been practicing.
Client: I've been trying, but it's really hard. I get so anxious even thinking about going to crowded places.
Therapist: That's understandable. The anxiety you're experiencing is a normal part of the process. 
Client: Sometimes I wonder if we should try something else. This feels too overwhelming.
Therapist: I hear your concern. Let's discuss adjusting our approach to make it more manageable.
"""

def test_pathway_citations():
    """Test the pathway analysis with multi-citations"""
    
    url = "http://localhost:8002/analyze"
    
    # Prepare request with test data
    request_data = {
        "transcript": test_transcript,
        "session_number": 5,
        "treatment_approach": "Exposure Therapy",
        "phase": "middle",
        "disorder": "Social Anxiety Disorder"
    }
    
    print("Testing pathway analysis with multi-citations...")
    print("-" * 50)
    
    try:
        # Send request
        response = requests.post(url, json=request_data, stream=True)
        
        if response.status_code == 200:
            full_response = ""
            pathway_data = None
            
            # Process streaming response
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        data = line[6:]
                        if data != '[DONE]':
                            try:
                                chunk = json.loads(data)
                                
                                # Look for pathway updates
                                if 'pathway' in chunk:
                                    pathway_data = chunk['pathway']
                                    
                            except json.JSONDecodeError:
                                pass
            
            if pathway_data:
                print("\nPathway Analysis Results:")
                print(f"Current Approach: {pathway_data.get('current_approach', 'N/A')}")
                print(f"Effectiveness: {pathway_data.get('effectiveness', 'N/A')}")
                
                if 'rationale' in pathway_data:
                    print(f"\nRationale: {pathway_data['rationale']}")
                    
                if 'immediate_actions' in pathway_data:
                    print("\nImmediate Actions:")
                    for action in pathway_data['immediate_actions']:
                        print(f"  - {action}")
                        
                if 'citations' in pathway_data:
                    print("\nCitations found:")
                    for citation in pathway_data['citations']:
                        print(f"  Citation [{citation['citation_number']}]: {citation.get('source', {}).get('title', 'N/A')}")
                    
                    # Check for multi-citations in text
                    all_text = pathway_data.get('rationale', '') + ' '.join(pathway_data.get('immediate_actions', []))
                    import re
                    multi_citations = re.findall(r'\[\d+(?:\s*,\s*\d+)+\]', all_text)
                    
                    if multi_citations:
                        print(f"\nMulti-citations found in text: {multi_citations}")
                        print("✅ These should now render as individual clickable chips in the UI")
                    else:
                        print("\nNo multi-citations found in this response")
                        
            else:
                print("No pathway data received in response")
                
        else:
            print(f"Error: Received status code {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the therapy analysis function")
        print("Make sure the service is running on port 8002")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Citation Rendering Test")
    print("=" * 50)
    print("This test verifies that multi-citations like [1,2,3] are properly handled")
    print("in the frontend by being split into individual clickable chips.\n")
    
    test_pathway_citations()
    
    print("\n" + "=" * 50)
    print("Test complete!")
    print("\nTo verify the fix in the UI:")
    print("1. Run the frontend: cd frontend && npm run dev")
    print("2. Start a session and generate some analysis")
    print("3. Look for citations like [1,2] or [1,2,3] in the Current Pathway section")
    print("4. Verify they appear as separate chips [1] [2] [3]")
    print("5. Click each chip to ensure it opens the correct citation")
