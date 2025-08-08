#!/usr/bin/env python3
"""
WebSocket Transcript Simulator for Ther-Assist
===============================================
Simulates a therapy session by sending transcript data directly to the frontend
via WebSocket connection, allowing the frontend to trigger its own analysis.

This mimics real-time transcription without requiring audio input.

Usage:
    python websocket_transcript_simulator.py           # Run with typing simulation
    python websocket_transcript_simulator.py --instant # Run instantly
"""

import asyncio
import websockets
import json
import sys
import argparse
from datetime import datetime
from typing import List, Dict, Any
import time

# ANSI color codes for console output
class Colors:
    RED = '\033[91m'
    YELLOW = '\033[93m'
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

# Configuration
WS_URL = "ws://localhost:8080/ws"  # WebSocket endpoint
TYPING_SPEED = 50  # Characters per second

class WebSocketTranscriptSimulator:
    def __init__(self, instant_mode=False):
        self.instant_mode = instant_mode
        self.session_id = f"test_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Complete therapy session script with test annotations
        self.script = [
            # ========== PHASE 1: SESSION BEGINNING ==========
            # TEST: Rapport building, initial assessment
            {
                "phase": "SESSION BEGINNING",
                "test": "Rapport building detection, agenda setting, initial emotional state",
                "exchanges": [
                    {"text": "Good afternoon, Sarah. How are you feeling today?", "delay": 2},
                    {"text": "I've been having a really tough week. The anxiety has been pretty overwhelming.", "delay": 3},
                    {"text": "I'm sorry to hear you're struggling. Can you tell me more about what's been triggering your anxiety this week?", "delay": 3},
                    {"text": "It's mostly work situations. I had to give a presentation, and I kept thinking everyone was judging me. I could feel my heart racing, and I started sweating. I almost had to leave the room.", "delay": 4}
                ]
            },
            
            # ========== PHASE 2: ANXIETY ESCALATION ==========
            # TEST: Should trigger SUGGESTION alerts for grounding techniques
            {
                "phase": "ANXIETY ESCALATION",
                "test": "High anxiety detection → should trigger grounding technique suggestions",
                "exchanges": [
                    {"text": "Those physical symptoms you're describing - the racing heart, sweating - those are common manifestations of anxiety. Have you been using any of the coping strategies we discussed last session?", "delay": 4},
                    {"text": "I tried the breathing exercises, but I couldn't focus. My mind kept racing with negative thoughts. I felt like I was going to pass out. My chest was so tight I couldn't breathe properly.", "delay": 4},
                    {"text": "Even now, just talking about it, I can feel my heart starting to race again. I feel dizzy and disconnected.", "delay": 3}
                ]
            },
            
            # ========== PHASE 3: COGNITIVE RESTRUCTURING ==========
            # TEST: CBT technique detection, positive therapeutic moments
            {
                "phase": "COGNITIVE RESTRUCTURING",
                "test": "CBT technique detection, cognitive distortion identification",
                "exchanges": [
                    {"text": "Let's explore those thoughts. What specifically were you thinking during the presentation?", "delay": 3},
                    {"text": "That I was going to mess up, that people would think I'm incompetent, that I don't deserve to be there.", "delay": 3},
                    {"text": "Those sound like what we call automatic negative thoughts or cognitive distortions. Let's apply some cognitive restructuring here. What evidence do you have that people actually think you're incompetent?", "delay": 4},
                    {"text": "Well... I guess I don't have any real evidence. My boss actually complimented my work last month.", "delay": 3},
                    {"text": "That's an important observation. So there's evidence that contradicts your negative thought. This is a good example of catastrophizing - assuming the worst will happen without evidence. How could you reframe that thought more realistically?", "delay": 4},
                    {"text": "Maybe... that I'm prepared and I know my material, even if I feel nervous?", "delay": 3},
                    {"text": "Excellent reframing. Feeling nervous is normal and doesn't mean you're incompetent.", "delay": 3}
                ]
            },
            
            # ========== PHASE 4: TREATMENT RESISTANCE ==========
            # TEST: Pathway change indicators
            {
                "phase": "TREATMENT RESISTANCE",
                "test": "Detect resistance → trigger pathway change considerations",
                "exchanges": [
                    {"text": "I understand what you're saying logically, but it doesn't help when I'm in the moment. The anxiety just takes over completely.", "delay": 3},
                    {"text": "It sounds like the cognitive work isn't translating to real situations for you.", "delay": 3},
                    {"text": "Exactly. I can do all the thought challenging here, but when I'm actually in a social situation, it all goes out the window. Maybe this approach just isn't working for me.", "delay": 4},
                    {"text": "I hear your frustration. Sometimes we need to adjust our approach.", "delay": 3}
                ]
            },
            
            # ========== PHASE 5: CRITICAL - DISSOCIATION ==========
            # TEST: CRITICAL alert for dissociation
            {
                "phase": "CRITICAL MOMENT - DISSOCIATION",
                "test": "Dissociation detection → CRITICAL safety alert",
                "exchanges": [
                    {"text": "Sometimes when the anxiety gets really bad, I feel like I'm watching myself from outside my body. Like I'm not really there.", "delay": 4},
                    {"text": "That sounds like dissociation. When did you last experience this?", "delay": 3},
                    {"text": "Yesterday at work. I just... floated away. I don't remember much of the afternoon. My coworker said I was just staring blankly for a while. It's scary when I lose time like that.", "delay": 4},
                    {"text": "Let's pause for a moment. Can you feel your feet on the floor right now? Let's do some grounding together.", "delay": 3},
                    {"text": "Yes, I can feel them. That helps a bit.", "delay": 2}
                ]
            },
            
            # ========== PHASE 6: GROUNDING AND EXPOSURE ==========
            # TEST: Grounding technique and exposure therapy detection
            {
                "phase": "GROUNDING AND EXPOSURE PLANNING",
                "test": "Grounding technique implementation, exposure therapy introduction",
                "exchanges": [
                    {"text": "Good. Now, can you name five things you can see in this room right now?", "delay": 3},
                    {"text": "The bookshelf, your diploma on the wall, the plant by the window, the blue chair, and the clock.", "delay": 3},
                    {"text": "Excellent. This 5-4-3-2-1 technique can help bring you back to the present moment when you feel dissociation starting.", "delay": 3},
                    {"text": "Now, I'd like to introduce an exposure exercise we can work on together. Would you be comfortable practicing a brief presentation here, starting with just 30 seconds?", "delay": 4},
                    {"text": "That makes me nervous just thinking about it, but... I guess we could try.", "delay": 3},
                    {"text": "We'll start small and work our way up. This is called graduated exposure, and it's a key component of CBT for social anxiety. Remember, the goal isn't to eliminate anxiety completely, but to learn that you can tolerate it and that it will decrease over time.", "delay": 5}
                ]
            },
            
            # ========== PHASE 7: CRITICAL - SELF-HARM ==========
            # TEST: CRITICAL alert for self-harm risk
            {
                "phase": "CRITICAL MOMENT - SELF-HARM",
                "test": "Self-harm risk detection → immediate CRITICAL alert",
                "exchanges": [
                    {"text": "Sometimes when everything gets too overwhelming, I have thoughts about... hurting myself. Just to make the anxiety stop.", "delay": 4},
                    {"text": "I'm really glad you felt safe enough to share that with me. Can you tell me more about these thoughts? Have you acted on them?", "delay": 4},
                    {"text": "I haven't done anything, but the thoughts are getting stronger. Yesterday I was looking at my knife set in the kitchen and... I had to leave the room.", "delay": 4},
                    {"text": "I appreciate your honesty, and I want to make sure you're safe. Let's create a safety plan together right now.", "delay": 3}
                ]
            },
            
            # ========== PHASE 8: SESSION ENDING ==========
            # TEST: Homework assignment, session closure
            {
                "phase": "SESSION ENDING",
                "test": "Session closure detection, homework assignment",
                "exchanges": [
                    {"text": "Before we end today, let's review what we've covered and set some homework for next week.", "delay": 3},
                    {"text": "Okay. I feel like we covered a lot today.", "delay": 2},
                    {"text": "For homework, I'd like you to practice the 5-4-3-2-1 grounding technique once a day, even when you're not anxious. Also, try to identify and write down three automatic negative thoughts each day, along with a more balanced alternative thought.", "delay": 5},
                    {"text": "I can do that. Should I also try the brief presentation practice we talked about?", "delay": 3},
                    {"text": "Let's start with the grounding and thought work first. We'll begin the exposure exercises together next session. Remember, you can call our crisis line if those difficult thoughts return.", "delay": 4},
                    {"text": "Thank you. I'll see you next week.", "delay": 2}
                ]
            }
        ]
        
    def print_header(self, text, color=Colors.BLUE):
        """Print formatted section header"""
        print(f"\n{color}{Colors.BOLD}{'='*80}{Colors.END}")
        print(f"{color}{Colors.BOLD}{text}{Colors.END}")
        print(f"{color}{Colors.BOLD}{'='*80}{Colors.END}\n")
        
    def print_phase_info(self, phase_data):
        """Print information about the current phase"""
        self.print_header(f"PHASE: {phase_data['phase']}")
        print(f"{Colors.YELLOW}TEST OBJECTIVE: {phase_data['test']}{Colors.END}\n")
        
    async def send_transcript_segment(self, websocket, text, is_interim=False):
        """Send a transcript segment via WebSocket"""
        message = {
            "transcript": text,
            "timestamp": datetime.now().isoformat(),
            "is_interim": is_interim
        }
        
        # Send interim results character by character for typing effect
        if not self.instant_mode and not is_interim:
            # Send progressive interim results
            for i in range(1, len(text) + 1):
                interim_message = {
                    "transcript": text[:i],
                    "timestamp": datetime.now().isoformat(),
                    "is_interim": True
                }
                await websocket.send(json.dumps(interim_message))
                await asyncio.sleep(1.0 / TYPING_SPEED)
            
        # Send final result
        message["is_interim"] = False
        await websocket.send(json.dumps(message))
        
        # Display in console
        color = Colors.CYAN if "?" in text else Colors.GREEN
        print(f"{color}→ {text}{Colors.END}")
        
    async def simulate_session(self):
        """Run the WebSocket simulation"""
        ws_url = f"{WS_URL}/{self.session_id}"
        
        print(f"\n{Colors.BOLD}Connecting to WebSocket: {ws_url}{Colors.END}")
        
        try:
            async with websockets.connect(ws_url) as websocket:
                print(f"{Colors.GREEN}✓ Connected to WebSocket{Colors.END}")
                print(f"{Colors.GREEN}Session ID: {self.session_id}{Colors.END}\n")
                
                # Send initial connection message
                await websocket.send(json.dumps({
                    "type": "start_session",
                    "session_id": self.session_id
                }))
                
                # Process each phase of the script
                for phase_data in self.script:
                    self.print_phase_info(phase_data)
                    
                    # Send each exchange in the phase
                    for exchange in phase_data["exchanges"]:
                        await self.send_transcript_segment(websocket, exchange["text"])
                        
                        # Wait between exchanges (simulating natural conversation flow)
                        if not self.instant_mode:
                            await asyncio.sleep(exchange["delay"])
                        else:
                            await asyncio.sleep(0.5)  # Small delay even in instant mode
                    
                    # Longer pause between phases
                    if not self.instant_mode:
                        await asyncio.sleep(3)
                        print(f"\n{Colors.CYAN}[Waiting for analysis to process...]{Colors.END}")
                        await asyncio.sleep(2)
                
                # Send session end signal
                await websocket.send(json.dumps({
                    "type": "end_session",
                    "session_id": self.session_id
                }))
                
                self.print_header("SESSION SIMULATION COMPLETE", Colors.GREEN)
                print(f"Session ID: {self.session_id}")
                print(f"Total phases: {len(self.script)}")
                print(f"\n{Colors.GREEN}✓ Check the frontend for:")
                print(f"  - Live transcript updates")
                print(f"  - Real-time guidance alerts")
                print(f"  - Session metrics changes")
                print(f"  - Pathway indicators{Colors.END}")
                
        except websockets.exceptions.ConnectionRefused:
            print(f"{Colors.RED}✗ Connection refused. Make sure the streaming service is running!{Colors.END}")
            print(f"{Colors.YELLOW}Run: cd backend/streaming-transcription-service && python main.py{Colors.END}")
        except Exception as e:
            print(f"{Colors.RED}✗ Error: {e}{Colors.END}")

