#!/usr/bin/env python3
"""
Therapy Session Transcript Simulator
=====================================
Tests all analytical functions of the Ther-Assist backend by simulating
a progressive therapy session with various triggers and edge cases.

Usage:
    python transcript_simulator.py           # Run with fast typing simulation
    python transcript_simulator.py --instant # Run instantly without typing effect
"""

import requests
import json
import time
import sys
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Any
import threading
import queue

# ANSI color codes for console output
class Colors:
    RED = '\033[91m'      # Critical alerts
    YELLOW = '\033[93m'   # Suggestions
    GREEN = '\033[92m'    # Info/positive
    BLUE = '\033[94m'     # Headers
    PURPLE = '\033[95m'   # Pathway changes
    CYAN = '\033[96m'     # Metrics
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

# Configuration
API_BASE_URL = "http://localhost:8081"  # Adjust if your backend runs on different port
TYPING_SPEED = 50  # Characters per second (fast as requested)
ANALYSIS_INTERVAL = 5  # Seconds between analysis calls (fast for testing)

class TranscriptSimulator:
    def __init__(self, instant_mode=False):
        self.instant_mode = instant_mode
        self.session_start = datetime.now()
        self.full_transcript = []
        self.session_context = {
            "session_type": "CBT",
            "primary_concern": "Social Anxiety",
            "current_approach": "Cognitive Behavioral Therapy"
        }
        self.session_metrics = {}
        self.alerts_received = []
        
    def print_header(self, text, color=Colors.BLUE):
        """Print formatted section header"""
        print(f"\n{color}{Colors.BOLD}{'='*80}{Colors.END}")
        print(f"{color}{Colors.BOLD}{text}{Colors.END}")
        print(f"{color}{Colors.BOLD}{'='*80}{Colors.END}\n")
        
    def print_subheader(self, text, color=Colors.CYAN):
        """Print formatted subsection header"""
        print(f"\n{color}{Colors.BOLD}--- {text} ---{Colors.END}\n")
        
    def type_text(self, text, speaker=""):
        """Simulate typing effect for transcript text"""
        if speaker:
            sys.stdout.write(f"{Colors.BOLD}{speaker}:{Colors.END} ")
            sys.stdout.flush()
            
        if self.instant_mode:
            print(text)
        else:
            for char in text:
                sys.stdout.write(char)
                sys.stdout.flush()
                time.sleep(1.0 / TYPING_SPEED)
            print()  # New line at end
            
    def add_to_transcript(self, speaker, text):
        """Add entry to transcript and display it"""
        timestamp = datetime.now().isoformat()
        entry = {
            "speaker": speaker,
            "text": text,
            "timestamp": timestamp
        }
        self.full_transcript.append(entry)
        self.type_text(text, speaker)
        return entry
        
    def analyze_segment(self, segment_description=""):
        """Call the analyze_segment endpoint with recent transcript"""
        if segment_description:
            self.print_subheader(f"ANALYZING: {segment_description}", Colors.PURPLE)
            
        # Get last 5 entries for analysis
        recent_transcript = self.full_transcript[-5:] if len(self.full_transcript) >= 5 else self.full_transcript
        
        if not recent_transcript:
            return
            
        session_duration_minutes = int((datetime.now() - self.session_start).total_seconds() / 60)
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/therapy_analysis",
                json={
                    "action": "analyze_segment",
                    "transcript_segment": recent_transcript,
                    "session_context": self.session_context,
                    "session_duration_minutes": session_duration_minutes
                },
                timeout=30
            )
            
            if response.status_code == 200:
                # Process streaming response
                for line in response.text.split('\n'):
                    if line.strip():
                        try:
                            data = json.loads(line)
                            self.process_analysis_response(data)
                        except json.JSONDecodeError:
                            continue
            else:
                print(f"{Colors.RED}Analysis failed with status {response.status_code}{Colors.END}")
                
        except Exception as e:
            print(f"{Colors.RED}Error calling analysis API: {e}{Colors.END}")
            
    def process_analysis_response(self, data):
        """Process and display analysis response"""
        # Process alerts
        if "alerts" in data and data["alerts"]:
            print(f"\n{Colors.BOLD}Alerts Received:{Colors.END}")
            for alert in data["alerts"]:
                self.alerts_received.append(alert)
                level = alert.get("level", "info")
                color = Colors.RED if level == "critical" else Colors.YELLOW if level == "suggestion" else Colors.GREEN
                
                print(f"{color}[{alert.get('level', '').upper()}] {alert.get('title', 'Alert')}{Colors.END}")
                print(f"  Category: {alert.get('category', 'N/A')}")
                print(f"  Message: {alert.get('message', 'N/A')}")
                if alert.get('recommendation'):
                    print(f"  Recommendation: {alert['recommendation']}")
                if alert.get('manual_reference'):
                    ref = alert['manual_reference']
                    print(f"  Reference: {ref.get('source', 'N/A')} - {ref.get('section', 'N/A')}")
                print()
                
        # Process session metrics
        if "session_metrics" in data and data["session_metrics"]:
            self.session_metrics = data["session_metrics"]
            print(f"\n{Colors.CYAN}Session Metrics Updated:{Colors.END}")
            print(f"  Engagement: {self.session_metrics.get('engagement_level', 0)*100:.0f}%")
            print(f"  Alliance: {self.session_metrics.get('therapeutic_alliance', 'unknown')}")
            print(f"  Emotional State: {self.session_metrics.get('emotional_state', 'unknown')}")
            print(f"  Techniques: {', '.join(self.session_metrics.get('techniques_detected', []))}")
            
        # Process pathway indicators
        if "pathway_indicators" in data and data["pathway_indicators"]:
            indicators = data["pathway_indicators"]
            if indicators.get("change_urgency") != "none":
                print(f"\n{Colors.PURPLE}Pathway Change Indicator:{Colors.END}")
                print(f"  Current effectiveness: {indicators.get('current_approach_effectiveness', 'unknown')}")
                print(f"  Change urgency: {indicators.get('change_urgency', 'none')}")
                if indicators.get('alternative_pathways'):
                    print(f"  Alternatives: {', '.join(indicators['alternative_pathways'])}")
                    
    def test_pathway_guidance(self):
        """Test the pathway_guidance endpoint"""
        self.print_subheader("Testing Pathway Guidance Endpoint", Colors.PURPLE)
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/therapy_analysis",
                json={
                    "action": "pathway_guidance",
                    "current_approach": self.session_context["current_approach"],
                    "session_history": [],  # Empty for testing
                    "presenting_issues": ["Social anxiety", "Catastrophic thinking", "Avoidance behaviors"]
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"{Colors.PURPLE}Pathway Guidance:{Colors.END}")
                print(f"  Continue current: {data.get('continue_current', 'N/A')}")
                print(f"  Rationale: {data.get('rationale', 'N/A')}")
                
                if data.get('alternative_pathways'):
                    print(f"\n  Alternative Pathways:")
                    for alt in data['alternative_pathways']:
                        print(f"    - {alt.get('approach', 'N/A')}: {alt.get('reason', 'N/A')}")
                        
                if data.get('immediate_actions'):
                    print(f"\n  Immediate Actions:")
                    for action in data['immediate_actions']:
                        print(f"    - {action}")
            else:
                print(f"{Colors.RED}Pathway guidance failed with status {response.status_code}{Colors.END}")
                
        except Exception as e:
            print(f"{Colors.RED}Error calling pathway guidance API: {e}{Colors.END}")
            
    def test_session_summary(self):
        """Test the session_summary endpoint"""
        self.print_subheader("Testing Session Summary Endpoint", Colors.PURPLE)
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/therapy_analysis",
                json={
                    "action": "session_summary",
                    "full_transcript": self.full_transcript,
                    "session_metrics": self.session_metrics
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"{Colors.GREEN}Session Summary Generated:{Colors.END}")
                summary_text = data.get('summary', 'No summary available')
                # Print first 500 chars of summary
                print(summary_text[:500] + "..." if len(summary_text) > 500 else summary_text)
            else:
                print(f"{Colors.RED}Session summary failed with status {response.status_code}{Colors.END}")
                
        except Exception as e:
            print(f"{Colors.RED}Error calling session summary API: {e}{Colors.END}")
            
    def run_session(self):
        """Run the complete simulated therapy session"""
        
        # ========== PHASE 1: SESSION BEGINNING (0-10 minutes) ==========
        # TEST: Rapport building, agenda setting, initial assessment
        self.print_header("PHASE 1: SESSION BEGINNING (0-10 minutes)")
        print("TEST OBJECTIVES: Rapport building detection, agenda setting, initial emotional state\n")
        
        self.add_to_transcript("THERAPIST", "Good afternoon, Sarah. How are you feeling today?")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("PATIENT", "I've been having a really tough week. The anxiety has been pretty overwhelming.")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("THERAPIST", "I'm sorry to hear you're struggling. Can you tell me more about what's been triggering your anxiety this week?")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("PATIENT", "It's mostly work situations. I had to give a presentation, and I kept thinking everyone was judging me. I could feel my heart racing, and I started sweating. I almost had to leave the room.")
        
        # Analyze for physical symptom identification
        self.analyze_segment("Initial assessment and physical symptoms")
        time.sleep(2 if not self.instant_mode else 0)
        
        # ========== PHASE 2: ANXIETY ESCALATION (10-20 minutes) ==========
        # TEST: Should trigger SUGGESTION alerts for grounding techniques
        self.print_header("PHASE 2: ANXIETY ESCALATION (10-20 minutes)")
        print("TEST OBJECTIVES: Anxiety escalation detection, should trigger grounding technique suggestions\n")
        
        self.add_to_transcript("THERAPIST", "Those physical symptoms you're describing - the racing heart, sweating - those are common manifestations of anxiety. Have you been using any of the coping strategies we discussed last session?")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("PATIENT", "I tried the breathing exercises, but I couldn't focus. My mind kept racing with negative thoughts. I felt like I was going to pass out. My chest was so tight I couldn't breathe properly.")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        # TEST: High anxiety should trigger suggestion for immediate grounding
        self.add_to_transcript("PATIENT", "Even now, just talking about it, I can feel my heart starting to race again. I feel dizzy and disconnected.")
        
        self.analyze_segment("High anxiety state - should suggest grounding")
        time.sleep(2 if not self.instant_mode else 0)
        
        # ========== PHASE 3: COGNITIVE RESTRUCTURING (20-30 minutes) ==========
        # TEST: CBT technique detection, cognitive distortion identification
        self.print_header("PHASE 3: COGNITIVE RESTRUCTURING (20-30 minutes)")
        print("TEST OBJECTIVES: Cognitive distortion identification, CBT technique detection\n")
        
        self.add_to_transcript("THERAPIST", "Let's explore those thoughts. What specifically were you thinking during the presentation?")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("PATIENT", "That I was going to mess up, that people would think I'm incompetent, that I don't deserve to be there.")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("THERAPIST", "Those sound like what we call automatic negative thoughts or cognitive distortions. Let's apply some cognitive restructuring here. What evidence do you have that people actually think you're incompetent?")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("PATIENT", "Well... I guess I don't have any real evidence. My boss actually complimented my work last month.")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("THERAPIST", "That's an important observation. So there's evidence that contradicts your negative thought. This is a good example of catastrophizing - assuming the worst will happen without evidence. How could you reframe that thought more realistically?")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("PATIENT", "Maybe... that I'm prepared and I know my material, even if I feel nervous?")
        
        # TEST: Should identify positive therapeutic moment (INFO alert)
        self.add_to_transcript("THERAPIST", "Excellent reframing. Feeling nervous is normal and doesn't mean you're incompetent.")
        
        self.analyze_segment("Cognitive restructuring - should detect CBT techniques")
        time.sleep(2 if not self.instant_mode else 0)
        
        # ========== PHASE 4: TREATMENT RESISTANCE (30-35 minutes) ==========
        # TEST: Pathway change indicators when approach isn't working
        self.print_header("PHASE 4: TREATMENT RESISTANCE (30-35 minutes)")
        print("TEST OBJECTIVES: Detect treatment resistance, trigger pathway change considerations\n")
        
        self.add_to_transcript("PATIENT", "I understand what you're saying logically, but it doesn't help when I'm in the moment. The anxiety just takes over completely.")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("THERAPIST", "It sounds like the cognitive work isn't translating to real situations for you.")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("PATIENT", "Exactly. I can do all the thought challenging here, but when I'm actually in a social situation, it all goes out the window. Maybe this approach just isn't working for me.")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("THERAPIST", "I hear your frustration. Sometimes we need to adjust our approach.")
        
        self.analyze_segment("Treatment resistance - should suggest pathway changes")
        time.sleep(2 if not self.instant_mode else 0)
        
        # Test pathway guidance endpoint
        self.test_pathway_guidance()
        time.sleep(2 if not self.instant_mode else 0)
        
        # ========== PHASE 5: CRITICAL MOMENT - DISSOCIATION (35-40 minutes) ==========
        # TEST: CRITICAL alert for dissociation signs
        self.print_header("PHASE 5: CRITICAL MOMENT - DISSOCIATION (35-40 minutes)")
        print("TEST OBJECTIVES: Detect dissociation, trigger CRITICAL safety alert\n")
        
        self.add_to_transcript("PATIENT", "Sometimes when the anxiety gets really bad, I feel like I'm watching myself from outside my body. Like I'm not really there.")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("THERAPIST", "That sounds like dissociation. When did you last experience this?")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        # TEST: Should trigger CRITICAL alert
        self.add_to_transcript("PATIENT", "Yesterday at work. I just... floated away. I don't remember much of the afternoon. My coworker said I was just staring blankly for a while. It's scary when I lose time like that.")
        
        self.analyze_segment("Dissociation signs - should trigger CRITICAL alert")
        time.sleep(2 if not self.instant_mode else 0)
        
        # Therapist responds to dissociation
        self.add_to_transcript("THERAPIST", "Let's pause for a moment. Can you feel your feet on the floor right now? Let's do some grounding together.")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("PATIENT", "Yes, I can feel them. That helps a bit.")
        time.sleep(2 if not self.instant_mode else 0)
        
        # ========== PHASE 6: GROUNDING AND EXPOSURE PLANNING (40-45 minutes) ==========
        # TEST: Grounding technique implementation, exposure therapy introduction
        self.print_header("PHASE 6: GROUNDING AND EXPOSURE PLANNING (40-45 minutes)")
        print("TEST OBJECTIVES: Detect grounding techniques, exposure therapy planning\n")
        
        self.add_to_transcript("THERAPIST", "Good. Now, can you name five things you can see in this room right now?")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("PATIENT", "The bookshelf, your diploma on the wall, the plant by the window, the blue chair, and the clock.")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("THERAPIST", "Excellent. This 5-4-3-2-1 technique can help bring you back to the present moment when you feel dissociation starting.")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("THERAPIST", "Now, I'd like to introduce an exposure exercise we can work on together. Would you be comfortable practicing a brief presentation here, starting with just 30 seconds?")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("PATIENT", "That makes me nervous just thinking about it, but... I guess we could try.")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("THERAPIST", "We'll start small and work our way up. This is called graduated exposure, and it's a key component of CBT for social anxiety. Remember, the goal isn't to eliminate anxiety completely, but to learn that you can tolerate it and that it will decrease over time.")
        
        self.analyze_segment("Grounding and exposure therapy introduction")
        time.sleep(2 if not self.instant_mode else 0)
        
        # ========== PHASE 7: CRITICAL MOMENT - SELF-HARM MENTION (45-48 minutes) ==========
        # TEST: CRITICAL alert for self-harm risk
        self.print_header("PHASE 7: CRITICAL MOMENT - SELF-HARM (45-48 minutes)")
        print("TEST OBJECTIVES: Detect self-harm risk, trigger immediate CRITICAL alert\n")
        
        self.add_to_transcript("PATIENT", "Sometimes when everything gets too overwhelming, I have thoughts about... hurting myself. Just to make the anxiety stop.")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        # TEST: Should trigger immediate CRITICAL alert
        self.add_to_transcript("THERAPIST", "I'm really glad you felt safe enough to share that with me. Can you tell me more about these thoughts? Have you acted on them?")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("PATIENT", "I haven't done anything, but the thoughts are getting stronger. Yesterday I was looking at my knife set in the kitchen and... I had to leave the room.")
        
        self.analyze_segment("Self-harm risk - should trigger immediate CRITICAL alert")
        time.sleep(2 if not self.instant_mode else 0)
        
        self.add_to_transcript("THERAPIST", "I appreciate your honesty, and I want to make sure you're safe. Let's create a safety plan together right now.")
        time.sleep(2 if not self.instant_mode else 0)
        
        # ========== PHASE 8: SESSION ENDING (48-50 minutes) ==========
        # TEST: Homework assignment, session closure, summary generation
        self.print_header("PHASE 8: SESSION ENDING (48-50 minutes)")
        print("TEST OBJECTIVES: Detect session closure, homework assignment, prepare for summary\n")
        
        self.add_to_transcript("THERAPIST", "Before we end today, let's review what we've covered and set some homework for next week.")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("PATIENT", "Okay. I feel like we covered a lot today.")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("THERAPIST", "For homework, I'd like you to practice the 5-4-3-2-1 grounding technique once a day, even when you're not anxious. Also, try to identify and write down three automatic negative thoughts each day, along with a more balanced alternative thought.")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("PATIENT", "I can do that. Should I also try the brief presentation practice we talked about?")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("THERAPIST", "Let's start with the grounding and thought work first. We'll begin the exposure exercises together next session. Remember, you can call our crisis line if those difficult thoughts return.")
        time.sleep(0.5 if not self.instant_mode else 0)
        
        self.add_to_transcript("PATIENT", "Thank you. I'll see you next week.")
        
        self.analyze_segment("Session closure and homework assignment")
        time.sleep(2 if not self.instant_mode else 0)
        
        # Test session summary endpoint
        self.test_session_summary()
        
        # ========== FINAL SUMMARY ==========
        self.print_header("SESSION SIMULATION COMPLETE", Colors.GREEN)
        print(f"Total transcript entries: {len(self.full_transcript)}")
        print(f"Total alerts received: {len(self.alerts_received)}")
        
        # Count alert types
        critical_count = sum(1 for a in self.alerts_received if a.get('level') == 'critical')
        suggestion_count = sum(1 for a in self.alerts_received if a.get('level') == 'suggestion')
        info_count = sum(1 for a in self.alerts_received if a.get('level') == 'info')
        
        print(f"\nAlert breakdown:")
        print(f"  - Critical: {critical_count}")
        print(f"  - Suggestions: {suggestion_count}")
        print(f"  - Info: {info_count}")
        
        if self.session_metrics:
            print(f"\nFinal session metrics:")
            print(f"  - Engagement: {self.session_metrics.get('engagement_level', 0)*100:.0f}%")
            print(f"  - Alliance: {self.session_metrics.get('therapeutic_alliance', 'unknown')}")
            print(f"  - Emotional State: {self.session_metrics.get('emotional_state', 'unknown')}")
            
        print(f"\n{Colors.GREEN}All tests completed successfully!{Colors.END}")

