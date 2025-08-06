#!/usr/bin/env python3
"""Test script to verify citation accumulation during streaming"""

import requests
import json
import time
import os
from datetime import datetime

# Cloud Function URL
FUNCTION_URL = "https://us-central1-wz-case-worker-mentor.cloudfunctions.net/analysis-function"

# Output file - save in the same directory as this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, f"test_citation_output_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt")

# Test transcript
test_transcript = [
    {"role": "user", "parts": "Hi, I'm from CPS. We got a call about your kids. I need to come in and look around."},
    {"role": "model", "parts": "What? Who are you? Do you have some ID? What call?"},
    {"role": "user", "parts": "Look, we know there's been violence in the home and drug use. Your daughter told her teacher. I need to see the kids now and check the house. This is serious."},
    {"role": "model", "parts": "I don't have to let you in! You can't just show up here making accusations! Where's your warrant? My kids are fine!"},
    {"role": "user", "parts": "Ma'am, if you don't cooperate, I'll have to call the police. We have reports of abuse and neglect. Do you really want to make this harder than it needs to be? Where's Shawn? Is he here?"},
    {"role": "model", "parts": "Get off my property! You have no right! I'm calling my lawyer! My kids are at school where they're supposed to be, and you're harassing me! Shawn's not here, he's in jail, okay? Are you happy now?"},
    {"role": "user", "parts": "So you admit Shawn's been arrested? What was he arrested for? And what about the drugs? Are you using too? I'm going to need to drug test you today."},
    {"role": "model", "parts": "I'm not admitting anything! I want you to leave! I haven't done anything wrong! You people always assume the worst! Just because we've had some problems doesn't mean my kids aren't safe!"}
]

# Test assessment
test_assessment = {
    "introduction": "poor",
    "reason": "poor", 
    "responsive": "poor",
    "permission": "notDemonstrated",
    "informationGathering": "poor",
    "nextSteps": "notDemonstrated",
    "reflection": "I came on too strong and immediately put the parent on the defensive. I should have been more professional and empathetic."
}

def test_analysis():
    """Test the analysis endpoint with streaming"""
    
    # Open output file
    with open(OUTPUT_FILE, 'w') as f:
        def log(msg):
            """Print to console and write to file"""
            print(msg)
            f.write(msg + '\n')
            f.flush()
    
        request_body = {
            "action": "analyze",
            "transcript": test_transcript,
            "assessment": test_assessment,
            "systemInstruction": "Analyze the transcript and provide feedback"
        }
        
        log(f"Test started at: {datetime.now()}")
        log("Sending analysis request...")
        log(f"URL: {FUNCTION_URL}")
        log(f"Output file: {OUTPUT_FILE}")
        
        try:
            response = requests.post(
                FUNCTION_URL,
                json=request_body,
                headers={'Content-Type': 'application/json'},
                stream=True
            )
            
            if response.status_code != 200:
                log(f"Error: Status code {response.status_code}")
                log(f"Response: {response.text}")
                return
            
            log("\n=== STREAMING RESPONSE ===\n")
            
            full_response = ""
            analysis_data = None
            citations_data = None
            
            # Process streaming response
            for line in response.iter_lines():
                if line:
                    decoded_line = line.decode('utf-8')
                    full_response += decoded_line + "\n"
                    
                    # Check for analysis complete marker
                    if "[ANALYSIS_COMPLETE]" in decoded_line:
                        start_idx = decoded_line.find("[ANALYSIS_COMPLETE]") + len("[ANALYSIS_COMPLETE]")
                        json_text = decoded_line[start_idx:].strip()
                        if json_text:
                            try:
                                analysis_data = json.loads(json_text)
                                log("\n=== ANALYSIS DATA RECEIVED ===")
                            except json.JSONDecodeError as e:
                                log(f"Error parsing analysis JSON: {e}")
                    
                    # Check for citations complete marker
                    elif "[CITATIONS_COMPLETE]" in decoded_line:
                        start_idx = decoded_line.find("[CITATIONS_COMPLETE]") + len("[CITATIONS_COMPLETE]")
                        json_text = decoded_line[start_idx:].strip()
                        if json_text:
                            try:
                                citations_data = json.loads(json_text)
                                log("\n=== CITATIONS DATA RECEIVED ===")
                            except json.JSONDecodeError as e:
                                log(f"Error parsing citations JSON: {e}")
            
            # Save full response
            log("\n=== FULL RESPONSE ===")
            log(full_response)
            
            # Display results
            if analysis_data:
                log("\n=== FINAL ANALYSIS ===")
                log(f"Overall Summary: {analysis_data.get('overallSummary', 'N/A')}")
                
                # Save pretty-printed JSON
                log("\n=== ANALYSIS JSON ===")
                log(json.dumps(analysis_data, indent=2))
                
                # Check for citations in the analysis
                if 'citations' in analysis_data and analysis_data['citations']:
                    log(f"\nCitations in analysis: {len(analysis_data['citations'])}")
                    for i, citation in enumerate(analysis_data['citations']):
                        log(f"\nCitation {i+1}:")
                        log(f"  Source: {citation.get('source', 'N/A')}")
                        log(f"  Pages: {citation.get('pages', 'N/A')}")
                        log(f"  Text: {citation.get('text', 'N/A')}")
                        log(f"  URI: {citation.get('uri', 'N/A')}")
                else:
                    log("\nNO CITATIONS FOUND IN ANALYSIS!")
                
                # Check citation markers in text
                citation_markers = []
                for i in range(1, 20):  # Check for markers [1] through [19]
                    if f"[{i}]" in analysis_data.get('overallSummary', ''):
                        citation_markers.append(f"[{i}]")
                
                if citation_markers:
                    log(f"\nCitation markers found in overall summary: {', '.join(citation_markers)}")
                else:
                    log("\nNo citation markers found in overall summary")
                
                # Check all text fields for citation markers
                all_text = json.dumps(analysis_data)
                all_markers = []
                for i in range(1, 20):
                    if f"[{i}]" in all_text:
                        all_markers.append(f"[{i}]")
                
                if all_markers:
                    log(f"\nAll citation markers found in response: {', '.join(all_markers)}")
                    
            else:
                log("\n=== NO ANALYSIS DATA RECEIVED ===")
                log("Full response preview:")
                log(full_response[:1000])
                
        except Exception as e:
            log(f"Error: {e}")
            import traceback
            log(traceback.format_exc())
        
        log(f"\nTest completed at: {datetime.now()}")
        log(f"Results saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    test_analysis()
