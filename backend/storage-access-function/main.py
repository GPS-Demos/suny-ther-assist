# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import functions_framework
from flask import jsonify, Response, send_file
from google.cloud import storage
import os
import logging
import re
from io import BytesIO
import mimetypes
import firebase_admin
from firebase_admin import auth, credentials
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize logging
logging.basicConfig(level=logging.INFO)

# --- Initialize Firebase Admin ---
try:
    # Firebase Admin SDK will automatically use the service account when running in Google Cloud
    if not firebase_admin._apps:
        firebase_admin.initialize_app()
    logging.info("Firebase Admin SDK initialized")
except Exception as e:
    logging.error(f"Error initializing Firebase Admin SDK: {e}", exc_info=True)

# --- Load Authorization Configuration from Environment ---
ALLOWED_DOMAINS = set(os.environ.get('AUTH_ALLOWED_DOMAINS', '').split(',')) if os.environ.get('AUTH_ALLOWED_DOMAINS') else set()
ALLOWED_EMAILS = set(os.environ.get('AUTH_ALLOWED_EMAILS', '').split(',')) if os.environ.get('AUTH_ALLOWED_EMAILS') else set()
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
ALLOWED_BUCKETS = set(filter(None, [
    os.environ.get('TARGET_BUCKET'),
    os.environ.get('STORAGE_BUCKET'),
    os.environ.get('CORPUS_BUCKET'),
    f"{PROJECT_ID}-ebt-corpus" if PROJECT_ID else None,
    f"{PROJECT_ID}-transcript-patterns" if PROJECT_ID else None,
]))
MAX_FILE_SIZE = int(os.environ.get('MAX_FILE_SIZE', 25 * 1024 * 1024))  # 25MB limit

def is_email_authorized(email: str) -> bool:
    """Check if email is authorized based on domain or explicit allowlist"""
    if not email:
        return False
    
    # Check explicit email allowlist
    if email in ALLOWED_EMAILS:
        return True
        
    # Check domain allowlist
    email_domain = email.split('@')[-1] if '@' in email else ''
    return email_domain in ALLOWED_DOMAINS

def verify_firebase_token(token: str):
    """Verify Firebase ID token and return decoded claims"""
    try:
        decoded_token = auth.verify_id_token(token)
        email = decoded_token.get('email')
        
        # Enforce email_verified check before trusting email
        if not decoded_token.get('email_verified', False):
            logging.warning(f"Unverified email attempted access: {email}")
            return None
        
        if not is_email_authorized(email):
            logging.warning(f"Unauthorized email attempted access: {email}")
            return None
            
        logging.info(f"Authorized user authenticated: {email}")
        return decoded_token
    except Exception as e:
        logging.error(f"Token verification failed: {e}")
        return None

# Initialize Storage client
storage_client = storage.Client()

def _get_cors_headers(request):
    origin = request.headers.get('Origin', '')
    allowed_origin = origin if origin in ALLOWED_ORIGINS else (ALLOWED_ORIGINS[0] if ALLOWED_ORIGINS else '')
    return {
        'Access-Control-Allow-Origin': allowed_origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '3600'
    }

def is_bucket_authorized(bucket_name: str) -> bool:
    """Validate bucket name against authorized bucket allowlist"""
    if not bucket_name:
        return False
    if ALLOWED_BUCKETS and bucket_name in ALLOWED_BUCKETS:
        return True
    if PROJECT_ID and bucket_name.startswith(f"{PROJECT_ID}-"):
        return True
    # If no explicit list configured, verify it doesn't contain path traversal
    if re.match(r'^[a-z0-9][a-z0-9._\-]{1,61}[a-z0-9]$', bucket_name):
        return True if not ALLOWED_BUCKETS else False
    return False

