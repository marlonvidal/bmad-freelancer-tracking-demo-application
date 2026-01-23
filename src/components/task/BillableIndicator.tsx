import React from 'react';

interface BillableIndicatorProps {
  isBillable: boolean;
}

/**
 * BillableIndicator - Displays billable indicator when task is billable
 * 
 * Shows a visual indicator (dollar sign icon with green badge) when isBillable is true.
 * Does not render when isBillable is false.
 * Styled consistently with PriorityBadge pattern.
 */
export const BillableIndicator: React.FC<BillableIndicatorProps> = ({ isBillable }) => {
  if (!isBillable) {
    return null;
  }

  return (
    <span
      className="px-2 py-1 text-xs font-medium rounded-full border bg-green-100 text-green-800 border-green-200 flex items-center gap-1"
      aria-label="Billable task"
    >
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>Billable</span>
    </span>
  );
};
