import json
import requests

def run_test():
    """
    Runs a local test of the analysis function with hardcoded data.
    """
    # Hardcoded transcript from the cooper good example
    transcript = [
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
        },
        {
            "role": "user",
            "parts": "I hear how difficult this has been for you, Sara. Thank you for being honest with me about what's happening. I can see that you care deeply about your children and don't want to lose them. That's a strength - your love for Jasmine and Jasper is clear. I also appreciate you sharing about the substance use. That takes courage. Is there anyone else in the home right now besides you and Jasper? And before we continue, I want to give you this pamphlet that explains your rights and what happens during a child protective services assessment. *hands over the 1536 pamphlet* Let me also check - do you or your children have any tribal affiliation or Native American heritage? This could provide additional rights and resources for your family."
        },
        {
            "role": "model",
            "parts": "No, no tribal affiliation. It's just me and the baby here. My mom will be back with Jasmine after school. She helps me a lot. She's been trying to get me to leave Shawn for months. She was right. I should have listened. *takes the pamphlet* What happens now? Are you going to take my kids? I'll go to treatment, I'll do whatever you need."
        }
    ]

    # Hardcoded assessment from the first good example
    assessment = {
        "introduction": "I introduced myself as Sarah Johnson from the Oregon Department of Human Services, Child Welfare division. I showed my ID and provided a business card. I confirmed the parent's identity by asking 'Are you Sara Cooper?' before proceeding. I feel I did this well, maintaining a professional yet approachable demeanor. However, I realized I could have asked if she preferred to be called Sara or Ms. Cooper to show more respect for her preferences.",
        "reasonForContact": "I clearly stated we received a report about concerns for the children's safety, specifically mentioning the report from Jasmine's school about witnessing incidents at home. I tried to use neutral language like 'concerns' instead of 'allegations' to reduce defensiveness. I emphasized that I wanted to hear her perspective. Looking back, I could have been more empathetic in my delivery - perhaps acknowledging how difficult it must be to receive this visit.",
        "responsiveToParent": "When Sara became emotional and started talking about her substance use and relationship with Shawn, I listened without judgment and validated her feelings by saying 'I hear how difficult this has been for you.' I asked follow-up questions from a place of curiosity rather than interrogation. However, I noticed I interrupted her once when she was explaining about Shawn - I need to work on allowing complete responses before asking the next question.",
        "permissionToEnter": "I asked 'May I come in so we can discuss this privately?' and waited for her explicit consent. When she invited me in, I thanked her. I also asked if anyone else was home, which helped me understand who was present. I maintained appropriate boundaries by asking where she'd like me to sit. This felt natural and respectful.",
        "gatheringInformation": "I gathered information about multiple areas: the substance use issue, domestic violence concerns, support systems (her mother), and current safety (Shawn being in jail). I asked about tribal affiliation to ensure appropriate resources. However, I realize I didn't ask enough about the children's daily routines, medical needs, or school attendance. I was so focused on the immediate allegations that I missed gathering a more complete picture of the family's functioning.",
        "processAndNextSteps": "I provided the 1536 pamphlet and briefly explained it outlined her rights and the assessment process. I told her we would need to see the children and assess their safety, and discussed potential resources and support. However, I realize I wasn't specific enough about timelines - when I would need to see the children, how long the assessment might take, or when she could expect to hear from me again. This uncertainty might increase her anxiety."
    }

    payload = {
        "action": "analyze",
        "transcript": transcript,
        "assessment": assessment,
        "systemInstruction": "You are an expert social work educator analyzing a parent interview transcript. Provide feedback based on best practices in child welfare."
    }

    url = "http://localhost:8080"
    headers = {"Content-Type": "application/json"}

    print(f"Sending POST request to {url}...")
    print("Payload size:", len(json.dumps(payload)))
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        try:
            print("Response JSON:")
            print(json.dumps(response.json(), indent=2))
        except json.JSONDecodeError:
            print("Response content (not JSON):")
            print(response.text)
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    run_test()
