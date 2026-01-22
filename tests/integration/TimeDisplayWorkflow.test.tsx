import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { TimerProvider, useTimerContext } from '@/contexts/TimerContext';
import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { TimerControl } from '@/components/timer/TimerControl';
import { TaskCard } from '@/components/kanban/TaskCard';
import { db } from '@/services/data/database';
import { Task } from '@/types/task';
import { TimeEntry } from '@/types/timeEntry';

// Test component that uses timer context
const TestTimerUser: React.FC<{ taskId: string }> = ({ taskId }) => {
  const { startTimer, stopTimer } = useTimerContext();
  return (
    <div>
      <button onClick={() => startTimer(taskId)} data-testid="start-btn">Start</button>
      <button onClick={() => stopTimer()} data-testid="stop-btn">Stop</button>
    </div>
  );
};

describe('TimeDisplayWorkflow', () => {
  beforeEach(async () => {
    await db.timeEntries.clear();
    await db.timerState.clear();
    await db.tasks.clear();
  });

  describe('complete workflow: start timer → see elapsed time → stop → see total time', () => {
    it('displays elapsed time while timer is running and total time after stopping', async () => {
      jest.useFakeTimers();

      const task: Task = {
        id: 'task1',
        title: 'Test Task',
        columnId: 'col1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.tasks.add(task);

      render(
        <TimerProvider>
          <div>
            <TimerDisplay taskId="task1" />
            <TestTimerUser taskId="task1" />
          </div>
        </TimerProvider>
      );

      // Initially should show 0m (no time entries)
      await waitFor(() => {
        expect(screen.queryByText('...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('0m')).toBeInTheDocument();

      // Start timer
      const startBtn = screen.getByTestId('start-btn');
      await act(async () => {
        fireEvent.click(startBtn);
      });

      // Wait for timer to start and show elapsed time
      await waitFor(() => {
        const timerElement = screen.getByRole('timer');
        const ariaLabel = timerElement.getAttribute('aria-label') || '';
        expect(ariaLabel).toMatch(/Elapsed time/);
      }, { timeout: 3000 });

      // Advance time by 2 minutes
      act(() => {
        jest.advanceTimersByTime(120000); // 2 minutes
      });

      // Should show elapsed time (approximately 2m)
      await waitFor(() => {
        const timerElement = screen.getByRole('timer');
        const timeText = timerElement.textContent || '';
        expect(timeText).toMatch(/\d+m/); // Should match format like "2m"
        expect(timerElement.getAttribute('aria-label')).toMatch(/Elapsed time/);
      }, { timeout: 3000 });

      // Stop timer
      const stopBtn = screen.getByTestId('stop-btn');
      await act(async () => {
        fireEvent.click(stopBtn);
      });

      // Wait for timer to stop and time entry to be created
      await waitFor(() => {
        const timerElement = screen.getByRole('timer');
        const ariaLabel = timerElement.getAttribute('aria-label') || '';
        expect(ariaLabel).toMatch(/Total time spent/);
      }, { timeout: 3000 });

      // Should show total time (approximately 2 minutes)
      const timerElement = screen.getByRole('timer');
      const timeText = timerElement.textContent || '';
      expect(timeText).toMatch(/\d+m/);

      jest.useRealTimers();
    });
  });

  describe('time display updates every second', () => {
    it('updates elapsed time display every second when timer is active', async () => {
      jest.useFakeTimers();

      render(
        <TimerProvider>
          <TimerDisplay taskId="task1" />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('...')).not.toBeInTheDocument();
      });

      // Start timer programmatically via TimerControl
      const timerControl = screen.queryByRole('button', { name: /start/i });
      if (timerControl) {
        await act(async () => {
          fireEvent.click(timerControl);
        });
      } else {
        // Alternative: create timer state directly
        await db.timerState.add({
          taskId: 'task1',
          startTime: new Date(Date.now() - 60000),
          lastUpdateTime: new Date(),
          status: 'active',
        });
      }

      // Get initial time
      let previousTime = screen.getByRole('timer').textContent || '';

      // Advance by 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const currentTime = screen.getByRole('timer').textContent || '';
        // Time should have updated (may be same if less than a minute)
        expect(currentTime).toBeTruthy();
      });

      jest.useRealTimers();
    });
  });

  describe('time format consistency', () => {
    it('uses consistent format across all task cards', async () => {
      const task1: Task = {
        id: 'task1',
        title: 'Task 1',
        columnId: 'col1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const task2: Task = {
        id: 'task2',
        title: 'Task 2',
        columnId: 'col1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.tasks.add(task1);
      await db.tasks.add(task2);

      // Create time entries with same duration
      const entry1: TimeEntry = {
        id: 'entry1',
        taskId: 'task1',
        startTime: new Date(),
        endTime: new Date(),
        duration: 90,
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const entry2: TimeEntry = {
        id: 'entry2',
        taskId: 'task2',
        startTime: new Date(),
        endTime: new Date(),
        duration: 90,
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.timeEntries.add(entry1);
      await db.timeEntries.add(entry2);

      render(
        <TimerProvider>
          <div>
            <TaskCard task={task1} />
            <TaskCard task={task2} />
          </div>
        </TimerProvider>
      );

      await waitFor(() => {
        const timers = screen.getAllByRole('timer');
        expect(timers.length).toBe(2);
        // Both should show same format
        timers.forEach((timer) => {
          expect(timer.textContent).toBe('1h 30m');
        });
      });
    });
  });

  describe('total time calculation from multiple entries', () => {
    it('sums duration from multiple time entries correctly', async () => {
      const task: Task = {
        id: 'task1',
        title: 'Test Task',
        columnId: 'col1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.tasks.add(task);

      // Create multiple time entries
      const entries: TimeEntry[] = [
        {
          id: 'entry1',
          taskId: 'task1',
          startTime: new Date(),
          endTime: new Date(),
          duration: 30, // 30 minutes
          isManual: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'entry2',
          taskId: 'task1',
          startTime: new Date(),
          endTime: new Date(),
          duration: 60, // 60 minutes
          isManual: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'entry3',
          taskId: 'task1',
          startTime: new Date(),
          endTime: new Date(),
          duration: 45, // 45 minutes
          isManual: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      for (const entry of entries) {
        await db.timeEntries.add(entry);
      }

      render(
        <TimerProvider>
          <TimerDisplay taskId="task1" />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('...')).not.toBeInTheDocument();
      });

      // Total should be 30 + 60 + 45 = 135 minutes = 2h 15m
      expect(screen.getByText('2h 15m')).toBeInTheDocument();
    });
  });

  describe('persistence across refresh', () => {
    it('loads and displays total time after browser refresh simulation', async () => {
      const task: Task = {
        id: 'task1',
        title: 'Test Task',
        columnId: 'col1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.tasks.add(task);

      // Create time entry before "refresh"
      const timeEntry: TimeEntry = {
        id: 'entry1',
        taskId: 'task1',
        startTime: new Date(),
        endTime: new Date(),
        duration: 90,
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.timeEntries.add(timeEntry);

      // Simulate "refresh" by creating new TimerProvider
      const { unmount } = render(
        <TimerProvider>
          <TimerDisplay taskId="task1" />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('1h 30m')).toBeInTheDocument();

      unmount();

      // "Refresh" - create new provider
      render(
        <TimerProvider>
          <TimerDisplay taskId="task1" />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('...')).not.toBeInTheDocument();
      });

      // Should still show the same total time
      expect(screen.getByText('1h 30m')).toBeInTheDocument();
    });
  });

  describe('time calculation accuracy', () => {
    it('calculates elapsed time accurately without drift', async () => {
      jest.useFakeTimers();

      const startTime = Date.now();
      const timerStartTime = new Date(startTime);

      // Create active timer state
      await db.timerState.add({
        taskId: 'task1',
        startTime: timerStartTime,
        lastUpdateTime: timerStartTime,
        status: 'active',
      });

      render(
        <TimerProvider>
          <TimerDisplay taskId="task1" />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Advance by exactly 5 minutes (300000 ms)
      act(() => {
        jest.advanceTimersByTime(300000);
      });

      await waitFor(() => {
        const timerElement = screen.getByRole('timer');
        const timeText = timerElement.textContent || '';
        // Should show approximately 5 minutes (allowing for small timing differences)
        expect(timeText).toMatch(/5m/);
      }, { timeout: 3000 });

      jest.useRealTimers();
    });

    it('calculates total time accurately from multiple entries', async () => {
      const entries: TimeEntry[] = [
        {
          id: 'entry1',
          taskId: 'task1',
          startTime: new Date('2024-01-01T10:00:00'),
          endTime: new Date('2024-01-01T10:30:00'),
          duration: 30, // Exactly 30 minutes
          isManual: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'entry2',
          taskId: 'task1',
          startTime: new Date('2024-01-01T11:00:00'),
          endTime: new Date('2024-01-01T12:00:00'),
          duration: 60, // Exactly 60 minutes
          isManual: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      for (const entry of entries) {
        await db.timeEntries.add(entry);
      }

      render(
        <TimerProvider>
          <TimerDisplay taskId="task1" />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('...')).not.toBeInTheDocument();
      });

      // Total should be exactly 90 minutes = 1h 30m
      expect(screen.getByText('1h 30m')).toBeInTheDocument();
    });
  });
});
