#!/usr/bin/env python3
"""
Script to programmatically create a Vertex AI Search datastore with document chunking for RAG.
This datastore will be configured to process EBT therapy manuals with layout-aware chunking.
"""

import os
import time
import json
from google.auth import default
from google.auth.transport.requests import Request
import requests

# Configuration
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "suny-ther-assist")
LOCATION = "global"
DATASTORE_ID = "ebt-corpus"
DISPLAY_NAME = "EBT Therapy Manuals Corpus"

def get_access_token():
    """Get access token for API calls."""
    credentials, _ = default()
    credentials.refresh(Request())
    return credentials.token

def create_datastore():
    """Create a Vertex AI Search datastore with document chunking enabled."""
    
    url = f"https://discoveryengine.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/collections/default_collection/dataStores?dataStoreId={DATASTORE_ID}"
    
    headers = {
        "Authorization": f"Bearer {get_access_token()}",
        "Content-Type": "application/json",
        "X-Goog-User-Project": PROJECT_ID
    }
    
    # Configure datastore with layout-aware chunking for RAG
    data = {
        "displayName": DISPLAY_NAME,
        "industryVertical": "GENERIC",
        "solutionTypes": ["SOLUTION_TYPE_SEARCH"],
        "contentConfig": "CONTENT_REQUIRED",
        "documentProcessingConfig": {
            # Enable document chunking for RAG
            "chunkingConfig": {
                "layoutBasedChunkingConfig": {
                    "chunkSize": 500,  # Token size limit per chunk (100-500)
                    "includeAncestorHeadings": True  # Include headings for context
                }
            },
            # Use layout parser as default for better document understanding
            "defaultParsingConfig": {
                "layoutParsingConfig": {}
            },
            # File-specific parser overrides
            "parsingConfigOverrides": {
                # Use layout parser for PDFs (therapy manuals)
                "pdf": {
                    "layoutParsingConfig": {}
                },
                # Use layout parser for DOCX files
                "docx": {
                    "layoutParsingConfig": {}
                },
                # Use layout parser for HTML if we have any
                "html": {
                    "layoutParsingConfig": {}
                }
            }
        }
    }
    
    print(f"Creating datastore '{DATASTORE_ID}' with layout-aware chunking...")
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 200:
        print(f"✅ Datastore '{DATASTORE_ID}' created successfully!")
        return response.json()
    elif response.status_code == 409:
        print(f"⚠️  Datastore '{DATASTORE_ID}' already exists.")
        return get_datastore()
    else:
        print(f"❌ Error creating datastore: {response.status_code}")
        print(f"Response: {response.text}")
        raise Exception(f"Failed to create datastore: {response.text}")

