import { Workbox } from 'workbox-window';

/**
 * Service Worker registration utility
 * Handles registration, updates, and error handling for the PWA Service Worker
 */

let wb: Workbox | null = null;
let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

/**
 * Registers the Service Worker for offline functionality
 * @returns Promise that resolves to ServiceWorkerRegistration or null if registration fails
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  // Return cached promise if registration is already in progress
  if (registrationPromise) {
    return registrationPromise;
  }

  // Check if Service Worker is supported
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker) {
    console.warn('Service Worker is not supported in this browser');
    return null;
  }

  // Check if we're in a secure context (HTTPS or localhost)
  if (!window.isSecureContext) {
    console.warn('Service Worker requires a secure context (HTTPS or localhost)');
    return null;
  }

  registrationPromise = (async () => {
    try {
      // Initialize Workbox
      wb = new Workbox('/sw.js', { type: 'module' });

      // Handle Service Worker updates
      wb.addEventListener('waiting', () => {
        console.log('New Service Worker is waiting to activate');
        // Update notification will be handled by UpdateNotification component
      });

      wb.addEventListener('controlling', () => {
        console.log('Service Worker is now controlling the page');
        window.location.reload();
      });

      // Register the Service Worker
      const registration = await wb.register();

      console.log('Service Worker registered successfully', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      // Return null instead of throwing to allow app to continue
      return null;
    }
  })();

  return registrationPromise;
}

/**
 * Unregisters the Service Worker (useful for testing or cleanup)
 * @returns Promise that resolves when unregistration is complete
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const success = await registration.unregister();
      console.log('Service Worker unregistered:', success);
      return success;
    }
    return false;
  } catch (error) {
    console.error('Failed to unregister Service Worker:', error);
    return false;
  }
}

/**
 * Gets the current Service Worker registration
 * @returns Promise that resolves to ServiceWorkerRegistration or null
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker) {
    return null;
  }

  try {
    return await navigator.serviceWorker.getRegistration();
  } catch (error) {
    console.error('Failed to get Service Worker registration:', error);
    return null;
  }
}

/**
 * Checks if a new Service Worker update is available
 * @returns Promise that resolves to true if update is available, false otherwise
 */
export async function checkForServiceWorkerUpdate(): Promise<boolean> {
  if (!wb) {
    return false;
  }

  try {
    await wb.update();
    return true;
  } catch (error) {
    console.error('Failed to check for Service Worker update:', error);
    return false;
  }
}

/**
 * Activates the waiting Service Worker (triggers page reload)
 * Should be called when user confirms they want to update
 */
export async function activateServiceWorkerUpdate(): Promise<void> {
  if (!wb) {
    return;
  }

  try {
    // Send skipWaiting message to Service Worker
    wb.messageSkipWaiting();
  } catch (error) {
    console.error('Failed to activate Service Worker update:', error);
  }
}
