import React, { useState } from 'react';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { AppearanceSettings } from './AppearanceSettings';
import { TaskDefaultsSettings } from './TaskDefaultsSettings';
import { KeyboardShortcutsSection } from './KeyboardShortcutsSection';
import { DataManagementSettings } from './DataManagementSettings';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { getDefaultSettings } from '@/utils/settingsDefaults';

/**
 * SettingsPanel - Main settings panel component
 * 
 * Displays all application settings organized into logical sections:
 * - Appearance (dark mode)
 * - Task Defaults (billable status, hourly rate)
 * - Keyboard Shortcuts (reference)
 * - Data Management (export, backup/restore)
 * 
 * Responsive design with single column on mobile, comfortable spacing on tablet/desktop.
 * Fully accessible with keyboard navigation and ARIA labels.
 */
export const SettingsPanel: React.FC = () => {
  const { loading, error, settings, updateSettings } = useSettingsContext();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error loading settings
                </h3>
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error.message || 'Failed to load settings. Please try refreshing the page.'}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-500 rounded-md hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Handle reset to defaults
   */
  const handleResetToDefaults = async () => {
    try {
      const defaultSettings = getDefaultSettings(settings);
      await updateSettings(defaultSettings);
      setShowResetConfirm(false);
      // Show success message briefly (could be enhanced with toast notification)
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Settings
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Configure your application preferences and manage your data.
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6 md:space-y-8">
          {/* Appearance Section */}
          <AppearanceSettings />

          {/* Task Defaults Section */}
          <TaskDefaultsSettings />

          {/* Keyboard Shortcuts Section */}
          <KeyboardShortcutsSection />

          {/* Data Management Section */}
          <DataManagementSettings />
        </div>

        {/* Reset to Defaults Section */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Reset to Defaults
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Reset all settings to their default values. This will not affect your tasks, time entries, or other data.
            </p>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-900/60 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 transition-colors"
              aria-label="Reset settings to defaults"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset Settings to Defaults?"
        message="This will reset all settings to their default values. Your tasks, time entries, and other data will not be affected. This action cannot be undone."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleResetToDefaults}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
