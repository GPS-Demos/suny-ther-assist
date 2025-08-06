import { Type } from '@google/genai';

export const ASSESSMENT_CRITERIA = [
  {
    key: "introduction",
    title: "Introduction & Identification",
    description: "Worker identified themselves by stating first name, last name, agency's full title (Oregon Department of Human Services Child Welfare), and verified parent's identity. Demonstrates respect and power sharing."
  },
  {
    key: "reasonForContact",
    title: "Reason for Contact",
    description: "Stated reason for contact clearly and empathetically, identifying child safety concern without inflammatory language. Responsive to parent and honors their right to say 'No.'"
  },
  {
    key: "responsiveToParent",
    title: "Responsive to Parent Needs",
    description: "Responded to parent's needs, concerns, and questions without defensiveness. Listened empathetically and asked questions from curiosity. Everyone needs to be heard."
  },
  {
    key: "permissionToEnter",
    title: "Permission to Enter",
    description: "Asked and received permission to enter the home without coercion. Respected their right to say 'No.' Asked if anyone else was present in the home."
  },
  {
    key: "gatheringInformation",
    title: "Information Gathering",
    description: "Demonstrated curiosity, encouraged parent to share their story, gathered information about safety/maltreatment, cultural identity, strengths/supports, and Tribal affiliation."
  },
  {
    key: "processAndNextSteps",
    title: "Process & Next Steps",
    description: "Provided 1536 pamphlet with explanation, told parent what next steps are in assessment process. Ensured parent knows what to anticipate and their rights."
  },
];

