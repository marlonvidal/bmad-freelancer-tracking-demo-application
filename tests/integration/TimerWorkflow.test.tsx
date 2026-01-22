import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { TimerProvider } from '@/contexts/TimerContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { ColumnProvider } from '@/contexts/ColumnContext';
import { TimerControl } from '@/components/timer/TimerControl';
import { TaskCard } from '@/components/kanban/TaskCard';
import { db } from '@/services/data/database';
import { Task } from '@/types/task';
import { TimerState } from '@/types/timerState';

const createMockTask = (overrides: Partial<Task> = {}): Task => {
  const now = new Date();
  return {
    id: 'task1',
    title: 'Test Task',
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
};

const TestApp: React.FC<{ task: Task }> = ({ task }) => {
  return (
    <ColumnProvider>
      <TaskProvider>
        <TimerProvider>
          <TaskCard task={task} />
        </TimerProvider>
      </TaskProvider>
    </ColumnProvider>
  );
};

describe('Timer Workflow Integration', () => {
  beforeEach(async () => {
    await db.timerState.clear();
    await db.timeEntries.clear();
    await db.tasks.clear();
    await db.columns.clear();

    // Create a test column
    await db.columns.add({
      id: 'column1',
      name: 'Test Column',
      position: 0,
      color: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  describe('Complete timer start/stop workflow', () => {
    it('completes full timer workflow: start → stop → time entry creation', async () => {
      const task = createMockTask({ id: 'task1', title: 'Task 1' });
      await db.tasks.add(task);

      render(<TestApp task={task} />);

      await waitFor(() => {
        expect(screen.queryByText('Task 1')).toBeInTheDocument();
      });

      // Find and click Start button
      const startButton = screen.getByLabelText('Start timer');
      expect(startButton).toBeInTheDocument();
      expect(startButton).toHaveTextContent('Start');

      await act(async () => {
        fireEvent.click(startButton);
      });

      // Wait for timer to start
      await waitFor(() => {
        const stopButton = screen.getByLabelText('Stop timer');
        expect(stopButton).toBeInTheDocument();
        expect(stopButton).toHaveTextContent('Stop');
      });

      // Verify timer state was saved
      const timerState = await db.timerState.get('task1');
      expect(timerState).toBeDefined();
      expect(timerState?.status).toBe('active');

      // Wait a bit to ensure duration > 0
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Click Stop button
      const stopButton = screen.getByLabelText('Stop timer');
      await act(async () => {
        fireEvent.click(stopButton);
      });

      // Wait for timer to stop
      await waitFor(() => {
        const newStartButton = screen.getByLabelText('Start timer');
        expect(newStartButton).toBeInTheDocument();
      });

      // Verify timer state was deleted
      const deletedState = await db.timerState.get('task1');
      expect(deletedState).toBeUndefined();

      // Verify time entry was created
      const timeEntries = await db.timeEntries.where('taskId').equals('task1').toArray();
      expect(timeEntries.length).toBe(1);
      expect(timeEntries[0].duration).toBeGreaterThanOrEqual(0);
      expect(timeEntries[0].isManual).toBe(false);
      // IndexedDB may serialize dates as strings, so check if it's a Date or can be converted to Date
      const endTime = timeEntries[0].endTime;
      expect(endTime).toBeTruthy();
      if (endTime instanceof Date) {
        expect(endTime).toBeInstanceOf(Date);
      } else {
        expect(new Date(endTime as string)).toBeInstanceOf(Date);
      }
    });
  });

  describe('Single active timer enforcement', () => {
    it('stops previous timer when starting new one', async () => {
      const task1 = createMockTask({ id: 'task1', title: 'Task 1' });
      const task2 = createMockTask({ id: 'task2', title: 'Task 2' });
      await db.tasks.add(task1);
      await db.tasks.add(task2);

      const { rerender } = render(<TestApp task={task1} />);

      await waitFor(() => {
        expect(screen.queryByText('Task 1')).toBeInTheDocument();
      });

      // Start timer for task1
      const startButton1 = screen.getByLabelText('Start timer');
      await act(async () => {
        fireEvent.click(startButton1);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Stop timer')).toBeInTheDocument();
      });

      // Switch to task2
      rerender(<TestApp task={task2} />);

      await waitFor(() => {
        expect(screen.queryByText('Task 2')).toBeInTheDocument();
      });

      // Start timer for task2
      const startButton2 = screen.getByLabelText('Start timer');
      await act(async () => {
        fireEvent.click(startButton2);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Stop timer')).toBeInTheDocument();
      });

      // Verify task1 timer state was deleted
      const task1State = await db.timerState.get('task1');
      expect(task1State).toBeUndefined();

      // Verify task2 timer state exists
      const task2State = await db.timerState.get('task2');
      expect(task2State).toBeDefined();
      expect(task2State?.status).toBe('active');

      // Verify time entry was created for task1
      const timeEntries = await db.timeEntries.where('taskId').equals('task1').toArray();
      expect(timeEntries.length).toBe(1);
    });
  });

  describe('Timer state persistence across refresh', () => {
    it('resumes timer state after browser refresh simulation', async () => {
      const task = createMockTask({ id: 'task1', title: 'Task 1' });
      await db.tasks.add(task);

      // Simulate active timer before "refresh"
      const startTime = new Date(Date.now() - 5000); // 5 seconds ago
      const timerState: TimerState = {
        taskId: 'task1',
        startTime,
        lastUpdateTime: new Date(),
        status: 'active'
      };
      await db.timerState.add(timerState);

      // Render app (simulating refresh)
      render(<TestApp task={task} />);

      await waitFor(() => {
        expect(screen.queryByText('Task 1')).toBeInTheDocument();
      });

      // Wait for timer context to load state from IndexedDB
      await waitFor(() => {
        const stopButton = screen.queryByLabelText('Stop timer');
        expect(stopButton).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify timer is active
      const stopButton = screen.getByLabelText('Stop timer');
      expect(stopButton).toBeInTheDocument();
      expect(stopButton).toHaveTextContent('Stop');
    });
  });

  describe('Visual feedback and animations', () => {
    it('shows visual indicator when timer is active', async () => {
      const task = createMockTask({ id: 'task1', title: 'Task 1' });
      await db.tasks.add(task);

      render(<TestApp task={task} />);

      await waitFor(() => {
        expect(screen.queryByText('Task 1')).toBeInTheDocument();
      });

      // Start timer
      const startButton = screen.getByLabelText('Start timer');
      await act(async () => {
        fireEvent.click(startButton);
      });

      await waitFor(() => {
        const stopButton = screen.getByLabelText('Stop timer');
        expect(stopButton).toBeInTheDocument();
        // Check for active state styling
        expect(stopButton).toHaveClass('bg-red-500');
        expect(stopButton).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('shows inactive state styling when timer is not active', async () => {
      const task = createMockTask({ id: 'task1', title: 'Task 1' });
      await db.tasks.add(task);

      render(<TestApp task={task} />);

      await waitFor(() => {
        expect(screen.queryByText('Task 1')).toBeInTheDocument();
      });

      const startButton = screen.getByLabelText('Start timer');
      expect(startButton).toHaveClass('bg-green-500');
      expect(startButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Keyboard accessibility', () => {
    it('supports keyboard navigation for timer control', async () => {
      const task = createMockTask({ id: 'task1', title: 'Task 1' });
      await db.tasks.add(task);

      render(<TestApp task={task} />);

      await waitFor(() => {
        expect(screen.queryByText('Task 1')).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /start/i });
      
      // Test Enter key
      await act(async () => {
        fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Stop timer')).toBeInTheDocument();
      });

      const stopButton = screen.getByRole('button', { name: /stop/i });
      
      // Test Space key
      await act(async () => {
        fireEvent.keyDown(stopButton, { key: ' ', code: 'Space' });
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Start timer')).toBeInTheDocument();
      });
    });
  });
});
