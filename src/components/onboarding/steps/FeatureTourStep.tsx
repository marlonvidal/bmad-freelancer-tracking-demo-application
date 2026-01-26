import React from 'react';

/**
 * FeatureTourStep - Final step showing tour of key features
 * 
 * Displays tour of key features: timer, billable toggle, revenue view.
 * User can interact with features during tour.
 */
export const FeatureTourStep: React.FC = () => {
  // Note: completeOnboarding is called by OnboardingWizard's Finish button

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Key Features Tour
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Here are some key features to help you get the most out of Time Tracker:
      </p>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Timer Functionality
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Start a timer on any task to track time automatically. The timer runs in the background
            even when you switch tabs or close the app. Stop the timer when you're done.
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Billable Toggle
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Mark tasks as billable or non-billable. Billable tasks contribute to your revenue calculations
            based on the hourly rate. Non-billable tasks help you track time without affecting revenue.
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Revenue Dashboard
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Navigate to the Revenue Dashboard to see your earnings breakdown by client, project, and task.
            Revenue is calculated from billable hours and hourly rates.
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          You're all set! Click "Finish" to complete the onboarding and start using Time Tracker.
        </p>
      </div>
    </div>
  );
};