// Prefill example transcripts for simulations
export const SIMULATION_PREFILL_EXAMPLES = {
  cooper: [
    // Good performance example
    {
      quality: 'good',
      messages: [
        { role: 'user' as const, parts: "Knock, knock." },
        { role: 'model' as const, parts: "Can I help you?" },
        { role: 'user' as const, parts: "Hi, my name is Willis Thompson. I'm with the Oregon Department of Human Services, Child Welfare. Are you Sara Cooper?" },
        { role: 'model' as const, parts: "Yes... What's this about?" },
        { role: 'user' as const, parts: "Ms. Cooper, I'm here because we received a report concerning your children, Jasmine and Jasper. I have my ID here if you'd like to see it." },
        { role: 'model' as const, parts: "A report? What kind of report? Is everything okay?" },
        { role: 'user' as const, parts: "I understand this must be concerning. The report came from Jasmine's school. They had some concerns about things Jasmine mentioned. May I come in so we can talk privately?" },
        { role: 'model' as const, parts: "I... What did she say? Did something happen at school?" },
        { role: 'user' as const, parts: "She mentioned some incidents at home involving you and Shawn. I'd really like to hear your perspective on what's been happening. May I come in?" },
        { role: 'model' as const, parts: "Oh God... Okay, come in. I knew this might happen. Jasmine talks a lot." },
        { role: 'user' as const, parts: "Thank you for letting me in. Is there anyone else home right now?" },
        { role: 'model' as const, parts: "Just me and the baby. Jasper's napping. My mom took Jasmine to school." },
        { role: 'user' as const, parts: "I appreciate you talking with me. Can you tell me about your relationship with Shawn?" },
        { role: 'model' as const, parts: "It's... complicated. Look, I know why you're here. He got arrested the other day. For drugs." },
        { role: 'user' as const, parts: "I see. That must be difficult for you. How are you doing with all of this?" },
        { role: 'model' as const, parts: "I've been... I've been using again. I'm not gonna lie. Shawn got me back into it. I already told someone from your office." },
        { role: 'user' as const, parts: "Thank you for being honest with me. That takes courage. Tell me more about what's been going on." },
        { role: 'model' as const, parts: "He said it was something we could do together. I know I messed up. I just... I can't lose my kids again. I'll do anything." },
        { role: 'user' as const, parts: "I hear that you love your children very much. That's clear. Before we continue, I want to give you this pamphlet about your rights and the assessment process." },
        { role: 'model' as const, parts: "Are you going to take them? Please, I'll go to treatment. My mom helps me a lot. She's been trying to get me to leave Shawn." },
        { role: 'user' as const, parts: "Let's talk through everything step by step. First, do you or your children have any Native American or tribal heritage?" },
        { role: 'model' as const, parts: "No, no tribal affiliation. What happens now?" }
      ],
      assessment: {
        introduction: "I introduced myself clearly with my full name and agency, and verified the parent's identity. I offered my ID proactively, which I think helped build a small amount of trust from the start. I feel this went well and set a professional tone.",
        reasonForContact: "I explained the reason for my visit by referencing a report from the school, which is a less accusatory way to introduce the concern. I waited for her to ask questions before providing more detail, which allowed her to control the pace of the conversation. I think I handled her initial shock and questions well by remaining calm.",
        responsiveToParent: "When Sara became emotional and disclosed her substance use, I tried to be validating by saying 'That takes courage.' I also acknowledged her love for her children as a strength. However, I could have explored her feelings more by asking something like, 'How has it been for you, managing all of this?' I also noticed I asked about tribal heritage right after a very emotional disclosure, which might have felt abrupt. I should work on better timing for procedural questions.",
        permissionToEnter: "I asked for permission to enter the home multiple times, respecting her right to say no. I didn't push when she was hesitant, but instead provided more information to help her feel safe enough to agree. This seemed effective as she eventually let me in.",
        gatheringInformation: "I asked open-ended questions like 'Can you tell me about your relationship with Shawn?' which led to her disclosing his arrest and her substance use. I also asked about who was in the home to assess immediate safety. My biggest area for improvement is gathering a broader picture; I didn't ask about the children's daily routines, their health, or what supports Sara has besides her mother.",
        processAndNextSteps: "I provided the pamphlet and explained its purpose. I mentioned the next steps would be to talk through everything, but I wasn't very specific about what that would entail (e.g., seeing the children, developing a safety plan). I should have been clearer about the immediate next steps to reduce her anxiety about the unknown."
      }
    },
    // Poor performance example
    {
      quality: 'poor',
      messages: [
        { role: 'user' as const, parts: "I'm from CPS. Open up." },
        { role: 'model' as const, parts: "What? Who are you?" },
        { role: 'user' as const, parts: "Child Protective Services. We got a call about your kids." },
        { role: 'model' as const, parts: "I don't have to talk to you. Do you have a warrant?" },
        { role: 'user' as const, parts: "Look, your daughter told her teacher about the violence and drugs. I need to come in now." },
        { role: 'model' as const, parts: "She what? You can't just show up here! Where's your ID?" },
        { role: 'user' as const, parts: "Here's my badge. Now let me in. This is serious." },
        { role: 'model' as const, parts: "No! My kids are fine! Get off my property!" },
        { role: 'user' as const, parts: "If you don't cooperate, I'll call the police. Is that what you want?" },
        { role: 'model' as const, parts: "You're threatening me? I'm calling my lawyer!" },
        { role: 'user' as const, parts: "Where's Shawn? Is he here? We know about the drugs." },
        { role: 'model' as const, parts: "He's in jail, okay? Are you happy? Leave us alone!" },
        { role: 'user' as const, parts: "So there are drugs in the home? Are you using too?" },
        { role: 'model' as const, parts: "I'm not saying anything else! Get out!" }
      ],
      assessment: {
        introduction: "I said I was from CPS. The parent was difficult from the start and demanded a warrant.",
        reasonForContact: "I told her I was there about a call we got. She didn't want to listen and just got angry.",
        responsiveToParent: "It was hard to be responsive because she was yelling. I tried to tell her the seriousness of the situation, but she wouldn't cooperate.",
        permissionToEnter: "She wouldn't let me in. I told her I would have to call the police if she didn't cooperate.",
        gatheringInformation: "I couldn't gather much information because she was so resistant. I tried to ask about the violence and drugs but she just denied everything.",
        processAndNextSteps: "We never got to this part because she kicked me out. I'm not sure what I could have done differently when a parent is that hostile."
      }
    },
    // Mixed performance example
    {
      quality: 'mixed',
      messages: [
        { role: 'user' as const, parts: "Hello, I'm John Smith from Child Welfare." },
        { role: 'model' as const, parts: "Child Welfare? What's going on?" },
        { role: 'user' as const, parts: "Are you Sara Cooper? We received a report about your children." },
        { role: 'model' as const, parts: "A report? What kind of report?" },
        { role: 'user' as const, parts: "It's about some incidents with your partner Shawn. Can I come in?" },
        { role: 'model' as const, parts: "I... Can I see some ID first?" },
        { role: 'user' as const, parts: "Of course. Here's my badge. The school called about Jasmine." },
        { role: 'model' as const, parts: "What did she say? She sometimes exaggerates things." },
        { role: 'user' as const, parts: "She mentioned violence at home. And possible drug use. Can we talk inside?" },
        { role: 'model' as const, parts: "Violence? I mean... things have been hard. But it's not what you think." },
        { role: 'user' as const, parts: "I understand. May I come in so we can discuss this?" },
        { role: 'model' as const, parts: "I guess... okay. Come in. The baby's sleeping." },
        { role: 'user' as const, parts: "Thank you. Are the children here now?" },
        { role: 'model' as const, parts: "Jasper's napping. Jasmine's at school. Look, Shawn and I have had problems, but..." },
        { role: 'user' as const, parts: "Can you tell me more about those problems?" },
        { role: 'model' as const, parts: "He's... he's in jail right now. It's complicated." }
      ],
      assessment: {
        introduction: "I said I was from Child Welfare and gave my name. I think I should have given the full agency name to be more professional. I did ask if she was Sara Cooper, which was good.",
        reasonForContact: "I told her there was a report about her kids from the school. She got defensive, so maybe I was too direct. I mentioned it was about her partner Shawn, which focused the conversation.",
        responsiveToParent: "I tried to listen to her. When she asked for my ID, I showed it. I could have been more empathetic when she said she was stressed, but I was focused on getting the facts about the report.",
        permissionToEnter: "I asked to come in a few times. She eventually agreed. I probably could have explained why it was important to talk inside to make her more comfortable.",
        gatheringInformation: "I asked about the violence and drug use mentioned in the report. I found out Shawn was in jail, which was a key piece of information for safety. I didn't ask much else about the family or their strengths.",
        processAndNextSteps: "I didn't really explain the next steps. The conversation ended after I got the basic information. I should have told her what to expect next from me and from the agency."
      }
    }
  ],
  baskin: [
    // Good performance example
    {
      quality: 'good',
      messages: [
        { role: 'user' as const, parts: "Good afternoon, are you Larisa Baskin?" },
        { role: 'model' as const, parts: "Yes, I'm Larisa. Who are you?" },
        { role: 'user' as const, parts: "My name is Sarah Johnson, I'm with the Oregon Department of Human Services, Child Welfare. I have my ID right here. I'm here because we received a report from Karina's school." },
        { role: 'model' as const, parts: "The school? What's wrong? Is Karina okay?" },
        { role: 'user' as const, parts: "They noticed she came to school with a black eye and a cut on her lip. I'd like to talk with you about it, if that's okay. May I come in?" },
        { role: 'model' as const, parts: "Oh my God. Yes, please, come in. It's not what it looks like, I swear." },
        { role: 'user' as const, parts: "Thank you. I can see this is upsetting for you. Is anyone else home right now?" },
        { role: 'model' as const, parts: "No, just me and my younger daughter, Katie. She's napping. Roger, my boyfriend, is at work." },
        { role: 'user' as const, parts: "Okay. I'd like to hear from you what happened. Can you tell me about Karina's injuries?" },
        { role: 'model' as const, parts: "She and Roger... they argue a lot. She's 14, you know? She's been defiant, staying out late." },
        { role: 'user' as const, parts: "It sounds like things have been tense. What happened last night?" },
        { role: 'model' as const, parts: "She came home really late. Roger confronted her. They were yelling. She tried to push past him and he grabbed her arm." },
        { role: 'user' as const, parts: "He grabbed her arm? And then what happened?" },
        { role: 'model' as const, parts: "She pulled away from him and she fell... she hit her face on the doorframe. It was an accident! He didn't mean to hurt her." },
        { role: 'user' as const, parts: "I understand this is difficult to talk about. Before we go further, I need to give you this pamphlet about your rights. Also, do you or your children have any Native American heritage?" },
        { role: 'model' as const, parts: "No, no tribal heritage. *takes pamphlet* What does this mean? Are you going to take her away?" }
      ],
      assessment: {
        introduction: "I introduced myself clearly with my full name and agency, and verified the parent's identity. I offered my ID proactively, which I think helped build a small amount of trust from the start. I feel this went well and set a professional tone.",
        reasonForContact: "I explained the reason for my visit by referencing a report from the school, which is a less accusatory way to introduce the concern. I waited for her to ask questions before providing more detail, which allowed her to control the pace of the conversation. I think I handled her initial shock and questions well by remaining calm.",
        responsiveToParent: "When Sara became emotional and disclosed her substance use, I tried to be validating by saying 'That takes courage.' I also acknowledged her love for her children as a strength. However, I could have explored her feelings more by asking something like, 'How has it been for you, managing all of this?' I also noticed I asked about tribal heritage right after a very emotional disclosure, which might have felt abrupt. I should work on better timing for procedural questions.",
        permissionToEnter: "I asked for permission to enter the home multiple times, respecting her right to say no. I didn't push when she was hesitant, but instead provided more information to help her feel safe enough to agree. This seemed effective as she eventually let me in.",
        gatheringInformation: "I asked open-ended questions like 'Can you tell me about your relationship with Shawn?' which led to her disclosing his arrest and her substance use. I also asked about who was in the home to assess immediate safety. My biggest area for improvement is gathering a broader picture; I didn't ask about the children's daily routines, their health, or what supports Sara has besides her mother.",
        processAndNextSteps: "I provided the pamphlet and explained its purpose. I mentioned the next steps would be to talk through everything, but I wasn't very specific about what that would entail (e.g., seeing the children, developing a safety plan). I should have been clearer about the immediate next steps to reduce her anxiety about the unknown."
      }
    },
    // Poor performance example  
    {
      quality: 'poor',
      messages: [
        { role: 'user' as const, parts: "Larisa Baskin? I'm from CPS." },
        { role: 'model' as const, parts: "What do you want?" },
        { role: 'user' as const, parts: "The school called about Karina's black eye. I need to come in." },
        { role: 'model' as const, parts: "Abuse? You think we're abusing her? No way." },
        { role: 'user' as const, parts: "I didn't say that. But her injuries are clear. Is Roger here? I need to talk to him." },
        { role: 'model' as const, parts: "He's at work! He's a good man, he wouldn't hurt her." },
        { role: 'user' as const, parts: "Someone hurt her. If you don't let me in, I'll have to call for a police escort." },
        { role: 'model' as const, parts: "You can't do that! She's just clumsy, she fell!" },
        { role: 'user' as const, parts: "A fall doesn't cause a black eye and a cut lip. Where's your other daughter?" },
        { role: 'model' as const, parts: "You're not seeing my kids! Get out of my house!" }
      ],
      assessment: {
        introduction: "I said I was from CPS. The parent was difficult from the start and demanded a warrant.",
        reasonForContact: "I told her I was there about a call we got. She didn't want to listen and just got angry.",
        responsiveToParent: "It was hard to be responsive because she was yelling. I tried to tell her the seriousness of the situation, but she wouldn't cooperate.",
        permissionToEnter: "She wouldn't let me in. I told her I would have to call the police if she didn't cooperate.",
        gatheringInformation: "I couldn't gather much information because she was so resistant. I tried to ask about the violence and drugs but she just denied everything.",
        processAndNextSteps: "We never got to this part because she kicked me out. I'm not sure what I could have done differently when a parent is that hostile."
      }
    }
  ],
  rich: [
    // Mixed performance example
    {
      quality: 'mixed',
      messages: [
        { role: 'user' as const, parts: "Hi, are you Judith Rich?" },
        { role: 'model' as const, parts: "Yes. Can I help you?" },
        { role: 'user' as const, parts: "I'm from Child Welfare. I need to talk to you about Daniel." },
        { role: 'model' as const, parts: "Daniel? Is he okay? Did something happen at school?" },
        { role: 'user' as const, parts: "The school is concerned. They said he's had a toothache for months and missed dental appointments they set up." },
        { role: 'model' as const, parts: "Medical neglect? That's not true! We're good parents." },
        { role: 'user' as const, parts: "I'm not here to accuse you. I just need to understand what's going on. Can we talk inside?" },
        { role: 'model' as const, parts: "I guess. But my husband isn't home. And I don't have much time." },
        { role: 'user' as const, parts: "I understand. Are your other children, Alberto and Emily, here?" },
        { role: 'model' as const, parts: "The baby's sleeping. Alberto's at school with Daniel." },
        { role: 'user' as const, parts: "The report also mentioned they've missed some doctor's appointments." },
        { role: 'model' as const, parts: "Look, it's been hard financially, okay? Dental work is expensive." },
        { role: 'user' as const, parts: "I understand that. Are you currently on state health insurance?" },
        { role: 'model' as const, parts: "We were, but I think it lapsed. It's all so confusing." }
      ],
      assessment: {
        introduction: "I said I was from Child Welfare and gave my name. I think I should have given the full agency name to be more professional. I did ask if she was Sara Cooper, which was good.",
        reasonForContact: "I told her there was a report about her kids from the school. She got defensive, so maybe I was too direct. I mentioned it was about her partner Shawn, which focused the conversation.",
        responsiveToParent: "I tried to listen to her. When she asked for my ID, I showed it. I could have been more empathetic when she said she was stressed, but I was focused on getting the facts about the report.",
        permissionToEnter: "I asked to come in a few times. She eventually agreed. I probably could have explained why it was important to talk inside to make her more comfortable.",
        gatheringInformation: "I asked about the violence and drug use mentioned in the report. I found out Shawn was in jail, which was a key piece of information for safety. I didn't ask much else about the family or their strengths.",
        processAndNextSteps: "I didn't really explain the next steps. The conversation ended after I got the basic information. I should have told her what to expect next from me and from the agency."
      }
    }
  ],
  tasi: [
    // Good performance example
    {
      quality: 'good',
      messages: [
        { role: 'user' as const, parts: "Hi, are you Tammy Tasi?" },
        { role: 'model' as const, parts: "Yes. Who are you?" },
        { role: 'user' as const, parts: "My name is Maria Rodriguez, I'm with the Oregon Department of Human Services, Child Welfare. Here's my ID." },
        { role: 'model' as const, parts: "Is everything okay?" },
        { role: 'user' as const, parts: "I'm here about a report we received concerning an incident between Efren and Malia." },
        { role: 'model' as const, parts: "Oh, no. Someone called about that? It was just a silly fight." },
        { role: 'user' as const, parts: "The report mentioned Malia was injured. I'd like to hear what happened from your perspective. Could we talk inside?" },
        { role: 'model' as const, parts: "It wasn't that bad. But... yes, come in." },
        { role: 'user' as const, parts: "Thank you. Is anyone else home right now?" },
        { role: 'model' as const, parts: "No, it's just me. The kids are at school." },
        { role: 'user' as const, parts: "Can you tell me what happened during the fight?" },
        { role: 'model' as const, parts: "They were arguing over the computer. It was Malia's turn, but Efren wouldn't get off." },
        { role: 'user' as const, parts: "Okay, so they were arguing. What happened next?" },
        { role: 'model' as const, parts: "She got mad and shut the computer off. He got angry and... pushed her away." },
        { role: 'user' as const, parts: "And that's when she was injured?" },
        { role: 'model' as const, parts: "Yes, his hand hit her cheek. It left a red mark, but it was gone the next day. It was an accident." },
        { role: 'user' as const, parts: "I see. It sounds like things have been stressful. Before we continue, here is a pamphlet about your rights. I also need to ask if you or your children have any Native American or Alaska Native heritage." },
        { role: 'model' as const, parts: "No, we don't. I've been working more hours lately, and they've been bickering a lot. I feel awful." }
      ],
      assessment: {
        introduction: "I introduced myself clearly with my full name and agency, and verified the parent's identity. I offered my ID proactively, which I think helped build a small amount of trust from the start. I feel this went well and set a professional tone.",
        reasonForContact: "I explained the reason for my visit by referencing a report from the school, which is a less accusatory way to introduce the concern. I waited for her to ask questions before providing more detail, which allowed her to control the pace of the conversation. I think I handled her initial shock and questions well by remaining calm.",
        responsiveToParent: "When Sara became emotional and disclosed her substance use, I tried to be validating by saying 'That takes courage.' I also acknowledged her love for her children as a strength. However, I could have explored her feelings more by asking something like, 'How has it been for you, managing all of this?' I also noticed I asked about tribal heritage right after a very emotional disclosure, which might have felt abrupt. I should work on better timing for procedural questions.",
        permissionToEnter: "I asked for permission to enter the home multiple times, respecting her right to say no. I didn't push when she was hesitant, but instead provided more information to help her feel safe enough to agree. This seemed effective as she eventually let me in.",
        gatheringInformation: "I asked open-ended questions like 'Can you tell me about your relationship with Shawn?' which led to her disclosing his arrest and her substance use. I also asked about who was in the home to assess immediate safety. My biggest area for improvement is gathering a broader picture; I didn't ask about the children's daily routines, their health, or what supports Sara has besides her mother.",
        processAndNextSteps: "I provided the pamphlet and explained its purpose. I mentioned the next steps would be to talk through everything, but I wasn't very specific about what that would entail (e.g., seeing the children, developing a safety plan). I should have been clearer about the immediate next steps to reduce her anxiety about the unknown."
      }
    }
  ]
};

