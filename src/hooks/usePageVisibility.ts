import { useState, useEffect } from 'react';

/**
 * Hook to detect page visibility changes
 * Uses Page Visibility API to detect when tab becomes active/inactive
 * 
 * @returns Object containing:
 * - isVisible: Boolean indicating if page is currently visible
 * - visibilityState: Current visibility state ('visible' | 'hidden' | 'prerender')
 * 
 * @example
 * ```tsx
 * const { isVisible, visibilityState } = usePageVisibility();
 * 
 * useEffect(() => {
 *   if (isVisible) {
 *     // Tab became active
 *   } else {
 *     // Tab became inactive
 *   }
 * }, [isVisible]);
 * ```
 */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === 'undefined') {
      return true; // SSR fallback
    }
    return !document.hidden;
  });

  const [visibilityState, setVisibilityState] = useState<DocumentVisibilityState>(() => {
    if (typeof document === 'undefined') {
      return 'visible'; // SSR fallback
    }
    return document.visibilityState;
  });

  useEffect(() => {
    // Check if Page Visibility API is supported
    if (typeof document === 'undefined' || !('visibilityState' in document)) {
      return; // Not supported, keep default values
    }

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
      setVisibilityState(document.visibilityState);
    };

    // Set initial state
    setIsVisible(!document.hidden);
    setVisibilityState(document.visibilityState);

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { isVisible, visibilityState };
}
