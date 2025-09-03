MODEL_NAME = "gemini-2.5-flash"

# Therapy phase definitions
THERAPY_PHASES = {
    "beginning": {"duration_minutes": 10, "focus": "rapport building, agenda setting"},
    "middle": {"duration_minutes": 30, "focus": "core therapeutic work"},
    "end": {"duration_minutes": 10, "focus": "summary, homework, closure"}
}

# Prompts
REALTIME_ANALYSIS_PROMPT = """Analyze this therapy segment for real-time guidance.

TRANSCRIPT (last 5 minutes):
{transcript_text}

Provide guidance based on timing priority:
1. NOW (immediate intervention needed): dissociation, panic, suicidal ideation, self-harm, severe distress
2. PAUSE (wait for natural pause): therapeutic opportunities, technique suggestions, process observations  
3. INFO (informational only): positive moments, progress indicators, engagement observations

Return the MOST RELEVANT guidance (max 1-2 alerts). Format:
{{
    "alerts": [{{
        "timing": "now|pause|info",
        "category": "safety|technique|pathway_change",
        "title": "Brief descriptive title",
        "message": "Specific action or observation (1-3 sentences max)",
        "evidence": ["relevant quote if applicable"],
        "recommendation": "Action(s) to take if applicable. IMPORTANT: format each recommendation as a bullet point"
    }}],
    "session_metrics": {{
        "engagement_level": 0.0-1.0,
        "therapeutic_alliance": "weak|moderate|strong",
        "emotional_state": "calm|anxious|distressed|dissociated|engaged"
    }}
}}

Prioritize actionable guidance. Even routine moments can have helpful suggestions."""

COMPREHENSIVE_ANALYSIS_PROMPT = """<thinking>
Analyze this therapy session segment step by step:
1. Check for any safety concerns (dissociation, panic, suicidal ideation)
2. Evaluate therapeutic process metrics (engagement, alliance, techniques)
3. Assess if current approach is effective or needs adjustment
4. Search for similar patterns in clinical transcripts (Beck sessions, PTSD sessions)
5. Reference EBT manuals for evidence-based protocols
6. Provide specific pathway guidance regardless of effectiveness
</thinking>

You are an expert clinical supervisor providing real-time guidance during a therapy session. Analyze this segment comprehensively using BOTH:
1. EBT manuals for evidence-based protocols and techniques
2. Clinical transcripts for real-world examples of similar therapeutic moments

CURRENT SESSION CONTEXT:
- Phase: {phase} ({phase_focus})
- Duration: {session_duration} minutes
- Session Type: {session_type}
- Primary Concern: {primary_concern}
- Current Therapeutic Approach: {current_approach}

TRANSCRIPT SEGMENT:
{transcript_text}

IMPORTANT: 
- Look for similar patterns in the transcript database (e.g., "client resistance", "overwhelm", "not ready")
- Reference EBT manual protocols with citations [1], [2], etc.
- If you find a similar moment in Beck or PTSD sessions, mention how it was handled
- ALWAYS provide pathway guidance details (rationale, actions, contraindications) regardless of effectiveness

Provide analysis in this JSON format:
{{
    "alerts": [
        {{
            "timing": "now|pause|info",
            "category": "safety|technique|pathway_change",
            "title": "Brief alert title",
            "message": "Detailed guidance message",
            "evidence": ["Direct quote from transcript"],
            "recommendation": "Specific action to take"
        }}
    ],
    "session_metrics": {{
        "engagement_level": 0.0-1.0,
        "therapeutic_alliance": "weak|moderate|strong",
        "techniques_detected": ["technique1", "technique2"],
        "emotional_state": "calm|anxious|distressed|dissociated",
        "phase_appropriate": true|false
    }},
    "pathway_indicators": {{
        "current_approach_effectiveness": "effective|struggling|ineffective",
        "alternative_pathways": ["pathway1", "pathway2"],
        "change_urgency": "none|monitor|consider|recommended"
    }},
    "pathway_guidance": {{
        "continue_current": true|false,
        "rationale": "Explanation with citations [1], [2] embedded in text",
        "immediate_actions": ["action1 with citation [3]", "action2"],
        "contraindications": ["contraindication1 [4]", "contraindication2"],
        "alternative_pathways": [
            {{
                "approach": "Approach name",
                "reason": "Why this alternative with citations [5]",
                "techniques": ["technique1", "technique2"]
            }}
        ]
    }}
}}

Focus on clinically actionable insights. Only surface critical information that requires immediate attention. Always provide pathway guidance even when the current approach is effective."""

PATHWAY_GUIDANCE_PROMPT = """You are a clinical supervisor providing pathway guidance for a therapy session.

CURRENT SITUATION:
- Current Approach: {current_approach}
- Presenting Issues: {presenting_issues}
- Recent Session History: {history_summary}

Based on evidence-based treatment protocols, provide specific guidance on:
1. Whether to continue with current approach
2. Alternative pathways if change is needed
3. Specific techniques to implement
4. Contraindications to watch for

IMPORTANT: When referencing EBT manuals or research, use inline citations in the format [1], [2], etc. 
For example: "Consider graded exposure therapy [1] as outlined in the PE manual [2]."

Provide response in JSON format:
{{
    "continue_current": true|false,
    "rationale": "Explanation with citations [1], [2] embedded in text",
    "alternative_pathways": [
        {{
            "approach": "Approach name",
            "reason": "Why this alternative with citations [3]",
            "techniques": ["technique1", "technique2"]
        }}
    ],
    "immediate_actions": ["action1 with citation [4]", "action2"],
    "contraindications": ["contraindication1 [5]", "contraindication2"]
}}"""

SESSION_SUMMARY_PROMPT = """Generate a comprehensive session summary for the therapist's records.

SESSION TRANSCRIPT:
{transcript_text}

SESSION METRICS:
{session_metrics}

Create a summary including:
1. Key therapeutic moments with timestamps
2. Techniques used effectively
3. Areas for improvement
4. Patient progress indicators
5. Recommended follow-up actions
6. Homework assignments based on EBT protocols

Reference specific EBT manual sections for homework and follow-up recommendations.

Format as structured JSON:
{{
    "session_date": "ISO date",
    "duration_minutes": number,
    "key_moments": [
        {{
            "time": "timestamp",
            "description": "what happened",
            "significance": "why it matters"
        }}
    ],
    "techniques_used": ["technique1", "technique2"],
    "progress_indicators": ["indicator1", "indicator2"],
    "areas_for_improvement": ["area1", "area2"],
    "homework_assignments": [
        {{
            "task": "description",
            "rationale": "why",
            "manual_reference": "CBT Manual p.X"
        }}
    ],
    "follow_up_recommendations": ["recommendation1", "recommendation2"],
    "risk_assessment": {{
        "level": "low|moderate|high",
        "factors": ["factor1", "factor2"]
    }}
}}"""
