import React, { useEffect } from 'react';
import { useOnboardingContext } from '@/contexts/OnboardingContext';
import { useTaskContext } from '@/contexts/TaskContext';
import { useTimerContext } from '@/contexts/TimerContext';

/**
 * CreateTaskStep - Step to guide user to create first task and try the timer
 * 
 * Displays instructions and highlights task creation UI and timer.
 * Auto-advances when task is created and timer is started.
 */
export const CreateTaskStep: React.FC = () => {
  const { nextStep } = useOnboardingContext();
  const { tasks } = useTaskContext();
  const { activeTaskId } = useTimerContext();

  const hasTask = tasks.length > 0;
  const hasActiveTimer = activeTaskId !== null;

  // Auto-advance when task is created and timer is started
  useEffect(() => {
    if (hasTask && hasActiveTimer) {
      // Small delay to show success message
      const timer = setTimeout(() => {
        nextStep();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasTask, hasActiveTimer, nextStep]);

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Create your first task and try the timer
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Tasks are the core of your workflow. Create a task and start the timer to track your time.
      </p>
      
      <div className="space-y-4">
        {!hasTask ? (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              <strong>Step 1:</strong> Click the "Add Task" button on any column to create your first task.
            </p>
          </div>
        ) : !hasActiveTimer ? (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200 mb-2">
              ✓ Great! You've created a task.
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Step 2:</strong> Click the timer button on your task card to start tracking time.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Perfect! You've created a task and started the timer. Moving to the next step...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
