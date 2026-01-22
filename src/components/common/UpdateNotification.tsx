import React from 'react';

interface UpdateNotificationProps {
  /**
   * Whether a Service Worker update is available
   */
  updateAvailable: boolean;
  /**
   * Callback function to activate the update
   */
  onUpdate: () => void;
  /**
   * Callback function to dismiss the notification
   */
  onDismiss?: () => void;
}

/**
 * UpdateNotification component
 * Displays a notification when a Service Worker update is available
 * Allows user to update the application
 * 
 * @param props - Component props
 * @param props.updateAvailable - Whether an update is available
 * @param props.onUpdate - Callback to activate the update
 * 
 * @example
 * ```tsx
 * const { updateAvailable, activateUpdate } = useServiceWorkerUpdate();
 * 
 * return (
 *   <UpdateNotification 
 *     updateAvailable={updateAvailable}
 *     onUpdate={activateUpdate}
 *   />
 * );
 * ```
 */
export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  updateAvailable,
  onUpdate,
  onDismiss,
}) => {
  // Don't render if no update is available
  if (!updateAvailable) {
    return null;
  }

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div
      role="alert"
      aria-label="Update available"
      className="fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Update Available</h3>
          <p className="text-sm text-blue-100 mb-3">
            A new version of the application is available. Update now to get the latest features and improvements.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onUpdate}
              className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-colors font-medium"
              aria-label="Update application"
            >
              Update Now
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-colors"
              aria-label="Dismiss update notification"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-blue-200 hover:text-white focus:outline-none"
          aria-label="Close update notification"
        >
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
    </div>
  );
};