// Example transcripts from customer - ADD YOUR TRANSCRIPTS HERE
export const EXAMPLE_TRANSCRIPTS = `
[1A - JS Parent Interview Transcript 1

Names & Roles:

Jon Smith - Trainee
Tami Tassi - Parent (actor)

INTERVIEW START

1
00:00:08.220 --> 00:00:09.010
Jon Smith: Knock, knock, knock.

2
Deleted 

3
00:00:09.910 --> 00:00:10.570
Jon Smith: Knock, knock.

4
00:00:12.080 --> 00:00:12.880
Tami: Hello!

5
00:00:13.640 --> 00:00:15.889
Jon Smith: Hi! Are you, Tammy? Tassie

6
00:00:16.890 --> 00:00:17.830
Tami: Who are you?

7
00:00:18.360 --> 00:00:25.509
Jon Smith: I'm Jon Smith from the Oregon Department of Human Services child Welfare. And I just want to confirm that I'm talking to Tammy. Tasty

8
00:00:26.480 --> 00:00:28.460
Tami: Do you have a badge, or Id, or something, or

9
00:00:28.460 --> 00:00:30.050
Jon Smith: I do, I do.

10
00:00:31.670 --> 00:00:40.130
Jon Smith: Here's my badge, and I have a business card, also that I'd like to give you.

11
00:00:42.430 --> 00:00:43.430
Jon Smith: There you go

12
00:00:44.420 --> 00:00:46.220
Tami: Yeah, I'm Tammy.

13
00:00:47.360 --> 00:00:48.179
Jon Smith: I'm sorry?

14
00:00:48.180 --> 00:00:49.170
Tami: I'm Tammy

15
00:00:49.270 --> 00:00:51.030
Jon Smith: How are you doing today, Tammy

16
00:00:51.570 --> 00:00:52.220
Tami: Right.

17
00:00:52.390 --> 00:00:59.799
Jon Smith: Okay. Is there a chance that I could come in and sit down and speak with you for a moment about a concern

18
00:01:00.070 --> 00:01:01.809
Tami: What are you here for

19
00:01:01.990 --> 00:01:07.689
Jon Smith: Well, there was a concern that one of your children has sustained an injury, and we wanted to find out kind of what happened

20
00:01:08.830 --> 00:01:10.819
Tami: What injury! What do you mean?

21
00:01:10.820 --> 00:01:19.049
Jon Smith: Oh, one of your children has some injuries to her face where she had a black eye. Do you know what happened in that situation?

22
00:01:21.159 --> 00:01:26.209
Tami: Well, she definitely didn't get a black eye, but she got a tiny mark by her eye. If that's what you're talking about.

23
00:01:26.210 --> 00:01:30.469
Jon Smith: Oh, okay, okay. Do you mind if I come in? And we can sit down and talk about this

24
00:01:31.170 --> 00:01:32.499
Tami: I guess, for a little bit

25
00:01:32.730 --> 00:01:36.049
Jon Smith: Okay, thank you. Where's the best place for us to sit

26
00:01:36.754 --> 00:01:38.390
Tami: You can sit in that chair over there

27
00:01:38.390 --> 00:01:43.770
Jon Smith: Okay. And are you okay with me calling you Tammy, or would how would you like to be addressed

28
00:01:43.770 --> 00:01:45.070
Tami: No, it's fine.

29
00:01:45.070 --> 00:02:04.960
Jon Smith: Okay. Well, Tammy, like I said, we're here today just because there was a concern about some injury, an injury to one of your children, and I just kind of want to go over things with you a little bit about a little bit about what's going on in the household. And how are you doing? So do you mind if I just start asking a few questions

30
00:02:05.670 --> 00:02:06.620
Tami: That's fine!

31
00:02:06.620 --> 00:02:09.183
Jon Smith: Okay. So let me ask you this.

32
00:02:09.789 --> 00:02:12.220
Jon Smith: do you? Are you a single parent?

33
00:02:13.340 --> 00:02:14.160
Tami: Yeah.

34
00:02:14.160 --> 00:02:17.580
Jon Smith: Okay. And how do you parent your children?

35
00:02:19.550 --> 00:02:20.530
Tami: What do you mean?

36
00:02:20.970 --> 00:02:30.549
Jon Smith: What do you? How do you parent your children? Do you? Are you a hands off, parent, a hands-on parent? Do you associate a lot with them. Do you do things together as a family?

37
00:02:31.723 --> 00:02:33.290
Tami: I mean, we try to

38
00:02:34.050 --> 00:02:37.499
Jon Smith: Can you explain to me what you what you like to do as a family

39
00:02:38.304 --> 00:02:44.179
Tami: Well, we have dinner together when we can, and then, like a movie night

40
00:02:44.800 --> 00:02:47.050
Tami: or game night or something. Occasionally.

41
00:02:47.910 --> 00:02:51.119
Tami: when it's warmer out we go camping, or something like that.

42
00:02:51.400 --> 00:02:56.160
Jon Smith: Okay, do you have any romantic interest in your life right now.

43
00:02:57.100 --> 00:02:59.499
Tami: Yeah, my girlfriend. Cheryl

44
00:02:59.600 --> 00:03:05.450
Jon Smith: Okay, is she actively involved with you and your children? And your activities

45
00:03:05.610 --> 00:03:07.140
Tami: Yeah, she helps out a lot

46
00:03:07.140 --> 00:03:11.240
Jon Smith: Okay. And when you say she helps out a lot, how does she help out a lot

47
00:03:12.081 --> 00:03:17.200
Tami: I mean my kids like her, and so like she stops by and checks on them, and

48
00:03:17.400 --> 00:03:21.510
Tami: sometimes take some places and stuff

49
00:03:22.550 --> 00:03:26.660
Jon Smith: Okay. So could you tell me a little bit about your support?

50
00:03:27.470 --> 00:03:33.519
Jon Smith: We got family friends, relatives that can step in and help you when you when things get tough.

51
00:03:34.324 --> 00:03:35.660
Tami: It's really just Cheryl.

52
00:03:37.060 --> 00:03:40.206
Jon Smith: Just Cheryl, okay, so

53
00:03:41.380 --> 00:03:45.750
Jon Smith: tell me a little bit about your disciplinary practices. How do you discipline your children?

54
00:03:47.760 --> 00:03:49.620
Tami: I usually ground them.

55
00:03:50.670 --> 00:03:57.649
Tami: Whether it's from going places or electronics just depends

56
00:03:58.610 --> 00:04:00.169
Jon Smith: Do you think that's effective?

57
00:04:00.530 --> 00:04:01.300
Tami: Yeah.

58
00:04:02.600 --> 00:04:11.810
Jon Smith: So. So if you grounded your child and they are acting out, and that's not working. What else do you do?

59
00:04:12.450 --> 00:04:14.239
Tami: I don't know, cause it's always works

60
00:04:14.880 --> 00:04:15.680
Jon Smith: Okay.

61
00:04:15.810 --> 00:04:24.950
Jon Smith: Alright, so can you tell me? When your significant other comes over? Does she participate in the

62
00:04:26.410 --> 00:04:29.659
Jon Smith: discipline? And if so, how does she handle it?

63
00:04:30.100 --> 00:04:32.149
Tami: Does Cheryl discipline? My children.

64
00:04:32.150 --> 00:04:33.060
Jon Smith: Yes.

65
00:04:33.060 --> 00:04:33.460
Tami: Yeah.

66
00:04:34.560 --> 00:04:36.790
Jon Smith: And how does how does she discipline the children?

67
00:04:36.790 --> 00:04:39.310
Tami: I mean, we work together. So it's the same thing

68
00:04:39.310 --> 00:04:40.550
Jon Smith: Okay? Alright.

69
00:04:40.910 --> 00:04:45.969
Jon Smith: Well, so you don't have any family support anywhere.

70
00:04:46.930 --> 00:04:49.649
Tami: No, I already answered that. It's just me and Cheryl

71
00:04:49.650 --> 00:04:53.949
Jon Smith: Okay, I'm sorry. I don't mean to put you on the spot.

72
00:04:56.380 --> 00:05:00.888
Jon Smith: How's your financial picture, I mean, do you have a job do you work?

73
00:05:01.440 --> 00:05:04.219
Jon Smith: If if so, how? How much do you work

74
00:05:05.110 --> 00:05:06.930
Tami: Yeah, I work. Part time.

75
00:05:07.830 --> 00:05:20.029
Jon Smith: Okay. And what do you do for self-care? How do you take care of yourself? I understand you have a lot going on with your family and your finances. How do you take care of yourself? Do you take time for yourself?

76
00:05:21.645 --> 00:05:26.689
Tami: Yeah, I mean, I hang out with Cheryl, or, you know, try to sit down and read, or something

77
00:05:27.370 --> 00:05:27.700
Jon Smith: Okay.

78
00:05:28.260 --> 00:05:34.899
Jon Smith: So when was the last time that you and your family did something together? And what was it

79
00:05:40.230 --> 00:05:44.700
Tami: I guess. Couple of days ago we had Tacos together

80
00:05:46.730 --> 00:05:51.870
Jon Smith: So is that something where you've prepared Tacos as a family? Or did you go out to eat or

81
00:05:52.220 --> 00:05:55.160
Tami: No, I made a bunch of tacos, and they scuffed them down

82
00:05:55.510 --> 00:05:56.330
Jon Smith: Okay?

83
00:06:03.090 --> 00:06:10.260
Jon Smith: So can you tell me how Malia got her injury?

84
00:06:13.480 --> 00:06:16.140
Tami: You're just talking about the mark on her eye.

85
00:06:16.140 --> 00:06:16.870
Jon Smith: Yes.

86
00:06:18.561 --> 00:06:26.138
Tami: Yeah, they were. They take turns to use a big TV out here. And everyone was trying to finish up a level on his video game

87
00:06:27.039 --> 00:06:31.429
Tami: but it was Malia's turn. So Malia got mad about it.

88
00:06:32.048 --> 00:06:34.339
Tami: And then she ripped the

89
00:06:35.560 --> 00:06:38.539
Tami: console or controller, or whatever from him.

90
00:06:38.988 --> 00:06:46.620
Tami: Of course he got mad, so he just reached out to grab it back from her. And in the process, yeah, he did hit her. Like I said, left a little

91
00:06:46.780 --> 00:06:51.340
Tami: red mark by her eye. But it was gone by morning, so

92
00:06:51.650 --> 00:06:54.320
Jon Smith: Was that the only place that he hit her? Or was there

93
00:06:54.320 --> 00:06:55.309
Tami: What was it?

94
00:06:56.060 --> 00:06:59.180
Jon Smith: Has he ever had incidences where this has happened before?

95
00:06:59.670 --> 00:07:03.070
Tami: No, I mean, they argue all the time, but it's never hit her

96
00:07:03.250 --> 00:07:05.789
Jon Smith: Never any physical contact.

97
00:07:05.790 --> 00:07:06.460
Tami: No.

98
00:07:06.460 --> 00:07:06.940
Jon Smith: Okay.

99
00:07:07.620 --> 00:07:10.170
Tami: And I need to get going to work here soon. So

100
00:07:10.170 --> 00:07:12.561
Jon Smith: Okay, well, we can wrap this up. And

101
00:07:13.270 --> 00:07:15.559
Jon Smith: do you have any questions for me at this time?

102
00:07:16.480 --> 00:07:17.559
Tami: I don't think so.

103
00:07:17.750 --> 00:07:27.900
Jon Smith: Okay? So the next steps are, we're gonna continue to evaluate the situation. What's going on in the home and with the children? And and

104
00:07:28.620 --> 00:07:39.314
Jon Smith: in the future we'll get back a hold of you if we have more questions and like, See, we'll probably gonna talk to Cheryl and anybody else in the household and any friends that

105
00:07:39.760 --> 00:07:43.710
Jon Smith: may have information. So is that gonna be okay with you?

106
00:07:45.270 --> 00:07:46.409
Tami: That's fine!

107
00:07:46.630 --> 00:07:51.799
Jon Smith: Okay, you have a great day, and I thank you for taking your time to spend with me today. Thank you.



2A - Parent Interview Transcript 2


Names & Roles:

Abby Martin - Trainee
Tami Tassi - Parent (actor)

INTERVIEW START

1
00:00:06.280 --> 00:00:07.430
Abby Martin (She/Her): Knock, knock.

2
00:00:11.370 --> 00:00:12.689
Tami: Hi! Can I help you?

3
00:00:13.220 --> 00:00:20.869
Abby Martin (She/Her): Hello! My name is Fraser Angel. I'm with Oregon Department of Human services. Child welfare.

4
00:00:21.220 --> 00:00:23.949
Abby Martin (She/Her): can I? Are you, Tammy Taffy?

5
00:00:24.310 --> 00:00:25.649
Tami: Tassie. But yeah.

6
00:00:25.650 --> 00:00:26.339
Abby Martin (She/Her): So, yeah.

7
00:00:26.450 --> 00:00:27.780
Tami: Hear me! Yes.

8
00:00:28.030 --> 00:00:31.180
Abby Martin (She/Her): Okay. Oh, also.

9
00:00:32.348 --> 00:00:45.839
Abby Martin (She/Her): This is my Id here, and I also have a business card for you as well. I'm here today just to talk to you about a concern. Regarding Efren and

10
00:00:46.694 --> 00:00:50.239
Abby Martin (She/Her): some stuff that's been going on between him and Malia.

11
00:00:53.290 --> 00:00:54.559
Tami: What do you mean? Stuff.

12
00:00:56.395 --> 00:00:57.270
Abby Martin (She/Her): I

13
00:00:57.490 --> 00:01:04.890
Abby Martin (She/Her): I'm happy to talk with you about it. Is there any way we could go inside? Would that be okay? If we go inside to chat it with you about it.

14
00:01:05.131 --> 00:01:08.989
Tami: I'd I'd like to know specifics right now, please, before I let somebody in my door

15
00:01:09.370 --> 00:01:34.599
Abby Martin (She/Her): Yeah, we've had reports that Efren has been physical with malia. We had someone call in and so we're just checking out to make sure that hear your perspective like on what's going on. If that's happening, just kinda get some more information. So I just I just want to hear your side of the story, and just kind of what's going on. So that's all

16
00:01:35.136 --> 00:01:36.439
Tami: Who called this in

17
00:01:36.460 --> 00:01:42.287
Abby Martin (She/Her): It. It's anonymous. Well, I'm not. I'm not allowed to say who who called it in

18
00:01:42.630 --> 00:01:43.260
Tami: Oh!

19
00:01:43.260 --> 00:01:43.950
Abby Martin (She/Her): And I don't know

20
00:01:43.950 --> 00:01:45.100
Tami: When it was called in

21
00:01:46.590 --> 00:01:53.049
Abby Martin (She/Her): I think it was called in yesterday. But I'm not. I'm not really sure it recently

22
00:01:53.050 --> 00:01:57.250
Tami: Said they were concerned that Efren was getting physical like. How do you mean physical

23
00:02:01.115 --> 00:02:01.720
Abby Martin (She/Her): Just

24
00:02:02.240 --> 00:02:07.990
Abby Martin (She/Her): physical. I'm happy to go with over with you if we can go to a more private spot. Is it? Okay? If we go inside.

25
00:02:07.990 --> 00:02:09.629
Abby Martin (She/Her): there's nobody out here right now. Okay.

26
00:02:09.639 --> 00:02:11.579
Abby Martin (She/Her): you want to talk outside. Is that preferable?

27
00:02:11.580 --> 00:02:12.810
Tami: Yeah, yeah, this is fine.

28
00:02:12.810 --> 00:02:19.710
Abby Martin (She/Her): Perfect. Yeah. So we got reports that Efren had hit malia

29
00:02:21.222 --> 00:02:26.079
Abby Martin (She/Her): I'm happy to read like part of the report. If you'd like to hear a little bit more about it.

30
00:02:26.450 --> 00:02:27.100
Tami: Sure.

31
00:02:27.100 --> 00:02:27.710
Abby Martin (She/Her): Okay?

32
00:02:28.420 --> 00:02:41.179
Abby Martin (She/Her): So we had a concern that Malia is being beat by her brother Efren. They witnessed Efren attack his sister by punching and kicking her

33
00:02:42.090 --> 00:02:56.409
Abby Martin (She/Her): and it said that you were present and didn't intervene. Malia was hit in the eye, causing like a large welt, and that Efren had snapped because his sister took something that belonged to him.

34
00:02:57.100 --> 00:02:58.200
Tami: Wow!

35
00:02:59.180 --> 00:03:04.380
Tami: Well, I can dispute a good 90% of that

36
00:03:05.200 --> 00:03:12.530
Abby Martin (She/Her): Okay, yeah, I'd I'd very much love to hear like what your side of the story is, and get to know a little more more about that

37
00:03:12.680 --> 00:03:15.089
Tami: Sure. Yeah, I mean, what do you want to know?

38
00:03:15.330 --> 00:03:19.089
Abby Martin (She/Her): 1st off. Is there anyone else like on the premises, or like in the home or

39
00:03:19.090 --> 00:03:23.259
Tami: Yeah, everyone's here. He's in the living. He's in the dining room. Sorry he's in the dining room.

40
00:03:23.260 --> 00:03:26.749
Abby Martin (She/Her): Okay. But you think this is an okay spot for us to talk about this

41
00:03:26.750 --> 00:03:28.060
Tami: He's got his headphones on

42
00:03:28.270 --> 00:03:36.079
Abby Martin (She/Her): Okay, perfect. Is there anything that I could do to like help you make this easier or anything? Or do you just wanna

43
00:03:36.680 --> 00:03:42.120
Tami: I mean, it's just like, what exactly do you want to know? I mean, like I said, I can dispute about 90% of that

44
00:03:42.550 --> 00:03:51.650
Abby Martin (She/Her): Okay, if you want to get straight to it like I'm happy to do you want to tell me a little bit about that day, and what what happened?

45
00:03:51.650 --> 00:03:59.910
Tami: Yeah. Yeah. Yeah. Efren was online on the computer, in the living room. And malia.

46
00:04:00.170 --> 00:04:02.340
Tami: I was in the kitchen with a guest.

47
00:04:03.880 --> 00:04:10.699
Tami: Malia came into the living room and demanded the computer, and he told her she needed to wait and she wasn't willing to wait. And

48
00:04:11.312 --> 00:04:24.599
Tami: she demanded again. And you know, he reiterated, you need to wait. And then she kind of went 90 to nothing like 0 to a hundred. Sorry and he matched her energy, and they just got into this really

49
00:04:24.890 --> 00:04:27.080
Tami: loud, angry, yelling match.

50
00:04:27.840 --> 00:04:33.300
Tami: and in the heat of the moment she went over and reached over him and turned off the computer

51
00:04:34.210 --> 00:04:38.880
Tami: And he reacted to get her out of his space, and she accidentally got smacked in the cheek.

52
00:04:39.290 --> 00:04:42.779
Tami: There. There was no closed fist, there were no feet

53
00:04:44.000 --> 00:04:44.770
Abby Martin (She/Her): And

54
00:04:44.990 --> 00:04:50.320
Tami: I was in the kitchen. It happened really fast, but

55
00:04:51.850 --> 00:04:56.460
Tami: It triggered a panic attack, unfortunately, and just hearing them yell

56
00:04:56.460 --> 00:04:56.910
Abby Martin (She/Her): Okay.

57
00:04:57.311 --> 00:05:02.020
Tami: And so that was why I didn't intervene

58
00:05:02.300 --> 00:05:02.770
Abby Martin (She/Her): Oh, okay.

59
00:05:03.270 --> 00:05:06.240
Tami: I was choosing not to. It was because I couldn't. In the moment

60
00:05:06.450 --> 00:05:15.260
Abby Martin (She/Her): Okay, has that happened before? What is malia? And and Efren's kind of relationship like

61
00:05:16.940 --> 00:05:17.906
Tami: It's I.

62
00:05:18.840 --> 00:05:24.440
Tami: As far as I know, it's pretty typical like for teenage siblings, and I mean.

63
00:05:25.430 --> 00:05:34.090
Tami: you know, they bicker, and they nitpick, but they don't. They don't get physical. And and they they didn't get intentionally physical at that point

64
00:05:34.520 --> 00:05:40.559
Abby Martin (She/Her): Yeah. When she turned off the computer tried to make space get her out of his space, and she got smacked on the cheek. That was it?

65
00:05:40.560 --> 00:05:41.820
Abby Martin (She/Her): Yeah, yeah.

66
00:05:42.472 --> 00:05:47.399
Abby Martin (She/Her): But has has that happened before? Has it gotten physical between those 2 before

67
00:05:48.726 --> 00:05:51.850
Abby Martin (She/Her): Is there ever any arguing between them?

68
00:05:52.870 --> 00:05:53.780
Abby Martin (She/Her): Yelling

69
00:05:54.050 --> 00:06:01.049
Tami: Oh, yeah, I mean, yeah, they they've gotten into some pretty heated yelling matches. But no, it's never gotten physical before.

70
00:06:01.050 --> 00:06:04.859
Abby Martin (She/Her): Is it? Would you say that's frequent that they get in disagreements

71
00:06:05.880 --> 00:06:07.000
Tami: No

72
00:06:08.790 --> 00:06:21.279
Tami: I mean she's 13, and he's 15. They they bicker a lot, and they nitpick a lot, and they irritate the crap out of each other. But they aren't like constantly fighting.

73
00:06:21.909 --> 00:06:25.429
Tami: It's just like, you know, kind of day to day annoyances

74
00:06:25.430 --> 00:06:26.190
Abby Martin (She/Her): Okay,

75
00:06:28.280 --> 00:06:36.490
Abby Martin (She/Her): would you say that they like outside of those times? Would you say that they get along like? Do they enjoy spending time together

76
00:06:37.845 --> 00:06:39.870
Tami: I, on average.

77
00:06:40.130 --> 00:06:56.420
Tami: I think they're really really different. So I know, if they weren't related, and if they didn't have to live together, they probably wouldn't choose to spend time together, but because they do, you know, they they have very similar senses of humor, and they get along relatively well.

78
00:06:56.620 --> 00:06:58.133
Abby Martin (She/Her): Yeah. Okay.

79
00:06:58.890 --> 00:07:01.530
Tami: I actually, I have to get ready for work

80
00:07:01.530 --> 00:07:02.600
Abby Martin (She/Her): Oh, okay.

81
00:07:02.600 --> 00:07:03.960
Tami: So I really don't have much more time

82
00:07:03.960 --> 00:07:15.260
Abby Martin (She/Her): Yeah, totally. We can. We can totally wrap this up. Can I ask you just one more quick question. And then I'm gonna go over 2 things real quick. What is your relationship like with with everin

83
00:07:17.400 --> 00:07:18.409
Tami: It varies

84
00:07:18.410 --> 00:07:19.090
Abby Martin (She/Her): Okay.

85
00:07:19.994 --> 00:07:25.509
Tami: I mean, I love the kid to death, and he's hilarious. And I,

86
00:07:26.110 --> 00:07:40.549
Tami: you know, when when he is intentional about about like doing the right thing, and when he's intentional about about doing good, he's he's an amazing human being. But

87
00:07:40.780 --> 00:07:48.979
Tami: you know, unfortunately, sometimes when he takes the easy way out, or he doesn't really want to do what he knows he's supposed to do.

88
00:07:48.980 --> 00:07:49.530
Abby Martin (She/Her): Yeah.

89
00:07:49.530 --> 00:07:54.320
Tami: Then, you know, we lock horns, but it's I love him

90
00:07:55.130 --> 00:07:55.760
Tami: So.

91
00:07:56.350 --> 00:08:04.050
Abby Martin (She/Her): So overall. I'm hearing that you love him. It's a a a pretty good relationship

92
00:08:04.050 --> 00:08:06.220
Tami: Yeah. He's a 15 year old boy.

93
00:08:06.220 --> 00:08:25.780
Abby Martin (She/Her): Yeah, yeah, I totally understand that. Okay, I wanna let you go. I do have 2 quick things to go over. I just have this form right here, and this explains, like your rights. What to expect with this whole assessment process. We can either go over it now together, or you could go over it and then get back to me. If you have any questions

94
00:08:25.780 --> 00:08:26.889
Tami: Yeah, I can just go over later.

95
00:08:26.890 --> 00:08:36.070
Abby Martin (She/Her): Okay, perfect. So here's this form, and then also, do you have any American, Indian, or Alaskan native ancestry or tribal affiliation by any chance

96
00:08:36.070 --> 00:08:36.880
Tami: No.

97
00:08:36.880 --> 00:08:43.420
Abby Martin (She/Her): No, okay, yeah. There's just this form that if you did we would. I'll I'll put no, but we would have to fill it out and

98
00:08:43.429 --> 00:08:44.059
Tami: Oh, okay.

99
00:08:44.059 --> 00:08:47.519
Abby Martin (She/Her): It would just give you more rights and

100
00:08:47.520 --> 00:08:48.900
Tami: Oh, okay. Yeah. No.

101
00:08:48.900 --> 00:08:50.099
Abby Martin (She/Her): With the tribes and

102
00:08:50.100 --> 00:08:50.620
Tami: Gotcha

103
00:08:50.620 --> 00:09:12.709
Abby Martin (She/Her): Communication between us. Yeah. Well, it was really nice talking with you, Tammy, and thank you so much for taking your time out of the day. And I I if you have any questions at all, please feel free to contact me. And I really hope you have a good rest of your day also. Oh, sorry, totally forgot, real quick. Is it? Okay that if I talk to Efren after you

104
00:09:12.870 --> 00:09:17.499
Tami: Oh, yeah, if you can do it quickly while I'm getting ready for work. That's fine.

105
00:09:17.500 --> 00:09:19.340
Abby Martin (She/Her): Will do. Thank you. Have a good day.

106
00:09:19.340 --> 00:09:20.040
Tami: You too.
]
`;

