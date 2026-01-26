import React, { useEffect } from 'react';
import { useSettingsContext } from '@/contexts/SettingsContext';

/**
 * DarkModeApplier - Applies dark mode class to root element
 * 
 * Watches SettingsContext for darkMode changes and applies/removes
 * the 'dark' class on the <html> element for Tailwind CSS dark mode.
 * Prevents flash of unstyled content by applying class before render.
 */
export const DarkModeApplier: React.FC = () => {
  const { isDarkMode, settings, loading } = useSettingsContext();

  useEffect(() => {
    if (loading || !settings) {
      return;
    }

    const darkMode = isDarkMode();
    const htmlElement = document.documentElement;

    if (darkMode) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }, [isDarkMode, settings, loading]);

  // Apply dark mode synchronously on mount to prevent FOUC
  // This runs once on mount before the reactive effect above
  useEffect(() => {
    if (!loading && settings) {
      const darkMode = settings.darkMode;
      const htmlElement = document.documentElement;

      // Apply immediately (synchronously) before React renders
      if (darkMode) {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount, using settings directly to avoid stale closure

  return null; // This component doesn't render anything
};
