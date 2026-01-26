import { useEffect, useRef, useState, useCallback } from 'react';

interface UseDebouncedAutoSaveOptions<T> {
  delay?: number;
  onSave: (value: T) => Promise<void>;
  onError?: (error: Error) => void;
}

interface SaveState {
  status: 'idle' | 'saving' | 'saved' | 'error';
  error: Error | null;
}

/**
 * useDebouncedAutoSave - Hook for debounced auto-save functionality
 * 
 * Automatically saves changes after a delay (default 500ms) of no input.
 * Provides save state feedback (saving/saved/error).
 * 
 * @param value - The value to save
 * @param options - Configuration options
 * @returns Save state and manual save function
 */
export function useDebouncedAutoSave<T>(
  value: T,
  options: UseDebouncedAutoSaveOptions<T>
): SaveState & { saveNow: () => Promise<void> } {
  const { delay = 500, onSave, onError } = options;
  const [saveState, setSaveState] = useState<SaveState>({
    status: 'idle',
    error: null
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousValueRef = useRef<T>(value);
  const isInitialMountRef = useRef(true);

  /**
   * Save the current value
   */
  const saveNow = useCallback(async () => {
    if (previousValueRef.current === value) {
      return; // No change
    }

    try {
      setSaveState({ status: 'saving', error: null });
      await onSave(value);
      previousValueRef.current = value;
      setSaveState({ status: 'saved', error: null });

      // Reset to idle after showing "saved" for 2 seconds
      setTimeout(() => {
        setSaveState(prev => prev.status === 'saved' ? { status: 'idle', error: null } : prev);
      }, 2000);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to save');
      setSaveState({ status: 'error', error: errorObj });
      if (onError) {
        onError(errorObj);
      }
    }
  }, [value, onSave, onError]);

  /**
   * Debounced save effect
   */
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousValueRef.current = value;
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't save if value hasn't changed
    if (previousValueRef.current === value) {
      return;
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      saveNow();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, saveNow]);

  return {
    ...saveState,
    saveNow
  };
}
