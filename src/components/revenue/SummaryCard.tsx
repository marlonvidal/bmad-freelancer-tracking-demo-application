import React from 'react';
import { formatCurrency } from '@/utils/currencyUtils';
import { formatDuration } from '@/utils/timeUtils';

interface SummaryCardProps {
  title: string;
  revenue: number;
  hours: number;
  loading?: boolean;
}

/**
 * SummaryCard - Displays revenue and hours summary for a time period
 * 
 * Shows formatted revenue (currency) and hours (duration) in a card layout.
 * Displays loading skeleton when loading is true.
 */
const SummaryCardComponent: React.FC<SummaryCardProps> = ({
  title,
  revenue,
  hours,
  loading = false
}) => {
  // Convert hours to minutes for formatDuration (it expects minutes)
  const hoursInMinutes = hours * 60;

  if (loading) {
    return (
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        role="status"
        aria-label={`Loading ${title} summary`}
        aria-live="polite"
      >
        <h3 className="text-sm font-medium text-gray-500 mb-4">{title}</h3>
        <div className="space-y-3">
          <div className="h-8 bg-gray-200 rounded animate-pulse" aria-hidden="true" />
          <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      role="region"
      aria-label={`${title} summary`}
    >
      <h3 className="text-sm font-medium text-gray-500 mb-4">{title}</h3>
      <div className="space-y-2">
        <div>
          <p className="text-2xl font-bold text-gray-900" aria-label={`Revenue: ${formatCurrency(revenue)}`}>
            {formatCurrency(revenue)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600" aria-label={`Billable hours: ${formatDuration(hoursInMinutes)}`}>
            {formatDuration(hoursInMinutes)}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Memoized SummaryCard to prevent unnecessary re-renders
 */
export const SummaryCard = React.memo(SummaryCardComponent);
