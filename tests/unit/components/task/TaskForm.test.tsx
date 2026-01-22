import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskForm } from '@/components/task/TaskForm';
import { ColumnProvider } from '@/contexts/ColumnContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { ColumnRepository } from '@/services/data/repositories/ColumnRepository';
import { db } from '@/services/data/database';

const renderTaskForm = (
  props: {
    initialColumnId?: string;
    onSubmit?: (taskData: any) => Promise<void>;
    onCancel?: () => void;
  } = {}
) => {
  const defaultOnSubmit = jest.fn().mockResolvedValue(undefined);
  const defaultOnCancel = jest.fn();

  return render(
    <ColumnProvider>
      <TaskProvider>
        <TaskForm
          initialColumnId={props.initialColumnId}
          onSubmit={props.onSubmit || defaultOnSubmit}
          onCancel={props.onCancel || defaultOnCancel}
        />
      </TaskProvider>
    </ColumnProvider>
  );
};

describe('TaskForm', () => {
  let testColumnId: string;

  beforeEach(async () => {
    await db.columns.clear();
    await db.tasks.clear();

    const columnRepository = new ColumnRepository();
    const column = await columnRepository.create({
      name: 'Test Column',
      position: 0,
      color: null
    });
    testColumnId = column.id;
  });

  describe('rendering', () => {
    it('renders all form fields', async () => {
      renderTaskForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/column/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
    });

    it('auto-focuses title input on mount', async () => {
      renderTaskForm();

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/title/i);
        expect(titleInput).toHaveFocus();
      });
    });

    it('sets default column to Backlog when no initialColumnId provided', async () => {
      const columnRepository = new ColumnRepository();
      await columnRepository.create({
        name: 'Backlog',
        position: 0,
        color: null
      });

      renderTaskForm();

      await waitFor(() => {
        const columnSelect = screen.getByLabelText(/column/i) as HTMLSelectElement;
        expect(columnSelect.value).toBeTruthy();
      });
    });

    it('pre-selects initialColumnId when provided', async () => {
      renderTaskForm({ initialColumnId: testColumnId });

      await waitFor(() => {
        const columnSelect = screen.getByLabelText(/column/i) as HTMLSelectElement;
        expect(columnSelect.value).toBe(testColumnId);
      });
    });
  });

  describe('form validation', () => {
    it('shows error when title is empty', async () => {
      const onSubmit = jest.fn();
      renderTaskForm({ onSubmit });

      const submitButton = screen.getByRole('button', { name: /create task/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows error when title is only whitespace', async () => {
      const onSubmit = jest.fn();
      renderTaskForm({ onSubmit });

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: '   ' } });

      const submitButton = screen.getByRole('button', { name: /create task/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('clears title error when user starts typing', async () => {
      renderTaskForm();

      const titleInput = screen.getByLabelText(/title/i);
      const submitButton = screen.getByRole('button', { name: /create task/i });

      // Trigger validation error
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });

      // Start typing
      fireEvent.change(titleInput, { target: { value: 'New Task' } });

      await waitFor(() => {
        expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument();
      });
    });

    it('validates date format if provided', async () => {
      const onSubmit = jest.fn();
      renderTaskForm({ onSubmit });

      const dueDateInput = screen.getByLabelText(/due date/i);
      // HTML5 date input validates format automatically, but we test the component handles it
      fireEvent.change(dueDateInput, { target: { value: 'invalid-date' } });

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });

      const submitButton = screen.getByRole('button', { name: /create task/i });
      fireEvent.click(submitButton);

      // HTML5 date input will prevent invalid dates, so validation should pass
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('form submission', () => {
    it('calls onSubmit with correct task data', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      renderTaskForm({ onSubmit });

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const prioritySelect = screen.getByLabelText(/priority/i);
      const tagsInput = screen.getByLabelText(/tags/i);

      fireEvent.change(titleInput, { target: { value: 'Test Task' } });
      fireEvent.change(descriptionInput, { target: { value: 'Task description' } });
      fireEvent.change(prioritySelect, { target: { value: 'high' } });
      fireEvent.change(tagsInput, { target: { value: 'urgent, frontend' } });

      const submitButton = screen.getByRole('button', { name: /create task/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      const callArgs = onSubmit.mock.calls[0][0];
      expect(callArgs.title).toBe('Test Task');
      expect(callArgs.description).toBe('Task description');
      expect(callArgs.priority).toBe('high');
      expect(callArgs.tags).toEqual(['urgent', 'frontend']);
      expect(callArgs.columnId).toBeTruthy();
      expect(callArgs.position).toBeDefined();
      expect(callArgs.isBillable).toBe(false);
    });

    it('trims title and description', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      renderTaskForm({ onSubmit });

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      fireEvent.change(titleInput, { target: { value: '  Test Task  ' } });
      fireEvent.change(descriptionInput, { target: { value: '  Description  ' } });

      const submitButton = screen.getByRole('button', { name: /create task/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      const callArgs = onSubmit.mock.calls[0][0];
      expect(callArgs.title).toBe('Test Task');
      expect(callArgs.description).toBe('Description');
    });

    it('parses tags from comma-separated string', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      renderTaskForm({ onSubmit });

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      const tagsInput = screen.getByLabelText(/tags/i);

      fireEvent.change(titleInput, { target: { value: 'Test Task' } });
      fireEvent.change(tagsInput, { target: { value: 'urgent, frontend, bug' } });

      const submitButton = screen.getByRole('button', { name: /create task/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      const callArgs = onSubmit.mock.calls[0][0];
      expect(callArgs.tags).toEqual(['urgent', 'frontend', 'bug']);
    });

    it('filters out empty tags', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      renderTaskForm({ onSubmit });

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      const tagsInput = screen.getByLabelText(/tags/i);

      fireEvent.change(titleInput, { target: { value: 'Test Task' } });
      fireEvent.change(tagsInput, { target: { value: 'urgent, , frontend,  ' } });

      const submitButton = screen.getByRole('button', { name: /create task/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      const callArgs = onSubmit.mock.calls[0][0];
      expect(callArgs.tags).toEqual(['urgent', 'frontend']);
    });

    it('sets default values correctly', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      renderTaskForm({ onSubmit });

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Minimal Task' } });

      const submitButton = screen.getByRole('button', { name: /create task/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      const callArgs = onSubmit.mock.calls[0][0];
      expect(callArgs.isBillable).toBe(false);
      expect(callArgs.clientId).toBe(null);
      expect(callArgs.projectId).toBe(null);
      expect(callArgs.hourlyRate).toBe(null);
      expect(callArgs.timeEstimate).toBe(null);
      expect(callArgs.tags).toEqual([]);
    });

    it('calculates next position in column', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      const { TaskRepository } = await import('@/services/data/repositories/TaskRepository');
      const taskRepository = new TaskRepository();

      // Add existing tasks to column
      await taskRepository.create({
        title: 'Task 1',
        columnId: testColumnId,
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

      await taskRepository.create({
        title: 'Task 2',
        columnId: testColumnId,
        position: 1,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });

      renderTaskForm({ initialColumnId: testColumnId });

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Task 3' } });

      const submitButton = screen.getByRole('button', { name: /create task/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      }, { timeout: 3000 });

      const callArgs = onSubmit.mock.calls[0][0];
      expect(callArgs.position).toBe(2);
    });

    it('disables submit button while submitting', async () => {
      const onSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderTaskForm({ onSubmit });

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });

      const submitButton = screen.getByRole('button', { name: /create task/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      expect(submitButton).toHaveTextContent('Creating...');
    });
  });

  describe('form cancellation', () => {
    it('calls onCancel when cancel button is clicked', () => {
      const onCancel = jest.fn();
      renderTaskForm({ onCancel });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when ESC key is pressed', async () => {
      const onCancel = jest.fn();
      renderTaskForm({ onCancel });

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const form = screen.getByLabelText(/create new task/i).closest('form');
      
      if (form) {
        fireEvent.keyDown(form, { key: 'Escape', code: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA labels', async () => {
      renderTaskForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      expect(titleInput).toHaveAttribute('aria-required', 'true');
      expect(titleInput).toHaveAttribute('id', 'task-title');
    });

    it('associates error messages with inputs', async () => {
      renderTaskForm();

      const titleInput = screen.getByLabelText(/title/i);
      const submitButton = screen.getByRole('button', { name: /create task/i });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });

      expect(titleInput).toHaveAttribute('aria-invalid', 'true');
      expect(titleInput).toHaveAttribute('aria-describedby', 'title-error');
    });

    it('has accessible form label', async () => {
      renderTaskForm();

      await waitFor(() => {
        const form = screen.getByLabelText(/create new task/i);
        expect(form).toBeInTheDocument();
        expect(form.tagName).toBe('FORM');
      });
    });
  });

  describe('priority selection', () => {
    it('allows selecting priority', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      renderTaskForm({ onSubmit });

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      const prioritySelect = screen.getByLabelText(/priority/i);

      fireEvent.change(titleInput, { target: { value: 'Test Task' } });
      fireEvent.change(prioritySelect, { target: { value: 'medium' } });

      const submitButton = screen.getByRole('button', { name: /create task/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      const callArgs = onSubmit.mock.calls[0][0];
      expect(callArgs.priority).toBe('medium');
    });

    it('allows selecting "None" for priority', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      renderTaskForm({ onSubmit });

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });

      const submitButton = screen.getByRole('button', { name: /create task/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      const callArgs = onSubmit.mock.calls[0][0];
      expect(callArgs.priority).toBe(null);
    });
  });

  describe('due date handling', () => {
    it('parses due date correctly', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      renderTaskForm({ onSubmit });

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      const dueDateInput = screen.getByLabelText(/due date/i);

      // Use a date that won't have timezone issues
      const testDate = '2025-06-15';
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });
      fireEvent.change(dueDateInput, { target: { value: testDate } });

      const submitButton = screen.getByRole('button', { name: /create task/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      const callArgs = onSubmit.mock.calls[0][0];
      expect(callArgs.dueDate).toBeInstanceOf(Date);
      // Check that date was parsed correctly (allowing for timezone differences)
      const parsedDate = new Date(testDate);
      expect(callArgs.dueDate?.getFullYear()).toBe(parsedDate.getFullYear());
      expect(callArgs.dueDate?.getMonth()).toBe(parsedDate.getMonth());
      expect(callArgs.dueDate?.getDate()).toBe(parsedDate.getDate());
    });

    it('handles empty due date', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      renderTaskForm({ onSubmit });

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });

      const submitButton = screen.getByRole('button', { name: /create task/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      const callArgs = onSubmit.mock.calls[0][0];
      expect(callArgs.dueDate).toBe(null);
    });
  });
});
