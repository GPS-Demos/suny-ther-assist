#!/usr/bin/env python3
"""
Debug script to prove we get grounding metadata from the RAG store.
Focuses on one test case with extensive logging of grounding chunks.
"""

import requests
import json
import os
from datetime import datetime
from typing import Dict, List, Any

# Configuration
CLOUD_URL = "https://us-central1-wz-case-worker-mentor.cloudfunctions.net/analysis-function"
LOCAL_URL = "http://localhost:8080"

# Use local for testing
FUNCTION_URL = LOCAL_URL

# Output file
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, f"grounding_debug_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt")

# Test data - Good example only
test_transcript = [
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

test_assessment = {
    "introduction": "I introduced myself as Willis from the Oregon Department of Human Services, Child Welfare division. I showed my ID and provided a business card. I confirmed the parent's identity by asking 'Are you Sara Cooper?' before proceeding. I feel I did this well, maintaining a professional yet approachable demeanor.",
    "reasonForContact": "I clearly stated we received a report about concerns for the children's safety, specifically mentioning the report from Jasmine's school about witnessing incidents at home. I tried to use neutral language like 'concerns' instead of 'allegations' to reduce defensiveness. I emphasized that I wanted to hear her perspective.",
    "responsiveToParent": "When Sara became emotional and started talking about her substance use and relationship with Shawn, I listened without judgment and validated her feelings. I asked follow-up questions from a place of curiosity rather than interrogation.",
    "permissionToEnter": "I asked 'May I come in so we can discuss this privately?' and waited for her explicit consent. When she invited me in, I thanked her. I also asked if anyone else was home, which helped me understand who was present.",
    "gatheringInformation": "I gathered information about multiple areas: the substance use issue, domestic violence concerns, support systems (her mother), and current safety (Shawn being in jail). I asked about tribal affiliation to ensure appropriate resources.",
    "processAndNextSteps": "I provided information about the assessment process and discussed potential resources and support. I explained that we would need to see the children and assess their safety."
}

def log_to_file_and_console(message: str, file_handle):
    """Print to console and write to file"""
    print(message)
    file_handle.write(message + '\n')
    file_handle.flush()

def debug_grounding_metadata():
    """Test with extensive grounding metadata debugging"""
    
    with open(OUTPUT_FILE, 'w') as f:
        log = lambda msg: log_to_file_and_console(msg, f)
        
        log("GROUNDING METADATA DEBUG TEST")
        log(f"Started: {datetime.now()}")
        log(f"URL: {FUNCTION_URL}")
        log(f"Output: {OUTPUT_FILE}")
        log("="*80)
        
        request_body = {
            "action": "analyze",
            "transcript": test_transcript,
            "assessment": test_assessment,
            "systemInstruction": "You are an expert social work educator analyzing a parent interview transcript. Provide feedback based on best practices in child welfare."
        }
        
        log("\nSending analysis request...")
        log(f"Transcript items: {len(test_transcript)}")
        
        try:
            response = requests.post(
                FUNCTION_URL,
                json=request_body,
                headers={'Content-Type': 'application/json'},
                stream=True
            )
            
            if response.status_code != 200:
                log(f"\nERROR: Status code {response.status_code}")
                log(f"Response: {response.text}")
                return
            
            log("\n--- STREAMING RESPONSE DEBUG ---")
            
            # Track all data
            full_response = ""
            chunk_count = 0
            grounding_detected_chunks = []
            accumulated_grounding = []
            analysis_data = None
            citations_data = None
            
            # Process streaming response
            for line in response.iter_lines():
                if line:
                    chunk_count += 1
                    decoded_line = line.decode('utf-8')
                    full_response += decoded_line + "\n"
                    
                    # Skip thinking content for now
                    if decoded_line.startswith("THINKING:"):
                        continue
                    
                    # Log important markers
                    if "THINKING_COMPLETE" in decoded_line:
                        log(f"\n[Chunk {chunk_count}] Thinking complete, switching to final response")
                    
                    # CRITICAL: Check for grounding metadata in ANY line
                    # The backend might be sending grounding info in a special format
                    if "grounding" in decoded_line.lower():
                        log(f"\n[Chunk {chunk_count}] GROUNDING KEYWORD DETECTED!")
                        log(f"Content: {decoded_line[:200]}...")
                        grounding_detected_chunks.append(chunk_count)
                    
                    # Check for analysis complete
                    if "[ANALYSIS_COMPLETE]" in decoded_line:
                        log(f"\n[Chunk {chunk_count}] Analysis complete marker found")
                        start_idx = decoded_line.find("[ANALYSIS_COMPLETE]") + len("[ANALYSIS_COMPLETE]")
                        json_text = decoded_line[start_idx:].strip()
                        if json_text:
                            try:
                                analysis_data = json.loads(json_text)
                                log(f"Analysis parsed successfully")
                                
                                # Check for citations in analysis
                                if 'citations' in analysis_data:
                                    log(f"Citations in analysis: {len(analysis_data['citations'])}")
                                    if analysis_data['citations']:
                                        log("\nFirst citation example:")
                                        log(json.dumps(analysis_data['citations'][0], indent=2))
                                else:
                                    log("NO 'citations' key in analysis data!")
                                    
                            except json.JSONDecodeError as e:
                                log(f"Error parsing analysis: {e}")
                    
                    # Check for citations complete
                    if "[CITATIONS_COMPLETE]" in decoded_line:
                        log(f"\n[Chunk {chunk_count}] Citations complete marker found")
                        start_idx = decoded_line.find("[CITATIONS_COMPLETE]") + len("[CITATIONS_COMPLETE]")
                        json_text = decoded_line[start_idx:].strip()
                        if json_text:
                            try:
                                citations_data = json.loads(json_text)
                                log(f"Citations parsed: {len(citations_data.get('citations', []))} items")
                            except json.JSONDecodeError as e:
                                log(f"Error parsing citations: {e}")
            
            log(f"\n--- STREAMING COMPLETE ---")
            log(f"Total chunks processed: {chunk_count}")
            log(f"Chunks with 'grounding' keyword: {grounding_detected_chunks}")
            
            # Analyze the response
            log("\n=== ANALYSIS OF GROUNDING METADATA ===")
            
            # 1. Check if we see citation markers in the text
            if analysis_data:
                all_text = json.dumps(analysis_data)
                citation_markers = []
                for i in range(1, 20):
                    if f"[{i}]" in all_text:
                        citation_markers.append(f"[{i}]")
                
                log(f"\nCitation markers in response text: {citation_markers}")
                log(f"Total unique citation markers: {len(citation_markers)}")
            
            # 2. Check citations array
            if analysis_data and 'citations' in analysis_data:
                citations = analysis_data['citations']
                log(f"\nCitations array length: {len(citations)}")
                if citations:
                    log("\nAll citations:")
                    for i, cit in enumerate(citations):
                        log(f"\n[{i+1}] Source: {cit.get('source', 'Unknown')}")
                        log(f"    Text: {cit.get('text', '')[:100]}...")
                        log(f"    URI: {cit.get('uri', 'N/A')}")
                        log(f"    Pages: {cit.get('pages', 'N/A')}")
                else:
                    log("\nEMPTY CITATIONS ARRAY!")
            
            # 3. Search for grounding patterns in full response
            log("\n=== SEARCHING FOR GROUNDING PATTERNS ===")
            
            # Look for specific patterns that might indicate grounding
            patterns = [
                "grounding_metadata",
                "grounding_chunks", 
                "retrieved_context",
                "grounding_supports",
                "rag_chunk",
                "curriculum",
                "training material"
            ]
            
            for pattern in patterns:
                count = full_response.lower().count(pattern.lower())
                if count > 0:
                    log(f"Pattern '{pattern}': found {count} times")
            
            # 4. Show backend logs if present
            log("\n=== BACKEND LOG ANALYSIS ===")
            backend_log_lines = [line for line in full_response.split('\n') if 'INFO:' in line or 'DEBUG:' in line or 'ERROR:' in line]
            if backend_log_lines:
                log("Backend log entries found:")
                for line in backend_log_lines[:10]:  # First 10 log lines
                    log(f"  {line}")
            
            # Save full response for analysis
            log("\n=== SAVING FULL RESPONSE ===")
            with open(OUTPUT_FILE.replace('.txt', '_full.txt'), 'w') as full_f:
                full_f.write(full_response)
            log(f"Full response saved to: {OUTPUT_FILE.replace('.txt', '_full.txt')}")
            
            # Final verdict
            log("\n=== VERDICT ===")
            if citations_data and citations_data.get('citations'):
                log("✅ GROUNDING METADATA SUCCESSFULLY RETRIEVED AND FORMATTED")
            elif citation_markers:
                log("⚠️  Citation markers present but citations array is empty")
                log("    This suggests grounding is working but accumulation is failing")
            else:
                log("❌ No evidence of grounding metadata in response")
            
        except Exception as e:
            log(f"\nEXCEPTION: {e}")
            import traceback
            log(traceback.format_exc())
        
        log(f"\nTest completed: {datetime.now()}")

if __name__ == "__main__":
    debug_grounding_metadata()
