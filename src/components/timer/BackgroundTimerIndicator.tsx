import React, { useEffect } from 'react';
import { useTimerContext } from '@/contexts/TimerContext';

/**
 * BackgroundTimerIndicator - Displays notification when timer was running in background
 * 
 * Shows a toast/banner notification when user returns to tab with active timer.
 * Auto-dismisses after a few seconds or allows manual dismiss.
 */
export const BackgroundTimerIndicator: React.FC = () => {
  const { backgroundTimerNotification, clearBackgroundTimerNotification } = useTimerContext();

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (backgroundTimerNotification) {
      const timer = setTimeout(() => {
        clearBackgroundTimerNotification();
      }, 5000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [backgroundTimerNotification, clearBackgroundTimerNotification]);

  if (!backgroundTimerNotification) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in-right max-w-md"
    >
      <div className="flex-shrink-0">
        <svg
          className="w-5 h-5"
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
      </div>
      <p className="flex-1 text-sm font-medium">{backgroundTimerNotification}</p>
      <button
        onClick={clearBackgroundTimerNotification}
        aria-label="Dismiss notification"
        className="flex-shrink-0 text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white rounded p-1"
      >
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};
