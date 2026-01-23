import React from 'react';
import { formatHourlyRate } from '@/utils/currencyUtils';

interface RateDisplayProps {
  rate: number | null;
  showLabel?: boolean;
  showSource?: boolean;
  source?: 'task' | 'project' | 'client' | 'global';
}

/**
 * RateDisplay - Component for displaying hourly rates with consistent formatting
 * 
 * Displays formatted hourly rate using currencyUtils.formatHourlyRate().
 * Handles null rates gracefully by showing "Not set" or "—".
 * Optionally shows label and source of rate.
 */
export const RateDisplay: React.FC<RateDisplayProps> = ({
  rate,
  showLabel = false,
  showSource = false,
  source
}) => {
  const formattedRate = formatHourlyRate(rate);
  const displayValue = rate === null || rate === undefined ? 'Not set' : formattedRate;

  const getSourceText = (): string => {
    switch (source) {
      case 'task':
        return 'from task';
      case 'project':
        return 'from project';
      case 'client':
        return 'from client';
      case 'global':
        return 'from global default';
      default:
        return '';
    }
  };

  return (
    <span
      className="text-sm text-gray-700 dark:text-gray-300"
      aria-label={showLabel ? `Rate: ${displayValue}` : displayValue}
    >
      {showLabel && <span className="font-medium">Rate: </span>}
      <span>{displayValue}</span>
      {showSource && source && (
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
          ({getSourceText()})
        </span>
      )}
    </span>
  );
};