@functions_framework.http
def storage_access(request):
    """
    HTTP Cloud Function to access Google Cloud Storage files.
    Provides secure access to citation documents stored in GCS.
    """
    headers = _get_cors_headers(request)
    
    # CORS handling
    if request.method == 'OPTIONS':
        return ('', 204, headers)
    
    # --- Authentication Check ---
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        logging.warning("Missing or invalid Authorization header")
        return (jsonify({'error': 'Authentication required'}), 401, headers)
    token = auth_header.split(' ')[1]
    decoded_token = verify_firebase_token(token)
    if not decoded_token:
        return (jsonify({'error': 'Invalid or unauthorized token'}), 401, headers)
    
    try:
        # Get the GCS URI from request parameters
        gcs_uri = request.args.get('uri')
        
        if not gcs_uri:
            logging.warning("No URI provided in request")
            return (jsonify({'error': 'Missing uri parameter'}), 400, headers)
        
        # Parse the GCS URI
        # Expected format: gs://bucket-name/path/to/file
        match = re.match(r'^gs://([^/]+)/(.+)$', gcs_uri)
        
        if not match:
            logging.warning(f"Invalid GCS URI format: {gcs_uri}")
            return (jsonify({'error': 'Invalid GCS URI format'}), 400, headers)
        
        bucket_name = match.group(1)
        blob_path = match.group(2)
        
        # Enforce bucket authorization to prevent arbitrary bucket reads
        if not is_bucket_authorized(bucket_name):
            logging.warning(f"Unauthorized bucket access attempt: {bucket_name}")
            return (jsonify({'error': f'Unauthorized bucket: {bucket_name}'}), 403, headers)
        
        logging.info(f"Accessing file: bucket={bucket_name}, path={blob_path}")
        
        # Get the bucket and blob
        try:
            bucket = storage_client.bucket(bucket_name)
            blob = bucket.blob(blob_path)
            
            # Check if blob exists
            if not blob.exists():
                logging.warning(f"File not found: {gcs_uri}")
                return (jsonify({'error': 'File not found'}), 404, headers)
            
            # Enforce max file size check to prevent Out-Of-Memory (OOM) Denial of Service
            blob.reload()
            if blob.size and blob.size > MAX_FILE_SIZE:
                logging.warning(f"File size {blob.size} exceeds maximum limit of {MAX_FILE_SIZE} bytes")
                return (jsonify({'error': f'File too large ({blob.size} bytes). Maximum allowed is {MAX_FILE_SIZE} bytes.'}), 413, headers)
            
            # Download the file content
            file_content = blob.download_as_bytes()
            
            # Determine content type
            content_type, _ = mimetypes.guess_type(blob_path)
            if not content_type:
                # Default content types based on extension
                if blob_path.lower().endswith('.pdf'):
                    content_type = 'application/pdf'
                elif blob_path.lower().endswith('.txt'):
                    content_type = 'text/plain'
                elif blob_path.lower().endswith('.docx'):
                    content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                elif blob_path.lower().endswith('.json'):
                    content_type = 'application/json'
                else:
                    content_type = 'application/octet-stream'
            
            # Get filename from path
            filename = os.path.basename(blob_path)
            
            # Update headers for file download
            headers.update({
                'Content-Type': content_type,
                'Content-Disposition': f'inline; filename="{filename}"',
                'Content-Length': str(len(file_content)),
                'Cache-Control': 'public, max-age=3600'  # Cache for 1 hour
            })
            
            logging.info(f"Successfully retrieved file: {filename} ({len(file_content)} bytes)")
            
            return (file_content, 200, headers)
            
        except Exception as e:
            logging.error(f"Error accessing storage: {str(e)}")
            return (jsonify({'error': f'Storage access error: {str(e)}'}), 500, headers)
    
    except Exception as e:
        logging.exception(f"Unexpected error: {str(e)}")
        return (jsonify({'error': 'Internal server error'}), 500, headers)


@functions_framework.http
def storage_access_metadata(request):
    """
    Alternative endpoint to get file metadata without downloading the entire file.
    Useful for checking file existence and getting file info.
    """
    
    headers = _get_cors_headers(request)
    
    # CORS handling
    if request.method == 'OPTIONS':
        return ('', 204, headers)
    
    # --- Authentication Check ---
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        logging.warning("Missing or invalid Authorization header")
        return (jsonify({'error': 'Authentication required'}), 401, headers)
    token = auth_header.split(' ')[1]
    decoded_token = verify_firebase_token(token)
    if not decoded_token:
        return (jsonify({'error': 'Invalid or unauthorized token'}), 401, headers)
    
    try:
        gcs_uri = request.args.get('uri')
        
        if not gcs_uri:
            return (jsonify({'error': 'Missing uri parameter'}), 400, headers)
        
        # Parse the GCS URI
        match = re.match(r'^gs://([^/]+)/(.+)$', gcs_uri)
        
        if not match:
            return (jsonify({'error': 'Invalid GCS URI format'}), 400, headers)
        
        bucket_name = match.group(1)
        blob_path = match.group(2)
        
        # Enforce bucket authorization to prevent arbitrary bucket reads
        if not is_bucket_authorized(bucket_name):
            logging.warning(f"Unauthorized bucket access attempt: {bucket_name}")
            return (jsonify({'error': f'Unauthorized bucket: {bucket_name}'}), 403, headers)
        
        # Get the bucket and blob
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(blob_path)
        
        # Check if blob exists and get metadata
        if blob.exists():
            blob.reload()  # Fetch metadata
            
            metadata = {
                'exists': True,
                'name': blob.name,
                'size': blob.size,
                'content_type': blob.content_type,
                'created': blob.time_created.isoformat() if blob.time_created else None,
                'updated': blob.updated.isoformat() if blob.updated else None,
                'md5_hash': blob.md5_hash,
                'public_url': blob.public_url if blob.public_url else None
            }
            
            return (jsonify(metadata), 200, headers)
        else:
            return (jsonify({'exists': False}), 404, headers)
    
    except Exception as e:
        logging.exception(f"Error getting metadata: {str(e)}")
        return (jsonify({'error': 'Failed to get file metadata'}), 500, headers)
