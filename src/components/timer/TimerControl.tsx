import React, { useCallback } from 'react';
import { useTimerContext } from '@/contexts/TimerContext';

interface TimerControlProps {
  taskId: string;
}

/**
 * TimerControl - Timer control button component for task cards
 * 
 * Displays Start/Stop button with visual indicators for active timer state.
 * Provides keyboard accessibility and visual feedback.
 */
export const TimerControl: React.FC<TimerControlProps> = ({ taskId }) => {
  const { activeTaskId, startTimer, stopTimer, status } = useTimerContext();
  const isActive = activeTaskId === taskId && status === 'active';

  const handleClick = useCallback(async () => {
    try {
      if (isActive) {
        await stopTimer();
      } else {
        await startTimer(taskId);
      }
    } catch (error) {
      console.error('Error toggling timer:', error);
      // Error is already handled in context
    }
  }, [isActive, taskId, startTimer, stopTimer]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleClick();
    }
  }, [handleClick]);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation(); // Prevent card click when clicking timer button
        handleClick();
      }}
      onKeyDown={handleKeyDown}
      aria-label={isActive ? 'Stop timer' : 'Start timer'}
      aria-pressed={isActive}
      className={`
        relative px-3 py-1.5 text-sm font-medium rounded-md
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isActive 
          ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500' 
          : 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500'
        }
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isActive ? 'animate-pulse motion-safe:animate-pulse' : ''}
      `}
      disabled={status === 'paused'}
    >
      <span className="flex items-center gap-1.5">
        {isActive ? (
          <>
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                clipRule="evenodd"
              />
            </svg>
            <span>Stop</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
            <span>Start</span>
          </>
        )}
      </span>
      
      {/* Pulsing indicator ring when active */}
      {isActive && (
        <span
          className="absolute inset-0 rounded-md bg-red-400 opacity-75 motion-safe:animate-ping"
          aria-hidden="true"
        />
      )}
    </button>
  );
};
