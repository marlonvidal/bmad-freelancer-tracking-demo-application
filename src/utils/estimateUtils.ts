/**
 * Estimate comparison utilities
 * 
 * Provides functions for calculating and formatting estimated vs actual time comparisons.
 */

export interface EstimateComparison {
  difference: number; // actual - estimate (in minutes)
  percentage: number; // percentage difference
  status: 'over' | 'under' | 'on-track';
}

/**
 * Default threshold for "on-track" status
 * Uses ±5% or ±10 minutes, whichever is larger
 */
const DEFAULT_THRESHOLD_PERCENTAGE = 5; // 5%
const DEFAULT_THRESHOLD_MINUTES = 10; // 10 minutes

/**
 * Calculates the comparison between estimated and actual time
 * 
 * @param estimate - Estimated time in minutes
 * @param actual - Actual time spent in minutes
 * @param thresholdPercentage - Optional threshold percentage (default: 5%)
 * @param thresholdMinutes - Optional threshold in minutes (default: 10)
 * @returns Comparison object with difference, percentage, and status
 * 
 * @example
 * calculateEstimateComparison(60, 75) // { difference: 15, percentage: 25, status: 'over' }
 * calculateEstimateComparison(60, 55) // { difference: -5, percentage: -8.33, status: 'on-track' }
 */
export function calculateEstimateComparison(
  estimate: number,
  actual: number,
  thresholdPercentage: number = DEFAULT_THRESHOLD_PERCENTAGE,
  thresholdMinutes: number = DEFAULT_THRESHOLD_MINUTES
): EstimateComparison {
  // Handle edge cases
  if (estimate <= 0) {
    // If no estimate, consider it "on-track" (can't compare)
    return {
      difference: actual,
      percentage: 0,
      status: 'on-track'
    };
  }

  if (actual < 0) {
    // Negative actual time shouldn't happen, but handle gracefully
    return {
      difference: -estimate,
      percentage: -100,
      status: 'under'
    };
  }

  // Calculate difference and percentage
  const difference = actual - estimate;
  const percentage = (difference / estimate) * 100;

  // Determine threshold (use larger of percentage or absolute minutes)
  const thresholdValue = Math.max(
    (estimate * thresholdPercentage) / 100,
    thresholdMinutes
  );

  // Determine status
  let status: 'over' | 'under' | 'on-track';
  if (difference > thresholdValue) {
    status = 'over';
  } else if (difference < -thresholdValue) {
    status = 'under';
  } else {
    status = 'on-track';
  }

  return {
    difference,
    percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
    status
  };
}

/**
 * Gets the estimate status (over, under, or on-track)
 * 
 * @param estimate - Estimated time in minutes
 * @param actual - Actual time spent in minutes
 * @param thresholdPercentage - Optional threshold percentage (default: 5%)
 * @param thresholdMinutes - Optional threshold in minutes (default: 10)
 * @returns Status string: 'over', 'under', or 'on-track'
 * 
 * @example
 * getEstimateStatus(60, 75) // 'over'
 * getEstimateStatus(60, 55) // 'on-track'
 */
export function getEstimateStatus(
  estimate: number,
  actual: number,
  thresholdPercentage: number = DEFAULT_THRESHOLD_PERCENTAGE,
  thresholdMinutes: number = DEFAULT_THRESHOLD_MINUTES
): 'over' | 'under' | 'on-track' {
  return calculateEstimateComparison(estimate, actual, thresholdPercentage, thresholdMinutes).status;
}

/**
 * Formats estimate comparison as a human-readable string
 * 
 * @param estimate - Estimated time in minutes
 * @param actual - Actual time spent in minutes
 * @returns Formatted string describing the comparison
 * 
 * @example
 * formatEstimateComparison(60, 75) // "Over estimate by 15 minutes (25%)"
 * formatEstimateComparison(60, 55) // "Under estimate by 5 minutes (8.33%)"
 */
export function formatEstimateComparison(estimate: number, actual: number): string {
  const comparison = calculateEstimateComparison(estimate, actual);
  
  if (estimate <= 0) {
    return 'No estimate set';
  }

  const absDifference = Math.abs(comparison.difference);
  const absPercentage = Math.abs(comparison.percentage);

  switch (comparison.status) {
    case 'over':
      return `Over estimate by ${absDifference} minute${absDifference !== 1 ? 's' : ''} (${absPercentage}%)`;
    case 'under':
      return `Under estimate by ${absDifference} minute${absDifference !== 1 ? 's' : ''} (${absPercentage}%)`;
    case 'on-track':
      if (absDifference === 0) {
        return 'Exactly on estimate';
      }
      return `Within estimate (${absDifference} minute${absDifference !== 1 ? 's' : ''} difference)`;
    default:
      return 'Unknown comparison';
  }
}
