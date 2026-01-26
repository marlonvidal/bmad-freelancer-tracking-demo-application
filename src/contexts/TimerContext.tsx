import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode, useRef } from 'react';
import { TimerState } from '@/types/timerState';
import { TimeEntry } from '@/types/timeEntry';
import { TimerStateRepository } from '@/services/data/repositories/TimerStateRepository';
import { TimeEntryRepository } from '@/services/data/repositories/TimeEntryRepository';
import { TimerService } from '@/services/TimerService';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { updateTabTitle, restoreTabTitle, initTabTitle } from '@/utils/tabTitle';
import { TaskRepository } from '@/services/data/repositories/TaskRepository';

interface TimerContextState {
  activeTaskId: string | null;
  startTime: Date | null;
  elapsedTime: number; // in seconds
  status: 'idle' | 'active' | 'paused';
  loading: boolean;
  error: Error | null;
}

interface TimerContextValue extends TimerContextState {
  startTimer: (taskId: string) => Promise<void>;
  stopTimer: () => Promise<TimeEntry | null>;
  getElapsedTime: (taskId: string) => number;
  isActive: (taskId: string) => boolean;
  backgroundTimerNotification: string | null;
  clearBackgroundTimerNotification: () => void;
  refreshTimerState: () => Promise<void>;
}

const TimerContext = createContext<TimerContextValue | undefined>(undefined);

interface TimerProviderProps {
  children: ReactNode;
}

/**
 * TimerProvider - Provides timer state and operations to child components
 * 
 * Manages timer state using React Context API. Loads timer state from IndexedDB on mount
 * and persists changes automatically. Enforces single active timer rule.
 */
