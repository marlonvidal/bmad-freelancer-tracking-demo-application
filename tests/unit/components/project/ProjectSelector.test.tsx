import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectSelector } from '@/components/project/ProjectSelector';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { ProjectRepository } from '@/services/data/repositories/ProjectRepository';
import { ClientRepository } from '@/services/data/repositories/ClientRepository';
import { db } from '@/services/data/database';
import { Project } from '@/types/project';

const renderProjectSelector = (
  props: {
    clientId: string | null;
    value?: string;
    onChange?: (projectId: string | null) => void;
    onCreateNew?: () => void;
  }
) => {
  const defaultOnChange = jest.fn();
  const defaultOnCreateNew = jest.fn();

  return render(
    <ClientProvider>
      <ProjectProvider>
        <ProjectSelector
          clientId={props.clientId}
          value={props.value}
          onChange={props.onChange || defaultOnChange}
          onCreateNew={props.onCreateNew || defaultOnCreateNew}
        />
      </ProjectProvider>
    </ClientProvider>
  );
};

describe('ProjectSelector', () => {
  let testClientId: string;

  beforeEach(async () => {
    await db.projects.clear();
    await db.clients.clear();

    // Create a test client
    const clientRepository = new ClientRepository();
    const testClient = await clientRepository.create({
      name: 'Test Client',
      defaultHourlyRate: null,
      contactInfo: null
    });
    testClientId = testClient.id;
  });

  describe('rendering', () => {
    it('shows disabled state when clientId is null', () => {
      renderProjectSelector({ clientId: null });

      const select = screen.getByLabelText(/project/i) as HTMLSelectElement;
      expect(select).toBeDisabled();
      expect(select.options[0].text).toBe('Select a client first');
      expect(screen.getByText(/select a client first to choose a project/i)).toBeInTheDocument();
    });

    it('renders dropdown with project list when clientId is set', async () => {
      const repository = new ProjectRepository();
      await repository.create({
        clientId: testClientId,
        name: 'Project 1',
        description: undefined,
        defaultHourlyRate: null
      });
      await repository.create({
        clientId: testClientId,
        name: 'Project 2',
        description: undefined,
        defaultHourlyRate: null
      });

      renderProjectSelector({ clientId: testClientId });

      await waitFor(() => {
        const select = screen.getByLabelText(/project/i) as HTMLSelectElement;
        expect(select).toBeInTheDocument();
        expect(select.options.length).toBeGreaterThan(2); // "None" + "Create New" + projects
      });

      expect(screen.getByText('+ Create New Project')).toBeInTheDocument();
    });

    it('displays projects sorted alphabetically', async () => {
      const repository = new ProjectRepository();
      await repository.create({
        clientId: testClientId,
        name: 'Zebra Project',
        description: undefined,
        defaultHourlyRate: null
      });
      await repository.create({
        clientId: testClientId,
        name: 'Alpha Project',
        description: undefined,
        defaultHourlyRate: null
      });
      await repository.create({
        clientId: testClientId,
        name: 'Beta Project',
        description: undefined,
        defaultHourlyRate: null
      });

      renderProjectSelector({ clientId: testClientId });

      await waitFor(() => {
        const select = screen.getByLabelText(/project/i) as HTMLSelectElement;
        // Wait for projects to load (should have at least 3 projects + "None" + "Create New")
        expect(select.options.length).toBeGreaterThanOrEqual(5);
      });

      const select = screen.getByLabelText(/project/i) as HTMLSelectElement;
      const options = Array.from(select.options).map(opt => opt.text);

      // Check alphabetical order (after "None" and "Create New Project")
      const projectOptions = options.slice(2);
      expect(projectOptions).toEqual(['Alpha Project', 'Beta Project', 'Zebra Project']);
    });

    it('shows "None" as default when no value provided', async () => {
      renderProjectSelector({ clientId: testClientId });

      await waitFor(() => {
        const select = screen.getByLabelText(/project/i) as HTMLSelectElement;
        expect(select.value).toBe('');
      });
    });

    it('pre-selects project when value provided', async () => {
      const repository = new ProjectRepository();
      const project = await repository.create({
        clientId: testClientId,
        name: 'Test Project',
        description: undefined,
        defaultHourlyRate: null
      });

      renderProjectSelector({ clientId: testClientId, value: project.id });

      await waitFor(() => {
        const select = screen.getByLabelText(/select project/i) as HTMLSelectElement;
        expect(select.value).toBe(project.id);
      });
    });

    it('shows edit button when project is selected', async () => {
      const repository = new ProjectRepository();
      const project = await repository.create({
        clientId: testClientId,
        name: 'Test Project',
        description: undefined,
        defaultHourlyRate: null
      });

      renderProjectSelector({ clientId: testClientId, value: project.id });

      await waitFor(() => {
        expect(screen.getByLabelText(/edit project/i)).toBeInTheDocument();
      });
    });

    it('does not show edit button when no project is selected', async () => {
      renderProjectSelector({ clientId: testClientId });

      await waitFor(() => {
        expect(screen.queryByLabelText(/edit project/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('project selection', () => {
    it('calls onChange when project is selected', async () => {
      const repository = new ProjectRepository();
      const project = await repository.create({
        clientId: testClientId,
        name: 'Test Project',
        description: undefined,
        defaultHourlyRate: null
      });

      const onChange = jest.fn();
      renderProjectSelector({ clientId: testClientId, onChange });

      await waitFor(() => {
        const select = screen.getByLabelText(/select project/i) as HTMLSelectElement;
        expect(select.options.length).toBeGreaterThan(2); // Wait for projects to load
      });

      const select = screen.getByLabelText(/select project/i) as HTMLSelectElement;
      fireEvent.change(select, { target: { value: project.id } });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(project.id);
      });
    });

    it('calls onChange with null when "None" is selected', async () => {
      const repository = new ProjectRepository();
      const project = await repository.create({
        clientId: testClientId,
        name: 'Test Project',
        description: undefined,
        defaultHourlyRate: null
      });

      const onChange = jest.fn();
      renderProjectSelector({ clientId: testClientId, value: project.id, onChange });

      await waitFor(() => {
        const select = screen.getByLabelText(/project/i) as HTMLSelectElement;
        fireEvent.change(select, { target: { value: '' } });
      });

      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('resets selection when clientId changes', async () => {
      const repository = new ProjectRepository();
      const project = await repository.create({
        clientId: testClientId,
        name: 'Test Project',
        description: undefined,
        defaultHourlyRate: null
      });

      const onChange = jest.fn();
      const { rerender } = renderProjectSelector({
        clientId: testClientId,
        value: project.id,
        onChange
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/project/i)).toBeInTheDocument();
      });

      // Change clientId to null
      rerender(
        <ClientProvider>
          <ProjectProvider>
            <ProjectSelector
              clientId={null}
              value={project.id}
              onChange={onChange}
            />
          </ProjectProvider>
        </ClientProvider>
      );

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(null);
      });
    });
  });

  describe('create new project', () => {
    it('opens create modal when "Create New Project" is selected', async () => {
      const onCreateNew = jest.fn();
      renderProjectSelector({ clientId: testClientId, onCreateNew });

      await waitFor(() => {
        const select = screen.getByLabelText(/project/i) as HTMLSelectElement;
        fireEvent.change(select, { target: { value: '__create_new__' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Create New Project')).toBeInTheDocument();
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      });

      expect(onCreateNew).toHaveBeenCalled();
    });

    it('does not show "Create New Project" option when clientId is null', () => {
      renderProjectSelector({ clientId: null });

      const select = screen.getByLabelText(/project/i) as HTMLSelectElement;
      const options = Array.from(select.options).map(opt => opt.text);
      expect(options).not.toContain('+ Create New Project');
    });

    it('creates project and updates dropdown immediately', async () => {
      renderProjectSelector({ clientId: testClientId });

      await waitFor(() => {
        const select = screen.getByLabelText(/project/i) as HTMLSelectElement;
        fireEvent.change(select, { target: { value: '__create_new__' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Create New Project')).toBeInTheDocument();
      });

      // Fill form
      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'New Project' } });

      // Submit form
      const submitButton = screen.getByText('Create Project');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Create New Project')).not.toBeInTheDocument();
        const select = screen.getByLabelText(/project/i) as HTMLSelectElement;
        expect(select.options).toHaveLength(3); // "None" + "Create New" + new project
      });
    });

    it('validates name is required', async () => {
      renderProjectSelector({ clientId: testClientId });

      await waitFor(() => {
        const select = screen.getByLabelText(/project/i) as HTMLSelectElement;
        fireEvent.change(select, { target: { value: '__create_new__' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Create New Project')).toBeInTheDocument();
      });

      // Try to submit without name
      const submitButton = screen.getByText('Create Project');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
    });

    it('closes create modal on cancel', async () => {
      renderProjectSelector({ clientId: testClientId });

      await waitFor(() => {
        const select = screen.getByLabelText(/project/i) as HTMLSelectElement;
        fireEvent.change(select, { target: { value: '__create_new__' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Create New Project')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Create New Project')).not.toBeInTheDocument();
      });
    });
  });

  describe('edit project', () => {
    it('opens edit modal when edit button is clicked', async () => {
      const repository = new ProjectRepository();
      const project = await repository.create({
        clientId: testClientId,
        name: 'Test Project',
        description: 'Test description',
        defaultHourlyRate: null
      });

      renderProjectSelector({ clientId: testClientId, value: project.id });

      await waitFor(() => {
        const editButton = screen.getByLabelText(/edit project/i);
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Project')).toBeInTheDocument();
      });

      // Use getByRole to find the name input field specifically
      const nameInput = screen.getByRole('textbox', { name: /name/i }) as HTMLInputElement;
      await waitFor(() => {
        expect(nameInput.value).toBe('Test Project');
      });
    });

    it('updates project on save', async () => {
      const repository = new ProjectRepository();
      const project = await repository.create({
        clientId: testClientId,
        name: 'Original Name',
        description: 'Original description',
        defaultHourlyRate: null
      });

      renderProjectSelector({ clientId: testClientId, value: project.id });

      await waitFor(() => {
        const editButton = screen.getByLabelText(/edit project/i);
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Project')).toBeInTheDocument();
      });

      // Update name - use getByRole to find the name input field specifically
      const nameInput = screen.getByRole('textbox', { name: /name/i }) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

      // Submit
      const submitButton = screen.getByText('Update Project');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Edit Project')).not.toBeInTheDocument();
      });

      // Use more specific query - get the select by its ID
      const select = screen.getByLabelText('Select project') as HTMLSelectElement;
      await waitFor(() => {
        expect(select.options[select.selectedIndex].text).toBe('Updated Name');
      });
    });
  });

  describe('delete project', () => {
    it('shows confirmation dialog when delete is clicked', async () => {
      const repository = new ProjectRepository();
      const project = await repository.create({
        clientId: testClientId,
        name: 'Project to Delete',
        description: undefined,
        defaultHourlyRate: null
      });

      renderProjectSelector({ clientId: testClientId, value: project.id });

      await waitFor(() => {
        const editButton = screen.getByLabelText(/edit project/i);
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Project')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Delete Project')).toBeInTheDocument();
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });
    });

    it('prevents deletion when tasks are assigned', async () => {
      const repository = new ProjectRepository();
      const project = await repository.create({
        clientId: testClientId,
        name: 'Project with Tasks',
        description: undefined,
        defaultHourlyRate: null
      });

      // Create a task assigned to this project
      const { TaskRepository } = await import('@/services/data/repositories/TaskRepository');
      const taskRepository = new TaskRepository();
      await taskRepository.create({
        title: 'Test Task',
        columnId: 'column-1',
        position: 0,
        clientId: testClientId,
        projectId: project.id,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });

      renderProjectSelector({ clientId: testClientId, value: project.id });

      await waitFor(() => {
        const editButton = screen.getByLabelText(/edit project/i);
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Project')).toBeInTheDocument();
      });

      // Use more specific query - get the delete button in the edit modal header
      const deleteButton = screen.getByLabelText(/delete project/i);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Delete Project')).toBeInTheDocument();
      });

      // Get the confirm button in the confirmation dialog (not the header delete button)
      // The confirm button has aria-label="Delete" from ConfirmDialog
      const confirmButtons = screen.getAllByRole('button', { name: /delete/i });
      // The last one should be the confirm button in the dialog
      const confirmButton = confirmButtons[confirmButtons.length - 1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        // There are multiple alerts - get the one in the modal (the div with red background)
        const errorAlerts = screen.getAllByRole('alert');
        const modalErrorAlert = errorAlerts.find(alert => 
          alert.className.includes('bg-red-50') && 
          alert.textContent?.includes('Cannot delete project')
        );
        expect(modalErrorAlert).toBeInTheDocument();
        expect(modalErrorAlert).toHaveTextContent(/cannot delete project/i);
        expect(modalErrorAlert).toHaveTextContent(/1 task\(s\) are assigned/i);
      });
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA labels', async () => {
      renderProjectSelector({ clientId: testClientId });

      await waitFor(() => {
        const select = screen.getByLabelText(/project/i);
        expect(select).toHaveAttribute('aria-label', 'Select project');
      });
    });

    it('supports keyboard navigation', async () => {
      renderProjectSelector({ clientId: testClientId });

      await waitFor(() => {
        const select = screen.getByLabelText(/project/i) as HTMLSelectElement;
        select.focus();
        expect(document.activeElement).toBe(select);
      });
    });
  });
});
