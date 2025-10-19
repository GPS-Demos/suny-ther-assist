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

# --- Authorized Email Configuration ---
AUTHORIZED_EMAILS = [
    'anitza@albany.edu',
    'jfboswell197@gmail.com',
    'Salvador.Dura-Bernal@downstate.edu',
    'boswell@albany.edu'
]

def is_email_authorized(email: str) -> bool:
    """Check if email is authorized (@google.com domain or in whitelist)"""
    if not email:
        return False
    return email.endswith('@google.com') or email in AUTHORIZED_EMAILS

def verify_firebase_token(token: str):
    """Verify Firebase ID token and return decoded claims"""
    try:
        decoded_token = auth.verify_id_token(token)
        email = decoded_token.get('email')
        
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

@functions_framework.http
def storage_access(request):
    """
    HTTP Cloud Function to access Google Cloud Storage files.
    Provides secure access to citation documents stored in GCS.
    """
    
    # CORS handling
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
    
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
        
        logging.info(f"Accessing file: bucket={bucket_name}, path={blob_path}")
        
        # Get the bucket and blob
        try:
            bucket = storage_client.bucket(bucket_name)
            blob = bucket.blob(blob_path)
            
            # Check if blob exists
            if not blob.exists():
                logging.warning(f"File not found: {gcs_uri}")
                return (jsonify({'error': 'File not found'}), 404, headers)
            
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
    
    # CORS handling
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
    
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
