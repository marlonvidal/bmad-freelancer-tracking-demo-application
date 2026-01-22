import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { TimerProvider, useTimerContext } from '@/contexts/TimerContext';
import { TimerStateRepository } from '@/services/data/repositories/TimerStateRepository';
import { TimeEntryRepository } from '@/services/data/repositories/TimeEntryRepository';
import { db } from '@/services/data/database';
import { TimerState } from '@/types/timerState';
import { Task } from '@/types/task';
import { Column } from '@/types/column';

// Test component that uses the context
const TestComponent: React.FC<{ onContextValue?: (value: any) => void }> = ({ onContextValue }) => {
  const context = useTimerContext();
  
  React.useEffect(() => {
    if (onContextValue) {
      onContextValue(context);
    }
  }, [context, onContextValue]);

  return (
    <div>
      {context.loading && <div data-testid="loading">Loading...</div>}
      {context.error && <div data-testid="error">{context.error.message}</div>}
      <div data-testid="active-task-id">{context.activeTaskId || 'none'}</div>
      <div data-testid="status">{context.status}</div>
      <div data-testid="elapsed-time">{context.elapsedTime}</div>
      <div data-testid="is-active-task1">{context.isActive('task1') ? 'true' : 'false'}</div>
      <div data-testid="is-active-task2">{context.isActive('task2') ? 'true' : 'false'}</div>
    </div>
  );
};

// Helper function to create a test column
const createTestColumn = async (columnId: string = 'column1', name: string = 'Test Column'): Promise<Column> => {
  const now = new Date();
  const column: Column = {
    id: columnId,
    name,
    position: 0,
    color: null,
    createdAt: now,
    updatedAt: now
  };
  await db.columns.add(column);
  return column;
};

