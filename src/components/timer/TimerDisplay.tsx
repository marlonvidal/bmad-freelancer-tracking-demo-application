import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useTimerContext } from '@/contexts/TimerContext';
import { TimeEntryRepository } from '@/services/data/repositories/TimeEntryRepository';
import { formatDuration } from '@/utils/timeUtils';

interface TimerDisplayProps {
  taskId: string;
  displayMode?: 'elapsed' | 'total' | 'auto';
}

/**
 * TimerDisplay - Displays elapsed time or total time spent on a task
 * 
 * Shows elapsed time when timer is active for this task, otherwise shows total time.
 * Updates in real-time when timer is running. Uses human-readable format.
 * 
 * Optimized with React.memo to prevent unnecessary re-renders.
 */
const TimerDisplayComponent: React.FC<TimerDisplayProps> = ({ 
  taskId, 
  displayMode = 'auto' 
}) => {
  const { activeTaskId, getElapsedTime, status } = useTimerContext();
  const [totalTime, setTotalTime] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const timeEntryRepository = useMemo(() => new TimeEntryRepository(), []);
  const previousStatusRef = useRef<'idle' | 'active' | 'paused'>('idle');

  const isActive = useMemo(() => activeTaskId === taskId && status === 'active', [activeTaskId, taskId, status]);
  const elapsedSeconds = useMemo(() => isActive ? getElapsedTime(taskId) : 0, [isActive, getElapsedTime, taskId]);
  const elapsedMinutes = useMemo(() => Math.floor(elapsedSeconds / 60), [elapsedSeconds]);

  // Determine what to display
  const displayTime = useMemo(() => {
    if (displayMode === 'elapsed') {
      return elapsedMinutes;
    }
    if (displayMode === 'total') {
      return totalTime;
    }
    // auto mode: show elapsed if active, otherwise total
    return isActive ? elapsedMinutes : totalTime;
  }, [displayMode, isActive, elapsedMinutes, totalTime]);

  // Load total time on mount and when taskId changes
  useEffect(() => {
    let isMounted = true;

    const loadTotalTime = async () => {
      try {
        setLoading(true);
        setError(null);
        const total = await timeEntryRepository.getTotalTimeForTask(taskId);
        if (isMounted) {
          setTotalTime(total);
          setLoading(false);
        }
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Failed to load total time');
        if (isMounted) {
          setError(errorObj);
          setLoading(false);
        }
        console.error('Error loading total time:', err);
      }
    };

    loadTotalTime();

    return () => {
      isMounted = false;
    };
  }, [taskId, timeEntryRepository]);

  // Update total time when timer stops (new time entry created)
  useEffect(() => {
    // Only reload if status changed from active to idle (timer stopped)
    if (previousStatusRef.current === 'active' && status === 'idle' && !isActive) {
      // Reload total time when timer stops
      timeEntryRepository.getTotalTimeForTask(taskId)
        .then((total) => {
          setTotalTime(total);
        })
        .catch((err) => {
          console.error('Error reloading total time:', err);
        });
    }
    previousStatusRef.current = status;
  }, [isActive, status, taskId, timeEntryRepository]);

  // Format display text
  const displayText = useMemo(() => {
    if (loading) {
      return '...';
    }
    if (error) {
      return '--';
    }
    return formatDuration(displayTime);
  }, [loading, error, displayTime]);

  // Determine ARIA label
  const ariaLabel = useMemo(() => {
    if (isActive) {
      return `Elapsed time: ${displayText}`;
    }
    return `Total time spent: ${displayText}`;
  }, [isActive, displayText]);

  return (
    <div
      className="text-sm text-gray-600 font-medium"
      aria-label={ariaLabel}
      role="timer"
      aria-live={isActive ? 'polite' : 'off'}
      aria-atomic="true"
    >
      <span className="flex items-center gap-1">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{displayText}</span>
      </span>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const TimerDisplay = React.memo(TimerDisplayComponent);
