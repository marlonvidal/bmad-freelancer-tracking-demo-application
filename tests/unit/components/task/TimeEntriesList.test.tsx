import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { TimeEntriesList } from '@/components/task/TimeEntriesList';
import { TimeEntryRepository } from '@/services/data/repositories/TimeEntryRepository';
import { db } from '@/services/data/database';
import { TimeEntry } from '@/types/timeEntry';

// Mock TimeEntryModal to avoid complex modal rendering in tests
jest.mock('@/components/timer/TimeEntryModal', () => ({
  TimeEntryModal: ({ isOpen, onClose, onSubmit }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="time-entry-modal">
        <button onClick={onClose} data-testid="modal-close">Close</button>
        <button
          onClick={() => {
            onSubmit({
              taskId: 'test-task-id',
              startTime: new Date('2025-01-26T10:00:00'),
              endTime: new Date('2025-01-26T11:00:00'),
              duration: 60,
              isManual: true,
              description: 'Test entry'
            });
          }}
          data-testid="modal-submit"
        >
          Submit
        </button>
      </div>
    );
  }
}));

describe('TimeEntriesList', () => {
  let taskId: string;
  let timeEntryRepository: TimeEntryRepository;

  beforeEach(async () => {
    await db.timeEntries.clear();
    taskId = 'test-task-id';
    timeEntryRepository = new TimeEntryRepository();
  });

  describe('rendering', () => {
    it('displays loading state initially', () => {
      render(<TimeEntriesList taskId={taskId} />);
      expect(screen.getByText(/loading time entries/i)).toBeInTheDocument();
    });

    it('displays empty state when no time entries', async () => {
      render(<TimeEntriesList taskId={taskId} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading time entries/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText(/no time entries yet/i)).toBeInTheDocument();
      expect(screen.getByText(/click "add entry" to add one/i)).toBeInTheDocument();
    });

    it('displays time entries list', async () => {
      const entry1 = await timeEntryRepository.create({
        taskId,
        startTime: new Date('2025-01-26T10:00:00'),
        endTime: new Date('2025-01-26T11:00:00'),
        duration: 60,
        isManual: true,
        description: 'First entry'
      });

      const entry2 = await timeEntryRepository.create({
        taskId,
        startTime: new Date('2025-01-26T14:00:00'),
        endTime: new Date('2025-01-26T15:30:00'),
        duration: 90,
        isManual: false,
        description: 'Second entry'
      });

      render(<TimeEntriesList taskId={taskId} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading time entries/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText('1h')).toBeInTheDocument(); // 60 minutes
      expect(screen.getByText('1h 30m')).toBeInTheDocument(); // 90 minutes
      expect(screen.getByText('First entry')).toBeInTheDocument();
      expect(screen.getByText('Second entry')).toBeInTheDocument();
      expect(screen.getByText(/manual/i)).toBeInTheDocument();
      expect(screen.getByText(/auto/i)).toBeInTheDocument();
    });

    it('displays total time spent', async () => {
      await timeEntryRepository.create({
        taskId,
        startTime: new Date('2025-01-26T10:00:00'),
        endTime: new Date('2025-01-26T11:00:00'),
        duration: 60,
        isManual: true
      });

      await timeEntryRepository.create({
        taskId,
        startTime: new Date('2025-01-26T14:00:00'),
        endTime: new Date('2025-01-26T15:30:00'),
        duration: 90,
        isManual: false
      });

      render(<TimeEntriesList taskId={taskId} />);

      await waitFor(() => {
        expect(screen.getByText(/total: 2h 30m/i)).toBeInTheDocument();
      });
    });
  });

  describe('add time entry', () => {
    it('opens add modal when Add Entry button is clicked', async () => {
      render(<TimeEntriesList taskId={taskId} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading time entries/i)).not.toBeInTheDocument();
      });

      const addButton = screen.getByLabelText(/add time entry/i);
      fireEvent.click(addButton);

      expect(screen.getByTestId('time-entry-modal')).toBeInTheDocument();
    });

    it('creates new time entry and refreshes list', async () => {
      const onTimeEntryChange = jest.fn();
      render(<TimeEntriesList taskId={taskId} onTimeEntryChange={onTimeEntryChange} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading time entries/i)).not.toBeInTheDocument();
      });

      const addButton = screen.getByLabelText(/add time entry/i);
      fireEvent.click(addButton);

      const submitButton = screen.getByTestId('modal-submit');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('time-entry-modal')).not.toBeInTheDocument();
      });

      expect(onTimeEntryChange).toHaveBeenCalled();
      expect(screen.getByText('1h')).toBeInTheDocument();
    });
  });

  describe('edit time entry', () => {
    it('opens edit modal when edit button is clicked', async () => {
      const entry = await timeEntryRepository.create({
        taskId,
        startTime: new Date('2025-01-26T10:00:00'),
        endTime: new Date('2025-01-26T11:00:00'),
        duration: 60,
        isManual: true,
        description: 'Original description'
      });

      render(<TimeEntriesList taskId={taskId} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading time entries/i)).not.toBeInTheDocument();
      });

      const editButtons = screen.getAllByLabelText(/edit time entry/i);
      fireEvent.click(editButtons[0]);

      expect(screen.getByTestId('time-entry-modal')).toBeInTheDocument();
    });
  });

  describe('delete time entry', () => {
    it('opens confirmation dialog when delete button is clicked', async () => {
      const entry = await timeEntryRepository.create({
        taskId,
        startTime: new Date('2025-01-26T10:00:00'),
        endTime: new Date('2025-01-26T11:00:00'),
        duration: 60,
        isManual: true
      });

      render(<TimeEntriesList taskId={taskId} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading time entries/i)).not.toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/delete time entry/i);
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/delete time entry/i)).toBeInTheDocument();
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });
    });

    it('deletes time entry when confirmed', async () => {
      const entry = await timeEntryRepository.create({
        taskId,
        startTime: new Date('2025-01-26T10:00:00'),
        endTime: new Date('2025-01-26T11:00:00'),
        duration: 60,
        isManual: true
      });

      const onTimeEntryChange = jest.fn();
      render(<TimeEntriesList taskId={taskId} onTimeEntryChange={onTimeEntryChange} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading time entries/i)).not.toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/delete time entry/i);
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/delete time entry/i)).toBeInTheDocument();
      });

      // Find the confirm button in the dialog (not the delete icon button)
      const confirmButton = screen.getByRole('button', { name: /^delete$/i });
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.queryByText(/delete time entry/i)).not.toBeInTheDocument();
        expect(screen.getByText(/no time entries yet/i)).toBeInTheDocument();
      });

      expect(onTimeEntryChange).toHaveBeenCalled();
    });

    it('cancels deletion when cancel is clicked', async () => {
      const entry = await timeEntryRepository.create({
        taskId,
        startTime: new Date('2025-01-26T10:00:00'),
        endTime: new Date('2025-01-26T11:00:00'),
        duration: 60,
        isManual: true
      });

      render(<TimeEntriesList taskId={taskId} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading time entries/i)).not.toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/delete time entry/i);
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/delete time entry/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/delete time entry/i)).not.toBeInTheDocument();
      });

      // Entry should still be visible
      expect(screen.getByText('1h')).toBeInTheDocument();
    });
  });

  describe('total time calculation', () => {
    it('calculates total time correctly for multiple entries', async () => {
      await timeEntryRepository.create({
        taskId,
        startTime: new Date('2025-01-26T10:00:00'),
        endTime: new Date('2025-01-26T10:30:00'),
        duration: 30,
        isManual: true
      });

      await timeEntryRepository.create({
        taskId,
        startTime: new Date('2025-01-26T11:00:00'),
        endTime: new Date('2025-01-26T12:00:00'),
        duration: 60,
        isManual: false
      });

      await timeEntryRepository.create({
        taskId,
        startTime: new Date('2025-01-26T14:00:00'),
        endTime: new Date('2025-01-26T14:15:00'),
        duration: 15,
        isManual: true
      });

      render(<TimeEntriesList taskId={taskId} />);

      await waitFor(() => {
        expect(screen.getByText(/total: 1h 45m/i)).toBeInTheDocument();
      });
    });

    it('shows 0m when no entries', async () => {
      render(<TimeEntriesList taskId={taskId} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading time entries/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText(/total: 0m/i)).toBeInTheDocument();
    });
  });

  describe('time entry display', () => {
    it('displays manual vs auto indicator correctly', async () => {
      await timeEntryRepository.create({
        taskId,
        startTime: new Date('2025-01-26T10:00:00'),
        endTime: new Date('2025-01-26T11:00:00'),
        duration: 60,
        isManual: true
      });

      await timeEntryRepository.create({
        taskId,
        startTime: new Date('2025-01-26T14:00:00'),
        endTime: new Date('2025-01-26T15:00:00'),
        duration: 60,
        isManual: false
      });

      render(<TimeEntriesList taskId={taskId} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading time entries/i)).not.toBeInTheDocument();
      });

      const manualBadges = screen.getAllByText(/manual/i);
      const autoBadges = screen.getAllByText(/auto/i);
      expect(manualBadges.length).toBeGreaterThan(0);
      expect(autoBadges.length).toBeGreaterThan(0);
    });

    it('displays start and end times', async () => {
      const startTime = new Date('2025-01-26T10:00:00');
      const endTime = new Date('2025-01-26T11:30:00');
      
      await timeEntryRepository.create({
        taskId,
        startTime,
        endTime,
        duration: 90,
        isManual: true
      });

      render(<TimeEntriesList taskId={taskId} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading time entries/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText(/start:/i)).toBeInTheDocument();
      expect(screen.getByText(/end:/i)).toBeInTheDocument();
    });

    it('displays description when present', async () => {
      await timeEntryRepository.create({
        taskId,
        startTime: new Date('2025-01-26T10:00:00'),
        endTime: new Date('2025-01-26T11:00:00'),
        duration: 60,
        isManual: true,
        description: 'Worked on feature implementation'
      });

      render(<TimeEntriesList taskId={taskId} />);

      await waitFor(() => {
        expect(screen.getByText('Worked on feature implementation')).toBeInTheDocument();
      });
    });
  });
});
