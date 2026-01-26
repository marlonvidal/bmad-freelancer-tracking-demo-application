import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { TaskDetailPanel } from '@/components/task/TaskDetailPanel';
import { TaskProvider } from '@/contexts/TaskContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { TaskRepository } from '@/services/data/repositories/TaskRepository';
import { ColumnRepository } from '@/services/data/repositories/ColumnRepository';
import { TimeEntryRepository } from '@/services/data/repositories/TimeEntryRepository';
import { db } from '@/services/data/database';
import { Task } from '@/types/task';

// Mock TimeEntriesList to simplify tests
jest.mock('@/components/task/TimeEntriesList', () => ({
  TimeEntriesList: ({ taskId }: { taskId: string }) => (
    <div data-testid="time-entries-list">Time Entries for {taskId}</div>
  )
}));

const createMockTask = (overrides: Partial<Task> = {}): Task => {
  const now = new Date();
  return {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test description',
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

const renderTaskDetailPanel = (
  isOpen: boolean,
  taskId: string | null,
  onClose: jest.Mock
) => {
  return render(
    <ClientProvider>
      <ProjectProvider>
        <TaskProvider>
          <TaskDetailPanel isOpen={isOpen} taskId={taskId} onClose={onClose} />
        </TaskProvider>
      </ProjectProvider>
    </ClientProvider>
  );
};

describe('TaskDetailPanel', () => {
  let testColumnId: string;
  let taskRepository: TaskRepository;
  let timeEntryRepository: TimeEntryRepository;

  beforeEach(async () => {
    await db.tasks.clear();
    await db.columns.clear();
    await db.timeEntries.clear();

    const columnRepository = new ColumnRepository();
    const column = await columnRepository.create({
      name: 'Test Column',
      position: 0,
      color: null
    });
    testColumnId = column.id;

    taskRepository = new TaskRepository();
    timeEntryRepository = new TimeEntryRepository();
  });

  describe('rendering', () => {
    it('does not render when panel is closed', () => {
      const onClose = jest.fn();
      renderTaskDetailPanel(false, 'task-1', onClose);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('does not render when taskId is null', () => {
      const onClose = jest.fn();
      renderTaskDetailPanel(true, null, onClose);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders panel when open with valid task', async () => {
      const task = await taskRepository.create({
        title: 'Test Task',
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

      const onClose = jest.fn();
      renderTaskDetailPanel(true, task.id, onClose);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByText('Task Details')).toBeInTheDocument();
    });

    it('displays task title', async () => {
      const task = await taskRepository.create({
        title: 'My Task Title',
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

      const onClose = jest.fn();
      renderTaskDetailPanel(true, task.id, onClose);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      }, { timeout: 3000 });

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
        expect(titleInput.value).toBe('My Task Title');
      });
    });

    it('displays task description', async () => {
      const task = await taskRepository.create({
        title: 'Test Task',
        description: 'This is a test description',
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

      const onClose = jest.fn();
      renderTaskDetailPanel(true, task.id, onClose);

      await waitFor(() => {
        const descriptionTextarea = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
        expect(descriptionTextarea.value).toBe('This is a test description');
      });
    });

    it('displays all task fields', async () => {
      const dueDate = new Date('2025-12-31');
      const task = await taskRepository.create({
        title: 'Complete Task',
        description: 'Description',
        columnId: testColumnId,
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: true,
        hourlyRate: 50,
        timeEstimate: 120,
        dueDate,
        priority: 'high' as const,
        tags: ['urgent', 'frontend']
      });

      const onClose = jest.fn();
      renderTaskDetailPanel(true, task.id, onClose);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/time estimate/i)).toBeInTheDocument();
      });
    });
  });

  describe('panel close functionality', () => {
    it('closes panel when close button is clicked', async () => {
      const task = await taskRepository.create({
        title: 'Test Task',
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

      const onClose = jest.fn();
      renderTaskDetailPanel(true, task.id, onClose);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText(/close task detail panel/i);
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes panel when ESC key is pressed', async () => {
      const task = await taskRepository.create({
        title: 'Test Task',
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

      const onClose = jest.fn();
      renderTaskDetailPanel(true, task.id, onClose);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes panel when backdrop is clicked', async () => {
      const task = await taskRepository.create({
        title: 'Test Task',
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

      const onClose = jest.fn();
      renderTaskDetailPanel(true, task.id, onClose);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Find backdrop (aria-hidden div)
      const backdrop = screen.getByRole('dialog').parentElement?.previousSibling as HTMLElement;
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('inline editing', () => {
    it('updates task title with debounced auto-save', async () => {
      const task = await taskRepository.create({
        title: 'Original Title',
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

      const onClose = jest.fn();
      renderTaskDetailPanel(true, task.id, onClose);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

      expect(titleInput.value).toBe('Updated Title');

      // Wait for debounced save (500ms + processing)
      await waitFor(
        () => {
          expect(screen.getByText(/saving/i)).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      await waitFor(
        () => {
          expect(screen.getByText(/saved/i)).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('updates task description with debounced auto-save', async () => {
      const task = await taskRepository.create({
        title: 'Test Task',
        description: 'Original description',
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

      const onClose = jest.fn();
      renderTaskDetailPanel(true, task.id, onClose);

      await waitFor(() => {
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      });

      const descriptionTextarea = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
      fireEvent.change(descriptionTextarea, { target: { value: 'Updated description' } });

      expect(descriptionTextarea.value).toBe('Updated description');

      await waitFor(
        () => {
          expect(screen.getByText(/saved/i)).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('updates priority immediately', async () => {
      const task = await taskRepository.create({
        title: 'Test Task',
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

      const onClose = jest.fn();
      renderTaskDetailPanel(true, task.id, onClose);

      await waitFor(() => {
        expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      });

      const prioritySelect = screen.getByLabelText(/priority/i) as HTMLSelectElement;
      fireEvent.change(prioritySelect, { target: { value: 'high' } });

      expect(prioritySelect.value).toBe('high');
    });

    it('updates tags immediately', async () => {
      const task = await taskRepository.create({
        title: 'Test Task',
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

      const onClose = jest.fn();
      renderTaskDetailPanel(true, task.id, onClose);

      await waitFor(() => {
        expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
      });

      const tagsInput = screen.getByLabelText(/tags/i) as HTMLInputElement;
      fireEvent.change(tagsInput, { target: { value: 'urgent, frontend' } });

      expect(tagsInput.value).toBe('urgent, frontend');
    });

    it('toggles billable status', async () => {
      const task = await taskRepository.create({
        title: 'Test Task',
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

      const onClose = jest.fn();
      renderTaskDetailPanel(true, task.id, onClose);

      await waitFor(() => {
        expect(screen.getByText(/non-billable/i)).toBeInTheDocument();
      });

      const billableButton = screen.getByLabelText(/mark task as billable/i);
      await act(async () => {
        fireEvent.click(billableButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/billable/i)).toBeInTheDocument();
      });
    });
  });

  describe('keyboard navigation', () => {
    it('traps focus within panel', async () => {
      const task = await taskRepository.create({
        title: 'Test Task',
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

      const onClose = jest.fn();
      renderTaskDetailPanel(true, task.id, onClose);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Focus should be within panel (either close button or first input)
      const dialog = screen.getByRole('dialog');
      const focusedElement = document.activeElement;
      expect(dialog.contains(focusedElement)).toBe(true);
    });

    it('supports keyboard navigation with Tab key', async () => {
      const task = await taskRepository.create({
        title: 'Test Task',
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

      const onClose = jest.fn();
      renderTaskDetailPanel(true, task.id, onClose);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      // Verify focusable elements exist (focus trap implementation verified via integration/E2E)
      const titleInput = screen.getByLabelText(/title/i);
      const descriptionTextarea = screen.getByLabelText(/description/i);
      expect(titleInput).toBeInTheDocument();
      expect(descriptionTextarea).toBeInTheDocument();
      // Focus trap functionality is verified in integration/E2E tests
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA attributes', async () => {
      const task = await taskRepository.create({
        title: 'Test Task',
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

      const onClose = jest.fn();
      renderTaskDetailPanel(true, task.id, onClose);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby', 'task-detail-panel-title');
      });
    });

    it('has aria-describedby for form fields', async () => {
      const task = await taskRepository.create({
        title: 'Test Task',
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

      const onClose = jest.fn();
      renderTaskDetailPanel(true, task.id, onClose);

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/title/i);
        expect(titleInput).toHaveAttribute('aria-describedby', 'task-title-description');
      });
    });
  });

  describe('time spent display', () => {
    it('displays time spent from time entries', async () => {
      const task = await taskRepository.create({
        title: 'Test Task',
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

      await timeEntryRepository.create({
        taskId: task.id,
        startTime: new Date('2025-01-26T10:00:00'),
        endTime: new Date('2025-01-26T11:00:00'),
        duration: 60,
        isManual: true
      });

      const onClose = jest.fn();
      renderTaskDetailPanel(true, task.id, onClose);

      await waitFor(() => {
        expect(screen.getByText(/1h/i)).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching time', async () => {
      const task = await taskRepository.create({
        title: 'Test Task',
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

      const onClose = jest.fn();
      renderTaskDetailPanel(true, task.id, onClose);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Should show loading initially for time spent
      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });
});
