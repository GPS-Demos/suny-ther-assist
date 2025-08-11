#!/usr/bin/env python3
"""
Simple test to see what the backend returns for the exact transcript chunks.
"""

import requests
import json

# The exact transcript you provided
TRANSCRIPT = [
    {"speaker": "THERAPIST", "text": "Good afternoon, Sarah. How are you feeling today?", "timestamp": "09:54:10 PM"},
    {"speaker": "PATIENT", "text": "I've been having a really tough week. The anxiety has been pretty overwhelming.", "timestamp": "09:54:12 PM"},
    {"speaker": "THERAPIST", "text": "I'm sorry to hear you're struggling. Can you tell me more about what's been triggering your anxiety this week?", "timestamp": "09:54:14 PM"},
    {"speaker": "PATIENT", "text": "It's mostly work situations. I had to give a presentation, and I kept thinking everyone was judging me. I could feel my heart racing, and I started sweating. I almost had to leave the room.", "timestamp": "09:54:16 PM"},
]

# Backend endpoint - using the actual deployed Cloud Run service
ENDPOINT = "https://therapy-analysis-mlofelg76a-uc.a.run.app/therapy_analysis"

def test_backend():
    """Test the backend with the exact transcript."""
    
    # Prepare the request exactly as the frontend would
    payload = {
        "action": "analyze_segment",
        "transcript_segment": TRANSCRIPT,
        "session_context": {
            "session_type": "CBT",
            "primary_concern": "Anxiety, Social anxiety",
            "current_approach": "Cognitive Behavioral Therapy"
        },
        "session_duration_minutes": 5,
        "is_realtime": True  # Fast mode
    }
    
    print("=" * 80)
    print("TESTING BACKEND WITH YOUR TRANSCRIPT")
    print("=" * 80)
    print("\n📤 SENDING REQUEST:")
    print(json.dumps(payload, indent=2))
    
    try:
        # Make the request
        response = requests.post(ENDPOINT, json=payload, timeout=30)
        
        print(f"\n📥 RESPONSE STATUS: {response.status_code}")
        print(f"📥 CONTENT TYPE: {response.headers.get('content-type', 'Not specified')}")
        
        # Show raw response first
        print("\n📥 RAW RESPONSE (first 1000 chars):")
        print(response.text[:1000])
        
        # Try to parse as JSON
        if response.status_code == 200:
            try:
                # Handle streaming responses
                if response.headers.get('content-type') == 'text/plain':
                    # Get the last line which should be the JSON
                    lines = response.text.strip().split('\n')
                    for line in reversed(lines):
                        if line.strip():
                            try:
                                data = json.loads(line)
                                break
                            except:
                                continue
                else:
                    data = response.json()
                
                print("\n📥 PARSED JSON RESPONSE:")
                print(json.dumps(data, indent=2))
                
                # Check for alerts and their timing fields
                if "alerts" in data:
                    print(f"\n✅ Found {len(data['alerts'])} alerts")
                    for i, alert in enumerate(data['alerts']):
                        print(f"\nAlert #{i+1}:")
                        print(f"  Timing: {alert.get('timing', 'MISSING!')}")
                        print(f"  Category: {alert.get('category', 'MISSING!')}")
                        print(f"  Title: {alert.get('title', 'MISSING!')}")
                        print(f"  Message: {alert.get('message', 'MISSING!')[:100]}...")
                        
                        # Check timing field
                        if 'timing' not in alert:
                            print("  ❌ MISSING TIMING FIELD - THIS WILL SHOW AS GRAY!")
                        elif alert['timing'] not in ['now', 'pause', 'info']:
                            print(f"  ❌ INVALID TIMING VALUE '{alert['timing']}' - THIS WILL SHOW AS GRAY!")
                        else:
                            print(f"  ✅ Valid timing: {alert['timing']}")
                else:
                    print("\n❌ No alerts in response")
                    
            except Exception as e:
                print(f"\n❌ Failed to parse JSON: {e}")
        else:
            print(f"\n❌ Backend returned error status {response.status_code}")
            
    except Exception as e:
        print(f"\n❌ Request failed: {e}")

if __name__ == "__main__":
    test_backend()
