import React from 'react';
import { formatCurrency } from '@/utils/currencyUtils';

interface RevenueDisplayProps {
  revenue: number | null;
  isBillable: boolean;
  showLabel?: boolean;
}

/**
 * RevenueDisplay - Component for displaying task revenue potential
 * 
 * Shows formatted revenue amount for billable tasks with rates set.
 * Handles edge cases gracefully (non-billable tasks, missing rates, etc.).
 * Small and unobtrusive, similar to TimeEstimateDisplay.
 * 
 * Optimized with React.memo to prevent unnecessary re-renders.
 */
const RevenueDisplayComponent: React.FC<RevenueDisplayProps> = ({ 
  revenue, 
  isBillable,
  showLabel = false
}) => {
  // Don't display if task is not billable
  if (!isBillable) {
    return null;
  }

  // Handle null revenue (no rate set)
  if (revenue === null) {
    return (
      <div 
        className="flex items-center gap-1 text-sm text-gray-500"
        aria-label="Rate not set"
        role="status"
      >
        {showLabel && <span className="text-gray-600">Revenue:</span>}
        <span>Rate not set</span>
      </div>
    );
  }

  // Format revenue using currencyUtils
  const formattedRevenue = formatCurrency(revenue);

  // Build ARIA label
  const ariaLabel = `Revenue: ${formattedRevenue}`;

  return (
    <div 
      className="flex items-center gap-1 text-sm text-gray-600"
      aria-label={ariaLabel}
      role="status"
    >
      {showLabel && <span className="text-gray-600">Revenue:</span>}
      <span className="font-medium text-gray-900 dark:text-gray-100">
        {formattedRevenue}
      </span>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const RevenueDisplay = React.memo(RevenueDisplayComponent);
