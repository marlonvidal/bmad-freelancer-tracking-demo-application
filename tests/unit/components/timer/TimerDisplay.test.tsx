import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { TimerProvider } from '@/contexts/TimerContext';
import { TimeEntryRepository } from '@/services/data/repositories/TimeEntryRepository';
import { db } from '@/services/data/database';
import { TimeEntry } from '@/types/timeEntry';

describe('TimerDisplay', () => {
  beforeEach(async () => {
    await db.timeEntries.clear();
    await db.timerState.clear();
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('displays total time when timer is not active', async () => {
      // Create a time entry with 90 minutes
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

      render(
        <TimerProvider>
          <TimerDisplay taskId="task1" />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('1h 30m')).toBeInTheDocument();
      expect(screen.getByLabelText(/Total time spent/)).toBeInTheDocument();
    });

    it('displays elapsed time when timer is active', async () => {
      // Create an active timer state
      await db.timerState.add({
        taskId: 'task1',
        startTime: new Date(Date.now() - 120000), // 2 minutes ago
        lastUpdateTime: new Date(),
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

      // Should show elapsed time (approximately 2 minutes)
      const timeText = screen.getByRole('timer').textContent || '';
      expect(timeText).toMatch(/\d+m/); // Should match format like "2m"
      expect(screen.getByLabelText(/Elapsed time/)).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
      render(
        <TimerProvider>
          <TimerDisplay taskId="task1" />
        </TimerProvider>
      );

      expect(screen.getByText('...')).toBeInTheDocument();
    });

    it('displays error state when loading fails', async () => {
      // Mock repository to throw error
      const getTotalTimeSpy = jest.spyOn(TimeEntryRepository.prototype, 'getTotalTimeForTask');
      getTotalTimeSpy.mockRejectedValue(new Error('Failed to load'));

      render(
        <TimerProvider>
          <TimerDisplay taskId="task1" />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('--')).toBeInTheDocument();
      });

      getTotalTimeSpy.mockRestore();
    });

    it('displays 0m when no time entries exist', async () => {
      render(
        <TimerProvider>
          <TimerDisplay taskId="task1" />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('0m')).toBeInTheDocument();
    });
  });

  describe('display modes', () => {
    it('uses auto mode by default (shows elapsed when active, total when not)', async () => {
      // First, show total (not active)
      render(
        <TimerProvider>
          <TimerDisplay taskId="task1" />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('0m')).toBeInTheDocument();
    });

    it('uses elapsed mode when specified', async () => {
      // Create an active timer
      await db.timerState.add({
        taskId: 'task1',
        startTime: new Date(Date.now() - 180000), // 3 minutes ago
        lastUpdateTime: new Date(),
        status: 'active',
      });

      // Create time entry with 90 minutes total
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

      render(
        <TimerProvider>
          <TimerDisplay taskId="task1" displayMode="elapsed" />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Should show elapsed time (approximately 3m) not total (1h 30m)
      const timeText = screen.getByRole('timer').textContent || '';
      expect(timeText).toMatch(/\d+m/); // Should match format like "3m"
      expect(timeText).not.toContain('1h 30m');
    });

    it('uses total mode when specified', async () => {
      // Create an active timer
      await db.timerState.add({
        taskId: 'task1',
        startTime: new Date(Date.now() - 180000), // 3 minutes ago
        lastUpdateTime: new Date(),
        status: 'active',
      });

      // Create time entry with 90 minutes total
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

      render(
        <TimerProvider>
          <TimerDisplay taskId="task1" displayMode="total" />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('...')).not.toBeInTheDocument();
      });

      // Should show total (1h 30m) not elapsed
      expect(screen.getByText('1h 30m')).toBeInTheDocument();
    });
  });

  describe('time formatting', () => {
    it('formats time correctly for various durations', async () => {
      const testCases = [
        { duration: 0, expected: '0m' },
        { duration: 30, expected: '30m' },
        { duration: 60, expected: '1h' },
        { duration: 90, expected: '1h 30m' },
        { duration: 120, expected: '2h' },
        { duration: 150, expected: '2h 30m' },
      ];

      for (const testCase of testCases) {
        await db.timeEntries.clear();
        const timeEntry: TimeEntry = {
          id: `entry-${testCase.duration}`,
          taskId: 'task1',
          startTime: new Date(),
          endTime: new Date(),
          duration: testCase.duration,
          isManual: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await db.timeEntries.add(timeEntry);

        const { unmount } = render(
          <TimerProvider>
            <TimerDisplay taskId="task1" />
          </TimerProvider>
        );

        await waitFor(() => {
          expect(screen.getByText(testCase.expected)).toBeInTheDocument();
        });

        unmount();
      }
    });
  });

  describe('accessibility', () => {
    it('has correct ARIA label for elapsed time', async () => {
      // Create an active timer
      await db.timerState.add({
        taskId: 'task1',
        startTime: new Date(Date.now() - 60000), // 1 minute ago
        lastUpdateTime: new Date(),
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

      const timerElement = screen.getByRole('timer');
      const ariaLabel = timerElement.getAttribute('aria-label') || '';
      expect(ariaLabel).toMatch(/Elapsed time:/);
    });

    it('has correct ARIA label for total time', async () => {
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

      render(
        <TimerProvider>
          <TimerDisplay taskId="task1" />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('...')).not.toBeInTheDocument();
      });

      expect(screen.getByLabelText('Total time spent: 1h 30m')).toBeInTheDocument();
    });

    it('has role="timer" attribute', async () => {
      render(
        <TimerProvider>
          <TimerDisplay taskId="task1" />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('...')).not.toBeInTheDocument();
      });

      const timerElement = screen.getByRole('timer');
      expect(timerElement).toBeInTheDocument();
    });

    it('has aria-live="polite" when timer is active', async () => {
      // Create an active timer
      await db.timerState.add({
        taskId: 'task1',
        startTime: new Date(Date.now() - 60000), // 1 minute ago
        lastUpdateTime: new Date(),
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

      const timerElement = screen.getByRole('timer');
      expect(timerElement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('real-time updates', () => {
    it('updates total time when timer stops', async () => {
      // Start with an active timer
      await db.timerState.add({
        taskId: 'task1',
        startTime: new Date(Date.now() - 60000), // 1 minute ago
        lastUpdateTime: new Date(),
        status: 'active',
      });

      const { rerender } = render(
        <TimerProvider>
          <TimerDisplay taskId="task1" />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Stop the timer (remove from state, create time entry)
      await db.timerState.clear();
      const timeEntry: TimeEntry = {
        id: 'entry1',
        taskId: 'task1',
        startTime: new Date(Date.now() - 60000),
        endTime: new Date(),
        duration: 1,
        isManual: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.timeEntries.add(timeEntry);

      // Re-render to simulate component update
      rerender(
        <TimerProvider>
          <TimerDisplay taskId="task1" />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('1m')).toBeInTheDocument();
      });
    });
  });
});
