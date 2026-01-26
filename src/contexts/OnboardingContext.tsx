import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useSettingsContext } from './SettingsContext';

/**
 * Onboarding step enum
 * Values match the step numbers used in the wizard
 */
export enum OnboardingStep {
  NOT_STARTED = 0,
  WELCOME = 1,
  ADD_CLIENT = 2,
  ADD_PROJECT = 3,
  CUSTOMIZE_COLUMNS = 4,
  CREATE_TASK = 5,
  FEATURE_TOUR = 6,
  COMPLETED = -1
}

interface OnboardingContextValue {
  currentStep: number;
  isActive: boolean;
  isSkipped: boolean;
  startOnboarding: () => Promise<void>;
  nextStep: () => Promise<void>;
  previousStep: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  getCurrentStep: () => number;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

/**
 * OnboardingProvider - Provides onboarding wizard state and operations to child components
 * 
 * Manages onboarding wizard state using React Context API. Loads onboarding progress from
 * Settings on mount and persists changes automatically. Uses SettingsContext for persistence.
 */
export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const { settings, updateSettings, loading: settingsLoading } = useSettingsContext();
  
  const [currentStep, setCurrentStep] = useState<number>(OnboardingStep.NOT_STARTED);
  const [isSkipped, setIsSkipped] = useState<boolean>(false);

  /**
   * Load onboarding state from Settings on mount
   */
  useEffect(() => {
    if (!settingsLoading && settings) {
      // If onboarding is completed, set step to COMPLETED
      if (settings.onboardingCompleted) {
        setCurrentStep(OnboardingStep.COMPLETED);
        setIsSkipped(false);
      } else {
        // Load saved step, default to 0 if not set or invalid
        const savedStep = settings.onboardingStep ?? 0;
        // Validate step number (0 = not started, 1-6 = valid steps, -1 = completed)
        if (savedStep === OnboardingStep.COMPLETED || savedStep < OnboardingStep.NOT_STARTED || savedStep > OnboardingStep.FEATURE_TOUR) {
          // Auto-start wizard on first launch
          setCurrentStep(OnboardingStep.WELCOME);
          updateSettings({ onboardingStep: OnboardingStep.WELCOME }).catch(console.error);
        } else if (savedStep === OnboardingStep.NOT_STARTED) {
          // Auto-start wizard if not started
          setCurrentStep(OnboardingStep.WELCOME);
          updateSettings({ onboardingStep: OnboardingStep.WELCOME }).catch(console.error);
        } else {
          // Resume from saved step
          setCurrentStep(savedStep);
        }
        setIsSkipped(false);
      }
    }
  }, [settings, settingsLoading, updateSettings]);

  /**
   * Check if onboarding is currently active
   */
  const isActive = useMemo(() => {
    return !settingsLoading && 
           settings !== null && 
           !settings.onboardingCompleted && 
           currentStep !== OnboardingStep.NOT_STARTED && 
           currentStep !== OnboardingStep.COMPLETED &&
           !isSkipped;
  }, [settings, settingsLoading, currentStep, isSkipped]);

  /**
   * Save current step to Settings
   */
  const saveStep = useCallback(async (step: number): Promise<void> => {
    try {
      await updateSettings({ onboardingStep: step });
    } catch (error) {
      console.error('Error saving onboarding step:', error);
      // Don't throw - allow wizard to continue even if save fails
    }
  }, [updateSettings]);

  /**
   * Complete onboarding wizard
   */
  const completeOnboarding = useCallback(async (): Promise<void> => {
    setCurrentStep(OnboardingStep.COMPLETED);
    setIsSkipped(false);
    await updateSettings({ 
      onboardingCompleted: true, 
      onboardingStep: OnboardingStep.COMPLETED 
    });
  }, [updateSettings]);

  /**
   * Start onboarding wizard
   */
  const startOnboarding = useCallback(async (): Promise<void> => {
    setCurrentStep(OnboardingStep.WELCOME);
    setIsSkipped(false);
    await saveStep(OnboardingStep.WELCOME);
  }, [saveStep]);

  /**
   * Move to next step
   */
  const nextStep = useCallback(async (): Promise<void> => {
    if (currentStep >= OnboardingStep.WELCOME && currentStep < OnboardingStep.FEATURE_TOUR) {
      const next = currentStep + 1;
      setCurrentStep(next);
      await saveStep(next);
    } else if (currentStep === OnboardingStep.FEATURE_TOUR) {
      // Last step - complete onboarding
      await completeOnboarding();
    }
  }, [currentStep, saveStep, completeOnboarding]);

  /**
   * Move to previous step
   */
  const previousStep = useCallback(async (): Promise<void> => {
    if (currentStep > OnboardingStep.WELCOME && currentStep <= OnboardingStep.FEATURE_TOUR) {
      const previous = currentStep - 1;
      setCurrentStep(previous);
      await saveStep(previous);
    }
  }, [currentStep, saveStep]);

  /**
   * Skip onboarding wizard
   */
  const skipOnboarding = useCallback(async (): Promise<void> => {
    setIsSkipped(true);
    setCurrentStep(OnboardingStep.COMPLETED);
    await updateSettings({ 
      onboardingCompleted: true, 
      onboardingStep: OnboardingStep.COMPLETED 
    });
  }, [updateSettings]);

  /**
   * Get current step number
   */
  const getCurrentStep = useCallback((): number => {
    return currentStep;
  }, [currentStep]);

  const value: OnboardingContextValue = {
    currentStep,
    isActive,
    isSkipped,
    startOnboarding,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding,
    getCurrentStep
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

/**
 * Hook to use OnboardingContext
 * @throws Error if used outside OnboardingProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useOnboardingContext = (): OnboardingContextValue => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }
  return context;
};