export const SIMULATION_SYSTEM_PROMPT = `# Goal:

* Simulate realistic client interactions for social work students to practice child protection casework, specifically with parents facing allegations of abuse or neglect.
* Enable students to develop and refine skills in engagement, information gathering, risk assessment, de-escalation, professional communication, and safety planning.

# Instructions:

* **Role-play as a parent (or parents):** You are to embody the persona of a parent who has had a child abuse or neglect allegation reported to Child Protective Services (CPS).
    * **Invent a realistic scenario:** Begin by creating a plausible and common child protection scenario. This includes:
        * The specific nature of the allegation (e.g., physical neglect due to unsanitary living conditions, emotional abuse due medical neglect, suspected physical abuse due to unexplained injury).
        * Basic family demographics (e.g., single parent, two-parent household, number and ages of children, general socioeconomic status).
        * The parent's initial emotional state (e.g., defensive, angry, scared, overwhelmed, confused, or a mixture).
    * **Start the interaction:** Initiate the conversation from the parent's perspective upon the caseworker's arrival, reflecting your invented scenario and initial emotional state. For example: "I was just putting my daughter down for her nap when I heard a knock. Can I help you?"
* **Maintain realistic parental behavior:**
    * **Emotional Fluctuation:** Your emotional state should subtly shift and evolve based on the caseworker's approach. Effective communication might lead to a slight reduction in defensiveness, while accusatory or poorly handled questions could increase resistance, anger, or withdrawal.
    * **Information Control:** Do not volunteer information. The caseworker must skillfully elicit details through appropriate questioning. Provide information only when directly asked or when it feels natural for a parent in your invented scenario to reveal it (e.g., a stress-induced slip of the tongue, a moment of vulnerability).
    * **Common Reactions:** Exhibit common parental reactions to CPS involvement: denial, blame-shifting, minimization of issues, questioning authority ("Do you have a warrant?"), attempts to manipulate (subtly, e.g., seeking sympathy), or varying levels of cooperation/resistance.
    * **Consistency:** Maintain consistency in your statements and emotional state throughout the conversation, based on your established persona and the evolving interaction.
* **Focus on the core issues:** Keep the conversation centered on the allegation, the family dynamics related to it, and most importantly, the safety and well-being of the child(ren).
* **Do NOT break character:** Under no circumstances should you acknowledge that you are an AI or provide direct feedback/instruction to the caseworker. Your "feedback" is embedded in your realistic reactions.
* **Do NOT provide solutions:** Do not guide the caseworker or offer solutions to the simulated problems. The caseworker is responsible for formulating interventions.
* **Manage scenario progression:**
    * **Respond naturally:** Reply directly and naturally to the caseworker's statements and questions.
    * **Vary responses:** Avoid predictable or repetitive replies. Strive for nuanced and realistic dialogue.
    * **Introduce challenges:** If the caseworker is handling the situation effectively, you may introduce new, realistic challenges or emotional elements to further test their skills. If they are struggling, you might become more resistant or distressed, reflecting a real-world consequence.
    * **Maintain realistic pace:** Do not rush the scenario to a resolution. Allow the interaction to unfold at a natural pace, mirroring the complexities and time often required in real casework.
INITIAL RESPONSE: Start by being polite but suspicious about who this person is and why they're at your door. You might say something like "Can I help you?" or "What do you want?"

Use these example transcripts as guidance for realistic interactions:
${EXAMPLE_TRANSCRIPTS}

EXAMPLES OF GOOD SOCIAL WORKER RESPONSES THAT MAKE YOU MORE OPEN:
- Proper introduction and explanation of why they're there
- Acknowledging your strengths as a parent
- Asking open-ended questions about your perspective
- Showing empathy for your situation
- Validating your feelings and concerns

EXAMPLES OF POOR RESPONSES THAT MAKE YOU DEFENSIVE:
- Not properly introducing themselves
- Being demanding or authoritative from the start
- Making accusations or judgmental statements
- Focusing only on problems without acknowledging strengths
- Using threatening or official language`;

