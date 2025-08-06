#!/usr/bin/env python3
"""
Test script for the new streaming analysis with grounding metadata.
Streams to terminal and saves to a timestamped file.
"""

import requests
import json
import os
from datetime import datetime
from typing import Dict, List, Any

# Configuration
CLOUD_URL = "https://us-central1-wz-case-worker-mentor.cloudfunctions.net/analysis-function"
LOCAL_URL = "http://localhost:8080"

# Use local for testing, cloud for production
FUNCTION_URL = LOCAL_URL  # Change to CLOUD_URL for production

# Output file - save in the same directory as this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, f"test_streaming_output_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt")

# Test data - Good example (Sara Cooper)
test_transcript_good = [
    {
        "role": "user",
        "parts": "Hello, I'm Willis from Child Protective Services. I'm here because we received a report concerning the welfare of the children in this home - Jasmine and Jasper. I need to speak with you and conduct a safety assessment. Are you Sara Cooper? May I come in so we can discuss this privately? I want to let you know that we take all reports seriously, and my primary concern is ensuring the safety and wellbeing of the children. This is a standard procedure when we receive reports, and I'd like to hear your perspective on the situation."
    },
    {
        "role": "model",
        "parts": "Yes, I'm Sara Cooper. Come in. What's this about? Is everything okay with Jasmine and Jasper? Has Shawn done something?"
    },
    {
        "role": "user",
        "parts": "Thank you for letting me in, Ms. Cooper. I can see you're concerned, and I want to be straightforward with you. We received a report from Jasmine's school indicating that she disclosed witnessing some concerning incidents at home involving violence between you and Shawn. *settles in, maintaining a calm, professional demeanor* I want you to know that I'm not here to make judgments or to take your children away immediately. My job is to assess the safety of Jasmine and Jasper and to understand what's been happening in your home. The report mentioned both domestic violence and possible substance use. Are the children here right now? I'll need to speak with you about the allegations, see the children to make sure they're safe, and then we'll discuss what support and resources might be available to help your family. Can you tell me about your relationship with Shawn and what's been going on lately? I know this is difficult, but I need to understand the situation from your perspective."
    },
    {
        "role": "model",
        "parts": "Come in. Please. I... I know why you're here. Jasmine... she always talks a lot. Jasper is here, he's just napping in his crib. My mom took Jasmine to school.\n\nLook, I already told someone from your office that I've been using some stuff again. Shawn... he got me back into it. He pushed me. He said it was something we could do together. I know... I know I messed up. I just don't want to lose my kids again. I can't. I'll do anything. But Shawn, he's in jail now, right? He got arrested for drugs the other day. He was trying to blame me, saying it was my stuff. He always tries to blame me for everything. Our relationship... it's just complicated. He gets... stressed. It's been hard, but he's gone now. It's fine."
    }
]

test_assessment_good = {
    "introduction": "I introduced myself as Willis from the Oregon Department of Human Services, Child Welfare division. I showed my ID and provided a business card. I confirmed the parent's identity by asking 'Are you Sara Cooper?' before proceeding. I feel I did this well, maintaining a professional yet approachable demeanor.",
    "reasonForContact": "I clearly stated we received a report about concerns for the children's safety, specifically mentioning the report from Jasmine's school about witnessing incidents at home. I tried to use neutral language like 'concerns' instead of 'allegations' to reduce defensiveness. I emphasized that I wanted to hear her perspective.",
    "responsiveToParent": "When Sara became emotional and started talking about her substance use and relationship with Shawn, I listened without judgment and validated her feelings. I asked follow-up questions from a place of curiosity rather than interrogation.",
    "permissionToEnter": "I asked 'May I come in so we can discuss this privately?' and waited for her explicit consent. When she invited me in, I thanked her. I also asked if anyone else was home, which helped me understand who was present.",
    "gatheringInformation": "I gathered information about multiple areas: the substance use issue, domestic violence concerns, support systems (her mother), and current safety (Shawn being in jail). I asked about tribal affiliation to ensure appropriate resources.",
    "processAndNextSteps": "I provided information about the assessment process and discussed potential resources and support. I explained that we would need to see the children and assess their safety."
}

