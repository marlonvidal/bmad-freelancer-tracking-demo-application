/**
 * Time formatting utilities
 * 
 * Provides functions for formatting time durations in human-readable formats.
 */

/**
 * Formats a duration in minutes to a human-readable string
 * 
 * @param minutes - Duration in minutes (integer or float, will be rounded)
 * @returns Formatted string: "1h 23m" for hours+minutes, "83m" for minutes only
 * 
 * @example
 * formatDuration(0) // "0m"
 * formatDuration(30) // "30m"
 * formatDuration(60) // "1h"
 * formatDuration(90) // "1h 30m"
 * formatDuration(120) // "2h"
 * formatDuration(150) // "2h 30m"
 * formatDuration(83) // "83m"
 */
export function formatDuration(minutes: number): string {
  // Handle edge cases
  if (minutes < 0) {
    return '0m';
  }
  
  // Round to nearest minute (no seconds displayed)
  const roundedMinutes = Math.round(minutes);
  
  if (roundedMinutes === 0) {
    return '0m';
  }
  
  // Calculate hours and remaining minutes
  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;
  
  // Format based on whether there are hours
  if (hours > 0) {
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  }
  
  // Minutes only
  return `${remainingMinutes}m`;
}
