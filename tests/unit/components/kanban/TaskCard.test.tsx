import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskCard } from '@/components/kanban/TaskCard';
import { Task } from '@/types/task';
import { TaskProvider } from '@/contexts/TaskContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { TimerProvider } from '@/contexts/TimerContext';
import { TaskRepository } from '@/services/data/repositories/TaskRepository';
import { db } from '@/services/data/database';

const createMockTask = (overrides: Partial<Task> = {}): Task => {
  const now = new Date();
  return {
    id: 'task-1',
    title: 'Test Task',
    description: undefined,
    columnId: 'column-1',
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

const renderTaskCard = (task: Task, props: { onClick?: () => void } = {}) => {
  return render(
    <SettingsProvider>
      <TaskProvider>
        <TimerProvider>
          <TaskCard task={task} onClick={props.onClick} />
        </TimerProvider>
      </TaskProvider>
    </SettingsProvider>
  );
};

describe('TaskCard', () => {
  beforeEach(async () => {
    await db.tasks.clear();
    await db.timeEntries.clear();
    await db.timerState.clear();
  });

  describe('rendering', () => {
    it('renders task title', () => {
      const task = createMockTask({ title: 'My Task' });
      renderTaskCard(task);

      expect(screen.getByText('My Task')).toBeInTheDocument();
    });

    it('renders task with minimal data', () => {
      const task = createMockTask();
      renderTaskCard(task);

      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('has proper ARIA attributes', () => {
      const task = createMockTask();
      renderTaskCard(task);

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-labelledby', `task-${task.id}-title`);

      const title = screen.getByText('Test Task');
      expect(title).toHaveAttribute('id', `task-${task.id}-title`);
    });
  });

  describe('priority badge', () => {
    it('displays high priority badge', () => {
      const task = createMockTask({ priority: 'high' });
      renderTaskCard(task);

      const badge = screen.getByText('High');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-red-100');
    });

    it('displays medium priority badge', () => {
      const task = createMockTask({ priority: 'medium' });
      renderTaskCard(task);

      const badge = screen.getByText('Medium');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-orange-100');
    });

    it('displays low priority badge', () => {
      const task = createMockTask({ priority: 'low' });
      renderTaskCard(task);

      const badge = screen.getByText('Low');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-gray-100');
    });

    it('does not display priority badge when priority is null', () => {
      const task = createMockTask({ priority: null });
      renderTaskCard(task);

      expect(screen.queryByText('High')).not.toBeInTheDocument();
      expect(screen.queryByText('Medium')).not.toBeInTheDocument();
      expect(screen.queryByText('Low')).not.toBeInTheDocument();
    });

    it('has accessible priority badge label', () => {
      const task = createMockTask({ priority: 'high' });
      renderTaskCard(task);

      const badge = screen.getByLabelText('Priority: High');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('due date display', () => {
    it('displays "Today" for today\'s date', () => {
      const today = new Date();
      const task = createMockTask({ dueDate: today });
      renderTaskCard(task);

      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('displays "Tomorrow" for tomorrow\'s date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const task = createMockTask({ dueDate: tomorrow });
      renderTaskCard(task);

      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
    });

    it('displays "Yesterday" for yesterday\'s date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const task = createMockTask({ dueDate: yesterday });
      renderTaskCard(task);

      expect(screen.getByText('Yesterday')).toBeInTheDocument();
    });

    it('displays relative date for dates within 7 days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const task = createMockTask({ dueDate: futureDate });
      renderTaskCard(task);

      expect(screen.getByText(/In 3 days/i)).toBeInTheDocument();
    });

    it('displays formatted date for dates beyond 7 days', () => {
      const futureDate = new Date('2025-12-31');
      const task = createMockTask({ dueDate: futureDate });
      renderTaskCard(task);

      // Should display as "Dec 31" format
      const dateText = screen.getByText(/Dec 31/i);
      expect(dateText).toBeInTheDocument();
    });

    it('displays calendar icon with due date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const task = createMockTask({ dueDate: tomorrow });
      renderTaskCard(task);

      // Calendar icon should be present (SVG)
      const icon = screen.getByText('Tomorrow').previousSibling;
      expect(icon).toBeInTheDocument();
    });

    it('does not display due date when dueDate is null', () => {
      const task = createMockTask({ dueDate: null });
      renderTaskCard(task);

      expect(screen.queryByText(/Today|Tomorrow|Yesterday|days/i)).not.toBeInTheDocument();
    });

    it('has accessible due date label', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const task = createMockTask({ dueDate: tomorrow });
      renderTaskCard(task);

      const dateElement = screen.getByLabelText('Due date: Tomorrow');
      expect(dateElement).toBeInTheDocument();
    });
  });

  describe('click handling', () => {
    it('calls onClick when card is clicked', () => {
      const onClick = jest.fn();
      const task = createMockTask();
      renderTaskCard(task, { onClick });

      const card = screen.getByRole('article');
      fireEvent.click(card);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when onClick is not provided', () => {
      const task = createMockTask();
      renderTaskCard(task);

      const card = screen.getByRole('article');
      fireEvent.click(card);

      // Should not throw error
      expect(card).toBeInTheDocument();
    });

    it('handles keyboard Enter key', () => {
      const onClick = jest.fn();
      const task = createMockTask();
      renderTaskCard(task, { onClick });

      const card = screen.getByRole('article');
      fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard Space key', () => {
      const onClick = jest.fn();
      const task = createMockTask();
      renderTaskCard(task, { onClick });

      const card = screen.getByRole('article');
      fireEvent.keyDown(card, { key: ' ', code: 'Space' });

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('prevents default on Enter/Space key', () => {
      const onClick = jest.fn();
      const task = createMockTask();
      renderTaskCard(task, { onClick });

      const card = screen.getByRole('article');
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      const preventDefaultSpy = jest.spyOn(enterEvent, 'preventDefault');

      fireEvent.keyDown(card, enterEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      preventDefaultSpy.mockRestore();
    });

    it('has tabIndex when onClick is provided', () => {
      const onClick = jest.fn();
      const task = createMockTask();
      renderTaskCard(task, { onClick });

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('does not have tabIndex when onClick is not provided', () => {
      const task = createMockTask();
      renderTaskCard(task);

      const card = screen.getByRole('article');
      expect(card).not.toHaveAttribute('tabIndex');
    });
  });

  describe('styling', () => {
    it('has proper CSS classes for card styling', () => {
      const task = createMockTask();
      renderTaskCard(task);

      const card = screen.getByRole('article');
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('rounded-lg');
      expect(card).toHaveClass('shadow-sm');
      expect(card).toHaveClass('border');
    });

    it('has hover styles', () => {
      const task = createMockTask();
      renderTaskCard(task);

      const card = screen.getByRole('article');
      expect(card).toHaveClass('hover:shadow-md');
      expect(card).toHaveClass('hover:scale-[1.02]');
    });

    it('has cursor pointer when onClick is provided', () => {
      const onClick = jest.fn();
      const task = createMockTask();
      renderTaskCard(task, { onClick });

      const card = screen.getByRole('article');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('has default cursor when onClick is not provided', () => {
      const task = createMockTask();
      renderTaskCard(task);

      const card = screen.getByRole('article');
      expect(card).toHaveClass('cursor-default');
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA role', () => {
      const task = createMockTask();
      renderTaskCard(task);

      const card = screen.getByRole('article');
      expect(card).toBeInTheDocument();
    });

    it('has accessible title association', () => {
      const task = createMockTask({ title: 'Accessible Task' });
      renderTaskCard(task);

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-labelledby', `task-${task.id}-title`);

      const title = screen.getByText('Accessible Task');
      expect(title).toHaveAttribute('id', `task-${task.id}-title`);
    });

    it('has focus ring styles for keyboard navigation', () => {
      const onClick = jest.fn();
      const task = createMockTask();
      renderTaskCard(task, { onClick });

      const card = screen.getByRole('article');
      expect(card).toHaveClass('focus:outline-none');
      expect(card).toHaveClass('focus:ring-2');
      expect(card).toHaveClass('focus:ring-blue-500');
    });
  });

  describe('edge cases', () => {
    it('handles long task titles', () => {
      const longTitle = 'A'.repeat(200);
      const task = createMockTask({ title: longTitle });
      renderTaskCard(task);

      const title = screen.getByText(longTitle);
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('line-clamp-2');
    });

    it('handles task with both priority and due date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const task = createMockTask({
        priority: 'high',
        dueDate: tomorrow
      });
      renderTaskCard(task);

      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
    });

    it('handles task with empty title', () => {
      const task = createMockTask({ title: '' });
      renderTaskCard(task);

      const title = screen.getByText('');
      expect(title).toBeInTheDocument();
    });

    it('handles past due dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const task = createMockTask({ dueDate: pastDate });
      renderTaskCard(task);

      expect(screen.getByText(/5 days ago/i)).toBeInTheDocument();
    });
  });

  describe('task metadata layout', () => {
    it('displays priority and due date in flex container', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const task = createMockTask({
        priority: 'medium',
        dueDate: tomorrow
      });
      renderTaskCard(task);

      const metadataContainer = screen.getByText('Medium').parentElement;
      expect(metadataContainer).toHaveClass('flex');
      expect(metadataContainer).toHaveClass('items-center');
      expect(metadataContainer).toHaveClass('justify-between');
    });

    it('wraps metadata on small screens', () => {
      const task = createMockTask({
        priority: 'high',
        dueDate: new Date()
      });
      renderTaskCard(task);

      const metadataContainer = screen.getByText('High').parentElement;
      expect(metadataContainer).toHaveClass('flex-wrap');
    });
  });

  describe('billable indicator', () => {
    it('displays billable indicator when task is billable', () => {
      const task = createMockTask({ isBillable: true });
      renderTaskCard(task);

      const indicator = screen.getByLabelText('Billable task');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveTextContent('Billable');
    });

    it('does not display billable indicator when task is not billable', () => {
      const task = createMockTask({ isBillable: false });
      renderTaskCard(task);

      expect(screen.queryByLabelText('Billable task')).not.toBeInTheDocument();
    });

    it('shows "Mark Billable" button when task is not billable', () => {
      const task = createMockTask({ isBillable: false });
      renderTaskCard(task);

      const button = screen.getByLabelText('Mark as billable');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Mark Billable');
    });
  });

  describe('billable toggle', () => {
    it('toggles billable status when clicking billable indicator', async () => {
      const taskRepository = new TaskRepository();
      const task = await taskRepository.create({
        title: 'Test Task',
        columnId: 'column-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: true,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });

      renderTaskCard(task);

      const toggleButton = screen.getByLabelText('Mark as non-billable');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        const updatedTask = await taskRepository.getById(task.id);
        expect(updatedTask?.isBillable).toBe(false);
      });
    });

    it('toggles billable status when clicking "Mark Billable" button', async () => {
      const taskRepository = new TaskRepository();
      const task = await taskRepository.create({
        title: 'Test Task',
        columnId: 'column-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });

      renderTaskCard(task);

      const toggleButton = screen.getByLabelText('Mark as billable');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        const updatedTask = await taskRepository.getById(task.id);
        expect(updatedTask?.isBillable).toBe(true);
      });
    });

    it('prevents card click when toggling billable status', async () => {
      const onClick = jest.fn();
      const task = createMockTask({ isBillable: true });
      renderTaskCard(task, { onClick });

      const toggleButton = screen.getByLabelText('Mark as non-billable');
      fireEvent.click(toggleButton);

      // Card onClick should not be called
      expect(onClick).not.toHaveBeenCalled();
    });

    it('supports keyboard navigation for billable toggle', async () => {
      const taskRepository = new TaskRepository();
      const task = await taskRepository.create({
        title: 'Test Task',
        columnId: 'column-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });

      renderTaskCard(task);

      const toggleButton = screen.getByLabelText('Mark as billable');
      toggleButton.focus();
      
      // Press Enter to toggle
      fireEvent.keyDown(toggleButton, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        const updatedTask = await taskRepository.getById(task.id);
        expect(updatedTask?.isBillable).toBe(true);
      });
    });

    it('has proper ARIA labels for toggle buttons', () => {
      const billableTask = createMockTask({ isBillable: true });
      renderTaskCard(billableTask);

      const toggleButton = screen.getByLabelText('Mark as non-billable');
      expect(toggleButton).toBeInTheDocument();

      const nonBillableTask = createMockTask({ isBillable: false });
      const { rerender } = renderTaskCard(nonBillableTask);
      rerender(
        <SettingsProvider>
          <TaskProvider>
            <TimerProvider>
              <TaskCard task={nonBillableTask} />
            </TimerProvider>
          </TaskProvider>
        </SettingsProvider>
      );

      const markBillableButton = screen.getByLabelText('Mark as billable');
      expect(markBillableButton).toBeInTheDocument();
    });
  });
});
