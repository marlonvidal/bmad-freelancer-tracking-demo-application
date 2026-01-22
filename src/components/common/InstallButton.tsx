import React from 'react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

/**
 * InstallButton component
 * Displays an install button for PWA installation
 * Only shows when the app is installable and not already installed
 * 
 * @example
 * ```tsx
 * <InstallButton />
 * ```
 */
export const InstallButton: React.FC = () => {
  const { showInstallPrompt, isInstallable, isInstalled } = useInstallPrompt();

  // Don't render if not installable or already installed
  if (!isInstallable || isInstalled) {
    return null;
  }

  return (
    <button
      onClick={showInstallPrompt}
      aria-label="Install application"
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
    >
      <div className="flex items-center gap-2">
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
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span>Install App</span>
      </div>
    </button>
  );
};
