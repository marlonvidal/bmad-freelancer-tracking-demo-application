import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FilterProvider } from '@/contexts/FilterContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { ColumnProvider } from '@/contexts/ColumnContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { SearchBar } from '@/components/kanban/SearchBar';
import { TaskFilterBar } from '@/components/kanban/TaskFilterBar';
import { Column } from '@/components/kanban/Column';
import { Column as ColumnType } from '@/types/column';
import { TaskRepository } from '@/services/data/repositories/TaskRepository';
import { ColumnRepository } from '@/services/data/repositories/ColumnRepository';
import { ClientRepository } from '@/services/data/repositories/ClientRepository';
import { ProjectRepository } from '@/services/data/repositories/ProjectRepository';
import { db } from '@/services/data/database';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ColumnProvider>
      <TaskProvider>
        <ClientProvider>
          <ProjectProvider>
            <FilterProvider>
              {component}
            </FilterProvider>
          </ProjectProvider>
        </ClientProvider>
      </TaskProvider>
    </ColumnProvider>
  );
};

describe('Search and Filter Integration Tests', () => {
  let testColumnId: string;
  let client1Id: string;
  let project1Id: string;

  beforeEach(async () => {
    await db.clients.clear();
    await db.projects.clear();
    await db.tasks.clear();
    await db.columns.clear();

    // Create test column
    const columnRepository = new ColumnRepository();
    const column = await columnRepository.create({
      name: 'Test Column',
      position: 0,
      color: null
    });
    testColumnId = column.id;

    // Create test client
    const clientRepository = new ClientRepository();
    const client1 = await clientRepository.create({ 
      name: 'Client 1', 
      defaultHourlyRate: null, 
      contactInfo: null 
    });
    client1Id = client1.id;

    // Create test project
    const projectRepository = new ProjectRepository();
    const project1 = await projectRepository.create({
      name: 'Project 1',
      clientId: client1Id
    });
    project1Id = project1.id;

    // Create test tasks
    const taskRepository = new TaskRepository();
    await taskRepository.create({
      title: 'Development Task',
      description: 'This is a development task',
      columnId: testColumnId,
      position: 0,
      clientId: client1Id,
      projectId: project1Id,
      isBillable: true,
      hourlyRate: null,
      timeEstimate: null,
      dueDate: new Date('2026-01-20'),
      priority: 'high',
      tags: ['development', 'frontend']
    });

    await taskRepository.create({
      title: 'Testing Task',
      description: 'This is a testing task',
      columnId: testColumnId,
      position: 1,
      clientId: client1Id,
      projectId: project1Id,
      isBillable: false,
      hourlyRate: null,
      timeEstimate: null,
      dueDate: new Date('2026-01-25'),
      priority: 'low',
      tags: ['testing', 'qa']
    });

    await taskRepository.create({
      title: 'Bug Fix Task',
      description: 'Fix a bug',
      columnId: testColumnId,
      position: 2,
      clientId: null,
      projectId: null,
      isBillable: false,
      hourlyRate: null,
      timeEstimate: null,
      dueDate: null,
      priority: 'medium',
      tags: ['bugfix']
    });
  });

  describe('search workflow', () => {
    it('searches tasks by title', async () => {
      renderWithProviders(
        <>
          <SearchBar />
          <Column column={{ id: testColumnId, name: 'Test Column', position: 0, color: null }} />
        </>
      );

      await waitFor(() => {
        expect(screen.queryByText('Development Task')).toBeInTheDocument();
        expect(screen.queryByText('Testing Task')).toBeInTheDocument();
        expect(screen.queryByText('Bug Fix Task')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search tasks by title, description, or tags/i);
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'dev' } });
      });

      await waitFor(() => {
        expect(screen.queryByText('Development Task')).toBeInTheDocument();
        expect(screen.queryByText('Testing Task')).not.toBeInTheDocument();
        expect(screen.queryByText('Bug Fix Task')).not.toBeInTheDocument();
      });
    });

    it('searches tasks by description', async () => {
      renderWithProviders(
        <>
          <SearchBar />
          <Column column={{ id: testColumnId, name: 'Test Column', position: 0, color: null }} />
        </>
      );

      const searchInput = screen.getByPlaceholderText(/Search tasks by title, description, or tags/i);
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'testing' } });
      });

      await waitFor(() => {
        expect(screen.queryByText('Testing Task')).toBeInTheDocument();
        expect(screen.queryByText('Development Task')).not.toBeInTheDocument();
      });
    });

    it('searches tasks by tags', async () => {
      renderWithProviders(
        <>
          <SearchBar />
          <Column column={{ id: testColumnId, name: 'Test Column', position: 0, color: null }} />
        </>
      );

      const searchInput = screen.getByPlaceholderText(/Search tasks by title, description, or tags/i);
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'bugfix' } });
      });

      await waitFor(() => {
        expect(screen.queryByText('Bug Fix Task')).toBeInTheDocument();
        expect(screen.queryByText('Development Task')).not.toBeInTheDocument();
      });
    });

    it('clears search and shows all tasks', async () => {
      renderWithProviders(
        <>
          <SearchBar />
          <Column column={{ id: testColumnId, name: 'Test Column', position: 0, color: null }} />
        </>
      );

      const searchInput = screen.getByPlaceholderText(/Search tasks by title, description, or tags/i);
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'dev' } });
      });

      await waitFor(() => {
        expect(screen.queryByText('Development Task')).toBeInTheDocument();
        expect(screen.queryByText('Testing Task')).not.toBeInTheDocument();
      });

      const clearButton = screen.getByLabelText(/Clear search/i);
      
      await act(async () => {
        fireEvent.click(clearButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Development Task')).toBeInTheDocument();
        expect(screen.queryByText('Testing Task')).toBeInTheDocument();
        expect(screen.queryByText('Bug Fix Task')).toBeInTheDocument();
      });
    });
  });

  describe('filter workflow', () => {
    it('filters tasks by billable status', async () => {
      renderWithProviders(
        <>
          <TaskFilterBar />
          <Column column={{ id: testColumnId, name: 'Test Column', position: 0, color: null }} />
        </>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Billable Status/i)).toBeInTheDocument();
      });

      const billableSelect = screen.getByLabelText(/Billable Status/i) as HTMLSelectElement;
      
      await act(async () => {
        fireEvent.change(billableSelect, { target: { value: 'true' } });
      });

      await waitFor(() => {
        expect(screen.queryByText('Development Task')).toBeInTheDocument();
        expect(screen.queryByText('Testing Task')).not.toBeInTheDocument();
        expect(screen.queryByText('Bug Fix Task')).not.toBeInTheDocument();
      });
    });

    it('filters tasks by priority', async () => {
      renderWithProviders(
        <>
          <TaskFilterBar />
          <Column column={{ id: testColumnId, name: 'Test Column', position: 0, color: null }} />
        </>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Priority/i)).toBeInTheDocument();
      });

      const prioritySelect = screen.getByLabelText(/Priority/i) as HTMLSelectElement;
      
      await act(async () => {
        fireEvent.change(prioritySelect, { target: { value: 'high' } });
      });

      await waitFor(() => {
        expect(screen.queryByText('Development Task')).toBeInTheDocument();
        expect(screen.queryByText('Testing Task')).not.toBeInTheDocument();
        expect(screen.queryByText('Bug Fix Task')).not.toBeInTheDocument();
      });
    });

    it('filters tasks by tags', async () => {
      renderWithProviders(
        <>
          <TaskFilterBar />
          <Column column={{ id: testColumnId, name: 'Test Column', position: 0, color: null }} />
        </>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Tags/i)).toBeInTheDocument();
      });

      const tagsSelect = screen.getByLabelText(/Tags/i) as HTMLSelectElement;
      
      await act(async () => {
        // Multi-select: select 'development' tag
        fireEvent.change(tagsSelect, { target: { value: 'development', selectedOptions: [{ value: 'development' }] } });
      });

      await waitFor(() => {
        expect(screen.queryByText('Development Task')).toBeInTheDocument();
        expect(screen.queryByText('Testing Task')).not.toBeInTheDocument();
      });
    });
  });

  describe('search + filter combination', () => {
    it('combines search with billable filter', async () => {
      renderWithProviders(
        <>
          <SearchBar />
          <TaskFilterBar />
          <Column column={{ id: testColumnId, name: 'Test Column', position: 0, color: null }} />
        </>
      );

      const searchInput = screen.getByPlaceholderText(/Search tasks by title, description, or tags/i);
      const billableSelect = screen.getByLabelText(/Billable Status/i) as HTMLSelectElement;
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'task' } });
        fireEvent.change(billableSelect, { target: { value: 'true' } });
      });

      await waitFor(() => {
        // Should show only Development Task (matches "task" AND is billable)
        expect(screen.queryByText('Development Task')).toBeInTheDocument();
        expect(screen.queryByText('Testing Task')).not.toBeInTheDocument();
        expect(screen.queryByText('Bug Fix Task')).not.toBeInTheDocument();
      });
    });

    it('combines search with priority filter', async () => {
      renderWithProviders(
        <>
          <SearchBar />
          <TaskFilterBar />
          <Column column={{ id: testColumnId, name: 'Test Column', position: 0, color: null }} />
        </>
      );

      const searchInput = screen.getByPlaceholderText(/Search tasks by title, description, or tags/i);
      const prioritySelect = screen.getByLabelText(/Priority/i) as HTMLSelectElement;
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'task' } });
        fireEvent.change(prioritySelect, { target: { value: 'high' } });
      });

      await waitFor(() => {
        expect(screen.queryByText('Development Task')).toBeInTheDocument();
        expect(screen.queryByText('Testing Task')).not.toBeInTheDocument();
      });
    });
  });

  describe('clear filters', () => {
    it('clears all filters including search', async () => {
      renderWithProviders(
        <>
          <SearchBar />
          <TaskFilterBar />
          <Column column={{ id: testColumnId, name: 'Test Column', position: 0, color: null }} />
        </>
      );

      const searchInput = screen.getByPlaceholderText(/Search tasks by title, description, or tags/i);
      const billableSelect = screen.getByLabelText(/Billable Status/i) as HTMLSelectElement;
      
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'dev' } });
        fireEvent.change(billableSelect, { target: { value: 'true' } });
      });

      await waitFor(() => {
        expect(screen.queryByText('Development Task')).toBeInTheDocument();
        expect(screen.queryByText('Testing Task')).not.toBeInTheDocument();
      });

      const clearButton = screen.getByText(/Clear Filters/i);
      
      await act(async () => {
        fireEvent.click(clearButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Development Task')).toBeInTheDocument();
        expect(screen.queryByText('Testing Task')).toBeInTheDocument();
        expect(screen.queryByText('Bug Fix Task')).toBeInTheDocument();
        expect(searchInput).toHaveValue('');
      });
    });
  });

  describe('filter badges', () => {
    it('displays active filter badges', async () => {
      renderWithProviders(
        <>
          <TaskFilterBar />
        </>
      );

      const billableSelect = screen.getByLabelText(/Billable Status/i) as HTMLSelectElement;
      
      await act(async () => {
        fireEvent.change(billableSelect, { target: { value: 'true' } });
      });

      await waitFor(() => {
        expect(screen.queryByText(/Billable/i)).toBeInTheDocument();
      });
    });

    it('removes filter when badge remove button is clicked', async () => {
      renderWithProviders(
        <>
          <TaskFilterBar />
          <Column column={{ id: testColumnId, name: 'Test Column', position: 0, color: null }} />
        </>
      );

      const billableSelect = screen.getByLabelText(/Billable Status/i) as HTMLSelectElement;
      
      await act(async () => {
        fireEvent.change(billableSelect, { target: { value: 'true' } });
      });

      await waitFor(() => {
        expect(screen.queryByText(/Billable/i)).toBeInTheDocument();
      });

      const removeButton = screen.getByLabelText(/Remove billable status filter/i);
      
      await act(async () => {
        fireEvent.click(removeButton);
      });

      await waitFor(() => {
        expect(screen.queryByText(/Billable/i)).not.toBeInTheDocument();
        expect(screen.queryByText('Development Task')).toBeInTheDocument();
        expect(screen.queryByText('Testing Task')).toBeInTheDocument();
      });
    });
  });
});
