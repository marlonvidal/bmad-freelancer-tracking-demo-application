import React from 'react';

interface OfflineIndicatorProps {
  /**
   * Whether the device is currently online
   */
  isOnline: boolean;
}

/**
 * OfflineIndicator component
 * Displays a notification when the device goes offline
 * 
 * @param props - Component props
 * @param props.isOnline - Whether the device is currently online
 * 
 * @example
 * ```tsx
 * const isOnline = useOnlineStatus();
 * 
 * return (
 *   <>
 *     <App />
 *     <OfflineIndicator isOnline={isOnline} />
 *   </>
 * );
 * ```
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isOnline }) => {
  // Don't render if online
  if (isOnline) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-label="Offline"
      className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-center z-50 shadow-lg"
    >
      <div className="flex items-center justify-center gap-2">
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
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.464-2.83m-1.41 4.653a9 9 0 01-2.121-5.683m5.546-.182a5 5 0 01-2.121-2.121m0 0L3 3m8.293 8.293l1.414 1.414"
          />
        </svg>
        <span className="font-medium">
          You are currently offline. Some features may be limited.
        </span>
      </div>
    </div>
  );
};