# Test data - Poor example
test_transcript_poor = [
    {"role": "user", "parts": "Hi, I'm from CPS. We got a call about your kids. I need to come in and look around."},
    {"role": "model", "parts": "What? Who are you? Do you have some ID? What call?"},
    {"role": "user", "parts": "Look, we know there's been violence in the home and drug use. Your daughter told her teacher. I need to see the kids now and check the house. This is serious."},
    {"role": "model", "parts": "I don't have to let you in! You can't just show up here making accusations! Where's your warrant? My kids are fine!"},
    {"role": "user", "parts": "Ma'am, if you don't cooperate, I'll have to call the police. We have reports of abuse and neglect. Do you really want to make this harder than it needs to be? Where's Shawn? Is he here?"},
    {"role": "model", "parts": "Get off my property! You have no right! I'm calling my lawyer! My kids are at school where they're supposed to be, and you're harassing me! Shawn's not here, he's in jail, okay? Are you happy now?"}
]

test_assessment_poor = {
    "introduction": "poor",
    "reason": "poor", 
    "responsive": "poor",
    "permission": "notDemonstrated",
    "informationGathering": "poor",
    "nextSteps": "notDemonstrated",
    "reflection": "I came on too strong and immediately put the parent on the defensive. I should have been more professional and empathetic."
}

def log_to_file_and_console(message: str, file_handle):
    """Print to console and write to file"""
    print(message)
    file_handle.write(message + '\n')
    file_handle.flush()

def test_streaming_analysis(test_name: str, transcript: List[Dict], assessment: Dict, file_handle):
    """Test the analysis endpoint with streaming and capture all data"""
    
    log = lambda msg: log_to_file_and_console(msg, file_handle)
    
    log(f"\n{'='*80}")
    log(f"TEST: {test_name}")
    log(f"{'='*80}")
    
    request_body = {
        "action": "analyze",
        "transcript": transcript,
        "assessment": assessment,
        "systemInstruction": "You are an expert social work educator analyzing a parent interview transcript. Provide feedback based on best practices in child welfare."
    }
    
    log(f"\nSending request to: {FUNCTION_URL}")
    log(f"Request size: {len(json.dumps(request_body))} bytes")
    log(f"Transcript items: {len(transcript)}")
    
    try:
        # Make streaming request
        response = requests.post(
            FUNCTION_URL,
            json=request_body,
            headers={'Content-Type': 'application/json'},
            stream=True
        )
        
        if response.status_code != 200:
            log(f"\nERROR: Status code {response.status_code}")
            log(f"Response: {response.text}")
            return None
        
        log("\n--- STREAMING RESPONSE ---")
        
        # Track state
        full_response = ""
        thinking_content = []
        final_content = []
        analysis_data = None
        citations_data = None
        thinking_complete = False
        
        # Process streaming response
        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                full_response += decoded_line + "\n"
                
                # Check for thinking complete marker
                if "THINKING_COMPLETE" in decoded_line:
                    thinking_complete = True
                    log("\n[THINKING COMPLETE - Switching to final response]\n")
                    continue
                
                # Check for analysis complete marker
                if "[ANALYSIS_COMPLETE]" in decoded_line:
                    log("\n[ANALYSIS DATA RECEIVED]")
                    start_idx = decoded_line.find("[ANALYSIS_COMPLETE]") + len("[ANALYSIS_COMPLETE]")
                    json_text = decoded_line[start_idx:].strip()
                    if json_text:
                        try:
                            analysis_data = json.loads(json_text)
                            log(f"Successfully parsed analysis with {len(analysis_data)} keys")
                        except json.JSONDecodeError as e:
                            log(f"Error parsing analysis JSON: {e}")
                    continue
                
                # Check for citations complete marker
                if "[CITATIONS_COMPLETE]" in decoded_line:
                    log("\n[CITATIONS DATA RECEIVED]")
                    start_idx = decoded_line.find("[CITATIONS_COMPLETE]") + len("[CITATIONS_COMPLETE]")
                    json_text = decoded_line[start_idx:].strip()
                    if json_text:
                        try:
                            citations_data = json.loads(json_text)
                            log(f"Successfully parsed {len(citations_data.get('citations', []))} citations")
                        except json.JSONDecodeError as e:
                            log(f"Error parsing citations JSON: {e}")
                    continue
                
                # Track thinking vs final content
                if decoded_line.startswith("THINKING:"):
                    thinking_content.append(decoded_line)
                    # Show abbreviated thinking in console, full in file
                    if len(decoded_line) > 100:
                        print(decoded_line[:97] + "...")
                    else:
                        print(decoded_line)
                    file_handle.write(decoded_line + '\n')
                elif thinking_complete and decoded_line.strip():
                    final_content.append(decoded_line)
                    print(decoded_line)
                    file_handle.write(decoded_line + '\n')
                else:
                    # Other content
                    print(decoded_line)
                    file_handle.write(decoded_line + '\n')
                
                file_handle.flush()
        
        log("\n--- STREAMING COMPLETE ---")
        
        # Analyze results
        if analysis_data:
            log("\n=== ANALYSIS SUMMARY ===")
            log(f"Overall Summary: {analysis_data.get('overallSummary', 'N/A')[:200]}...")
            log(f"Strengths: {len(analysis_data.get('strengths', []))}")
            log(f"Areas for Improvement: {len(analysis_data.get('areasForImprovement', []))}")
            log(f"Criteria Analysis: {len(analysis_data.get('criteriaAnalysis', []))}")
            log(f"Transcript Citations: {len(analysis_data.get('transcriptCitations', []))}")
            
            # Check citations in analysis
            analysis_citations = analysis_data.get('citations', [])
            log(f"\nCitations in analysis object: {len(analysis_citations)}")
            
            if analysis_citations:
                log("\nFirst 3 citations from analysis:")
                for i, cit in enumerate(analysis_citations[:3]):
                    log(f"  [{cit['number']}] {cit.get('source', 'Unknown')}")
                    if cit.get('pages'):
                        log(f"       Pages: {cit['pages']}")
            
            # Save full analysis JSON
            log("\n=== FULL ANALYSIS JSON ===")
            log(json.dumps(analysis_data, indent=2))
        
        # Check citation markers in text
        if analysis_data:
            all_text = json.dumps(analysis_data)
            curriculum_markers = []
            transcript_markers = []
            
            for i in range(1, 30):
                if f"[{i}]" in all_text:
                    curriculum_markers.append(f"[{i}]")
                if f"[T{i}]" in all_text:
                    transcript_markers.append(f"[T{i}]")
            
            log(f"\nCitation markers found:")
            log(f"  Curriculum citations: {', '.join(curriculum_markers) if curriculum_markers else 'None'}")
            log(f"  Transcript citations: {', '.join(transcript_markers) if transcript_markers else 'None'}")
        
        log(f"\nThinking chunks: {len(thinking_content)}")
        log(f"Final content chunks: {len(final_content)}")
        log(f"Total response size: {len(full_response)} bytes")
        
        return analysis_data
        
    except Exception as e:
        log(f"\nEXCEPTION: {e}")
        import traceback
        log(traceback.format_exc())
        return None

