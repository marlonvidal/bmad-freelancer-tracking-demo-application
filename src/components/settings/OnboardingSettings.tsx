import React, { useState } from 'react';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

/**
 * OnboardingSettings - Settings section for onboarding wizard
 * 
 * Allows user to restart the onboarding wizard.
 */
export const OnboardingSettings: React.FC = () => {
  const { settings, updateSettings } = useSettingsContext();
  const { startOnboarding } = useOnboardingContext();
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const handleRestartOnboarding = async () => {
    try {
      // Reset onboarding state
      await updateSettings({
        onboardingCompleted: false,
        onboardingStep: 0
      });
      // Start onboarding wizard
      await startOnboarding();
      setShowRestartConfirm(false);
    } catch (error) {
      console.error('Error restarting onboarding:', error);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Onboarding
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Restart the onboarding wizard to see the guided tour again.
        </p>
        <button
          onClick={() => setShowRestartConfirm(true)}
          className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
          aria-label="Restart onboarding wizard"
        >
          Restart Onboarding
        </button>
      </div>

      {/* Restart Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRestartConfirm}
        title="Restart Onboarding?"
        message="This will restart the onboarding wizard and show you the guided tour again. You can skip it at any time."
        confirmLabel="Restart"
        cancelLabel="Cancel"
        onConfirm={handleRestartOnboarding}
        onCancel={() => setShowRestartConfirm(false)}
      />
    </>
  );
};
