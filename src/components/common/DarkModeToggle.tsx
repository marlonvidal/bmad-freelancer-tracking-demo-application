import React from 'react';
import { useSettingsContext } from '@/contexts/SettingsContext';

/**
 * DarkModeToggle - Toggle component for switching between light and dark modes
 * 
 * Displays a toggle button with sun/moon icon based on current mode.
 * Accessible with keyboard navigation (Tab, Enter/Space).
 * Uses SettingsContext to manage dark mode state.
 * 
 * @example
 * ```tsx
 * <DarkModeToggle />
 * ```
 */
export const DarkModeToggle: React.FC = () => {
  const { toggleDarkMode, isDarkMode, loading } = useSettingsContext();
  const darkMode = isDarkMode();

  /**
   * Handle toggle button click
   */
  const handleToggle = async () => {
    if (loading) {
      return; // Prevent toggling while settings are loading
    }
    try {
      await toggleDarkMode();
    } catch (error) {
      console.error('Error toggling dark mode:', error);
    }
  };

  /**
   * Handle keyboard events for accessibility
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <button
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      disabled={loading}
      className="
        p-2 rounded-md
        text-gray-700 dark:text-gray-100
        hover:bg-gray-100 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-800
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
      "
      aria-label="Toggle dark mode"
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? (
        // Moon icon for dark mode (click to switch to light)
        <svg
          className="w-5 h-5 transition-transform duration-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ) : (
        // Sun icon for light mode (click to switch to dark)
        <svg
          className="w-5 h-5 transition-transform duration-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )}
    </button>
  );
};
