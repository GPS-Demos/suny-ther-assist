#!/usr/bin/env python3
"""
Test script to diagnose timing field issues in therapy analysis responses.
Tests with 10-word chunks to simulate real-time transcription.
"""

import requests
import json
import time
from datetime import datetime
from typing import List, Dict, Any
from collections import defaultdict

# Test transcript data
TRANSCRIPT_DATA = [
    ("THERAPIST", "Good afternoon, Sarah. How are you feeling today?", "09:54:10 PM"),
    ("PATIENT", "I've been having a really tough week. The anxiety has been pretty overwhelming.", "09:54:12 PM"),
    ("THERAPIST", "I'm sorry to hear you're struggling. Can you tell me more about what's been triggering your anxiety this week?", "09:54:14 PM"),
    ("PATIENT", "It's mostly work situations. I had to give a presentation, and I kept thinking everyone was judging me. I could feel my heart racing, and I started sweating. I almost had to leave the room.", "09:54:16 PM"),
]

# Analysis endpoint
# Use the real deployed backend
ENDPOINT = "https://us-central1-suny-ther-assist.cloudfunctions.net/therapy-analysis-function"

# Session context
SESSION_CONTEXT = {
    "session_type": "CBT",
    "primary_concern": "Anxiety, Social anxiety",
    "current_approach": "Cognitive Behavioral Therapy"
}

def split_into_chunks(text: str, chunk_size: int = 10) -> List[str]:
    """Split text into chunks of specified word count."""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size):
        chunk = ' '.join(words[i:i+chunk_size])
        if chunk:
            chunks.append(chunk)
    return chunks

def create_transcript_entries(speaker: str, chunks: List[str], base_timestamp: str) -> List[Dict]:
    """Create transcript entries from chunks."""
    entries = []
    for i, chunk in enumerate(chunks):
        entries.append({
            "speaker": speaker,
            "text": chunk,
            "timestamp": base_timestamp
        })
    return entries

def test_analysis(transcript_segment: List[Dict], session_duration: int, is_realtime: bool) -> Dict:
    """Send analysis request and return response."""
    payload = {
        "action": "analyze_segment",
        "transcript_segment": transcript_segment,
        "session_context": SESSION_CONTEXT,
        "session_duration_minutes": session_duration,
        "is_realtime": is_realtime
    }
    
    try:
        response = requests.post(ENDPOINT, json=payload, timeout=30)
        
        # Handle streaming response
        if response.headers.get('content-type') == 'text/plain':
            # For streaming responses, get the last complete JSON object
            lines = response.text.strip().split('\n')
            for line in reversed(lines):
                if line.strip():
                    try:
                        return json.loads(line)
                    except json.JSONDecodeError:
                        continue
            return {"error": "No valid JSON in streaming response"}
        else:
            return response.json()
    except requests.exceptions.Timeout:
        return {"error": "Request timeout"}
    except Exception as e:
        return {"error": f"Request failed: {str(e)}"}

def analyze_timing_fields(response: Dict, test_name: str) -> Dict[str, Any]:
    """Analyze the timing fields in the response."""
    analysis = {
        "test_name": test_name,
        "has_alerts": False,
        "alert_count": 0,
        "timing_issues": [],
        "valid_timings": [],
        "invalid_timings": [],
        "missing_timings": 0,
        "raw_alerts": []
    }
    
    if "alerts" in response:
        alerts = response.get("alerts", [])
        analysis["has_alerts"] = True
        analysis["alert_count"] = len(alerts)
        analysis["raw_alerts"] = alerts
        
        for i, alert in enumerate(alerts):
            alert_info = {
                "index": i,
                "title": alert.get("title", "NO TITLE"),
                "category": alert.get("category", "NO CATEGORY")
            }
            
            if "timing" not in alert:
                analysis["missing_timings"] += 1
                analysis["timing_issues"].append({
                    **alert_info,
                    "issue": "MISSING timing field"
                })
            else:
                timing = alert.get("timing")
                alert_info["timing"] = timing
                
                if timing in ["now", "pause", "info"]:
                    analysis["valid_timings"].append(alert_info)
                else:
                    analysis["invalid_timings"].append({
                        **alert_info,
                        "issue": f"INVALID timing value: {timing}"
                    })
    
    return analysis

