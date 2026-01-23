import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientProvider } from '@/contexts/ClientContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { ColumnProvider } from '@/contexts/ColumnContext';
import { ClientSelector } from '@/components/client/ClientSelector';
import { ProjectSelector } from '@/components/project/ProjectSelector';
import { TaskForm } from '@/components/task/TaskForm';
import { db } from '@/services/data/database';
import { ClientRepository } from '@/services/data/repositories/ClientRepository';
import { ProjectRepository } from '@/services/data/repositories/ProjectRepository';
import { TaskRepository } from '@/services/data/repositories/TaskRepository';
import { ColumnRepository } from '@/services/data/repositories/ColumnRepository';

describe('Project Management Workflow', () => {
  beforeEach(async () => {
    await db.projects.clear();
    await db.clients.clear();
    await db.tasks.clear();
    await db.columns.clear();

    // Create a default column
    const columnRepository = new ColumnRepository();
    await columnRepository.create({
      name: 'Backlog',
      position: 0
    });
  });

  describe('complete workflow: select client → create project → assign to task → verify persistence', () => {
    it('completes full workflow successfully', async () => {
      const clientRepository = new ClientRepository();
      const projectRepository = new ProjectRepository();
      const taskRepository = new TaskRepository();

      // Create a client
      const client = await clientRepository.create({
        name: 'Test Client',
        defaultHourlyRate: null,
        contactInfo: null
      });

      let createdProjectId: string | null = null;
      let createdTaskId: string | null = null;

      const TestComponent = () => {
        const [clientId, setClientId] = React.useState<string | null>(null);
        const [projectId, setProjectId] = React.useState<string | null>(null);
        const [showTaskForm, setShowTaskForm] = React.useState(false);

        return (
          <div>
            <ClientSelector 
              value={clientId || undefined} 
              onChange={(id) => {
                setClientId(id);
              }} 
            />
            <ProjectSelector 
              clientId={clientId} 
              value={projectId || undefined} 
              onChange={setProjectId} 
            />
            {showTaskForm && (
              <TaskForm
                initialClientId={clientId}
                initialProjectId={projectId}
                onSubmit={async (taskData) => {
                  const task = await taskRepository.create(taskData);
                  createdTaskId = task.id;
                  setShowTaskForm(false);
                }}
                onCancel={() => setShowTaskForm(false)}
              />
            )}
            {!showTaskForm && (
              <button onClick={() => setShowTaskForm(true)}>Create Task</button>
            )}
          </div>
        );
      };

      render(
        <ClientProvider>
          <ProjectProvider>
            <ColumnProvider>
              <TaskProvider>
                <TestComponent />
              </TaskProvider>
            </ColumnProvider>
          </ProjectProvider>
        </ClientProvider>
      );

      // Step 1: Wait for client selector and clients to load, then select client
      await waitFor(() => {
        const clientSelect = screen.getByLabelText('Select client') as HTMLSelectElement;
        expect(clientSelect).toBeInTheDocument();
        // Wait for the client option to appear in the select
        const options = Array.from(clientSelect.options).map(opt => opt.value);
        expect(options).toContain(client.id);
      });
      const clientSelect = screen.getByLabelText('Select client') as HTMLSelectElement;
      
      // Use userEvent for more reliable async state updates
      const user = userEvent.setup();
      await user.selectOptions(clientSelect, client.id);

      // Step 2: Wait for project selector to become enabled after client selection
      // The ProjectSelector re-renders when clientId prop changes
      // Wait for the enabled version to appear - check for "Create New Project" option
      await waitFor(() => {
        // Check for enabled project selector (not the disabled one)
        // The disabled one has aria-label="Select project (disabled - select a client first)"
        // The enabled one has aria-label="Select project"
        const projectSelect = screen.queryByLabelText('Select project') as HTMLSelectElement | null;
        const disabledSelect = screen.queryByLabelText(/select project.*disabled/i);
        
        // Disabled select should be gone
        if (disabledSelect) {
          throw new Error('Disabled project selector still present');
        }
        
        // Enabled select should be present and not disabled
        if (!projectSelect) {
          throw new Error('Project selector not found');
        }
        
        if (projectSelect.disabled) {
          throw new Error('Project selector is still disabled');
        }
        
        // Verify "Create New Project" option exists (indicates enabled state)
        const options = Array.from(projectSelect.options).map(opt => opt.text);
        if (!options.includes('+ Create New Project')) {
          throw new Error('Create New Project option not found');
        }
        
        expect(projectSelect).not.toBeDisabled();
      }, { timeout: 5000 });

      // Create project
      const projectSelect = screen.getByLabelText('Select project') as HTMLSelectElement;
      fireEvent.change(projectSelect, { target: { value: '__create_new__' } });

      await waitFor(() => {
        expect(screen.getByText('Create New Project')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'New Project' } });

      const createButton = screen.getByText('Create Project');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.queryByText('Create New Project')).not.toBeInTheDocument();
      });
      
      // Wait for project to appear in dropdown and be selected
      await waitFor(() => {
        const projectSelect = screen.getByLabelText('Select project') as HTMLSelectElement;
        expect(projectSelect.value).toBeTruthy();
        createdProjectId = projectSelect.value;
      });

      // Step 3: Create task and assign project
      const createTaskButton = screen.getByText('Create Task');
      fireEvent.click(createTaskButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });

      const submitTaskButton = screen.getByText('Create Task');
      fireEvent.click(submitTaskButton);

      await waitFor(() => {
        expect(createdTaskId).toBeTruthy();
      });

      // Step 4: Verify persistence
      const task = await taskRepository.getById(createdTaskId!);
      expect(task).toBeDefined();
      expect(task?.clientId).toBe(client.id);
      expect(task?.projectId).toBe(createdProjectId);

      const project = await projectRepository.getById(createdProjectId!);
      expect(project).toBeDefined();
      expect(project?.name).toBe('New Project');
      expect(project?.clientId).toBe(client.id);
    });
  });

  describe('project selector disabled state', () => {
    it('disables project selector when no client is selected', () => {
      render(
        <ClientProvider>
          <ProjectProvider>
            <ProjectSelector clientId={null} value={undefined} onChange={jest.fn()} />
          </ProjectProvider>
        </ClientProvider>
      );

      // When disabled, the aria-label is different
      const select = screen.getByLabelText(/select project.*disabled/i) as HTMLSelectElement;
      expect(select).toBeDisabled();
      expect(screen.getByText(/select a client first to choose a project/i)).toBeInTheDocument();
    });
  });

  describe('project list updates when client changes', () => {
    it('updates project list when client changes', async () => {
      const clientRepository = new ClientRepository();
      const projectRepository = new ProjectRepository();

      const client1 = await clientRepository.create({
        name: 'Client 1',
        defaultHourlyRate: null,
        contactInfo: null
      });
      const client2 = await clientRepository.create({
        name: 'Client 2',
        defaultHourlyRate: null,
        contactInfo: null
      });

      await projectRepository.create({
        clientId: client1.id,
        name: 'Project 1',
        description: undefined,
        defaultHourlyRate: null
      });
      await projectRepository.create({
        clientId: client2.id,
        name: 'Project 2',
        description: undefined,
        defaultHourlyRate: null
      });

      const TestComponent = () => {
        const [clientId, setClientId] = React.useState<string | null>(null);
        return (
          <div>
            <ClientSelector value={clientId || undefined} onChange={setClientId} />
            <ProjectSelector clientId={clientId} value={undefined} onChange={() => {}} />
          </div>
        );
      };

      render(
        <ClientProvider>
          <ProjectProvider>
            <TestComponent />
          </ProjectProvider>
        </ClientProvider>
      );

      // Select client 1 - wait for clients to load first
      await waitFor(() => {
        const clientSelect = screen.getByLabelText('Select client') as HTMLSelectElement;
        expect(clientSelect).toBeInTheDocument();
        // Wait for client1 option to appear
        const options = Array.from(clientSelect.options).map(opt => opt.value);
        expect(options).toContain(client1.id);
      });
      const clientSelect1 = screen.getByLabelText('Select client') as HTMLSelectElement;
      const user = userEvent.setup();
      await user.selectOptions(clientSelect1, client1.id);

      // Wait for project selector to become enabled and projects to load
      await waitFor(() => {
        // Check for enabled project selector (not the disabled one)
        const projectSelect = screen.queryByLabelText('Select project') as HTMLSelectElement | null;
        const disabledSelect = screen.queryByLabelText(/select project.*disabled/i);
        
        // Disabled select should be gone
        if (disabledSelect) {
          throw new Error('Disabled project selector still present');
        }
        
        // Enabled select should be present and not disabled
        if (!projectSelect) {
          throw new Error('Project selector not found');
        }
        
        if (projectSelect.disabled) {
          throw new Error('Project selector is still disabled');
        }
        
        // Verify "Create New Project" option exists and projects are loaded
        const options = Array.from(projectSelect.options).map(opt => opt.text);
        if (!options.includes('+ Create New Project')) {
          throw new Error('Create New Project option not found');
        }
        
        // Wait for Project 1 to appear in options
        if (!options.includes('Project 1')) {
          throw new Error('Project 1 not loaded yet');
        }
        
        expect(projectSelect.options.length).toBeGreaterThanOrEqual(3); // "None" + "Create New" + Project 1
      }, { timeout: 5000 });

      // Change to client 2
      const clientSelect2 = screen.getByLabelText('Select client') as HTMLSelectElement;
      await user.selectOptions(clientSelect2, client2.id);

      await waitFor(() => {
        const projectSelect = screen.getByLabelText('Select project') as HTMLSelectElement;
        expect(Array.from(projectSelect.options).map(o => o.text)).toContain('Project 2');
        expect(Array.from(projectSelect.options).map(o => o.text)).not.toContain('Project 1');
      });
    });
  });

  describe('edit project', () => {
    it('edits project and verifies changes persist', async () => {
      const clientRepository = new ClientRepository();
      const projectRepository = new ProjectRepository();

      const client = await clientRepository.create({
        name: 'Test Client',
        defaultHourlyRate: null,
        contactInfo: null
      });

      const project = await projectRepository.create({
        clientId: client.id,
        name: 'Original Name',
        description: 'Original description',
        defaultHourlyRate: null
      });

      const TestComponent = () => {
        const [clientId] = React.useState<string | null>(client.id);
        const [projectId, setProjectId] = React.useState<string | null>(project.id);
        return (
          <ProjectSelector clientId={clientId} value={projectId || undefined} onChange={setProjectId} />
        );
      };

      render(
        <ClientProvider>
          <ProjectProvider>
            <TestComponent />
          </ProjectProvider>
        </ClientProvider>
      );

      await waitFor(() => {
        const editButton = screen.getByLabelText(/edit project/i);
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Project')).toBeInTheDocument();
      });

      // Use getByRole to find the name input field specifically
      const nameInput = screen.getByRole('textbox', { name: /name/i }) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

      const submitButton = screen.getByText('Update Project');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Edit Project')).not.toBeInTheDocument();
      });

      // Verify persistence
      const updatedProject = await projectRepository.getById(project.id);
      expect(updatedProject?.name).toBe('Updated Name');
    });
  });

  describe('delete project', () => {
    it('deletes project with no tasks successfully', async () => {
      const clientRepository = new ClientRepository();
      const projectRepository = new ProjectRepository();

      const client = await clientRepository.create({
        name: 'Test Client',
        defaultHourlyRate: null,
        contactInfo: null
      });

      const project = await projectRepository.create({
        clientId: client.id,
        name: 'Project to Delete',
        description: undefined,
        defaultHourlyRate: null
      });

      const TestComponent = () => {
        const [clientId] = React.useState<string | null>(client.id);
        const [projectId, setProjectId] = React.useState<string | null>(project.id);
        return (
          <ProjectSelector clientId={clientId} value={projectId || undefined} onChange={setProjectId} />
        );
      };

      render(
        <ClientProvider>
          <ProjectProvider>
            <TestComponent />
          </ProjectProvider>
        </ClientProvider>
      );

      await waitFor(() => {
        // Project selector might be disabled initially, so check for either enabled or disabled version
        const projectSelect = screen.queryByLabelText('Select project') || screen.queryByLabelText(/select project.*disabled/i);
        expect(projectSelect).toBeInTheDocument();
      });
      
      // Wait for project to load and edit button to appear
      await waitFor(() => {
        const editButton = screen.getByLabelText(/edit project/i);
        expect(editButton).toBeInTheDocument();
      });
      const editButton = screen.getByLabelText(/edit project/i);
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Project')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Delete Project')).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByRole('button', { name: /delete/i });
      const confirmButton = confirmButtons[confirmButtons.length - 1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText('Delete Project')).not.toBeInTheDocument();
      });

      // Verify deletion
      const deletedProject = await projectRepository.getById(project.id);
      expect(deletedProject).toBeUndefined();
    });

    it('prevents deletion when tasks are assigned', async () => {
      const clientRepository = new ClientRepository();
      const projectRepository = new ProjectRepository();
      const taskRepository = new TaskRepository();
      const columnRepository = new ColumnRepository();

      const client = await clientRepository.create({
        name: 'Test Client',
        defaultHourlyRate: null,
        contactInfo: null
      });

      const project = await projectRepository.create({
        clientId: client.id,
        name: 'Project with Tasks',
        description: undefined,
        defaultHourlyRate: null
      });

      const column = await columnRepository.create({
        name: 'Backlog',
        position: 0
      });

      await taskRepository.create({
        title: 'Test Task',
        columnId: column.id,
        position: 0,
        clientId: client.id,
        projectId: project.id,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });

      const TestComponent = () => {
        const [clientId] = React.useState<string | null>(client.id);
        const [projectId] = React.useState<string | null>(project.id);
        return (
          <ProjectSelector clientId={clientId} value={projectId || undefined} onChange={jest.fn()} />
        );
      };

      render(
        <ClientProvider>
          <ProjectProvider>
            <TestComponent />
          </ProjectProvider>
        </ClientProvider>
      );

      await waitFor(() => {
        const editButton = screen.getByLabelText(/edit project/i);
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Project')).toBeInTheDocument();
      });

      const deleteButton = screen.getByLabelText(/delete project/i);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Delete Project')).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByRole('button', { name: /delete/i });
      const confirmButton = confirmButtons[confirmButtons.length - 1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        const errorAlerts = screen.getAllByRole('alert');
        const modalErrorAlert = errorAlerts.find(alert => 
          alert.className.includes('bg-red-50') && 
          alert.textContent?.includes('Cannot delete project')
        );
        expect(modalErrorAlert).toBeInTheDocument();
        expect(modalErrorAlert).toHaveTextContent(/cannot delete project/i);
        expect(modalErrorAlert).toHaveTextContent(/1 task\(s\) are assigned/i);
      });

      // Verify project still exists
      const projectStillExists = await projectRepository.getById(project.id);
      expect(projectStillExists).toBeDefined();
    });
  });

  describe('project scoping to clients', () => {
    it('cannot select project from different client', async () => {
      const clientRepository = new ClientRepository();
      const projectRepository = new ProjectRepository();

      const client1 = await clientRepository.create({
        name: 'Client 1',
        defaultHourlyRate: null,
        contactInfo: null
      });
      const client2 = await clientRepository.create({
        name: 'Client 2',
        defaultHourlyRate: null,
        contactInfo: null
      });

      const project1 = await projectRepository.create({
        clientId: client1.id,
        name: 'Project 1',
        description: undefined,
        defaultHourlyRate: null
      });
      await projectRepository.create({
        clientId: client2.id,
        name: 'Project 2',
        description: undefined,
        defaultHourlyRate: null
      });

      const TestComponent = () => {
        const [clientId, setClientId] = React.useState<string | null>(client1.id);
        const [projectId, setProjectId] = React.useState<string | null>(project1.id);
        return (
          <div>
            <ClientSelector value={clientId || undefined} onChange={setClientId} />
            <ProjectSelector clientId={clientId} value={projectId || undefined} onChange={setProjectId} />
          </div>
        );
      };

      render(
        <ClientProvider>
          <ProjectProvider>
            <TestComponent />
          </ProjectProvider>
        </ClientProvider>
      );

      // Wait for project selector to load and projects to be available
      await waitFor(() => {
        const projectSelect = screen.getByLabelText('Select project') as HTMLSelectElement;
        expect(projectSelect).toBeInTheDocument();
        // Wait for projects to load (should have at least Project 1)
        expect(projectSelect.options.length).toBeGreaterThan(2);
        // Check that Project 1 is in the options
        const optionValues = Array.from(projectSelect.options).map(opt => opt.value);
        expect(optionValues).toContain(project1.id);
      });
      
      // Wait for the project to be selected (value prop should set it)
      // Note: The value might be empty initially if projects haven't loaded,
      // but once they load and the value prop matches an option, it should be set
      await waitFor(() => {
        const projectSelect = screen.getByLabelText('Select project') as HTMLSelectElement;
        // The value should match project1.id once everything is loaded
        expect(projectSelect.value).toBe(project1.id);
      }, { timeout: 3000 });

      // Change client
      const clientSelect = screen.getByLabelText('Select client') as HTMLSelectElement;
      fireEvent.change(clientSelect, { target: { value: client2.id } });

      // Project selection should be reset
      await waitFor(() => {
        const projectSelect = screen.getByLabelText('Select project') as HTMLSelectElement;
        expect(projectSelect.value).toBe(''); // Reset to "None"
        expect(Array.from(projectSelect.options).map(o => o.text)).toContain('Project 2');
        expect(Array.from(projectSelect.options).map(o => o.text)).not.toContain('Project 1');
      });
    });
  });
});
