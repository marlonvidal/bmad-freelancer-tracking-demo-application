import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskDetailPanel } from '@/components/task/TaskDetailPanel';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { TaskProvider } from '@/contexts/TaskContext';
import { ColumnProvider } from '@/contexts/ColumnContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { TimerProvider } from '@/contexts/TimerContext';
import { FilterProvider } from '@/contexts/FilterContext';
import { TaskRepository } from '@/services/data/repositories/TaskRepository';
import { ColumnRepository } from '@/services/data/repositories/ColumnRepository';
import { db } from '@/services/data/database';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <SettingsProvider>
      <ClientProvider>
        <ProjectProvider>
          <ColumnProvider>
            <TaskProvider>
              <TimerProvider>
                <FilterProvider>
                  {component}
                </FilterProvider>
              </TimerProvider>
            </TaskProvider>
          </ColumnProvider>
        </ProjectProvider>
      </ClientProvider>
    </SettingsProvider>
  );
};

describe('TaskDetailPanel Integration', () => {
  let testColumnId: string;
  let taskRepository: TaskRepository;

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
  });

  describe('complete workflow', () => {
    it('opens panel → edits task → saves → closes', async () => {
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
      renderWithProviders(
        <TaskDetailPanel isOpen={true} taskId={task.id} onClose={onClose} />
      );

      // Wait for panel to render
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Edit title
      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

      // Wait for save
      await waitFor(() => {
        expect(screen.getByText(/saved/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Close panel
      const closeButton = screen.getByLabelText(/close task detail panel/i);
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('edits multiple fields and all save correctly', async () => {
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
      renderWithProviders(
        <TaskDetailPanel isOpen={true} taskId={task.id} onClose={onClose} />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Edit multiple fields
      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
      const descriptionTextarea = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
      const prioritySelect = screen.getByLabelText(/priority/i) as HTMLSelectElement;

      fireEvent.change(titleInput, { target: { value: 'New Title' } });
      fireEvent.change(descriptionTextarea, { target: { value: 'New Description' } });
      fireEvent.change(prioritySelect, { target: { value: 'high' } });

      // Wait for saves
      await waitFor(() => {
        expect(screen.getByText(/saved/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify values are updated
      expect(titleInput.value).toBe('New Title');
      expect(descriptionTextarea.value).toBe('New Description');
      expect(prioritySelect.value).toBe('high');
    });
  });

  describe('panel interactions with kanban board', () => {
    it('panel opens from kanban board task click', async () => {
      await taskRepository.create({
        title: 'Kanban Task',
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

      renderWithProviders(<KanbanBoard />);

      // Wait for board to load
      await waitFor(() => {
        expect(screen.getByText('Kanban Task')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Click task card (this should open panel via TaskContext)
      const taskCard = screen.getByText('Kanban Task').closest('[role="article"]');
      if (taskCard) {
        fireEvent.click(taskCard);

        // Panel should open
        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        }, { timeout: 3000 });
      }
    });
  });
});