def print_analysis_results(analysis: Dict):
    """Pretty print analysis results."""
    print(f"\n{'='*80}")
    print(f"Test: {analysis['test_name']}")
    print(f"{'='*80}")
    
    print(f"Alerts found: {analysis['alert_count']}")
    
    if analysis['alert_count'] > 0:
        print(f"Valid timings: {len(analysis['valid_timings'])}")
        print(f"Invalid timings: {len(analysis['invalid_timings'])}")
        print(f"Missing timings: {analysis['missing_timings']}")
        
        if analysis['valid_timings']:
            print("\n✅ Valid timing fields:")
            for alert in analysis['valid_timings']:
                print(f"  - [{alert['timing']}] {alert['title']}")
        
        if analysis['timing_issues']:
            print("\n❌ Timing issues found:")
            for issue in analysis['timing_issues']:
                print(f"  - Alert #{issue['index']}: {issue['issue']}")
                print(f"    Title: {issue['title']}")
        
        if analysis['invalid_timings']:
            print("\n⚠️  Invalid timing values:")
            for alert in analysis['invalid_timings']:
                print(f"  - Alert #{alert['index']}: {alert['issue']}")
        
        print("\n📋 Raw alerts data:")
        for i, alert in enumerate(analysis['raw_alerts']):
            print(f"\nAlert #{i}:")
            print(json.dumps(alert, indent=2))

