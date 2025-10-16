# Dual-RAG Architecture for Ther-Assist

This directory contains the setup scripts and corpus files for the dual-RAG (Retrieval Augmented Generation) system that powers Ther-Assist's real-time therapy guidance.

## Architecture Overview

Ther-Assist uses two complementary RAG datastores:

### 1. EBT Manuals Store (`ebt-corpus`)
- **Purpose**: Evidence-based protocols, techniques, contraindications
- **Content**: 
  - CBT manuals
  - PE for PTSD protocols
  - Social phobia treatment guides
- **Chunking**: 500 tokens with layout-aware parsing
- **Query examples**: "grounding techniques for dissociation", "CBT thought challenging steps"

### 2. Clinical Transcripts Store (`transcript-patterns`)
- **Purpose**: Pattern recognition, therapeutic moments, real-world examples
- **Content**:
  - Beck CBT sessions (BB3)
  - PTSD/PE sessions
  - Thousand Voices of Trauma conversations
  - Therapeutic pattern library
- **Chunking**: 300 tokens optimized for dialogue (3-turn sequences)
- **Query examples**: "therapist handling client resistance", "preparing client for exposure therapy"

## Setup Instructions

### Prerequisites

1. Google Cloud Project with APIs enabled:
   - Vertex AI API
   - Discovery Engine API
   - Cloud Storage API

2. Authentication:
```bash
gcloud auth application-default login
```

3. Set project:
```bash
export GOOGLE_CLOUD_PROJECT=your-gcp-project
```

### Setting Up EBT Manuals Datastore

```bash
# Install dependencies
pip install google-auth google-auth-httplib2 google-cloud-storage requests

# Run setup script
python backend/rag/setup_rag_datastore.py
```

This will:
- Create the `ebt-corpus` datastore
- Upload manuals to GCS
- Import documents with 500-token chunking
- Configure layout-aware parsing for PDFs

NOTE: If your setup_rag_datastore.py job times out while creating (600+ seconds), create the RAG Corpus from the upload files in Storage

### Setting Up Transcript Patterns Datastore

```bash
# Install dependencies (includes PyPDF2 for transcript processing)
pip install google-auth google-auth-httplib2 google-cloud-storage requests PyPDF2

# Run setup script
python backend/rag/setup_transcript_datastore.py
```

This will:
- Create the `transcript-patterns` datastore
- Process PDFs and JSON conversations
- Create 3-turn dialogue sequences
- Generate therapeutic pattern library
- Upload to GCS with 300-token chunking

NOTE: If you run into a 400 error about exceeding the maximum number of files then use the RAG Corpus

## Corpus Organization

```
backend/rag/
├── corpus/                    # EBT Manuals
│   ├── APA_Boswell_Constantino_Deliberate_Practice_CBT.pdf
│   ├── Comprehensive-CBT-for-Social-Phobia-Manual.pdf
│   ├── PE_for_PTSD_2022.pdf
│   └── References_for_Exposure_Therapy_Manuals_and_Guidebooks.docx
│
└── transcripts/               # Clinical Transcripts
    ├── BB3-Session-2-Annotated-Transcript.pdf      # Beck CBT
    ├── BB3-Session-10-Annotated-Transcript.pdf     # Beck CBT
    ├── PE_Supplement_Handouts-Oct-22_0.pdf         # PTSD/PE
    └── ThousandVoicesOfTrauma/
        └── conversations/     # JSON therapy conversations
            ├── 100_P5_conversation.json
            ├── 100_P6_conversation.json
            └── ... (30+ sessions)
```

## How It Works in Real-Time

When analyzing a therapy session segment:

1. **Pattern Matching**: The system searches transcript patterns for similar therapeutic moments
2. **Protocol Lookup**: EBT manuals provide evidence-based guidance
3. **Synthesis**: The LLM combines both sources to provide:
   - Theoretical guidance from manuals
   - Practical examples from real sessions
   - Specific recommendations

Example output:
> "This resistance pattern is similar to Beck Session 2, where the client said 'I don't want to impose.' Dr. Beck used Socratic questioning [Transcript Citation]. The CBT manual recommends challenging cognitive distortions through evidence gathering [Manual Citation, p.45]."

## Therapeutic Pattern Library

The system includes a curated pattern library with:

### Resistance Patterns
- "I don't want to impose" → Socratic questioning
- "I'm not ready" → Validation with gradual approach

### Engagement Techniques
- Checking task likelihood (0-100% scale)
- Collaborative tone ("Would that be alright?")
- Breaking overwhelming tasks into small steps

### Quality Markers
**Positive:**
- Concrete planning with specific times
- Positive reinforcement
- Making tasks optional

**Warning Signs:**
- Pushing too fast when client hesitates
- Missing psychoeducation opportunities
- Ignoring signs of overwhelm

## Maintenance

### Adding New Manuals
1. Place PDF/DOCX files in `backend/rag/corpus/`
2. Re-run `setup_rag_datastore.py`

### Adding New Transcripts
1. Place PDFs in `backend/rag/transcripts/`
2. Place JSON conversations in `backend/rag/transcripts/ThousandVoicesOfTrauma/conversations/`
3. Re-run `setup_transcript_datastore.py`

### Updating Pattern Library
Edit the `create_pattern_library()` function in `setup_transcript_datastore.py` to add new patterns.

## Troubleshooting

### Authentication Issues
```bash
gcloud auth application-default login
gcloud config set project your-gcp-project-id
```

### Import Timeout
The import operation can take 5-10 minutes. Check status in:
- [Google Cloud Console](https://console.cloud.google.com/ai/search/datastores)

### Missing Dependencies
```bash
pip install -r requirements.txt
```

## Testing

TODO: This doesn't exist yet 

After setup, test the dual-RAG system:

1. Start the backend:
```bash
cd test_scripts
./start_all_services.sh
```

2. Check logs for dual-RAG citations:
- Citations from manuals: `[1], [2]` 
- References to transcript patterns: "Similar to Beck Session 2"

## Architecture Benefits

The dual-RAG approach provides:

1. **Evidence-Based Foundation**: Manuals ensure adherence to proven protocols
2. **Real-World Context**: Transcripts show how theory applies in practice
3. **Pattern Recognition**: Quickly identify and respond to common therapeutic moments
4. **Quality Benchmarking**: Compare current session to exemplar sessions
5. **Nuanced Guidance**: Combine "what the manual says" with "what experienced therapists do"

This creates a more sophisticated and clinically useful AI assistant that provides both theoretical grounding and practical wisdom.