async def main():
    parser = argparse.ArgumentParser(description='WebSocket Transcript Simulator for Ther-Assist')
    parser.add_argument('--instant', action='store_true', 
                       help='Run instantly without typing effect')
    parser.add_argument('--ws-url', type=str, default='ws://localhost:8080/ws',
                       help='WebSocket URL (default: ws://localhost:8080/ws)')
    
    args = parser.parse_args()
    
    # Update global WS URL if provided
    global WS_URL
    WS_URL = args.ws_url
    
    print(f"{Colors.BOLD}{Colors.BLUE}")
    print("=" * 80)
    print("WEBSOCKET TRANSCRIPT SIMULATOR")
    print("Ther-Assist Frontend Integration Test")
    print("=" * 80)
    print(f"{Colors.END}")
    
    print(f"\nConfiguration:")
    print(f"  WebSocket URL: {WS_URL}")
    print(f"  Mode: {'Instant' if args.instant else f'Typing simulation ({TYPING_SPEED} chars/sec)'}")
    
    print(f"\n{Colors.YELLOW}Prerequisites:{Colors.END}")
    print(f"1. Start the streaming service:")
    print(f"   {Colors.CYAN}cd backend/streaming-transcription-service && python main.py{Colors.END}")
    print(f"2. Start the analysis function:")
    print(f"   {Colors.CYAN}cd backend/therapy-analysis-function && functions-framework --target=therapy_analysis --port=8081{Colors.END}")
    print(f"3. Start the frontend:")
    print(f"   {Colors.CYAN}cd frontend && npm run dev{Colors.END}")
    print(f"4. Open the frontend in browser and click 'Start Session'")
    
    input(f"\n{Colors.BOLD}Press Enter when ready to start simulation...{Colors.END}")
    
    simulator = WebSocketTranscriptSimulator(instant_mode=args.instant)
    await simulator.simulate_session()

if __name__ == "__main__":
    asyncio.run(main())