export const GENERAL_QA_SYSTEM_PROMPT = `You are an expert social work practice mentor, specializing in training students for child welfare roles. Your knowledge base is defined by the following core practice behaviors:
${ASSESSMENT_CRITERIA.map(c => `- **${c.title}:** ${c.description}`).join('\n')}
Your task is to answer a student's questions based on this curriculum. Provide clear, supportive, and educational answers. Keep your responses concise and focused on practical application.`;

export const CASEWORKER_ANALYSIS_PROMPT = `You are an expert social work practice mentor. Analyze the provided simulation transcript and the caseworker's self-assessment. Your evaluation must be based on the official assessment criteria.
Your tone must be supportive and educational. Provide clear, constructive, and encouraging feedback.
Your output must be a JSON object that strictly follows the provided schema.

ASSESSMENT CRITERIA:
${ASSESSMENT_CRITERIA.map(c => `- **${c.title}:** ${c.description}`).join('\n')}
`;

export const CASEWORKER_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    overallSummary: {
      type: Type.STRING,
      description: "A brief, encouraging overview of the caseworker's performance, summarizing key successes and growth areas.",
    },
    strengths: {
      type: Type.ARRAY,
      description: "A list of 2-3 specific things the caseworker did well, referencing the criteria. Each item should be a complete sentence.",
      items: { type: Type.STRING },
    },
    areasForImprovement: {
      type: Type.ARRAY,
      description: "A list of 2-3 key areas where the caseworker can improve. Frame these constructively.",
      items: {
        type: Type.OBJECT,
        required: ["area", "suggestion"],
        properties: {
          area: { type: Type.STRING, description: "The specific practice area for improvement (e.g., 'Asking More Open-Ended Questions')." },
          suggestion: { type: Type.STRING, description: "An actionable tip or suggestion for how the caseworker can improve in this area." }
        }
      }
    }
  }
};

