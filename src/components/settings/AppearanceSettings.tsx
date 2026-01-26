import React from 'react';
import { SettingsSection } from './SettingsSection';
import { DarkModeToggle } from '@/components/common/DarkModeToggle';
import { useSettingsContext } from '@/contexts/SettingsContext';

/**
 * AppearanceSettings - Settings section for appearance preferences
 * 
 * Displays dark mode toggle with description.
 * Uses DarkModeToggle component from Story 4.5.
 */
export const AppearanceSettings: React.FC = () => {
  const { isDarkMode } = useSettingsContext();
  const darkMode = isDarkMode();

  return (
    <SettingsSection
      title="Appearance"
      description="Reduce eye strain with dark mode. Toggle to switch between light and dark themes."
    >
      <div className="flex items-center justify-between py-2">
        <div className="flex-1">
          <label
            htmlFor="dark-mode-toggle"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Dark Mode
          </label>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {darkMode ? 'Dark mode is currently enabled' : 'Light mode is currently enabled'}
          </p>
        </div>
        <div className="ml-4">
          <DarkModeToggle />
        </div>
      </div>
    </SettingsSection>
  );
};