def main():
    """Main test function."""
    print("\n" + "="*80)
    print("THERAPY ANALYSIS TIMING FIELD TEST")
    print("="*80)
    print(f"Testing endpoint: {ENDPOINT}")
    print(f"Session context: {json.dumps(SESSION_CONTEXT, indent=2)}")
    
    # Build cumulative transcript
    cumulative_transcript = []
    session_duration = 0
    
    # Test results storage
    all_results = {
        "realtime_tests": [],
        "comprehensive_tests": [],
        "timing_summary": defaultdict(int)
    }
    
    print("\n" + "="*80)
    print("PROCESSING TRANSCRIPT IN 10-WORD CHUNKS")
    print("="*80)
    
    for speaker, text, timestamp in TRANSCRIPT_DATA:
        print(f"\n📝 Processing {speaker} statement:")
        print(f"   '{text[:50]}...'")
        
        # Split into 10-word chunks
        chunks = split_into_chunks(text, 10)
        print(f"   Split into {len(chunks)} chunks")
        
        for chunk_idx, chunk in enumerate(chunks):
            # Add chunk to cumulative transcript
            cumulative_transcript.append({
                "speaker": speaker,
                "text": chunk,
                "timestamp": timestamp
            })
            
            # Update session duration (simulate time passing)
            session_duration += 1  # Add 1 minute per chunk for testing
            
            print(f"\n   Chunk {chunk_idx + 1}: '{chunk}'")
            print(f"   Cumulative entries: {len(cumulative_transcript)}, Duration: {session_duration} min")
            
            # Test 1: Real-time analysis (fast mode)
            print(f"\n   Testing REAL-TIME mode...")
            realtime_response = test_analysis(
                cumulative_transcript[-5:],  # Last 5 entries
                session_duration,
                is_realtime=True
            )
            
            # Print raw JSON response
            print(f"\n   📋 RAW REAL-TIME RESPONSE:")
            print(json.dumps(realtime_response, indent=4))
            
            realtime_analysis = analyze_timing_fields(
                realtime_response,
                f"Realtime - {speaker} chunk {chunk_idx + 1}"
            )
            all_results["realtime_tests"].append(realtime_analysis)
            
            if realtime_analysis['alert_count'] > 0:
                print(f"   ✓ Real-time: {realtime_analysis['alert_count']} alerts")
                for alert in realtime_analysis['valid_timings']:
                    print(f"     - [{alert['timing']}] {alert['title']}")
                    all_results["timing_summary"][alert['timing']] += 1
                if realtime_analysis['timing_issues']:
                    print(f"   ⚠️  Issues: {len(realtime_analysis['timing_issues'])} timing problems")
            else:
                print(f"   - Real-time: No alerts generated")
            
            # Test 2: Comprehensive analysis (with RAG)
            print(f"\n   Testing COMPREHENSIVE mode...")
            comprehensive_response = test_analysis(
                cumulative_transcript,  # Full transcript
                session_duration,
                is_realtime=False
            )
            
            # Print raw JSON response
            print(f"\n   📋 RAW COMPREHENSIVE RESPONSE:")
            print(json.dumps(comprehensive_response, indent=4))
            
            comprehensive_analysis = analyze_timing_fields(
                comprehensive_response,
                f"Comprehensive - {speaker} chunk {chunk_idx + 1}"
            )
            all_results["comprehensive_tests"].append(comprehensive_analysis)
            
            if comprehensive_analysis['alert_count'] > 0:
                print(f"   ✓ Comprehensive: {comprehensive_analysis['alert_count']} alerts")
                for alert in comprehensive_analysis['valid_timings']:
                    print(f"     - [{alert['timing']}] {alert['title']}")
                if comprehensive_analysis['timing_issues']:
                    print(f"   ⚠️  Issues: {len(comprehensive_analysis['timing_issues'])} timing problems")
            else:
                print(f"   - Comprehensive: No alerts generated")
            
            # Small delay between requests
            time.sleep(0.5)
    
    # Final summary
    print("\n" + "="*80)
    print("FINAL SUMMARY")
    print("="*80)
    
    # Count timing issues
    total_realtime_alerts = sum(t['alert_count'] for t in all_results['realtime_tests'])
    total_comprehensive_alerts = sum(t['alert_count'] for t in all_results['comprehensive_tests'])
    
    realtime_issues = sum(len(t['timing_issues']) + len(t['invalid_timings']) + t['missing_timings'] 
                          for t in all_results['realtime_tests'])
    comprehensive_issues = sum(len(t['timing_issues']) + len(t['invalid_timings']) + t['missing_timings'] 
                              for t in all_results['comprehensive_tests'])
    
    print(f"\n📊 Real-time mode:")
    print(f"   Total alerts: {total_realtime_alerts}")
    print(f"   Timing issues: {realtime_issues}")
    print(f"   Issue rate: {realtime_issues}/{total_realtime_alerts} ({realtime_issues/max(1,total_realtime_alerts)*100:.1f}%)")
    
    print(f"\n📊 Comprehensive mode:")
    print(f"   Total alerts: {total_comprehensive_alerts}")
    print(f"   Timing issues: {comprehensive_issues}")
    print(f"   Issue rate: {comprehensive_issues}/{total_comprehensive_alerts} ({comprehensive_issues/max(1,total_comprehensive_alerts)*100:.1f}%)")
    
    print(f"\n📊 Timing distribution:")
    for timing, count in all_results["timing_summary"].items():
        print(f"   {timing}: {count} alerts")
    
    # Identify problematic tests
    problematic_tests = []
    for test in all_results['realtime_tests'] + all_results['comprehensive_tests']:
        if test['timing_issues'] or test['invalid_timings'] or test['missing_timings'] > 0:
            problematic_tests.append(test)
    
    if problematic_tests:
        print(f"\n⚠️  PROBLEMATIC TESTS ({len(problematic_tests)} total):")
        for test in problematic_tests[:3]:  # Show first 3
            print(f"\n   {test['test_name']}:")
            if test['raw_alerts']:
                print("   Raw alert data:")
                print(json.dumps(test['raw_alerts'][0], indent=6))
    
    # Save detailed results to file
    output_file = f"test_timing_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w') as f:
        json.dump(all_results, f, indent=2)
    print(f"\n💾 Detailed results saved to: {output_file}")
    
    # Final diagnosis
    print("\n" + "="*80)
    print("DIAGNOSIS")
    print("="*80)
    
    if realtime_issues > 0 or comprehensive_issues > 0:
        print("❌ TIMING FIELD ISSUES DETECTED")
        print("\nThe backend is not consistently setting the timing field.")
        print("This causes alerts to appear gray in the frontend.")
        print("\nRecommendations:")
        print("1. Add validation in the backend to ensure timing is always set")
        print("2. Set a default timing value ('info') when missing")
        print("3. Log warnings when the model doesn't return proper timing")
    else:
        print("✅ ALL TIMING FIELDS VALID")
        print("\nNo timing field issues detected in this test.")
        print("Gray alerts may be caused by other factors.")

if __name__ == "__main__":
    try:
        print("🚀 Testing against deployed backend")
        print(f"   Endpoint: {ENDPOINT}")
        main()
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        exit(1)
