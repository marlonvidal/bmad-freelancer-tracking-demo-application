import React, { useEffect, useRef } from 'react';
import { useOnboardingContext, OnboardingStep } from '@/contexts/OnboardingContext';
import { WelcomeStep } from './steps/WelcomeStep';
import { AddClientStep } from './steps/AddClientStep';
import { AddProjectStep } from './steps/AddProjectStep';
import { CustomizeColumnsStep } from './steps/CustomizeColumnsStep';
import { CreateTaskStep } from './steps/CreateTaskStep';
import { FeatureTourStep } from './steps/FeatureTourStep';

/**
 * OnboardingWizard - Main wizard container component
 * 
 * Manages wizard state, step navigation, and renders appropriate step component.
 * Handles keyboard navigation, focus management, and accessibility.
 */
export const OnboardingWizard: React.FC = () => {
  const {
    currentStep,
    isActive,
    nextStep,
    previousStep,
    skipOnboarding
  } = useOnboardingContext();

  const wizardRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Store the previously focused element when wizard opens
  useEffect(() => {
    if (isActive) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
  }, [isActive]);

  // Focus management: focus wizard container when it becomes active
  useEffect(() => {
    if (isActive && wizardRef.current) {
      wizardRef.current.focus();
    }
  }, [isActive, currentStep]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC key to skip/close wizard
      if (e.key === 'Escape') {
        e.preventDefault();
        skipOnboarding();
        return;
      }

      // Arrow keys for navigation (only if not in an input field)
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return; // Don't handle arrow keys in input fields
      }

      if (e.key === 'ArrowRight' && currentStep < OnboardingStep.FEATURE_TOUR) {
        e.preventDefault();
        nextStep();
      } else if (e.key === 'ArrowLeft' && currentStep > OnboardingStep.WELCOME) {
        e.preventDefault();
        previousStep();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, currentStep, nextStep, previousStep, skipOnboarding]);

  // Prevent body scroll when wizard is open
  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isActive]);

  // Return focus to previously focused element when wizard closes
  useEffect(() => {
    if (!isActive && previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [isActive]);

  // Don't render if wizard is not active
  if (!isActive) {
    return null;
  }

  // Calculate total steps (excluding NOT_STARTED and COMPLETED)
  const totalSteps = OnboardingStep.FEATURE_TOUR - OnboardingStep.WELCOME + 1;
  const currentStepNumber = currentStep - OnboardingStep.WELCOME + 1;

  // Render appropriate step component
  const renderStep = () => {
    switch (currentStep) {
      case OnboardingStep.WELCOME:
        return <WelcomeStep />;
      case OnboardingStep.ADD_CLIENT:
        return <AddClientStep />;
      case OnboardingStep.ADD_PROJECT:
        return <AddProjectStep />;
      case OnboardingStep.CUSTOMIZE_COLUMNS:
        return <CustomizeColumnsStep />;
      case OnboardingStep.CREATE_TASK:
        return <CreateTaskStep />;
      case OnboardingStep.FEATURE_TOUR:
        return <FeatureTourStep />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={wizardRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 dark:bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-wizard-title"
      tabIndex={-1}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Wizard Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2
            id="onboarding-wizard-title"
            className="text-xl font-semibold text-gray-900 dark:text-gray-100"
          >
            Welcome to Time Tracker
          </h2>
          <button
            type="button"
            onClick={skipOnboarding}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
            aria-label="Skip onboarding"
          >
            <span className="sr-only">Skip</span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Step {currentStepNumber} of {totalSteps}</span>
            <span>{Math.round((currentStepNumber / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStepNumber / totalSteps) * 100}%` }}
              role="progressbar"
              aria-valuenow={currentStepNumber}
              aria-valuemin={1}
              aria-valuemax={totalSteps}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="px-6 py-6">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <button
            type="button"
            onClick={skipOnboarding}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
            aria-label="Skip onboarding"
          >
            Skip
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={previousStep}
              disabled={currentStep === OnboardingStep.WELCOME}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous step"
            >
              Previous
            </button>
            {currentStep === OnboardingStep.FEATURE_TOUR ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Finish onboarding"
              >
                Finish
              </button>
            ) : (
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Next step"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
