import React, { useEffect } from 'react';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { useClientContext } from '@/contexts/ClientContext';

/**
 * AddClientStep - Step to guide user to add their first client
 * 
 * Displays instructions and highlights ClientSelector component.
 * Auto-advances when a client is created.
 */
export const AddClientStep: React.FC = () => {
  const { nextStep } = useOnboardingContext();
  const { clients } = useClientContext();

  // Auto-advance when client is created
  useEffect(() => {
    if (clients.length > 0) {
      // Small delay to show success message
      const timer = setTimeout(() => {
        nextStep();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [clients.length, nextStep]);

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Let's add your first client
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Clients help you organize your work and track revenue. You can add clients with their hourly rates
        and contact information.
      </p>
      
      {clients.length > 0 ? (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg mb-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            ✓ Great! You've added a client. Moving to the next step...
          </p>
        </div>
      ) : (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Look for the client selector on the kanban board (top of the page) and click "Create New Client"
            to add your first client.
          </p>
        </div>
      )}
    </div>
  );
};
