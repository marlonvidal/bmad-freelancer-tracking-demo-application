import { useState, useEffect } from 'react';
import { Workbox } from 'workbox-window';

/**
 * Custom hook to detect Service Worker updates
 * Listens for Service Worker update events and provides methods to activate updates
 * 
 * @returns Object containing:
 * - updateAvailable: Boolean indicating if an update is available
 * - activateUpdate: Function to activate the update (reloads page)
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
export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [workbox, setWorkbox] = useState<Workbox | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Initialize Workbox if not already initialized
    let wb: Workbox | null = null;

    const initWorkbox = async () => {
      try {
        const { Workbox } = await import('workbox-window');
        wb = new Workbox('/sw.js', { type: 'module' });
        setWorkbox(wb);

        // Listen for waiting event (new Service Worker is waiting)
        wb.addEventListener('waiting', () => {
          setUpdateAvailable(true);
        });

        // Listen for controlling event (Service Worker took control)
        wb.addEventListener('controlling', () => {
          setUpdateAvailable(false);
          // Page will reload automatically
        });

        // Register the Service Worker
        await wb.register();

        // Check for updates periodically (on navigation)
        // Workbox automatically checks for updates on navigation
      } catch (error) {
        console.error('Failed to initialize Workbox:', error);
      }
    };

    initWorkbox();

    return () => {
      // Cleanup if needed
    };
  }, []);

  /**
   * Activate the waiting Service Worker update
   * This will trigger a page reload
   */
  const activateUpdate = async (): Promise<void> => {
    if (!workbox) {
      console.warn('Workbox is not initialized');
      return;
    }

    try {
      // Send skipWaiting message to Service Worker
      workbox.messageSkipWaiting();
      setUpdateAvailable(false);
      // Page will reload automatically when Service Worker takes control
    } catch (error) {
      console.error('Failed to activate Service Worker update:', error);
    }
  };

  const dismissUpdate = () => {
    setUpdateAvailable(false);
  };

  return {
    updateAvailable,
    activateUpdate,
    dismissUpdate,
  };
}
