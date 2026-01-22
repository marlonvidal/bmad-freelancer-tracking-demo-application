import { useState, useEffect } from 'react';

/**
 * Type for the beforeinstallprompt event
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Custom hook to handle PWA install prompt
 * Listens for beforeinstallprompt event and provides methods to show the prompt
 * 
 * @returns Object containing:
 * - installPrompt: The install prompt event (null if not available)
 * - showInstallPrompt: Function to show the install prompt
 * - isInstallable: Boolean indicating if the app is installable
 * - isInstalled: Boolean indicating if the app is already installed
 * 
 * @example
 * ```tsx
 * const { installPrompt, showInstallPrompt, isInstallable } = useInstallPrompt();
 * 
 * return (
 *   <button onClick={showInstallPrompt} disabled={!isInstallable}>
 *     Install App
 *   </button>
 * );
 * ```
 */
export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser install prompt
      e.preventDefault();
      // Store the event for later use
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * Show the install prompt
   * Should be called when user clicks install button
   */
  const showInstallPrompt = async (): Promise<void> => {
    if (!installPrompt) {
      console.warn('Install prompt is not available');
      return;
    }

    try {
      // Show the install prompt
      await installPrompt.prompt();

      // Wait for user's choice
      const choiceResult = await installPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }

      // Clear the prompt (it can only be used once)
      setInstallPrompt(null);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  return {
    installPrompt,
    showInstallPrompt,
    isInstallable: installPrompt !== null && !isInstalled,
    isInstalled,
  };
}
