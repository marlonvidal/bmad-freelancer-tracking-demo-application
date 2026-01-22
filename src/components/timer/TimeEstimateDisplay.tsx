import React from 'react';
import { Task } from '@/types/task';
import { formatDuration } from '@/utils/timeUtils';
import { calculateEstimateComparison } from '@/utils/estimateUtils';

interface TimeEstimateDisplayProps {
  task: Task;
  totalTime: number; // actual time in minutes
}

/**
 * TimeEstimateDisplay - Component for displaying time estimate vs actual time comparison
 * 
 * Shows estimated time, actual time, and visual indicators for over/under/on-track status.
 * Handles edge cases gracefully (no estimate, no actual time, etc.).
 */
export const TimeEstimateDisplay: React.FC<TimeEstimateDisplayProps> = ({ 
  task, 
  totalTime 
}) => {
  // Don't show if no estimate
  if (!task.timeEstimate || task.timeEstimate <= 0) {
    return null;
  }

  const comparison = calculateEstimateComparison(task.timeEstimate, totalTime);
  
  // Determine color classes based on status
  const getStatusColor = () => {
    switch (comparison.status) {
      case 'over':
        return 'text-red-600';
      case 'under':
        return 'text-green-600';
      case 'on-track':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  // Determine icon/badge based on status
  const getStatusIcon = () => {
    switch (comparison.status) {
      case 'over':
        return '⚠️';
      case 'under':
        return '✓';
      case 'on-track':
        return '✓';
      default:
        return '';
    }
  };

  // Format comparison text for screen readers
  const getAriaLabel = () => {
    const estimateText = formatDuration(task.timeEstimate);
    const actualText = formatDuration(totalTime);
    const statusText = comparison.status === 'over' 
      ? `Over estimate by ${Math.abs(comparison.difference)} minutes`
      : comparison.status === 'under'
      ? `Under estimate by ${Math.abs(comparison.difference)} minutes`
      : 'On track with estimate';
    
    return `Estimate: ${estimateText}, Actual: ${actualText}, ${statusText}`;
  };

  const statusColor = getStatusColor();
  const statusIcon = getStatusIcon();

  return (
    <div 
      className="flex items-center gap-2 text-sm"
      aria-label={getAriaLabel()}
      role="status"
    >
      <span className="text-gray-600">
        Est: <span className="font-medium">{formatDuration(task.timeEstimate)}</span>
      </span>
      <span className="text-gray-400">|</span>
      <span className="text-gray-600">
        Actual: <span className="font-medium">{formatDuration(totalTime)}</span>
      </span>
      {comparison.status !== 'on-track' && (
        <>
          <span className="text-gray-400">|</span>
          <span className={`${statusColor} flex items-center gap-1`}>
            <span aria-hidden="true">{statusIcon}</span>
            <span className="sr-only">
              {comparison.status === 'over' 
                ? `Over estimate by ${Math.abs(comparison.difference)} minutes`
                : `Under estimate by ${Math.abs(comparison.difference)} minutes`}
            </span>
            <span aria-hidden="true">
              {comparison.status === 'over' ? '↑' : '↓'}
            </span>
          </span>
        </>
      )}
    </div>
  );
};
