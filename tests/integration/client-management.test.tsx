import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClientProvider } from '@/contexts/ClientContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { ColumnProvider } from '@/contexts/ColumnContext';
import { ClientSelector } from '@/components/client/ClientSelector';
import { TaskForm } from '@/components/task/TaskForm';
import { ClientRepository } from '@/services/data/repositories/ClientRepository';
import { TaskRepository } from '@/services/data/repositories/TaskRepository';
import { ColumnRepository } from '@/services/data/repositories/ColumnRepository';
import { db } from '@/services/data/database';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ColumnProvider>
      <TaskProvider>
        <ClientProvider>
          {component}
        </ClientProvider>
      </TaskProvider>
    </ColumnProvider>
  );
};

describe('Client Management Integration Tests', () => {
  let testColumnId: string;

  beforeEach(async () => {
    await db.clients.clear();
    await db.tasks.clear();
    await db.columns.clear();

    // Create a test column
    const columnRepository = new ColumnRepository();
    const column = await columnRepository.create({
      name: 'Test Column',
      position: 0,
      color: null
    });
    testColumnId = column.id;
  });

  describe('complete workflow: create client from TaskForm → assign to task → verify persistence', () => {
    it('creates client from TaskForm and assigns to task', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      const onCancel = jest.fn();

      renderWithProviders(
        <TaskForm
          initialColumnId={testColumnId}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      // Fill task title
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });

      // Open client selector and create new client
      const clientSelect = screen.getByLabelText(/client/i) as HTMLSelectElement;
      fireEvent.change(clientSelect, { target: { value: '__create_new__' } });

      // Wait for create modal
      await waitFor(() => {
        expect(screen.getByText('Create New Client')).toBeInTheDocument();
      });

      // Fill client form
      const clientNameInput = screen.getByLabelText(/name/i);
      fireEvent.change(clientNameInput, { target: { value: 'New Client' } });

      // Submit client creation
      const createClientButton = screen.getByText('Create Client');
      fireEvent.click(createClientButton);

      // Wait for modal to close and client to be created
      await waitFor(() => {
        expect(screen.queryByText('Create New Client')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify client appears in dropdown
      await waitFor(() => {
        const updatedSelect = screen.getByLabelText(/client/i) as HTMLSelectElement;
        const options = Array.from(updatedSelect.options).map(opt => opt.text);
        expect(options).toContain('New Client');
      });

      // Submit task form
      const createTaskButton = screen.getByText('Create Task');
      fireEvent.click(createTaskButton);

      // Verify task was created with client assigned
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      const submittedData = onSubmit.mock.calls[0][0];
      expect(submittedData.title).toBe('Test Task');
      expect(submittedData.clientId).toBeTruthy();

      // Verify client persists in database
      const clientRepository = new ClientRepository();
      const clients = await clientRepository.getAll();
      expect(clients.length).toBe(1);
      expect(clients[0].name).toBe('New Client');
    });
  });

  describe('edit client from dropdown → verify changes persist', () => {
    it('edits client and changes persist', async () => {
      // Create a client
      const clientRepository = new ClientRepository();
      const client = await clientRepository.create({
        name: 'Original Name',
        defaultHourlyRate: 100,
        contactInfo: 'original@example.com'
      });

      const onChange = jest.fn();
      renderWithProviders(
        <ClientSelector value={client.id} onChange={onChange} />
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getByLabelText(/edit client/i);
      fireEvent.click(editButton);

      // Wait for edit modal
      await waitFor(() => {
        expect(screen.getByText('Edit Client')).toBeInTheDocument();
      });

      // Update client name
      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Original Name');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

      // Submit update
      const updateButton = screen.getByText('Update Client');
      fireEvent.click(updateButton);

      // Wait for modal to close
      await waitFor(() => {
        expect(screen.queryByText('Edit Client')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify changes persisted
      const updatedClient = await clientRepository.getById(client.id);
      expect(updatedClient?.name).toBe('Updated Name');
      expect(updatedClient?.defaultHourlyRate).toBe(100);
      expect(updatedClient?.contactInfo).toBe('original@example.com');
    });
  });

  describe('delete client with no tasks → verify deletion succeeds', () => {
    it('deletes client when no tasks are assigned', async () => {
      // Create a client
      const clientRepository = new ClientRepository();
      const client = await clientRepository.create({
        name: 'Client to Delete',
        defaultHourlyRate: null,
        contactInfo: null
      });

      const onChange = jest.fn();
      renderWithProviders(
        <ClientSelector value={client.id} onChange={onChange} />
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getByLabelText(/edit client/i);
      fireEvent.click(editButton);

      // Wait for edit modal
      await waitFor(() => {
        expect(screen.getByText('Edit Client')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      // Wait for confirmation dialog
      await waitFor(() => {
        expect(screen.getByText('Delete Client')).toBeInTheDocument();
      });

      // Confirm deletion
      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);

      // Wait for dialogs to close
      await waitFor(() => {
        expect(screen.queryByText('Delete Client')).not.toBeInTheDocument();
        expect(screen.queryByText('Edit Client')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify client was deleted
      const deletedClient = await clientRepository.getById(client.id);
      expect(deletedClient).toBeUndefined();

      // Verify onChange was called with null
      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  describe('delete client with tasks → verify deletion prevented with warning', () => {
    it('prevents deletion when tasks are assigned', async () => {
      // Create a client
      const clientRepository = new ClientRepository();
      const client = await clientRepository.create({
        name: 'Client with Tasks',
        defaultHourlyRate: null,
        contactInfo: null
      });

      // Create a task assigned to this client
      const taskRepository = new TaskRepository();
      await taskRepository.create({
        title: 'Test Task',
        columnId: testColumnId,
        clientId: client.id,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });

      const onChange = jest.fn();
      renderWithProviders(
        <ClientSelector value={client.id} onChange={onChange} />
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
      });

      // Click edit button
      const editButton = screen.getByLabelText(/edit client/i);
      fireEvent.click(editButton);

      // Wait for edit modal
      await waitFor(() => {
        expect(screen.getByText('Edit Client')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      // Wait for confirmation dialog
      await waitFor(() => {
        expect(screen.getByText('Delete Client')).toBeInTheDocument();
      });

      // Confirm deletion
      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/cannot delete client/i)).toBeInTheDocument();
        expect(screen.getByText(/1 task\(s\) are assigned/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify client was NOT deleted
      const clientStillExists = await clientRepository.getById(client.id);
      expect(clientStillExists).toBeDefined();
      expect(clientStillExists?.name).toBe('Client with Tasks');
    });
  });

  describe('client list persists across page refresh', () => {
    it('maintains client data after component remount', async () => {
      // Create a client
      const clientRepository = new ClientRepository();
      const client = await clientRepository.create({
        name: 'Persistent Client',
        defaultHourlyRate: 75,
        contactInfo: 'persistent@example.com'
      });

      // Render component
      const { unmount } = renderWithProviders(
        <ClientSelector value={client.id} onChange={() => {}} />
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
      });

      // Unmount component (simulating page refresh)
      unmount();

      // Re-render component
      renderWithProviders(
        <ClientSelector value={client.id} onChange={() => {}} />
      );

      // Verify client still exists and is displayed
      await waitFor(() => {
        const select = screen.getByLabelText(/client/i) as HTMLSelectElement;
        expect(select.value).toBe(client.id);
      });

      // Verify client data persisted in database
      const persistedClient = await clientRepository.getById(client.id);
      expect(persistedClient).toBeDefined();
      expect(persistedClient?.name).toBe('Persistent Client');
      expect(persistedClient?.defaultHourlyRate).toBe(75);
      expect(persistedClient?.contactInfo).toBe('persistent@example.com');
    });
  });
});