def get_datastore():
    """Get existing datastore details."""
    url = f"https://discoveryengine.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/collections/default_collection/dataStores/{DATASTORE_ID}"
    
    headers = {
        "Authorization": f"Bearer {get_access_token()}",
        "X-Goog-User-Project": PROJECT_ID
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Error getting datastore: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def create_gcs_bucket():
    """Create a GCS bucket for storing the EBT corpus documents."""
    from google.cloud import storage
    
    bucket_name = f"{PROJECT_ID}-ebt-corpus"
    client = storage.Client(project=PROJECT_ID)
    
    # Check if bucket already exists
    try:
        bucket = client.get_bucket(bucket_name)
        print(f"⚠️  Bucket {bucket_name} already exists")
        return bucket_name
    except Exception as e:
        if "404" in str(e):
            # Bucket doesn't exist, create it
            try:
                bucket = client.create_bucket(bucket_name, location="US")
                print(f"✅ Created GCS bucket: {bucket_name}")
                return bucket_name
            except Exception as create_error:
                if "already own it" in str(create_error):
                    print(f"⚠️  Bucket {bucket_name} already exists")
                    return bucket_name
                else:
                    raise create_error
        else:
            raise e

def upload_corpus_to_gcs(bucket_name):
    """Upload EBT corpus files to GCS bucket."""
    from google.cloud import storage
    
    client = storage.Client(project=PROJECT_ID)
    bucket = client.bucket(bucket_name)
    
    corpus_dir = "backend/rag/corpus"
    
    if not os.path.exists(corpus_dir):
        print(f"❌ Corpus directory '{corpus_dir}' not found!")
        return False
    
    files_uploaded = 0
    for filename in os.listdir(corpus_dir):
        if filename.endswith(('.pdf', '.docx', '.txt')):
            local_path = os.path.join(corpus_dir, filename)
            blob_name = f"corpus/{filename}"
            blob = bucket.blob(blob_name)
            
            print(f"Uploading {filename}...")
            blob.upload_from_filename(local_path)
            files_uploaded += 1
    
    print(f"✅ Uploaded {files_uploaded} files to GCS bucket")
    return True

def import_documents_to_datastore(bucket_name):
    """Import documents from GCS to the datastore."""
    
    url = f"https://discoveryengine.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/collections/default_collection/dataStores/{DATASTORE_ID}/branches/0/documents:import"
    
    headers = {
        "Authorization": f"Bearer {get_access_token()}",
        "Content-Type": "application/json",
        "X-Goog-User-Project": PROJECT_ID
    }
    
    # Configure import from GCS
    data = {
        "gcsSource": {
            "inputUris": [f"gs://{bucket_name}/corpus/**"],
            "dataSchema": "document"
        },
        "reconciliationMode": "INCREMENTAL"
        # Don't use autoGenerateIds with document schema
    }
    
    print(f"Importing documents from GCS to datastore...")
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 200:
        operation = response.json()
        print(f"✅ Import operation started: {operation['name']}")
        return operation
    else:
        print(f"❌ Error importing documents: {response.status_code}")
        print(f"Response: {response.text}")
        raise Exception(f"Failed to import documents: {response.text}")

def wait_for_operation(operation_name, timeout=600):
    """Wait for a long-running operation to complete."""
    
    headers = {
        "Authorization": f"Bearer {get_access_token()}",
        "X-Goog-User-Project": PROJECT_ID
    }
    
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        url = f"https://discoveryengine.googleapis.com/v1/{operation_name}"
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            operation = response.json()
            if operation.get("done"):
                if "error" in operation:
                    print(f"❌ Operation failed: {operation['error']}")
                    return False
                else:
                    print(f"✅ Operation completed successfully!")
                    return True
        else:
            print(f"❌ Error checking operation status: {response.status_code}")
            return False
        
        print("⏳ Waiting for operation to complete...")
        time.sleep(10)
    
    print(f"❌ Operation timed out after {timeout} seconds")
    return False

def update_datastore_path_in_code():
    """Update the datastore path in the therapy analysis function."""
    
    datastore_path = f"projects/{PROJECT_ID}/locations/{LOCATION}/collections/default_collection/dataStores/{DATASTORE_ID}"
    
    print(f"\n📝 Datastore path: {datastore_path}")
    print("\nThis path is already configured in backend/therapy-analysis-function/main.py")
    
    return datastore_path

def main():
    """Main function to set up the RAG datastore."""
    
    print(f"🚀 Setting up Vertex AI Search datastore for Ther-Assist")
    print(f"Project ID: {PROJECT_ID}")
    print(f"Datastore ID: {DATASTORE_ID}\n")
    
    try:
        # Create datastore with chunking enabled
        datastore = create_datastore()
        
        # Create GCS bucket
        bucket_name = create_gcs_bucket()
        
        # Upload corpus files
        if upload_corpus_to_gcs(bucket_name):
            # Import documents to datastore
            operation = import_documents_to_datastore(bucket_name)
            
            if operation:
                # Wait for import to complete
                if wait_for_operation(operation['name']):
                    print("\n✅ RAG datastore setup complete!")
                    
                    # Update datastore path
                    datastore_path = update_datastore_path_in_code()
                    
                    print("\n📚 Your EBT corpus has been:")
                    print("   - Uploaded to GCS")
                    print("   - Imported into Vertex AI Search")
                    print("   - Configured with layout-aware chunking (500 tokens per chunk)")
                    print("   - Optimized for RAG with ancestor headings included")
                    
                    print("\nYou can now use this datastore for real-time therapy guidance!")
                else:
                    print("\n⚠️  Import operation failed or timed out")
                    print("Check the operation status in the Google Cloud Console")
        
    except Exception as e:
        print(f"\n❌ Setup failed: {str(e)}")
        raise

if __name__ == "__main__":
    # Check for required libraries
    try:
        import google.auth
        from google.cloud import storage
    except ImportError:
        print("Installing required dependencies...")
        os.system("pip install google-auth google-auth-httplib2 google-cloud-storage requests")
        print("Dependencies installed. Please run the script again.")
        exit(0)
    
    main()
