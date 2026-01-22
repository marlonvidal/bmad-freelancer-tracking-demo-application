import { useState, useEffect } from 'react';

/**
 * Custom hook to detect online/offline status
 * Uses navigator.onLine API and online/offline events
 * 
 * @returns boolean indicating if the device is online
 * 
 * @example
 * ```tsx
 * const isOnline = useOnlineStatus();
 * 
 * if (!isOnline) {
 *   return <OfflineIndicator />;
 * }
 * ```
 */
export function useOnlineStatus(): boolean {
  // Initialize with current online status
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    // Default to true if navigator.onLine is not available
    return true;
  });

  useEffect(() => {
    // Handle online event
    const handleOnline = () => {
      setIsOnline(true);
    };

    // Handle offline event
    const handleOffline = () => {
      setIsOnline(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
