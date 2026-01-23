/**
 * Currency formatting utilities
 * 
 * Provides functions for formatting currency amounts and hourly rates
 * using Intl.NumberFormat for locale-aware formatting.
 */

/**
 * Formats a currency amount as a string with currency symbol
 * 
 * @param amount - The amount to format (e.g., 1250.50)
 * @returns Formatted string (e.g., "$1,250.50")
 */
export function formatCurrency(amount: number): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '—';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats an hourly rate as a string with currency symbol and unit
 * 
 * @param rate - The hourly rate to format (e.g., 75.50)
 * @returns Formatted string (e.g., "$75.50/hr" or "$75.50/hour")
 */
export function formatHourlyRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || isNaN(rate)) {
    return '—';
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rate);

  return `${formatted}/hr`;
}