def main():
    """Run tests and save results"""
    
    print(f"Starting analysis tests at {datetime.now()}")
    print(f"Results will be saved to: {OUTPUT_FILE}")
    
    with open(OUTPUT_FILE, 'w') as f:
        log = lambda msg: log_to_file_and_console(msg, f)
        
        log("SOCIAL WORK ANALYSIS - STREAMING TEST")
        log(f"Test started: {datetime.now()}")
        log(f"Function URL: {FUNCTION_URL}")
        log(f"Output file: {OUTPUT_FILE}")
        
        # Test 1: Good example
        good_result = test_streaming_analysis(
            "Good Interview Example (Sara Cooper)",
            test_transcript_good,
            test_assessment_good,
            f
        )
        
        # Test 2: Poor example  
        poor_result = test_streaming_analysis(
            "Poor Interview Example",
            test_transcript_poor,
            test_assessment_poor,
            f
        )
        
        # Summary
        log(f"\n{'='*80}")
        log("TEST SUMMARY")
        log(f"{'='*80}")
        log(f"Good example: {'✓ Passed' if good_result else '✗ Failed'}")
        log(f"Poor example: {'✓ Passed' if poor_result else '✗ Failed'}")
        
        # Check citation differences
        if good_result and poor_result:
            good_citations = len(good_result.get('citations', []))
            poor_citations = len(poor_result.get('citations', []))
            log(f"\nCitation comparison:")
            log(f"  Good example citations: {good_citations}")
            log(f"  Poor example citations: {poor_citations}")
        
        log(f"\nTest completed: {datetime.now()}")
        log(f"Results saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