def main():
    parser = argparse.ArgumentParser(description='Therapy Session Transcript Simulator')
    parser.add_argument('--instant', action='store_true', 
                       help='Run instantly without typing effect')
    parser.add_argument('--api-url', type=str, default='http://localhost:8081',
                       help='Backend API URL (default: http://localhost:8081)')
    
    args = parser.parse_args()
    
    # Update global API URL if provided
    global API_BASE_URL
    API_BASE_URL = args.api_url
    
    print(f"{Colors.BOLD}{Colors.BLUE}")
    print("=" * 80)
    print("THERAPY SESSION TRANSCRIPT SIMULATOR")
    print("Testing Ther-Assist Analytical Functions")
    print("=" * 80)
    print(f"{Colors.END}")
    
    print(f"\nConfiguration:")
    print(f"  API URL: {API_BASE_URL}")
    print(f"  Mode: {'Instant' if args.instant else f'Typing simulation ({TYPING_SPEED} chars/sec)'}")
    print(f"  Analysis interval: {ANALYSIS_INTERVAL} seconds")
    
    print(f"\n{Colors.YELLOW}Make sure your therapy-analysis-function is running at {API_BASE_URL}{Colors.END}")
    print(f"{Colors.YELLOW}Run: cd backend/therapy-analysis-function && functions-framework --target=therapy_analysis --port=8081{Colors.END}")
    
    input(f"\n{Colors.BOLD}Press Enter to start the simulation...{Colors.END}")
    
    simulator = TranscriptSimulator(instant_mode=args.instant)
    
    try:
        simulator.run_session()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Simulation interrupted by user{Colors.END}")
    except Exception as e:
        print(f"\n\n{Colors.RED}Error during simulation: {e}{Colors.END}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