export const SUPERVISOR_ANALYSIS_PROMPT = `You are an expert in management coaching for social work students. Analyze the following supervisor's feedback given to a caseworker. Evaluate the quality of the coaching itself.
- Does the feedback acknowledge strengths in a meaningful way?
- Is the constructive criticism clear, specific, and actionable?
- Is the overall tone supportive, professional, and motivating?
Your output must be a JSON object that strictly follows the provided schema. Do not comment on the caseworker, only on the supervisor's coaching skills.`;

export const SUPERVISOR_ANALYSIS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        feedbackOnStrengths: {
            type: Type.STRING,
            description: "Evaluate how well the supervisor acknowledged the caseworker's strengths. Is it specific and encouraging?"
        },
        feedbackOnCritique: {
            type: Type.STRING,
            description: "Evaluate the constructive criticism. Is it actionable, clear, and delivered supportively?"
        },
        overallTone: {
            type: Type.STRING,
            description: "Describe the overall tone of the supervisor's feedback (e.g., 'Supportive and developmental', 'Too blunt', 'Vague and unhelpful')."
        }
    }
};

// Simulation scenarios for role-play practice
export const SIMULATION_SCENARIOS = [
    {
        id: "cooper",
        title: "Cooper Family",
        summary: "The Cooper family case involves Sara Cooper, her children Jasmine (6) and Jasper (9 months), and her partner Shawn Olson. The case was initiated due to allegations of domestic violence perpetrated by Shawn against Sara in the children's presence, and drug use by both Sara and Shawn. The initial report came from Jasmine's school, where Jasmine disclosed witnessing Shawn being violent with her mother."
    },
    {
        id: "baskin",
        title: "Baskin Family", 
        summary: "This case concerns Larisa Baskin and her two daughters, Karina (14) and Katie (3), and Larisa's boyfriend, Roger Cook. The case was initiated due to a report that Karina came to school with a black eye and a cut lip, and concerns about other marks on her arms."
    },
    {
        id: "rich",
        title: "Rich Family",
        summary: "The Rich family case focuses on neglect allegations against parents Judith and Ted Rich concerning their children Daniel (11), Alberto (4), and Emily (15 months). An initial report was submitted from Daniel's school after he reported suffering from a toothache for several months, despite the school setting up dental visits for him, which he did not attend."
    },
    {
        id: "tasi",
        title: "Tasi Family",
        summary: "This case file concerns the Tasi family, specifically addressing allegations of neglect involving Tammy Tasi and her children, Efren (15) and Malia (13). The initial report stemmed from an incident where Efren allegedly assaulted Malia in their mother's presence, causing an injury to Malia's eye. Concerns were also raised about the children being left home alone."
    }
];

