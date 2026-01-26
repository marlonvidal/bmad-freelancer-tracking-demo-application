import React from 'react';
import { useViewContext } from '@/contexts/ViewContext';
import { DarkModeToggle } from './DarkModeToggle';

/**
 * Navigation - Main navigation component for the application
 * 
 * Provides navigation between main views:
 * - Board (Kanban board) - default/home view
 * - Revenue Dashboard - revenue analytics view
 * 
 * Logo/branding returns to board view.
 * Accessible with keyboard navigation and ARIA labels.
 */
export const Navigation: React.FC = () => {
  const { currentView, setView } = useViewContext();

  const handleLogoClick = () => {
    setView('board');
  };

  const handleDashboardClick = () => {
    setView('dashboard');
  };

  return (
    <nav
      className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo/Home - Left Side */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-md px-2 py-1 transition-colors"
          aria-label="Go to board (home)"
          aria-current={currentView === 'board' ? 'page' : undefined}
        >
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
          <span className="text-lg font-semibold">FreelanceFlow</span>
        </button>

        {/* Navigation Links - Right Side */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleDashboardClick}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
              currentView === 'dashboard'
                ? 'bg-blue-600 dark:bg-blue-500 text-white'
                : 'text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            aria-label="Go to revenue dashboard"
            aria-current={currentView === 'dashboard' ? 'page' : undefined}
          >
            Revenue Dashboard
          </button>
          <DarkModeToggle />
        </div>
      </div>
    </nav>
  );
};
