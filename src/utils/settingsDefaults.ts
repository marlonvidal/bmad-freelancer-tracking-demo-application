import { Settings } from '@/types/settings';

/**
 * Default settings values
 * 
 * Used for resetting settings to defaults.
 * Note: onboardingCompleted and onboardingStep are NOT reset (preserved across resets).
 */
export const DEFAULT_SETTINGS: Omit<Settings, 'id' | 'updatedAt' | 'onboardingCompleted' | 'onboardingStep'> = {
  darkMode: false,
  defaultBillableStatus: false,
  defaultHourlyRate: null,
  keyboardShortcuts: {}
};

/**
 * Get default settings with current onboarding status preserved
 * 
 * @param currentSettings - Current settings to preserve onboardingCompleted and onboardingStep
 * @returns Default settings with onboardingCompleted and onboardingStep preserved
 */
export const getDefaultSettings = (
  currentSettings: Settings | null
): Partial<Omit<Settings, 'id'>> => {
  return {
    ...DEFAULT_SETTINGS,
    onboardingCompleted: currentSettings?.onboardingCompleted ?? false,
    onboardingStep: currentSettings?.onboardingStep ?? 0
  };
};
