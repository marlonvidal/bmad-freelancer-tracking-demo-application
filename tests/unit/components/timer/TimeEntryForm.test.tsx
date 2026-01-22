import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimeEntryForm } from '@/components/timer/TimeEntryForm';
import { TimeEntry } from '@/types/timeEntry';

const renderTimeEntryForm = (
  props: {
    taskId?: string;
    timeEntry?: TimeEntry;
    onSubmit?: (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    onCancel?: () => void;
  } = {}
) => {
  const defaultOnSubmit = jest.fn().mockResolvedValue(undefined);
  const defaultOnCancel = jest.fn();

  return render(
    <TimeEntryForm
      taskId={props.taskId || 'test-task-id'}
      timeEntry={props.timeEntry}
      onSubmit={props.onSubmit || defaultOnSubmit}
      onCancel={props.onCancel || defaultOnCancel}
    />
  );
};

describe('TimeEntryForm', () => {
  describe('rendering', () => {
    it('renders all form fields', () => {
      renderTimeEntryForm();

      expect(screen.getByLabelText(/hours/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/minutes/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^date$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^time$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('auto-focuses hours input on mount', () => {
      renderTimeEntryForm();

      const hoursInput = screen.getByLabelText(/hours/i);
      expect(hoursInput).toHaveFocus();
    });

    it('renders with default values for create mode', () => {
      renderTimeEntryForm();

      const hoursInput = screen.getByLabelText(/hours/i) as HTMLInputElement;
      const minutesInput = screen.getByLabelText(/minutes/i) as HTMLInputElement;

      expect(hoursInput.value).toBe('0');
      expect(minutesInput.value).toBe('0');
    });

    it('pre-populates form fields in edit mode', () => {
      const timeEntry: TimeEntry = {
        id: 'entry-1',
        taskId: 'task-1',
        startTime: new Date('2024-12-19T14:30:00'),
        endTime: new Date('2024-12-19T16:00:00'),
        duration: 90, // 1h 30m
        isManual: true,
        description: 'Test description',
        createdAt: new Date('2024-12-19T14:30:00'),
        updatedAt: new Date('2024-12-19T14:30:00')
      };

      renderTimeEntryForm({ timeEntry });

      const hoursInput = screen.getByLabelText(/hours/i) as HTMLInputElement;
      const minutesInput = screen.getByLabelText(/minutes/i) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;

      expect(hoursInput.value).toBe('1');
      expect(minutesInput.value).toBe('30');
      expect(descriptionInput.value).toBe('Test description');
    });
  });

  describe('form validation', () => {
    it('validates hours input range', async () => {
      renderTimeEntryForm();

      const hoursInput = screen.getByLabelText(/hours/i) as HTMLInputElement;
      // HTML5 number input with min="0" prevents negative values, but we can test the validation logic
      // by setting value directly and triggering validation
      Object.defineProperty(hoursInput, 'value', {
        writable: true,
        value: '-1'
      });
      fireEvent.change(hoursInput);

      const submitButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/hours must be 0 or greater/i)).toBeInTheDocument();
      });
    });

    it('validates minutes input range', async () => {
      renderTimeEntryForm();

      const minutesInput = screen.getByLabelText(/minutes/i) as HTMLInputElement;
      Object.defineProperty(minutesInput, 'value', {
        writable: true,
        value: '-1'
      });
      fireEvent.change(minutesInput);

      const submitButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/minutes must be 0 or greater/i)).toBeInTheDocument();
      });
    });

    // Note: HTML5 max="59" prevents entering minutes >= 60, but validation logic exists as safety net
    // Testing the validation that can actually occur in practice

    it('shows error when both hours and minutes are 0', async () => {
      renderTimeEntryForm();

      const submitButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/at least one of hours or minutes must be greater than 0/i)).toBeInTheDocument();
      });
    });

    it('shows error when total duration is 24 hours or more', async () => {
      renderTimeEntryForm();

      const hoursInput = screen.getByLabelText(/hours/i);
      fireEvent.change(hoursInput, { target: { value: '24' } });

      const submitButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/total duration must be less than 24 hours/i)).toBeInTheDocument();
      });
    });

    it('clears error when user fixes invalid input', async () => {
      renderTimeEntryForm();

      const hoursInput = screen.getByLabelText(/hours/i) as HTMLInputElement;
      Object.defineProperty(hoursInput, 'value', {
        writable: true,
        value: '-1'
      });
      fireEvent.change(hoursInput);

      const submitButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/hours must be 0 or greater/i)).toBeInTheDocument();
      });

      fireEvent.change(hoursInput, { target: { value: '1' } });

      await waitFor(() => {
        expect(screen.queryByText(/hours must be 0 or greater/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('calls onSubmit with correct data in create mode', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);

      renderTimeEntryForm({ onSubmit });

      const hoursInput = screen.getByLabelText(/hours/i);
      const minutesInput = screen.getByLabelText(/minutes/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      fireEvent.change(hoursInput, { target: { value: '2' } });
      fireEvent.change(minutesInput, { target: { value: '30' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test entry' } });

      const submitButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      const callArgs = onSubmit.mock.calls[0][0];
      expect(callArgs.duration).toBe(150); // 2h 30m = 150 minutes
      expect(callArgs.isManual).toBe(true);
      expect(callArgs.description).toBe('Test entry');
      expect(callArgs.taskId).toBe('test-task-id');
      expect(callArgs.startTime).toBeInstanceOf(Date);
      expect(callArgs.endTime).toBeInstanceOf(Date);
    });

    it('calls onSubmit with correct data in edit mode', async () => {
      const timeEntry: TimeEntry = {
        id: 'entry-1',
        taskId: 'task-1',
        startTime: new Date('2024-12-19T14:30:00'),
        endTime: new Date('2024-12-19T16:00:00'),
        duration: 90,
        isManual: true,
        description: 'Original description',
        createdAt: new Date('2024-12-19T14:30:00'),
        updatedAt: new Date('2024-12-19T14:30:00')
      };

      const onSubmit = jest.fn().mockResolvedValue(undefined);

      renderTimeEntryForm({ timeEntry, onSubmit });

      const hoursInput = screen.getByLabelText(/hours/i);
      const minutesInput = screen.getByLabelText(/minutes/i);

      fireEvent.change(hoursInput, { target: { value: '3' } });
      fireEvent.change(minutesInput, { target: { value: '15' } });

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      const callArgs = onSubmit.mock.calls[0][0];
      expect(callArgs.duration).toBe(195); // 3h 15m = 195 minutes
      expect(callArgs.isManual).toBe(true);
    });

    it('trims description before submission', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);

      renderTimeEntryForm({ onSubmit });

      const hoursInput = screen.getByLabelText(/hours/i);
      const minutesInput = screen.getByLabelText(/minutes/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      fireEvent.change(hoursInput, { target: { value: '1' } });
      fireEvent.change(minutesInput, { target: { value: '0' } });
      fireEvent.change(descriptionInput, { target: { value: '  Test entry  ' } });

      const submitButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      const callArgs = onSubmit.mock.calls[0][0];
      expect(callArgs.description).toBe('Test entry');
    });

    it('sets description to undefined when empty', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);

      renderTimeEntryForm({ onSubmit });

      const hoursInput = screen.getByLabelText(/hours/i);
      const minutesInput = screen.getByLabelText(/minutes/i);

      fireEvent.change(hoursInput, { target: { value: '1' } });
      fireEvent.change(minutesInput, { target: { value: '0' } });

      const submitButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      const callArgs = onSubmit.mock.calls[0][0];
      expect(callArgs.description).toBeUndefined();
    });
  });

  describe('form cancellation', () => {
    it('calls onCancel when cancel button is clicked', () => {
      const onCancel = jest.fn();

      renderTimeEntryForm({ onCancel });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when ESC key is pressed', () => {
      const onCancel = jest.fn();

      renderTimeEntryForm({ onCancel });

      const form = screen.getByLabelText(/add time entry/i).closest('form');
      if (form) {
        fireEvent.keyDown(form, { key: 'Escape' });
      }

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA labels', () => {
      renderTimeEntryForm();

      expect(screen.getByLabelText(/add time entry/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hours/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/minutes/i)).toHaveAttribute('aria-required', 'true');
    });

    it('announces validation errors', async () => {
      renderTimeEntryForm();

      const submitButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/at least one of hours or minutes must be greater than 0/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });
});
