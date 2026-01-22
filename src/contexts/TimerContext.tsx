import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { TimerState } from '@/types/timerState';
import { TimeEntry } from '@/types/timeEntry';
import { TimerStateRepository } from '@/services/data/repositories/TimerStateRepository';
import { TimeEntryRepository } from '@/services/data/repositories/TimeEntryRepository';

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

  const timerStateRepository = useMemo(() => new TimerStateRepository(), []);
  const timeEntryRepository = useMemo(() => new TimeEntryRepository(), []);

  // Interval reference for elapsed time updates
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  /**
   * Load timer state from IndexedDB
   */
  const loadTimerState = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const timerState = await timerStateRepository.getActive();
      
      if (timerState && timerState.status === 'active') {
        const startTime = new Date(timerState.startTime);
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        
        setState({
          activeTaskId: timerState.taskId,
          startTime,
          elapsedTime: elapsedSeconds,
          status: 'active',
          loading: false,
          error: null
        });
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
    }
  }, [timerStateRepository]);

  /**
   * Initialize timer state on mount
   */
  useEffect(() => {
    loadTimerState();
  }, [loadTimerState]);

  /**
   * Update elapsed time every second when timer is active
   */
  useEffect(() => {
    if (state.status === 'active' && state.startTime) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const elapsedSeconds = Math.floor((now.getTime() - state.startTime!.getTime()) / 1000);
        setState(prev => ({ ...prev, elapsedTime: elapsedSeconds }));
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
      }
    };
  }, [state.status, state.startTime]);

  /**
   * Stop the active timer and create a time entry
   */
  const stopTimer = useCallback(async (): Promise<TimeEntry | null> => {
    try {
      if (!state.activeTaskId || !state.startTime || state.status !== 'active') {
        return null;
      }

      const endTime = new Date();
      const durationMinutes = Math.floor((endTime.getTime() - state.startTime.getTime()) / (1000 * 60));

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
      throw errorObj;
    }
  }, [state.activeTaskId, state.startTime, state.status, timeEntryRepository, timerStateRepository]);

  /**
   * Start timer for a task
   * Enforces single active timer rule: stops previous timer if active
   */
  const startTimer = useCallback(async (taskId: string): Promise<void> => {
    try {
      // Stop any existing active timer first (enforce single active timer rule)
      if (state.activeTaskId && state.status === 'active') {
        await stopTimer();
      }

      const now = new Date();
      const timerState: TimerState = {
        taskId,
        startTime: now,
        lastUpdateTime: now,
        status: 'active'
      };

      // Save to IndexedDB
      await timerStateRepository.save(timerState);

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
      throw errorObj;
    }
  }, [state.activeTaskId, state.status, timerStateRepository, stopTimer]);

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

  const value: TimerContextValue = {
    ...state,
    startTimer,
    stopTimer,
    getElapsedTime,
    isActive
  };

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
