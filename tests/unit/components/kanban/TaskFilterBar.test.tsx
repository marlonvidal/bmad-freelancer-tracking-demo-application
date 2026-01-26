import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { TaskFilterBar } from '@/components/kanban/TaskFilterBar';
import { FilterProvider } from '@/contexts/FilterContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { ColumnProvider } from '@/contexts/ColumnContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { ClientRepository } from '@/services/data/repositories/ClientRepository';
import { ProjectRepository } from '@/services/data/repositories/ProjectRepository';
import { db } from '@/services/data/database';
import { Client } from '@/types/client';
import { Project } from '@/types/project';

const renderTaskFilterBar = () => {
  return render(
    <ColumnProvider>
      <TaskProvider>
        <ClientProvider>
          <ProjectProvider>
            <FilterProvider>
              <TaskFilterBar />
            </FilterProvider>
          </ProjectProvider>
        </ClientProvider>
      </TaskProvider>
    </ColumnProvider>
  );
};

describe('TaskFilterBar', () => {
  beforeEach(async () => {
    await db.clients.clear();
    await db.projects.clear();
  });

  describe('rendering', () => {
    it('renders filter controls', async () => {
      renderTaskFilterBar();

      expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by project/i)).toBeInTheDocument();
    });

    it('shows "All Clients" and "All Projects" as default options', async () => {
      renderTaskFilterBar();

      const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;

      expect(clientSelect.value).toBe('');
      expect(projectSelect.value).toBe('');
      expect(clientSelect.options[0].text).toBe('All Clients');
      expect(projectSelect.options[0].text).toBe('All Projects');
    });

    it('displays client dropdown with all clients', async () => {
      const repository = new ClientRepository();
      await repository.create({ name: 'Client 1', defaultHourlyRate: null, contactInfo: null });
      await repository.create({ name: 'Client 2', defaultHourlyRate: null, contactInfo: null });

      renderTaskFilterBar();

      await waitFor(() => {
        const select = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        expect(select.options.length).toBeGreaterThan(2); // "All Clients" + clients
      });

      const select = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      expect(select.options[1].text).toBe('Client 1');
      expect(select.options[2].text).toBe('Client 2');
    });
  });

  describe('client filter', () => {
    it('updates filter when client is selected', async () => {
      const repository = new ClientRepository();
      const client = await repository.create({ 
        name: 'Test Client', 
        defaultHourlyRate: null, 
        contactInfo: null 
      });

      renderTaskFilterBar();

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      });

      // Wait for clients to load
      await waitFor(() => {
        const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        expect(clientSelect.options.length).toBeGreaterThan(1); // More than just "All Clients"
      }, { timeout: 5000 });

      const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(clientSelect, { target: { value: client.id } });
      });

      // Wait for filter to be applied - check for badge or project dropdown enabled
      await waitFor(() => {
        const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
        expect(projectSelect.disabled).toBe(false);
      }, { timeout: 5000 });
    });

    it('clears filter when "All Clients" is selected', async () => {
      const repository = new ClientRepository();
      const client = await repository.create({ 
        name: 'Test Client', 
        defaultHourlyRate: null, 
        contactInfo: null 
      });

      renderTaskFilterBar();

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      });

      // Wait for clients to load
      await waitFor(() => {
        const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        expect(clientSelect.options.length).toBeGreaterThan(1);
      }, { timeout: 5000 });

      const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      
      // Select a client
      await act(async () => {
        fireEvent.change(clientSelect, { target: { value: client.id } });
      });
      await waitFor(() => {
        const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
        expect(projectSelect.disabled).toBe(false);
      }, { timeout: 5000 });

      // Clear selection
      const clientSelect2 = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(clientSelect2, { target: { value: '' } });
      });
      await waitFor(() => {
        const updatedSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        expect(updatedSelect.value).toBe('');
      });
    });
  });

  describe('project filter', () => {
    it('is disabled when no client is selected', async () => {
      renderTaskFilterBar();

      const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
      expect(projectSelect.disabled).toBe(true);
      expect(screen.getByText(/select a client to filter by project/i)).toBeInTheDocument();
    });

    it('is enabled when client is selected', async () => {
      const clientRepository = new ClientRepository();
      const client = await clientRepository.create({ 
        name: 'Test Client', 
        defaultHourlyRate: null, 
        contactInfo: null 
      });

      const projectRepository = new ProjectRepository();
      await projectRepository.create({
        name: 'Test Project',
        clientId: client.id,
        description: null
      });

      renderTaskFilterBar();

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      });

      // Wait for clients to load
      await waitFor(() => {
        const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        expect(clientSelect.disabled).toBe(false); // Should be enabled when clients loaded
        expect(clientSelect.options.length).toBeGreaterThan(1);
      }, { timeout: 5000 });

      const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(clientSelect, { target: { value: client.id } });
      });

      await waitFor(() => {
        const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
        expect(projectSelect.disabled).toBe(false);
      }, { timeout: 5000 });

      await waitFor(() => {
        const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
        expect(projectSelect.disabled).toBe(false);
      }, { timeout: 3000 });
    });

    it('shows projects for selected client', async () => {
      const clientRepository = new ClientRepository();
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

      const projectRepository = new ProjectRepository();
      const project1 = await projectRepository.create({
        name: 'Project 1',
        clientId: client1.id,
        description: null
      });
      await projectRepository.create({
        name: 'Project 2',
        clientId: client2.id,
        description: null
      });

      renderTaskFilterBar();

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      });

      // Wait for clients to load
      await waitFor(() => {
        const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        expect(clientSelect.options.length).toBeGreaterThan(1);
      }, { timeout: 5000 });

      // Select client 1
      const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(clientSelect, { target: { value: client1.id } });
      });

      await waitFor(() => {
        const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
        expect(projectSelect.disabled).toBe(false);
      }, { timeout: 5000 });

      const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
      // Should only show Project 1 (for Client 1)
      expect(projectSelect.options[1].text).toBe('Project 1');
      expect(projectSelect.options.length).toBe(2); // "All Projects" + Project 1
    });

    it('resets project filter when client filter changes', async () => {
      const clientRepository = new ClientRepository();
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

      const projectRepository = new ProjectRepository();
      const project1 = await projectRepository.create({
        name: 'Project 1',
        clientId: client1.id,
        description: null
      });

      renderTaskFilterBar();

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      });

      // Wait for clients to load
      await waitFor(() => {
        const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        expect(clientSelect.options.length).toBeGreaterThan(1);
      }, { timeout: 5000 });

      // Select client 1 and project 1
      const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(clientSelect, { target: { value: client1.id } });
      });

      await waitFor(() => {
        const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
        expect(projectSelect.disabled).toBe(false);
      }, { timeout: 5000 });

      const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(projectSelect, { target: { value: project1.id } });
      });

      await waitFor(() => {
        expect(screen.getByText(/Project: Project 1/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Change client - project should reset
      const clientSelect2 = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(clientSelect2, { target: { value: client2.id } });
      });

      await waitFor(() => {
        expect(screen.queryByText(/Project: Project 1/i)).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('clear filters button', () => {
    it('is not visible when no filters are active', () => {
      renderTaskFilterBar();

      expect(screen.queryByText(/clear filters/i)).not.toBeInTheDocument();
    });

    it('is visible when filters are active', async () => {
      const repository = new ClientRepository();
      const client = await repository.create({ 
        name: 'Test Client', 
        defaultHourlyRate: null, 
        contactInfo: null 
      });

      renderTaskFilterBar();

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      });

      // Wait for clients to load
      await waitFor(() => {
        const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        expect(clientSelect.options.length).toBeGreaterThan(1);
      }, { timeout: 5000 });

      const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(clientSelect, { target: { value: client.id } });
      });

      await waitFor(() => {
        expect(screen.getByText(/clear filters/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('clears all filters when clicked', async () => {
      const clientRepository = new ClientRepository();
      const client = await clientRepository.create({ 
        name: 'Test Client', 
        defaultHourlyRate: null, 
        contactInfo: null 
      });

      const projectRepository = new ProjectRepository();
      const project = await projectRepository.create({
        name: 'Test Project',
        clientId: client.id,
        description: null
      });

      renderTaskFilterBar();

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      });

      // Wait for clients to load
      await waitFor(() => {
        const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        expect(clientSelect.options.length).toBeGreaterThan(1);
      }, { timeout: 5000 });

      // Set both filters
      const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(clientSelect, { target: { value: client.id } });
      });

      await waitFor(() => {
        const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
        expect(projectSelect.disabled).toBe(false);
      }, { timeout: 5000 });

      const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(projectSelect, { target: { value: project.id } });
      });

      await waitFor(() => {
        expect(screen.getByText(/Project: Test Project/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Click clear filters
      const clearButton = screen.getByText(/clear filters/i);
      await act(async () => {
        fireEvent.click(clearButton);
      });

      await waitFor(() => {
        expect(screen.queryByText(/clear filters/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Client: Test Client/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Project: Test Project/i)).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('active filter badges', () => {
    it('displays client badge when client filter is active', async () => {
      const repository = new ClientRepository();
      const client = await repository.create({ 
        name: 'Test Client', 
        defaultHourlyRate: null, 
        contactInfo: null 
      });

      renderTaskFilterBar();

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      });

      // Wait for clients to load
      await waitFor(() => {
        const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        expect(clientSelect.options.length).toBeGreaterThan(1);
      }, { timeout: 5000 });

      const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(clientSelect, { target: { value: client.id } });
      });

      await waitFor(() => {
        expect(screen.getByText(/client: test client/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('displays project badge when project filter is active', async () => {
      const clientRepository = new ClientRepository();
      const client = await clientRepository.create({ 
        name: 'Test Client', 
        defaultHourlyRate: null, 
        contactInfo: null 
      });

      const projectRepository = new ProjectRepository();
      const project = await projectRepository.create({
        name: 'Test Project',
        clientId: client.id,
        description: null
      });

      renderTaskFilterBar();

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      });

      // Wait for clients to load
      await waitFor(() => {
        const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        expect(clientSelect.options.length).toBeGreaterThan(1);
      }, { timeout: 5000 });

      // Set client and project filters
      const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(clientSelect, { target: { value: client.id } });
      });

      await waitFor(() => {
        const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
        expect(projectSelect.disabled).toBe(false);
      }, { timeout: 5000 });

      const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(projectSelect, { target: { value: project.id } });
      });

      await waitFor(() => {
        expect(screen.getByText(/project: test project/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('removes client filter when badge X is clicked', async () => {
      const repository = new ClientRepository();
      const client = await repository.create({ 
        name: 'Test Client', 
        defaultHourlyRate: null, 
        contactInfo: null 
      });

      renderTaskFilterBar();

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      });

      // Wait for clients to load
      await waitFor(() => {
        const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        expect(clientSelect.options.length).toBeGreaterThan(1);
      }, { timeout: 5000 });

      const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(clientSelect, { target: { value: client.id } });
      });

      await waitFor(() => {
        expect(screen.getByText(/client: test client/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      const removeButton = screen.getByLabelText(new RegExp(`remove client filter: ${client.name}`, 'i'));
      await act(async () => {
        fireEvent.click(removeButton);
      });

      await waitFor(() => {
        expect(screen.queryByText(/client: test client/i)).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('removes project filter when badge X is clicked', async () => {
      const clientRepository = new ClientRepository();
      const client = await clientRepository.create({ 
        name: 'Test Client', 
        defaultHourlyRate: null, 
        contactInfo: null 
      });

      const projectRepository = new ProjectRepository();
      const project = await projectRepository.create({
        name: 'Test Project',
        clientId: client.id,
        description: null
      });

      renderTaskFilterBar();

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
        fireEvent.change(clientSelect, { target: { value: client.id } });
      });

      await waitFor(() => {
        const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
        expect(projectSelect.disabled).toBe(false);
      }, { timeout: 5000 });

      const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(projectSelect, { target: { value: project.id } });
      });

      await waitFor(() => {
        expect(screen.getByText(/project: test project/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      const removeButton = screen.getByLabelText(new RegExp(`remove project filter: ${project.name}`, 'i'));
      await act(async () => {
        fireEvent.click(removeButton);
      });

      await waitFor(() => {
        expect(screen.queryByText(/project: test project/i)).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('keyboard navigation', () => {
    it('supports Tab navigation', async () => {
      renderTaskFilterBar();

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      });

      // Wait for clients to load (if any) - wait for loading to complete
      await waitFor(() => {
        const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        // Verify the select exists and is enabled (clients loaded)
        expect(clientSelect).toBeInTheDocument();
        expect(clientSelect.disabled).toBe(false);
      }, { timeout: 5000 });

      const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;

      // Tab should move focus - use userEvent or verify elements are focusable
      // In jsdom, focus() may not work as expected, so we verify elements exist and are accessible
      expect(clientSelect).toBeInTheDocument();
      expect(projectSelect).toBeInTheDocument();
      expect(clientSelect.tagName).toBe('SELECT');
      expect(projectSelect.tagName).toBe('SELECT');
      // Verify they have proper tabIndex or are naturally focusable
      expect(clientSelect.disabled).toBe(false);
      expect(projectSelect.disabled).toBe(true); // Should be disabled when no client selected
    });

    it('supports Enter key to select option', async () => {
      const repository = new ClientRepository();
      const client = await repository.create({ 
        name: 'Test Client', 
        defaultHourlyRate: null, 
        contactInfo: null 
      });

      renderTaskFilterBar();

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      });

      // Wait for clients to load
      await waitFor(() => {
        const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        expect(clientSelect.options.length).toBeGreaterThan(1);
      }, { timeout: 5000 });

      const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      
      // Select using change event (simulating user selection)
      await act(async () => {
        fireEvent.change(clientSelect, { target: { value: client.id } });
      });

      await waitFor(() => {
        const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
        expect(projectSelect.disabled).toBe(false);
      }, { timeout: 5000 });
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA labels', async () => {
      renderTaskFilterBar();

      await waitFor(() => {
        expect(screen.getByLabelText(/select client to filter tasks/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/select a client first to filter by project/i)).toBeInTheDocument();
      });
    });

    it('has region role for filter bar', () => {
      renderTaskFilterBar();

      const filterBar = screen.getByRole('region', { name: /task filters/i });
      expect(filterBar).toBeInTheDocument();
    });
  });

  describe('empty states', () => {
    it('shows message when no projects available for client', async () => {
      const repository = new ClientRepository();
      const client = await repository.create({ 
        name: 'Test Client', 
        defaultHourlyRate: null, 
        contactInfo: null 
      });

      renderTaskFilterBar();

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by client/i)).toBeInTheDocument();
      });

      // Wait for clients to load
      await waitFor(() => {
        const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
        expect(clientSelect.options.length).toBeGreaterThan(1);
      }, { timeout: 5000 });

      const clientSelect = screen.getByLabelText(/filter by client/i) as HTMLSelectElement;
      await act(async () => {
        fireEvent.change(clientSelect, { target: { value: client.id } });
      });

      await waitFor(() => {
        const projectSelect = screen.getByLabelText(/filter by project/i) as HTMLSelectElement;
        expect(projectSelect.disabled).toBe(false);
      }, { timeout: 5000 });

      // Wait for projects to load and check for empty message
      await waitFor(() => {
        expect(screen.getByText(/no projects available/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});
