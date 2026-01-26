import React, { useState } from 'react';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { SampleDataService } from '@/services/SampleDataService';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

/**
 * WelcomeStep - Welcome screen for onboarding wizard
 * 
 * Displays welcome message, value proposition, and option to start with sample data.
 */
export const WelcomeStep: React.FC = () => {
  const { nextStep } = useOnboardingContext();
  const [isGeneratingSampleData, setIsGeneratingSampleData] = useState(false);
  const [hasSampleData, setHasSampleData] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGetStarted = () => {
    nextStep();
  };

  const handleTryWithSampleData = async () => {
    try {
      setIsGeneratingSampleData(true);
      setErrorMessage(null);
      await SampleDataService.generateSampleData();
      setHasSampleData(true);
    } catch (error) {
      console.error('Error generating sample data:', error);
      setErrorMessage('Failed to generate sample data. Please try again.');
    } finally {
      setIsGeneratingSampleData(false);
    }
  };

  const handleDeleteSampleData = async () => {
    try {
      setErrorMessage(null);
      await SampleDataService.deleteSampleData();
      setHasSampleData(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting sample data:', error);
      setErrorMessage('Failed to delete sample data. Please try again.');
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="text-center">
      {/* Logo/Branding */}
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      {/* Welcome Message */}
      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Welcome to Time Tracker
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        A powerful tool to track your time, manage tasks, and monitor your revenue.
      </p>

      {/* Value Proposition */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-blue-600 dark:text-blue-400 mb-2">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Kanban Board
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Organize tasks in a visual board with customizable columns
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-blue-600 dark:text-blue-400 mb-2">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Time Tracking
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track time with built-in timer and manual entries
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-blue-600 dark:text-blue-400 mb-2">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Revenue Tracking
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Monitor earnings with billable hours and hourly rates
          </p>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
        </div>
      )}

      {/* Sample Data Option */}
      {!hasSampleData ? (
        <div className="mb-6">
          <button
            type="button"
            onClick={handleTryWithSampleData}
            disabled={isGeneratingSampleData}
            className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingSampleData ? 'Generating...' : 'Try with Sample Data'}
          </button>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
            Sample data has been generated! You can explore the app with pre-populated tasks.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
          >
            Delete Sample Data
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Sample Data?"
        message="This will permanently delete all sample data including sample tasks and time entries. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteSampleData}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setErrorMessage(null);
        }}
      />

      {/* Action Buttons */}
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={handleGetStarted}
          className="px-6 py-2 text-base font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};
