import { useEffect } from 'react';

/**
 * useKeyboardShortcut - Hook for handling keyboard shortcuts
 * 
 * Registers a keyboard shortcut handler that triggers a callback when the shortcut is pressed.
 * Supports Ctrl (Windows/Linux) and Cmd (Mac) modifiers.
 * 
 * @param key - The key to listen for (e.g., 'f', 'n', 't')
 * @param callback - Callback function to execute when shortcut is pressed
 * @param options - Optional configuration
 */
export function useKeyboardShortcut(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options: {
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    preventDefault?: boolean;
  } = {}
): void {
  const {
    ctrlKey = true,
    metaKey = true,
    shiftKey = false,
    altKey = false,
    preventDefault = true
  } = options;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the pressed key matches
      if (event.key.toLowerCase() !== key.toLowerCase()) {
        return;
      }

      // Check modifiers
      const shiftPressed = event.shiftKey;
      const altPressed = event.altKey;

      // Match shortcut based on options
      const matchesCtrl = ctrlKey && (event.ctrlKey || event.metaKey);
      const matchesMeta = metaKey && event.metaKey;
      const matchesShift = shiftKey === shiftPressed;
      const matchesAlt = altKey === altPressed;

      // For Ctrl/Cmd shortcuts, accept either Ctrl or Cmd
      const matchesModifier = (ctrlKey || metaKey) ? (matchesCtrl || matchesMeta) : true;

      // All specified modifiers must match (if shiftKey/altKey are false, they must not be pressed)
      if (matchesModifier && matchesShift && matchesAlt) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, callback, ctrlKey, metaKey, shiftKey, altKey, preventDefault]);
}
