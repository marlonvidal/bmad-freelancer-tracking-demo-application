/**
 * File utility functions for downloading files
 * 
 * Provides functions for downloading CSV and JSON files with proper
 * browser compatibility and cleanup.
 */

/**
 * Download a file to the user's device
 * 
 * Creates a Blob from the content, generates a temporary URL, triggers download,
 * and cleans up the URL after download.
 * 
 * @param content - File content as string or Blob
 * @param filename - Name of the file to download
 * @param mimeType - MIME type of the file (e.g., 'text/csv', 'application/json')
 * 
 * @example
 * downloadFile('name,age\nJohn,30', 'data.csv', 'text/csv');
 * downloadFile(JSON.stringify({name: 'John'}), 'data.json', 'application/json');
 */
export function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string
): void {
  try {
    // Create Blob if content is a string
    const blob = content instanceof Blob 
      ? content 
      : new Blob([content], { type: mimeType });

    // Create temporary URL
    const url = URL.createObjectURL(blob);

    // Create temporary anchor element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Append to body (required for Firefox)
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up: remove link and revoke URL
    document.body.removeChild(link);
    
    // Revoke URL after a short delay to ensure download starts
    // (some browsers need the URL to remain valid during download)
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw new Error(
      `Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Format date as YYYY-MM-DD for use in filenames
 * 
 * @param date - Date to format
 * @returns Formatted date string (YYYY-MM-DD)
 * 
 * @example
 * formatDateForFilename(new Date(2026, 0, 15)); // "2026-01-15"
 */
export function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date and time as YYYY-MM-DD-HHMMSS for use in filenames
 * 
 * @param date - Date to format
 * @returns Formatted date-time string (YYYY-MM-DD-HHMMSS)
 * 
 * @example
 * formatDateTimeForFilename(new Date(2026, 0, 15, 14, 30, 45)); // "2026-01-15-143045"
 */
export function formatDateTimeForFilename(date: Date): string {
  const dateStr = formatDateForFilename(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${dateStr}-${hours}${minutes}${seconds}`;
}