// Helper function to create a test task
const createTestTask = async (taskId: string, overrides: Partial<Task> = {}): Promise<Task> => {
  // Ensure column exists
  const existingColumn = await db.columns.get('column1');
  if (!existingColumn) {
    await createTestColumn('column1');
  }
  
  const now = new Date();
  const task: Task = {
    id: taskId,
    title: `Test Task ${taskId}`,
    description: undefined,
    columnId: 'column1',
    position: 0,
    clientId: null,
    projectId: null,
    isBillable: false,
    hourlyRate: null,
    timeEstimate: null,
    dueDate: null,
    priority: null,
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
  await db.tasks.add(task);
  return task;
};

describe('TimerContext', () => {
  beforeEach(async () => {
    await db.timerState.clear();
    await db.timeEntries.clear();
    await db.tasks.clear();
    await db.columns.clear();
  });

  describe('TimerProvider', () => {
    it('loads timer state from IndexedDB on mount', async () => {
      // Create a task for the timer
      await createTestTask('task1');
      
      // Create an active timer state in IndexedDB
      const timerState: TimerState = {
        taskId: 'task1',
        startTime: new Date(Date.now() - 5000), // 5 seconds ago
        lastUpdateTime: new Date(),
        status: 'active'
      };
      await db.timerState.add(timerState);

      render(
        <TimerProvider>
          <TestComponent />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('active-task-id')).toHaveTextContent('task1');
      expect(screen.getByTestId('status')).toHaveTextContent('active');
    });

    it('initializes with idle state when no active timer exists', async () => {
      render(
        <TimerProvider>
          <TestComponent />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('active-task-id')).toHaveTextContent('none');
      expect(screen.getByTestId('status')).toHaveTextContent('idle');
      expect(screen.getByTestId('elapsed-time')).toHaveTextContent('0');
    });

    it('starts timer and updates state', async () => {
      // Create a task before starting timer
      await createTestTask('task1');
      
      let contextValue: any;
      const onContextValue = (value: any) => {
        contextValue = value;
      };

      render(
        <TimerProvider>
          <TestComponent onContextValue={onContextValue} />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      await act(async () => {
        await contextValue.startTimer('task1');
      });

      expect(screen.getByTestId('active-task-id')).toHaveTextContent('task1');
      expect(screen.getByTestId('status')).toHaveTextContent('active');
      expect(screen.getByTestId('is-active-task1')).toHaveTextContent('true');
      expect(screen.getByTestId('is-active-task2')).toHaveTextContent('false');

      // Verify timer state was saved to IndexedDB
      const savedState = await db.timerState.get('task1');
      expect(savedState).toBeDefined();
      expect(savedState?.status).toBe('active');
    });

    it('stops timer and creates time entry', async () => {
      // Create a task before creating timer state
      await createTestTask('task1');
      
      let contextValue: any;
      const onContextValue = (value: any) => {
        contextValue = value;
      };

      // Create an active timer
      const timerState: TimerState = {
        taskId: 'task1',
        startTime: new Date(Date.now() - 60000), // 1 minute ago
        lastUpdateTime: new Date(),
        status: 'active'
      };
      await db.timerState.add(timerState);

      render(
        <TimerProvider>
          <TestComponent onContextValue={onContextValue} />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      await act(async () => {
        await contextValue.stopTimer();
      });

      expect(screen.getByTestId('active-task-id')).toHaveTextContent('none');
      expect(screen.getByTestId('status')).toHaveTextContent('idle');
      expect(screen.getByTestId('elapsed-time')).toHaveTextContent('0');

      // Verify timer state was deleted from IndexedDB
      const deletedState = await db.timerState.get('task1');
      expect(deletedState).toBeUndefined();

      // Verify time entry was created
      const timeEntries = await db.timeEntries.where('taskId').equals('task1').toArray();
      expect(timeEntries.length).toBe(1);
      expect(timeEntries[0].duration).toBeGreaterThan(0);
      expect(timeEntries[0].isManual).toBe(false);
    });

    it('enforces single active timer rule', async () => {
      // Create tasks before starting timers
      await createTestTask('task1');
      await createTestTask('task2');
      
      let contextValue: any;
      const onContextValue = (value: any) => {
        contextValue = value;
      };

      render(
        <TimerProvider>
          <TestComponent onContextValue={onContextValue} />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Start timer for task1
      await act(async () => {
        await contextValue.startTimer('task1');
      });

      expect(screen.getByTestId('active-task-id')).toHaveTextContent('task1');

      // Wait for debounce to complete (100ms + small buffer)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      // Start timer for task2 (should stop task1 timer)
      await act(async () => {
        await contextValue.startTimer('task2');
      });

      // Wait for debounce and state update
      await waitFor(() => {
        expect(screen.getByTestId('active-task-id')).toHaveTextContent('task2');
      }, { timeout: 1000 });
      expect(screen.getByTestId('is-active-task1')).toHaveTextContent('false');
      expect(screen.getByTestId('is-active-task2')).toHaveTextContent('true');

      // Verify task1 timer state was deleted
      const task1State = await db.timerState.get('task1');
      expect(task1State).toBeUndefined();

      // Verify task2 timer state exists
      const task2State = await db.timerState.get('task2');
      expect(task2State).toBeDefined();
      expect(task2State?.status).toBe('active');
    });

    it('handles rapid start/stop operations', async () => {
      // Create tasks before starting timers
      await createTestTask('task1');
      await createTestTask('task2');
      
      let contextValue: any;
      const onContextValue = (value: any) => {
        contextValue = value;
      };

      render(
        <TimerProvider>
          <TestComponent onContextValue={onContextValue} />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Rapid start/stop
      await act(async () => {
        await contextValue.startTimer('task1');
      });

      // Wait for debounce
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      await act(async () => {
        await contextValue.stopTimer();
      });

      // Wait for debounce
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      await act(async () => {
        await contextValue.startTimer('task2');
      });

      // Wait for debounce and state update
      await waitFor(() => {
        expect(screen.getByTestId('active-task-id')).toHaveTextContent('task2');
        expect(screen.getByTestId('status')).toHaveTextContent('active');
      }, { timeout: 1000 });
    });

    it('returns null when stopping timer with no active timer', async () => {
      let contextValue: any;
      const onContextValue = (value: any) => {
        contextValue = value;
      };

      render(
        <TimerProvider>
          <TestComponent onContextValue={onContextValue} />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      const result = await act(async () => {
        return await contextValue.stopTimer();
      });

      expect(result).toBeNull();
      expect(screen.getByTestId('status')).toHaveTextContent('idle');
    });

    it('updates elapsed time every second when timer is active', async () => {
      // Create a task before starting timer
      await createTestTask('task1');
      
      jest.useFakeTimers();
      
      let contextValue: any;
      const onContextValue = (value: any) => {
        contextValue = value;
      };

      render(
        <TimerProvider>
          <TestComponent onContextValue={onContextValue} />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      await act(async () => {
        await contextValue.startTimer('task1');
      });

      expect(screen.getByTestId('elapsed-time')).toHaveTextContent('0');

      // Advance time by 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        const elapsedTime = parseInt(screen.getByTestId('elapsed-time').textContent || '0');
        expect(elapsedTime).toBeGreaterThanOrEqual(1);
      });

      jest.useRealTimers();
    });

    it('getElapsedTime returns elapsed time for active task', async () => {
      // Create a task before starting timer
      await createTestTask('task1');
      
      jest.useFakeTimers();
      
      let contextValue: any;
      const onContextValue = (value: any) => {
        contextValue = value;
      };

      render(
        <TimerProvider>
          <TestComponent onContextValue={onContextValue} />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      await act(async () => {
        await contextValue.startTimer('task1');
      });

      // Initially 0
      expect(contextValue.getElapsedTime('task1')).toBe(0);

      // Advance time by 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        const elapsedTime = contextValue.getElapsedTime('task1');
        expect(elapsedTime).toBeGreaterThanOrEqual(4); // At least 4 seconds (allowing for timing)
      });

      jest.useRealTimers();
    });

    it('getElapsedTime returns 0 for inactive task', async () => {
      // Create tasks before starting timer
      await createTestTask('task1');
      await createTestTask('task2');
      
      let contextValue: any;
      const onContextValue = (value: any) => {
        contextValue = value;
      };

      render(
        <TimerProvider>
          <TestComponent onContextValue={onContextValue} />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // No active timer
      expect(contextValue.getElapsedTime('task1')).toBe(0);
      expect(contextValue.getElapsedTime('task2')).toBe(0);

      // Start timer for task1
      await act(async () => {
        await contextValue.startTimer('task1');
      });

      // task1 should have elapsed time, task2 should be 0
      expect(contextValue.getElapsedTime('task1')).toBeGreaterThanOrEqual(0);
      expect(contextValue.getElapsedTime('task2')).toBe(0);
    });

    it('getElapsedTime returns 0 when timer stops', async () => {
      // Create a task before starting timer
      await createTestTask('task1');
      
      let contextValue: any;
      const onContextValue = (value: any) => {
        contextValue = value;
      };

      render(
        <TimerProvider>
          <TestComponent onContextValue={onContextValue} />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Start timer
      await act(async () => {
        await contextValue.startTimer('task1');
      });

      // Should have some elapsed time
      expect(contextValue.getElapsedTime('task1')).toBeGreaterThanOrEqual(0);

      // Stop timer
      await act(async () => {
        await contextValue.stopTimer();
      });

      // Should return 0 after stopping
      expect(contextValue.getElapsedTime('task1')).toBe(0);
    });
  });

  describe('useTimerContext hook', () => {
    it('throws error when used outside TimerProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTimerContext must be used within a TimerProvider');

      consoleSpy.mockRestore();
    });
  });
});