export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  const [state, setState] = useState<TimerContextState>({
    activeTaskId: null,
    startTime: null,
    elapsedTime: 0,
    status: 'idle',
    loading: true,
    error: null
  });

  const [backgroundTimerNotification, setBackgroundTimerNotification] = useState<string | null>(null);

  const timerStateRepository = useMemo(() => new TimerStateRepository(), []);
  const timeEntryRepository = useMemo(() => new TimeEntryRepository(), []);
  const timerService = useMemo(() => new TimerService(), []);
  const taskRepository = useMemo(() => new TaskRepository(), []);
  
  const { isVisible } = usePageVisibility();
  
  // Refs for cleanup and state tracking
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const periodicSaveRef = useRef<NodeJS.Timeout | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const wasVisibleRef = useRef<boolean>(true);
  const recoveryCheckedRef = useRef<boolean>(false);
  
  // Refs for debouncing rapid operations
  const isStartingRef = useRef<boolean>(false);
  const isStoppingRef = useRef<boolean>(false);
  const pendingStartRef = useRef<string | null>(null);

  // Initialize tab title utility
  useEffect(() => {
    initTabTitle();
    return () => {
      restoreTabTitle();
    };
  }, []);

  /**
   * Load timer state from IndexedDB with recovery logic
   * Includes validation for corrupted state
   */
  const loadTimerState = useCallback(async (showRecoveryNotification = false) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const timerState = await timerStateRepository.getActive();
      
      if (timerState && timerState.status === 'active') {
        // Validate timer state
        if (!timerState.taskId || !timerState.startTime) {
          console.error('Invalid timer state: missing taskId or startTime');
          await timerStateRepository.delete(timerState.taskId || '');
          setState({
            activeTaskId: null,
            startTime: null,
            elapsedTime: 0,
            status: 'idle',
            loading: false,
            error: null
          });
          return;
        }

        const startTime = new Date(timerState.startTime);
        
        // Validate startTime is a valid date
        if (isNaN(startTime.getTime())) {
          console.error('Invalid timer state: invalid startTime');
          await timerStateRepository.delete(timerState.taskId);
          setState({
            activeTaskId: null,
            startTime: null,
            elapsedTime: 0,
            status: 'idle',
            loading: false,
            error: null
          });
          return;
        }

        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        
        // Validate elapsed time is not negative (shouldn't happen, but handle gracefully)
        if (elapsedSeconds < 0) {
          console.warn('Negative elapsed time detected, clearing timer state');
          await timerStateRepository.delete(timerState.taskId);
          setState({
            activeTaskId: null,
            startTime: null,
            elapsedTime: 0,
            status: 'idle',
            loading: false,
            error: null
          });
          return;
        }
        
        // Check if timer state is very old (more than 24 hours) - might be stale
        const hoursElapsed = elapsedSeconds / 3600;
        if (hoursElapsed > 24) {
          console.warn('Timer state is very old, clearing it');
          await timerStateRepository.delete(timerState.taskId);
          setState({
            activeTaskId: null,
            startTime: null,
            elapsedTime: 0,
            status: 'idle',
            loading: false,
            error: null
          });
          return;
        }

        // Validate task still exists
        try {
          const task = await taskRepository.getById(timerState.taskId);
          if (!task) {
            console.warn('Task for timer no longer exists, clearing timer state');
            await timerStateRepository.delete(timerState.taskId);
            setState({
              activeTaskId: null,
              startTime: null,
              elapsedTime: 0,
              status: 'idle',
              loading: false,
              error: null
            });
            return;
          }
        } catch (taskError) {
          console.error('Error validating task:', taskError);
          // Continue anyway - task validation failure shouldn't prevent timer recovery
        }
        
        setState({
          activeTaskId: timerState.taskId,
          startTime,
          elapsedTime: elapsedSeconds,
          status: 'active',
          loading: false,
          error: null
        });

        // Show recovery notification if requested
        if (showRecoveryNotification) {
          const minutes = Math.floor(elapsedSeconds / 60);
          setBackgroundTimerNotification(
            `Timer was running in background for ${minutes} minute${minutes !== 1 ? 's' : ''}`
          );
        }
      } else {
        setState({
          activeTaskId: null,
          startTime: null,
          elapsedTime: 0,
          status: 'idle',
          loading: false,
          error: null
        });
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to load timer state');
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorObj 
      }));
      console.error('Error loading timer state:', error);
      // Don't throw - allow app to continue even if timer state load fails
    }
  }, [timerStateRepository, taskRepository]);

  /**
   * Initialize timer state on mount with recovery
   */
  useEffect(() => {
    if (!recoveryCheckedRef.current) {
      recoveryCheckedRef.current = true;
      loadTimerState(true); // Show recovery notification
    }
  }, [loadTimerState]);

  /**
   * Set up BroadcastChannel for cross-tab synchronization
   */
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      return; // Not supported
    }

    const channel = new BroadcastChannel('timer-sync');
    broadcastChannelRef.current = channel;

    channel.onmessage = (event) => {
      const { type } = event.data;
      
      if (type === 'TIMER_STARTED') {
        // Another tab started a timer - reload state
        loadTimerState(false);
      } else if (type === 'TIMER_STOPPED') {
        // Another tab stopped a timer - reload state
        loadTimerState(false);
      }
    };

    return () => {
      channel.close();
    };
  }, [loadTimerState]);

  /**
   * Handle tab visibility changes - sync with Service Worker
   */
  useEffect(() => {
    if (!wasVisibleRef.current && isVisible && state.status === 'active') {
      // Tab became active - sync with Service Worker
      const syncWithServiceWorker = async () => {
        try {
          const swState = await timerService.requestTimerStateFromServiceWorker();
          if (swState) {
            const startTime = new Date(swState.startTime);
            const now = new Date();
            const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            
            setState(prev => ({
              ...prev,
              startTime,
              elapsedTime: elapsedSeconds,
            }));

            // Show notification
            const minutes = Math.floor(elapsedSeconds / 60);
            setBackgroundTimerNotification(
              `Timer was running in background for ${minutes} minute${minutes !== 1 ? 's' : ''}`
            );
          }
        } catch (error) {
          console.error('Error syncing with Service Worker:', error);
          // Fallback to IndexedDB
          loadTimerState(false);
        }
      };
      
      syncWithServiceWorker();
    }
    
    wasVisibleRef.current = isVisible;
  }, [isVisible, state.status, timerService, loadTimerState]);

  /**
   * Periodic timer state save (every 30 seconds)
   * Uses refs to access current state without causing re-renders
   */
  useEffect(() => {
    if (state.status === 'active' && state.activeTaskId && state.startTime) {
      // Store current values in refs for interval access
      const currentTaskId = state.activeTaskId;
      const currentStartTime = state.startTime;
      
      periodicSaveRef.current = setInterval(async () => {
        try {
          // Use refs to check current state without re-render
          // Note: This is a best-effort save - state may have changed
          const timerState: TimerState = {
            taskId: currentTaskId,
            startTime: currentStartTime,
            lastUpdateTime: new Date(),
            status: 'active',
          };
          // Fire and forget - don't await to avoid blocking
          timerStateRepository.save(timerState).catch(err => {
            console.error('Error saving timer state periodically:', err);
            // Don't interrupt timer if save fails
          });
        } catch (error) {
          console.error('Error in periodic save interval:', error);
          // Don't interrupt timer if save fails
        }
      }, 30000); // 30 seconds
    } else {
      if (periodicSaveRef.current) {
        clearInterval(periodicSaveRef.current);
        periodicSaveRef.current = null;
      }
    }

    return () => {
      if (periodicSaveRef.current) {
        clearInterval(periodicSaveRef.current);
        periodicSaveRef.current = null;
      }
    };
  }, [state.status, state.activeTaskId, state.startTime, timerStateRepository]);

  /**
   * Beforeunload handler for graceful shutdown
   */
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (state.status === 'active' && state.activeTaskId && state.startTime) {
        try {
          // Save current timer state
          const timerState: TimerState = {
            taskId: state.activeTaskId,
            startTime: state.startTime,
            lastUpdateTime: new Date(),
            status: 'active',
          };
          await timerStateRepository.save(timerState);
        } catch (error) {
          console.error('Error saving timer state on beforeunload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state.status, state.activeTaskId, state.startTime, timerStateRepository]);

  /**
   * Update elapsed time every second when timer is active (only when tab is visible)
   * Optimized to only update when value actually changes
   */
  useEffect(() => {
    if (state.status === 'active' && state.startTime && isVisible) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - state.startTime!.getTime()) / 1000);
        
        // Only update state if elapsed time actually changed (prevents unnecessary re-renders)
        setState(prev => {
          if (prev.elapsedTime !== elapsedSeconds) {
            return { ...prev, elapsedTime: elapsedSeconds };
          }
          return prev; // Return same reference if no change
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.status, state.startTime, isVisible]);

  /**
   * Update tab title and badge when timer state changes
   */
  useEffect(() => {
    if (state.status === 'active' && state.activeTaskId) {
      // Get task title for display
      taskRepository.getById(state.activeTaskId).then(task => {
        updateTabTitle(true, task?.title, state.elapsedTime);
      }).catch(() => {
        // Fallback to elapsed time only if task not found
        updateTabTitle(true, undefined, state.elapsedTime);
      });
    } else {
      updateTabTitle(false);
    }
  }, [state.status, state.activeTaskId, state.elapsedTime, taskRepository]);

  /**
   * Stop the active timer and create a time entry
   * Debounced to prevent rapid calls
   */
  const stopTimer = useCallback(async (): Promise<TimeEntry | null> => {
    // Debounce: prevent rapid stop calls
    if (isStoppingRef.current) {
      return null;
    }

    try {
      isStoppingRef.current = true;

      if (!state.activeTaskId || !state.startTime || state.status !== 'active') {
        isStoppingRef.current = false;
        return null;
      }

      // Validate timer state
      if (!state.startTime || isNaN(state.startTime.getTime())) {
        console.error('Invalid startTime in timer state');
        setState(prev => ({
          ...prev,
          error: new Error('Invalid timer state'),
          status: 'idle',
          activeTaskId: null,
          startTime: null,
          elapsedTime: 0
        }));
        isStoppingRef.current = false;
        return null;
      }

      const endTime = new Date();
      const durationMinutes = Math.floor((endTime.getTime() - state.startTime.getTime()) / (1000 * 60));

      // Validate duration (should be positive)
      if (durationMinutes < 0) {
        console.warn('Negative duration detected, resetting timer');
        await timerStateRepository.delete(state.activeTaskId);
        setState({
          activeTaskId: null,
          startTime: null,
          elapsedTime: 0,
          status: 'idle',
          loading: false,
          error: null
        });
        isStoppingRef.current = false;
        return null;
      }

      // Create time entry
      const timeEntry = await timeEntryRepository.create({
        taskId: state.activeTaskId,
        startTime: state.startTime,
        endTime,
        duration: durationMinutes,
        isManual: false
      });

      // Delete timer state from IndexedDB
      await timerStateRepository.delete(state.activeTaskId);

      // Notify Service Worker via TimerService
      await timerService.stopTimer();

      // Notify other tabs via BroadcastChannel
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'TIMER_STOPPED',
          taskId: state.activeTaskId,
        });
      }

      // Update state
      setState({
        activeTaskId: null,
        startTime: null,
        elapsedTime: 0,
        status: 'idle',
        loading: false,
        error: null
      });

      return timeEntry;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to stop timer');
      setState(prev => ({ ...prev, error: errorObj }));
      console.error('Error stopping timer:', error);
      // Reset debounce flag on error
      isStoppingRef.current = false;
      throw errorObj;
    } finally {
      // Reset debounce flag after a short delay to allow operation to complete
      setTimeout(() => {
        isStoppingRef.current = false;
      }, 100);
    }
  }, [state.activeTaskId, state.startTime, state.status, timeEntryRepository, timerStateRepository, timerService]);

  /**
   * Start timer for a task
   * Enforces single active timer rule: stops previous timer if active
   * Debounced to prevent rapid calls
   */
  const startTimer = useCallback(async (taskId: string): Promise<void> => {
    // Debounce: prevent rapid start calls
    if (isStartingRef.current) {
      // Queue the request if different task
      if (pendingStartRef.current !== taskId) {
        pendingStartRef.current = taskId;
      }
      return;
    }

    // Validate taskId
    if (!taskId || typeof taskId !== 'string') {
      const errorObj = new Error('Invalid task ID');
      setState(prev => ({ ...prev, error: errorObj }));
      throw errorObj;
    }

    try {
      isStartingRef.current = true;
      pendingStartRef.current = null;

      // Validate task exists before starting timer (Task 13: Add timer state validation)
      // Handle invalid timer state gracefully - validate but don't crash app
      try {
        const task = await taskRepository.getById(taskId);
        if (!task) {
          const errorObj = new Error(`Task with ID ${taskId} not found`);
          setState(prev => ({ ...prev, error: errorObj }));
          isStartingRef.current = false;
          throw errorObj;
        }
      } catch (error) {
        // If error is already our validation error, rethrow it
        if (error instanceof Error && error.message.includes('not found')) {
          throw error;
        }
        // For other errors (e.g., repository errors), handle gracefully
        const errorObj = error instanceof Error ? error : new Error('Failed to validate task');
        setState(prev => ({ ...prev, error: errorObj }));
        isStartingRef.current = false;
        throw errorObj;
      }

      // Stop any existing active timer first (enforce single active timer rule)
      if (state.activeTaskId && state.status === 'active' && state.activeTaskId !== taskId) {
        try {
          await stopTimer();
        } catch (error) {
          console.error('Error stopping previous timer:', error);
          // Continue with starting new timer even if stopping previous failed
        }
      }

      const now = new Date();
      
      // Validate date
      if (isNaN(now.getTime())) {
        throw new Error('Invalid date');
      }

      const timerState: TimerState = {
        taskId,
        startTime: now,
        lastUpdateTime: now,
        status: 'active'
      };

      // Save to IndexedDB
      await timerStateRepository.save(timerState);

      // Notify Service Worker via TimerService
      await timerService.startTimer(taskId);

      // Notify other tabs via BroadcastChannel
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'TIMER_STARTED',
          taskId,
        });
      }

      // Update state (optimistic update)
      setState({
        activeTaskId: taskId,
        startTime: now,
        elapsedTime: 0,
        status: 'active',
        loading: false,
        error: null
      });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to start timer');
      setState(prev => ({ ...prev, error: errorObj }));
      console.error('Error starting timer:', error);
      isStartingRef.current = false;
      throw errorObj;
    } finally {
      // Reset debounce flag after a short delay to allow operation to complete
      setTimeout(() => {
        isStartingRef.current = false;
        // Process pending start if any
        if (pendingStartRef.current) {
          const pendingTaskId = pendingStartRef.current;
          pendingStartRef.current = null;
          startTimer(pendingTaskId).catch(err => {
            console.error('Error processing pending start:', err);
          });
        }
      }, 100);
    }
  }, [state.activeTaskId, state.status, timerStateRepository, timerService, stopTimer, taskRepository]);

  /**
   * Get elapsed time for a specific task (in seconds)
   * Returns elapsed time if timer is active for the task, otherwise 0
   * @param taskId - Task ID to get elapsed time for
   * @returns Elapsed time in seconds, or 0 if timer is not active for this task
   */
  const getElapsedTime = useCallback((taskId: string): number => {
    if (state.activeTaskId === taskId && state.status === 'active') {
      return state.elapsedTime;
    }
    return 0;
  }, [state.activeTaskId, state.status, state.elapsedTime]);

  /**
   * Check if timer is active for a specific task
   */
  const isActive = useCallback((taskId: string): boolean => {
    return state.activeTaskId === taskId && state.status === 'active';
  }, [state.activeTaskId, state.status]);

  const clearBackgroundTimerNotification = useCallback(() => {
    setBackgroundTimerNotification(null);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value: TimerContextValue = useMemo(() => ({
    ...state,
    startTimer,
    stopTimer,
    getElapsedTime,
    isActive,
    backgroundTimerNotification,
    clearBackgroundTimerNotification,
    refreshTimerState: () => loadTimerState(false)
  }), [
    state,
    startTimer,
    stopTimer,
    getElapsedTime,
    isActive,
    backgroundTimerNotification,
    clearBackgroundTimerNotification,
    loadTimerState
  ]);

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

/**
 * Hook to use TimerContext
 * @throws Error if used outside TimerProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useTimerContext = (): TimerContextValue => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return context;
};
