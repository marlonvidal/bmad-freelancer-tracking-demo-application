import React from 'react';

interface EmptyColumnStateProps {
  columnName: string;
}

/**
 * EmptyColumnState - Empty state component for columns with no tasks
 * 
 * Displays helpful message when column has no tasks.
 * Visually distinct from columns with tasks.
 */
export const EmptyColumnState: React.FC<EmptyColumnStateProps> = ({ columnName }) => {
  return (
    <div 
      className="flex flex-col items-center justify-center py-8 text-center"
      role="status"
      aria-label={`No tasks in ${columnName} column`}
    >
      <div className="text-gray-400 dark:text-gray-500 mb-2">
        <svg 
          className="w-12 h-12 mx-auto" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No tasks in this column
      </p>
    </div>
  );
};
