#!/usr/bin/env python3
"""
Test script to call main.py analysis endpoint and capture raw streaming output
Shows the exact raw chunk data structures sent to frontend
"""

import requests
import json
from datetime import datetime
import sys

def test_main_streaming():
    """Test the main.py analysis endpoint with raw streaming output"""
    
    # Configuration
    # Use local URL for testing with functions-framework
    BASE_URL = "http://localhost:8080"  # Change to deployed URL if needed
    
    # Create output file with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_filename = f"test_main_raw_output_{timestamp}.txt"
    
    # Test data
    transcript = [
        {
            "role": "user",
            "parts": "Hi, I'm from CPS. We got a call about your kids. I need to come in and look around."
        },
        {
            "role": "model", 
            "parts": "What? Who are you? Do you have some ID? What call?"
        },
        {
            "role": "user",
            "parts": "Look, we know there's been violence in the home and drug use. Your daughter told her teacher. I need to see the kids now and check the house. This is serious."
        },
        {
            "role": "model",
            "parts": "I don't have to let you in! You can't just show up here making accusations! Where's your warrant? My kids are fine!"
        }
    ]
    
    assessment = {
        "reflection": "I realize my approach was too confrontational and I failed to properly introduce myself."
    }
    
    # Request payload
    payload = {
        "action": "analyze",
        "transcript": transcript,
        "assessment": assessment
    }
    
    print(f"Output file: {output_filename}")
    print("=" * 80)
    print("RAW STREAMING OUTPUT FROM MAIN.PY")
    print("=" * 80)
    print()
    print(f"Starting request at {datetime.now()}")
    print(f"Endpoint: {BASE_URL}")
    print()
    
    # Open output file
    with open(output_filename, 'w', encoding='utf-8') as f:
        def log(message=""):
            """Print to console and write to file"""
            print(message, end='')
            f.write(message)
            f.flush()  # Ensure immediate write
        
        try:
            # Make streaming request
            response = requests.post(
                BASE_URL,
                json=payload,
                stream=True,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code != 200:
                log(f"ERROR: HTTP {response.status_code}\n")
                log(response.text)
                return
            
            log("=" * 80 + "\n")
            log("RAW RESPONSE STREAM:\n")
            log("=" * 80 + "\n\n")
            
            # Stream raw response
            for chunk in response.iter_content(chunk_size=None, decode_unicode=True):
                if chunk:
                    log(chunk)
            
            log("\n\n" + "=" * 80 + "\n")
            log("END OF RAW STREAMING OUTPUT\n")
            log(f"Completed at {datetime.now()}\n")
            
        except requests.exceptions.ConnectionError:
            log("\nERROR: Could not connect to the server.\n")
            log("Make sure the function is running locally with:\n")
            log("  cd backend/analysis-function\n")
            log("  functions-framework --target social_work_ai --debug\n")
        except Exception as e:
            log(f"\nERROR: {e}\n")
            import traceback
            log(traceback.format_exc())
    
    print(f"\nOutput saved to: {output_filename}")

if __name__ == "__main__":
    # Check if a URL argument was provided
    if len(sys.argv) > 1:
        BASE_URL = sys.argv[1]
        print(f"Using provided URL: {BASE_URL}")
    
    test_main_streaming()
