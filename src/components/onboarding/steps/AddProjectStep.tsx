import React, { useEffect } from 'react';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useClientContext } from '@/contexts/ClientContext';

/**
 * AddProjectStep - Step to guide user to create their first project (optional)
 * 
 * Displays instructions and highlights ProjectSelector component.
 * Auto-advances when a project is created, or can be skipped.
 */
export const AddProjectStep: React.FC = () => {
  const { nextStep } = useOnboardingContext();
  const { getAllProjects } = useProjectContext();
  const { clients } = useClientContext();

  const projects = getAllProjects();
  const hasClient = clients.length > 0;

  // Auto-advance when project is created
  useEffect(() => {
    if (projects.length > 0) {
      // Small delay to show success message
      const timer = setTimeout(() => {
        nextStep();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [projects.length, nextStep]);

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Create a project (optional)
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Projects help you organize tasks under specific clients. You can skip this step if you prefer
        to work without projects.
      </p>
      
      {!hasClient ? (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            You need to add a client first before creating a project.
          </p>
        </div>
      ) : projects.length > 0 ? (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg mb-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            ✓ Great! You've created a project. Moving to the next step...
          </p>
        </div>
      ) : (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            If you've selected a client, look for the project selector and click "Create New Project"
            to add a project. You can also skip this step.
          </p>
        </div>
      )}
    </div>
  );
};
