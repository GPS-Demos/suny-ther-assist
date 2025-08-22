/**
 * Utility functions for handling Google Cloud Storage URIs and file access
 */

// Cloud Function endpoint for storage access
// This will be replaced with the actual deployed function URL
const STORAGE_ACCESS_URL = import.meta.env.VITE_STORAGE_ACCESS_URL;

/**
 * Check if a URI is a Google Cloud Storage URI
 * @param uri - The URI to check
 * @returns true if it's a GCS URI (gs://...)
 */
export function isGcsUri(uri: string | undefined | null): boolean {
  if (!uri) return false;
  return uri.startsWith('gs://');
}

/**
 * Convert a GCS URI to a storage access function URL
 * @param gcsUri - The GCS URI (gs://bucket/path/to/file)
 * @returns URL to access the file through the Cloud Function
 */
export function getStorageAccessUrl(gcsUri: string): string {
  if (!isGcsUri(gcsUri)) {
    // If it's not a GCS URI, return as-is (might be a regular HTTP URL)
    return gcsUri;
  }
  
  // Encode the URI to handle special characters
  const encodedUri = encodeURIComponent(gcsUri);
  return `${STORAGE_ACCESS_URL}?uri=${encodedUri}`;
}

/**
 * Get file metadata from a GCS URI without downloading the file
 * @param gcsUri - The GCS URI
 * @returns Promise with file metadata or null if not found
 */
export async function getFileMetadata(gcsUri: string): Promise<any | null> {
  try {
    const metadataUrl = `${STORAGE_ACCESS_URL}/metadata?uri=${encodeURIComponent(gcsUri)}`;
    const response = await fetch(metadataUrl);
    
    if (!response.ok) {
      console.error('Failed to fetch file metadata:', response.statusText);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching file metadata:', error);
    return null;
  }
}

/**
 * Open a GCS file in a new tab
 * @param gcsUri - The GCS URI
 */
export function openGcsFile(gcsUri: string): void {
  const url = getStorageAccessUrl(gcsUri);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Download a GCS file
 * @param gcsUri - The GCS URI
 * @param filename - Optional filename for download
 */
export async function downloadGcsFile(gcsUri: string, filename?: string): Promise<void> {
  try {
    const url = getStorageAccessUrl(gcsUri);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename || gcsUri.split('/').pop() || 'download';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

/**
 * Extract filename from GCS URI
 * @param gcsUri - The GCS URI
 * @returns The filename or empty string
 */
export function getFilenameFromGcsUri(gcsUri: string): string {
  if (!isGcsUri(gcsUri)) return '';
  
  const parts = gcsUri.split('/');
  return parts[parts.length - 1] || '';
}

/**
 * Extract bucket name from GCS URI
 * @param gcsUri - The GCS URI
 * @returns The bucket name or empty string
 */
export function getBucketFromGcsUri(gcsUri: string): string {
  if (!isGcsUri(gcsUri)) return '';
  
  const match = gcsUri.match(/^gs:\/\/([^\/]+)/);
  return match ? match[1] : '';
}
