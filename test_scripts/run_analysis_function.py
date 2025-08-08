#!/usr/bin/env python3
"""
Local development server for therapy analysis function
Wraps the Cloud Function in a Flask app for local testing
Works around Python 3.13 compatibility issues with functions-framework
"""

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import os
import sys

# Add the therapy-analysis-function directory to path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend', 'therapy-analysis-function'))

# Mock the functions_framework decorator before importing main
class MockRequest:
    def __init__(self, flask_request):
        self.method = flask_request.method
        self.get_json = flask_request.get_json

def mock_functions_framework_http(func):
    """Mock decorator to replace functions_framework.http"""
    return func

# Replace the functions_framework module with our mock
sys.modules['functions_framework'] = type(sys)('functions_framework')
sys.modules['functions_framework'].http = mock_functions_framework_http

# Now we can import main
from main import therapy_analysis

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/therapy_analysis', methods=['POST', 'OPTIONS'])
def handle_therapy_analysis():
    """Route handler for therapy analysis"""
    if request.method == 'OPTIONS':
        # Handle CORS preflight
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    # Create a mock request object that matches what the function expects
    mock_req = MockRequest(request)
    
    # Call the therapy analysis function
    result = therapy_analysis(mock_req)
    
    # Handle the response - it might be a tuple (response, status, headers) or just response
    if isinstance(result, tuple):
        if len(result) == 3:
            response, status, headers = result
        elif len(result) == 2:
            response, status = result
            headers = {}
        else:
            response = result[0]
            status = 200
            headers = {}
    else:
        response = result
        status = 200
        headers = {}
    
    # Ensure CORS headers are included
    if 'Access-Control-Allow-Origin' not in headers:
        headers['Access-Control-Allow-Origin'] = '*'
    
    return response, status, headers

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'therapy-analysis-function'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8081))
    print(f"\n{'='*50}")
    print(f"Starting therapy analysis function on port {port}")
    print(f"{'='*50}")
    print(f"Endpoint: http://localhost:{port}/therapy_analysis")
    print(f"Health check: http://localhost:{port}/health")
    print(f"{'='*50}\n")
    app.run(host='0.0.0.0', port=port, debug=True)
