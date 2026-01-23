/**
 * Date utility functions for date range calculations
 * 
 * Provides functions for calculating date ranges (today, week, month) and
 * checking if dates fall within ranges. All functions use local timezone.
 */

/**
 * Date range interface
 */
export interface DateRange {
  start: Date; // Inclusive start date (00:00:00)
  end: Date;   // Inclusive end date (23:59:59)
}

/**
 * Get today's date range (00:00:00 to 23:59:59 in local timezone)
 * 
 * @returns DateRange object with start and end dates for today
 * 
 * @example
 * const range = getTodayRange();
 * // range.start = 2026-01-23 00:00:00
 * // range.end = 2026-01-23 23:59:59
 */
export function getTodayRange(): DateRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end };
}

/**
 * Get current week's date range (Sunday to Saturday in local timezone)
 * 
 * @returns DateRange object with start (Sunday 00:00:00) and end (Saturday 23:59:59) dates
 * 
 * @example
 * const range = getCurrentWeekRange();
 * // If today is Wednesday, Jan 22, 2026:
 * // range.start = Sunday, Jan 19, 2026 00:00:00
 * // range.end = Saturday, Jan 25, 2026 23:59:59
 */
export function getCurrentWeekRange(): DateRange {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Calculate days to subtract to get to Sunday
  const daysToSunday = dayOfWeek;
  
  // Get Sunday (start of week)
  const start = new Date(now);
  start.setDate(now.getDate() - daysToSunday);
  start.setHours(0, 0, 0, 0);
  
  // Get Saturday (end of week) - 6 days after Sunday
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Get current month's date range (first day to last day in local timezone)
 * 
 * @returns DateRange object with start (first day 00:00:00) and end (last day 23:59:59) dates
 * 
 * @example
 * const range = getCurrentMonthRange();
 * // If today is Jan 15, 2026:
 * // range.start = Jan 1, 2026 00:00:00
 * // range.end = Jan 31, 2026 23:59:59
 */
export function getCurrentMonthRange(): DateRange {
  const now = new Date();
  
  // First day of month
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  
  // Last day of month (day 0 of next month gives last day of current month)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Check if a date falls within a date range (inclusive)
 * 
 * @param date - The date to check
 * @param range - The date range to check against
 * @returns true if date is within range (inclusive), false otherwise
 * 
 * @example
 * const range = getTodayRange();
 * const today = new Date();
 * isDateInRange(today, range); // true
 * 
 * const yesterday = new Date();
 * yesterday.setDate(yesterday.getDate() - 1);
 * isDateInRange(yesterday, range); // false
 */
export function isDateInRange(date: Date, range: DateRange): boolean {
  // Compare timestamps for accurate comparison
  const dateTime = date.getTime();
  const startTime = range.start.getTime();
  const endTime = range.end.getTime();
  
  return dateTime >= startTime && dateTime <= endTime;
}
