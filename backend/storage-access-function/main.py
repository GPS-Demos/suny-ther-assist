import functions_framework
from flask import jsonify, Response, send_file
from google.cloud import storage
import os
import logging
import re
from io import BytesIO
import mimetypes

# Initialize logging
logging.basicConfig(level=logging.INFO)

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
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
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
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
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