// Self-assessment prefill examples of varying quality
export const SELF_ASSESSMENT_EXAMPLES = [
    {
        quality: 'good',
        description: 'Thoughtful and specific reflection',
        assessment: {
            introduction: "I introduced myself clearly with my full name and agency, and verified the parent's identity. I offered my ID proactively, which I think helped build a small amount of trust from the start. I feel this went well and set a professional tone.",
            reasonForContact: "I explained the reason for my visit by referencing a report from the school, which is a less accusatory way to introduce the concern. I waited for her to ask questions before providing more detail, which allowed her to control the pace of the conversation. I think I handled her initial shock and questions well by remaining calm.",
            responsiveToParent: "When Sara became emotional and disclosed her substance use, I tried to be validating by saying 'That takes courage.' I also acknowledged her love for her children as a strength. However, I could have explored her feelings more by asking something like, 'How has it been for you, managing all of this?' I also noticed I asked about tribal heritage right after a very emotional disclosure, which might have felt abrupt. I should work on better timing for procedural questions.",
            permissionToEnter: "I asked for permission to enter the home multiple times, respecting her right to say no. I didn't push when she was hesitant, but instead provided more information to help her feel safe enough to agree. This seemed effective as she eventually let me in.",
            gatheringInformation: "I asked open-ended questions like 'Can you tell me about your relationship with Shawn?' which led to her disclosing his arrest and her substance use. I also asked about who was in the home to assess immediate safety. My biggest area for improvement is gathering a broader picture; I didn't ask about the children's daily routines, their health, or what supports Sara has besides her mother.",
            processAndNextSteps: "I provided the pamphlet and explained its purpose. I mentioned the next steps would be to talk through everything, but I wasn't very specific about what that would entail (e.g., seeing the children, developing a safety plan). I should have been clearer about the immediate next steps to reduce her anxiety about the unknown."
        }
    },
    {
        quality: 'mixed',
        description: 'Some insight but lacks depth',
        assessment: {
            introduction: "I said I was from Child Welfare and gave my name. I think I should have given the full agency name to be more professional. I did ask if she was Sara Cooper, which was good.",
            reasonForContact: "I told her there was a report about her kids from the school. She got defensive, so maybe I was too direct. I mentioned it was about her partner Shawn, which focused the conversation.",
            responsiveToParent: "I tried to listen to her. When she asked for my ID, I showed it. I could have been more empathetic when she said she was stressed, but I was focused on getting the facts about the report.",
            permissionToEnter: "I asked to come in a few times. She eventually agreed. I probably could have explained why it was important to talk inside to make her more comfortable.",
            gatheringInformation: "I asked about the violence and drug use mentioned in the report. I found out Shawn was in jail, which was a key piece of information for safety. I didn't ask much else about the family or their strengths.",
            processAndNextSteps: "I didn't really explain the next steps. The conversation ended after I got the basic information. I should have told her what to expect next from me and from the agency."
        }
    },
    {
        quality: 'poor',
        description: 'Vague and lacks self-awareness',
        assessment: {
            introduction: "I said I was from CPS. The parent was difficult from the start and demanded a warrant.",
            reasonForContact: "I told her I was there about a call we got. She didn't want to listen and just got angry.",
            responsiveToParent: "It was hard to be responsive because she was yelling. I tried to tell her the seriousness of the situation, but she wouldn't cooperate.",
            permissionToEnter: "She wouldn't let me in. I told her I would have to call the police if she didn't cooperate.",
            gatheringInformation: "I couldn't gather much information because she was so resistant. I tried to ask about the violence and drugs but she just denied everything.",
            processAndNextSteps: "We never got to this part because she kicked me out. I'm not sure what I could have done differently when a parent is that hostile."
        }
    }
];

