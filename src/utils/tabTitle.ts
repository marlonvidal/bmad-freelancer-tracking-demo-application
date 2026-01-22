/**
 * Tab title and badge update utilities
 * 
 * Provides functions for updating browser tab title and badge when timer is active.
 */

const APP_NAME = 'Kanban Tracker';
let originalTitle = '';

/**
 * Initialize tab title utility
 * Should be called once on app mount to store original title
 */
export function initTabTitle(): void {
  if (typeof document !== 'undefined' && !originalTitle) {
    originalTitle = document.title || APP_NAME;
  }
}

/**
 * Update tab title and badge when timer is active
 * @param isActive - Whether timer is currently active
 * @param taskTitle - Optional task title to display
 * @param elapsedSeconds - Elapsed time in seconds (for badge)
 */
export function updateTabTitle(
  isActive: boolean,
  taskTitle?: string,
  elapsedSeconds?: number
): void {
  if (typeof document === 'undefined') {
    return; // SSR safety
  }

  initTabTitle();

  if (isActive) {
    // Format elapsed time for display
    let timeDisplay = '';
    if (elapsedSeconds !== undefined) {
      const minutes = Math.floor(elapsedSeconds / 60);
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (hours > 0) {
        timeDisplay = remainingMinutes > 0 
          ? `${hours}h ${remainingMinutes}m` 
          : `${hours}h`;
      } else {
        timeDisplay = `${minutes}m`;
      }
    }

    // Update title with timer indicator
    const displayText = taskTitle || timeDisplay || 'Timer';
    document.title = `⏱ ${displayText} - ${APP_NAME}`;
    
    // Update badge if supported
    if ('setAppBadge' in navigator && typeof navigator.setAppBadge === 'function') {
      const badgeCount = elapsedSeconds ? Math.floor(elapsedSeconds / 60) : 1;
      navigator.setAppBadge(badgeCount).catch((error) => {
        console.warn('Failed to set app badge:', error);
      });
    }
  } else {
    // Restore original title
    document.title = originalTitle || APP_NAME;
    
    // Clear badge if supported
    if ('clearAppBadge' in navigator && typeof navigator.clearAppBadge === 'function') {
      navigator.clearAppBadge().catch((error) => {
        console.warn('Failed to clear app badge:', error);
      });
    }
  }
}

/**
 * Restore original tab title
 * Should be called when timer stops or app unmounts
 */
export function restoreTabTitle(): void {
  if (typeof document !== 'undefined') {
    document.title = originalTitle || APP_NAME;
    
    if ('clearAppBadge' in navigator && typeof navigator.clearAppBadge === 'function') {
      navigator.clearAppBadge().catch((error) => {
        console.warn('Failed to clear app badge:', error);
      });
    }
  }
}
