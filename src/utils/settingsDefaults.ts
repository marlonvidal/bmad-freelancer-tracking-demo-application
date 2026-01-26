import { Settings } from '@/types/settings';

/**
 * Default settings values
 * 
 * Used for resetting settings to defaults.
 * Note: onboardingCompleted is NOT reset (preserved across resets).
 */
export const DEFAULT_SETTINGS: Omit<Settings, 'id' | 'updatedAt' | 'onboardingCompleted'> = {
  darkMode: false,
  defaultBillableStatus: false,
  defaultHourlyRate: null,
  keyboardShortcuts: {}
};

/**
 * Get default settings with current onboarding status preserved
 * 
 * @param currentSettings - Current settings to preserve onboardingCompleted
 * @returns Default settings with onboardingCompleted preserved
 */
export const getDefaultSettings = (
  currentSettings: Settings | null
): Partial<Omit<Settings, 'id'>> => {
  return {
    ...DEFAULT_SETTINGS,
    onboardingCompleted: currentSettings?.onboardingCompleted ?? false
  };
};