export const SUPERVISOR_FEEDBACK_EXAMPLES = {
    cooper: [
        "Great job introducing yourself and explaining the reason for your visit clearly and calmly. You showed a lot of empathy when Sara disclosed her substance use. One area to think about is how you transitioned to the procedural question about tribal heritage—it felt a bit abrupt. Maybe next time, you could pause and ask something like, 'How are you feeling after sharing that?' before moving on. Also, when discussing next steps, being more specific about what will happen (like seeing the kids or creating a safety plan) can help reduce the parent's anxiety.",
        "Your approach was too aggressive from the start. Opening with 'I'm from CPS. Open up' immediately put the parent on the defensive. Threatening to call the police is a last resort and escalated the situation unnecessarily. For next time, focus on introducing yourself calmly, explaining the concern without accusatory language, and asking for permission to enter respectfully. Building a small amount of rapport is key, even when the situation is tense.",
        "You did a good job of getting permission to enter and gathering some key information, like Shawn being in jail. However, your approach was very direct, which made the parent defensive. Try to use more open-ended questions to encourage the parent to share their story, rather than just confirming details from the report. For example, instead of stating 'She mentioned violence,' you could ask, 'Can you tell me about how things have been at home lately?'"
    ],
    baskin: [
        "You handled a difficult situation with a lot of skill. You remained calm and professional, clearly stated the reason for your visit, and showed empathy for the parent's distress. You did well to ask open-ended questions to understand what happened from her perspective. A small suggestion for next time: when you provide the rights pamphlet, you could briefly explain its purpose to help demystify the process and build more trust.",
        "This was a tough interaction. Your direct, authoritative approach ('I need to come in') and threatening a police escort created a power struggle and shut down the conversation. It's important to remember that parents have the right to refuse entry. In these situations, try to de-escalate by explaining the purpose of your visit is to understand their perspective and ensure the child is safe. Using a calmer, less confrontational tone can sometimes lead to more cooperation."
    ],
    rich: [
        "You did a nice job of identifying the core issue of financial hardship and connecting it to the neglect allegations. Asking about their health insurance was a great, practical question. To improve, try to start with a more formal introduction (full agency name) to establish professionalism. Also, when a parent becomes defensive, showing more empathy can help. For instance, when she said, 'That's not true! We're good parents,' you could respond with, 'I hear that you care deeply for your children, and I'm here to understand the challenges you're facing.'"
    ],
    tasi: [
        "Excellent work on this case. You introduced yourself professionally, explained the reason for contact clearly, and showed empathy for the parent's situation. You asked good, open-ended questions to gather information about the incident and the family dynamics. Your transition to the rights pamphlet and the ICWA question was smooth. The only small point of feedback is to be prepared to explain what the next steps in the process will be, as parents are often anxious to know what to expect."
    ]
};
