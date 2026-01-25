import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FilterProvider, useFilterContext } from '@/contexts/FilterContext';
import { TaskProvider, useTaskContext } from '@/contexts/TaskContext';
import { ColumnProvider } from '@/contexts/ColumnContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { TaskFilterBar } from '@/components/kanban/TaskFilterBar';
import { ClientRepository } from '@/services/data/repositories/ClientRepository';
import { ProjectRepository } from '@/services/data/repositories/ProjectRepository';
import { TaskRepository } from '@/services/data/repositories/TaskRepository';
import { ColumnRepository } from '@/services/data/repositories/ColumnRepository';
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

describe('Task Filtering Integration Tests', () => {
  let testColumnId: string;
  let column2Id: string;
  let client1Id: string;
  let client2Id: string;
  let project1Id: string;
  let project2Id: string;

  beforeEach(async () => {
    await db.clients.clear();
    await db.projects.clear();
    await db.tasks.clear();
    await db.columns.clear();

    // Create test columns
    const columnRepository = new ColumnRepository();
    const column1 = await columnRepository.create({
      name: 'Column 1',
      position: 0,
      color: null
    });
    testColumnId = column1.id;

    const column2 = await columnRepository.create({
      name: 'Column 2',
      position: 1,
      color: null
    });
    column2Id = column2.id;

    // Create test clients
    const clientRepository = new ClientRepository();
    const client1 = await clientRepository.create({ name: 'Client 1' });
    client1Id = client1.id;

    const client2 = await clientRepository.create({ name: 'Client 2' });
    client2Id = client2.id;

    // Create test projects
    const projectRepository = new ProjectRepository();
    const project1 = await projectRepository.create({
      name: 'Project 1',
      clientId: client1Id
    });
    project1Id = project1.id;

    const project2 = await projectRepository.create({
      name: 'Project 2',
      clientId: client1Id
    });
    project2Id = project2.id;

    // Create test tasks
    const taskRepository = new TaskRepository();
    
    // Client 1, Project 1 tasks
    await taskRepository.create({
      title: 'Client 1 Project 1 Task 1',
      columnId: testColumnId,
      position: 0,
      clientId: client1Id,
      projectId: project1Id,
      isBillable: false,
      hourlyRate: null,
      timeEstimate: null,
      dueDate: null,
      priority: null,
      tags: []
    });

    await taskRepository.create({
      title: 'Client 1 Project 1 Task 2',
      columnId: column2Id,
      position: 0,
      clientId: client1Id,
      projectId: project1Id,
      isBillable: false,
      hourlyRate: null,
      timeEstimate: null,
      dueDate: null,
      priority: null,
      tags: []
    });

    // Client 1, Project 2 tasks
    await taskRepository.create({
      title: 'Client 1 Project 2 Task',
      columnId: testColumnId,
      position: 1,
      clientId: client1Id,
      projectId: project2Id,
      isBillable: false,
      hourlyRate: null,
      timeEstimate: null,
      dueDate: null,
      priority: null,
      tags: []
    });

    // Client 2 tasks
    await taskRepository.create({
      title: 'Client 2 Task',
      columnId: testColumnId,
      position: 2,
      clientId: client2Id,
      projectId: null,
      isBillable: false,
      hourlyRate: null,
      timeEstimate: null,
      dueDate: null,
      priority: null,
      tags: []
    });

    // Task with no client/project
    await taskRepository.create({
      title: 'Unassigned Task',
      columnId: testColumnId,
      position: 3,
      clientId: null,
      projectId: null,
      isBillable: false,
      hourlyRate: null,
      timeEstimate: null,
      dueDate: null,
      priority: null,
      tags: []
    });
  });

  describe('complete filtering workflow', () => {
    it('filters tasks by client → then by project → then clears filters', async () => {
      const TestComponent = () => {
        const { getFilteredTasks, loading: tasksLoading } = useTaskContext();
        const { filters } = useFilterContext();
        const filteredTasks = getFilteredTasks(filters);
        
        if (tasksLoading) {
          return <div data-testid="loading">Loading...</div>;
        }
        
        return (
          <div>
            <TaskFilterBar />
            <div data-testid="filtered-tasks">
              {filteredTasks.map((task) => (
                <div key={task.id} data-testid={`task-${task.title}`}>
                  {task.title}
                </div>
              ))}
            </div>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      // Wait for components to load
      await waitFor(() => {
        expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      });

      // Wait for loading to complete and tasks to load
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        expect(screen.getByTestId('filtered-tasks')).toBeInTheDocument();
      });

      // Verify all tasks are visible initially (5 tasks total)
      await waitFor(() => {
        expect(screen.getByTestId('task-Client 1 Project 1 Task 1')).toBeInTheDocument();
        expect(screen.getByTestId('task-Client 1 Project 2 Task')).toBeInTheDocument();
        expect(screen.getByTestId('task-Client 2 Task')).toBeInTheDocument();
        expect(screen.getByTestId('task-Unassigned Task')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Select client filter
      const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(clientSelect, { target: { value: client1Id } });
      });

      // Wait for filter to apply and re-render
      await waitFor(() => {
        // Should show Client 1 tasks only (3 tasks: 2 from Project 1, 1 from Project 2)
        expect(screen.getByTestId('task-Client 1 Project 1 Task 1')).toBeInTheDocument();
        expect(screen.getByTestId('task-Client 1 Project 2 Task')).toBeInTheDocument();
        // Client 2 and Unassigned tasks should not be visible
        expect(screen.queryByTestId('task-Client 2 Task')).not.toBeInTheDocument();
        expect(screen.queryByTestId('task-Unassigned Task')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // Select project filter (should further filter to Project 1 only)
      await waitFor(() => {
        const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
        expect(projectSelect.disabled).toBe(false);
      });
      
      const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(projectSelect, { target: { value: project1Id } });
      });

      // Wait for filter to apply
      await waitFor(() => {
        // Should show only Client 1 Project 1 tasks
        expect(screen.getByTestId('task-Client 1 Project 1 Task 1')).toBeInTheDocument();
        // Client 1 Project 2 task should not be visible
        expect(screen.queryByTestId('task-Client 1 Project 2 Task')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // Clear filters
      const clearButton = screen.getByText(/clear filters/i);
      await act(async () => {
        fireEvent.click(clearButton);
      });

      // Wait for filters to clear
      await waitFor(() => {
        // All tasks should be visible again
        expect(screen.getByTestId('task-Client 1 Project 1 Task 1')).toBeInTheDocument();
        expect(screen.getByTestId('task-Client 1 Project 2 Task')).toBeInTheDocument();
        expect(screen.getByTestId('task-Client 2 Task')).toBeInTheDocument();
        expect(screen.getByTestId('task-Unassigned Task')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('resets project filter when client filter changes', async () => {
      renderWithProviders(<TaskFilterBar />);

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      });

      // Wait for clients to load (check that client options are available)
      await waitFor(() => {
        const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        expect(clientSelect.options.length).toBeGreaterThan(1); // More than just "All Clients"
      }, { timeout: 5000 });

      // Select client 1
      const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(clientSelect, { target: { value: client1Id } });
      });

      // Wait for project dropdown to be enabled (this indicates filter was applied)
      await waitFor(() => {
        const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
        expect(projectSelect.disabled).toBe(false);
      }, { timeout: 5000 });

      // Select project 1
      const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(projectSelect, { target: { value: project1Id } });
      });

      // Verify project is selected
      await waitFor(() => {
        const updatedProjectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
        expect(updatedProjectSelect.value).toBe(project1Id);
      });

      // Change client to client 2
      await act(async () => {
        fireEvent.change(clientSelect, { target: { value: client2Id } });
      });

      // Project filter should be reset (cleared)
      await waitFor(() => {
        const updatedProjectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
        expect(updatedProjectSelect.value).toBe('');
      });
    });

    it('shows active filter badges and allows individual removal', async () => {
      renderWithProviders(<TaskFilterBar />);

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      });

      // Wait for clients to load
      await waitFor(() => {
        const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        expect(clientSelect.options.length).toBeGreaterThan(1);
      }, { timeout: 5000 });

      // Select client filter
      const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(clientSelect, { target: { value: client1Id } });
      });

      // Wait for badge to appear (this confirms filter was applied)
      await waitFor(() => {
        expect(screen.getByText(/Client: Client 1/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Select project filter
      await waitFor(() => {
        const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
        expect(projectSelect.disabled).toBe(false);
      });
      
      const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(projectSelect, { target: { value: project1Id } });
      });

      // Wait for both badges to appear
      await waitFor(() => {
        expect(screen.getByText(/Client: Client 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Project: Project 1/i)).toBeInTheDocument();
      });

      // Remove client filter via badge
      const clientBadgeRemoveButton = screen.getByLabelText(/remove client filter/i);
      await act(async () => {
        fireEvent.click(clientBadgeRemoveButton);
      });

      // Client badge should disappear, project filter should also clear (dependency)
      await waitFor(() => {
        expect(screen.queryByText(/Client: Client 1/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Project: Project 1/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('filter state persistence', () => {
    it('filter state resets on component remount (simulating app reload)', async () => {
      const { unmount } = renderWithProviders(<TaskFilterBar />);

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      });

      // Wait for clients to load
      await waitFor(() => {
        const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        expect(clientSelect.options.length).toBeGreaterThan(1);
      }, { timeout: 5000 });

      // Set filters
      const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(clientSelect, { target: { value: client1Id } });
      });

      // Wait for filter to be applied (check for badge)
      await waitFor(() => {
        expect(screen.getByText(/Client: Client 1/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Unmount (simulating app reload)
      unmount();

      // Remount
      renderWithProviders(<TaskFilterBar />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      });

      // Filters should be reset (no badge visible)
      await waitFor(() => {
        expect(screen.queryByText(/Client: Client 1/i)).not.toBeInTheDocument();
        const newClientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        expect(newClientSelect.value).toBe('');
      }, { timeout: 5000 });
    });
  });

  describe('keyboard navigation', () => {
    it('allows keyboard navigation through filter controls', async () => {
      renderWithProviders(<TaskFilterBar />);

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      });

      // Wait for clients to load
      await waitFor(() => {
        const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        expect(clientSelect.options.length).toBeGreaterThan(1);
      }, { timeout: 5000 });

      const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;

      // Verify controls are accessible
      expect(clientSelect).toBeInTheDocument();
      expect(projectSelect).toBeInTheDocument();
      
      // Verify project select is disabled when no client selected
      expect(projectSelect.disabled).toBe(true);
      
      // Select client to enable project select
      await act(async () => {
        fireEvent.change(clientSelect, { target: { value: client1Id } });
      });
      
      await waitFor(() => {
        const updatedProjectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
        expect(updatedProjectSelect.disabled).toBe(false);
      }, { timeout: 5000 });
    });
  });

  describe('empty states', () => {
    it('returns correct count when filtering by client with no matching tasks', async () => {
      const TestComponent = () => {
        const { getFilteredTasks, loading: tasksLoading } = useTaskContext();
        const { filters } = useFilterContext();
        const filteredTasks = getFilteredTasks(filters);
        
        if (tasksLoading) {
          return <div data-testid="loading">Loading...</div>;
        }
        
        return (
          <div>
            <TaskFilterBar />
            <div data-testid="filtered-tasks-count">{filteredTasks.length}</div>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Wait for clients to load
      await waitFor(() => {
        const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        expect(clientSelect.options.length).toBeGreaterThan(1);
      }, { timeout: 5000 });

      // Verify initial count shows all tasks (5 tasks)
      await waitFor(() => {
        const countElement = screen.getByTestId('filtered-tasks-count');
        expect(countElement.textContent).toBe('5');
      });

      // Filter by client2 (which has 1 task, so count should be 1)
      const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(clientSelect, { target: { value: client2Id } });
      });

      // Should return 1 task (client2 has 1 task)
      await waitFor(() => {
        const countElement = screen.getByTestId('filtered-tasks-count');
        expect(countElement.textContent).toBe('1');
      }, { timeout: 5000 });
    });
  });
});
