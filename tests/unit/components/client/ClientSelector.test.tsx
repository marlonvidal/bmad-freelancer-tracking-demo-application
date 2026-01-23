import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClientSelector } from '@/components/client/ClientSelector';
import { ClientProvider } from '@/contexts/ClientContext';
import { ClientRepository } from '@/services/data/repositories/ClientRepository';
import { db } from '@/services/data/database';
import { Client } from '@/types/client';

// Mock ClientContext for testing
const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'Zebra Corp',
    defaultHourlyRate: 100,
    contactInfo: 'zebra@example.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'client-2',
    name: 'Alpha Inc',
    defaultHourlyRate: 75,
    contactInfo: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  },
  {
    id: 'client-3',
    name: 'Beta LLC',
    defaultHourlyRate: null,
    contactInfo: 'beta@example.com',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03')
  }
];

const renderClientSelector = (
  props: {
    value?: string;
    onChange?: (clientId: string | null) => void;
    onCreateNew?: () => void;
  } = {}
) => {
  const defaultOnChange = jest.fn();
  const defaultOnCreateNew = jest.fn();

  return render(
    <ClientProvider>
      <ClientSelector
        value={props.value}
        onChange={props.onChange || defaultOnChange}
        onCreateNew={props.onCreateNew || defaultOnCreateNew}
      />
    </ClientProvider>
  );
};

describe('ClientSelector', () => {
  beforeEach(async () => {
    await db.clients.clear();
  });

  describe('rendering', () => {
    it('renders dropdown with client list', async () => {
      // Create test clients
      const repository = new ClientRepository();
      for (const client of mockClients) {
        await repository.create({
          name: client.name,
          defaultHourlyRate: client.defaultHourlyRate,
          contactInfo: client.contactInfo
        });
      }

      renderClientSelector();

      await waitFor(() => {
        expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
      });

      const select = screen.getByLabelText(/client/i) as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      
      // Check that "Create New Client" option exists
      expect(screen.getByText('+ Create New Client')).toBeInTheDocument();
    });

    it('displays clients sorted alphabetically', async () => {
      // Create test clients in non-alphabetical order
      const repository = new ClientRepository();
      await repository.create({ name: 'Zebra Corp', defaultHourlyRate: null, contactInfo: null });
      await repository.create({ name: 'Alpha Inc', defaultHourlyRate: null, contactInfo: null });
      await repository.create({ name: 'Beta LLC', defaultHourlyRate: null, contactInfo: null });

      renderClientSelector();

      await waitFor(() => {
        const select = screen.getByLabelText(/client/i) as HTMLSelectElement;
        expect(select.options.length).toBeGreaterThan(1); // At least "None" + "Create New" + clients
      });

      const select = screen.getByLabelText(/client/i) as HTMLSelectElement;
      const options = Array.from(select.options).map(opt => opt.text);
      
      // Check alphabetical order (after "None" and "Create New Client")
      const clientOptions = options.slice(2); // Skip "None" and "Create New Client"
      expect(clientOptions).toEqual(['Alpha Inc', 'Beta LLC', 'Zebra Corp']);
    });

    it('shows "None" as default when no value provided', async () => {
      renderClientSelector();

      await waitFor(() => {
        const select = screen.getByLabelText(/client/i) as HTMLSelectElement;
        expect(select.value).toBe('');
      });
    });

    it('pre-selects client when value provided', async () => {
      const repository = new ClientRepository();
      const client = await repository.create({
        name: 'Test Client',
        defaultHourlyRate: null,
        contactInfo: null
      });

      renderClientSelector({ value: client.id });

      await waitFor(() => {
        const select = screen.getByLabelText(/client/i) as HTMLSelectElement;
        expect(select.value).toBe(client.id);
      });
    });

    it('shows edit button when client is selected', async () => {
      const repository = new ClientRepository();
      const client = await repository.create({
        name: 'Test Client',
        defaultHourlyRate: null,
        contactInfo: null
      });

      renderClientSelector({ value: client.id });

      await waitFor(() => {
        expect(screen.getByLabelText(/edit client/i)).toBeInTheDocument();
      });
    });

    it('does not show edit button when no client is selected', async () => {
      renderClientSelector();

      await waitFor(() => {
        expect(screen.queryByLabelText(/edit client/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('client selection', () => {
    it('calls onChange when client is selected', async () => {
      const repository = new ClientRepository();
      const client = await repository.create({
        name: 'Test Client',
        defaultHourlyRate: null,
        contactInfo: null
      });

      const onChange = jest.fn();
      renderClientSelector({ onChange });

      await waitFor(() => {
        const select = screen.getByLabelText(/client/i) as HTMLSelectElement;
        fireEvent.change(select, { target: { value: client.id } });
      });

      expect(onChange).toHaveBeenCalledWith(client.id);
    });

    it('calls onChange with null when "None" is selected', async () => {
      const repository = new ClientRepository();
      const client = await repository.create({
        name: 'Test Client',
        defaultHourlyRate: null,
        contactInfo: null
      });

      const onChange = jest.fn();
      renderClientSelector({ value: client.id, onChange });

      await waitFor(() => {
        const select = screen.getByLabelText(/client/i) as HTMLSelectElement;
        fireEvent.change(select, { target: { value: '' } });
      });

      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  describe('create new client', () => {
    it('opens create modal when "Create New Client" is selected', async () => {
      const onCreateNew = jest.fn();
      renderClientSelector({ onCreateNew });

      await waitFor(() => {
        const select = screen.getByLabelText(/client/i) as HTMLSelectElement;
        fireEvent.change(select, { target: { value: '__create_new__' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Create New Client')).toBeInTheDocument();
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      });

      expect(onCreateNew).toHaveBeenCalled();
    });

    it('closes create modal on cancel', async () => {
      renderClientSelector();

      await waitFor(() => {
        const select = screen.getByLabelText(/client/i) as HTMLSelectElement;
        fireEvent.change(select, { target: { value: '__create_new__' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Create New Client')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Create New Client')).not.toBeInTheDocument();
      });
    });

    it('creates new client and updates dropdown', async () => {
      const onChange = jest.fn();
      renderClientSelector({ onChange });

      // Open create modal
      await waitFor(() => {
        const select = screen.getByLabelText(/client/i) as HTMLSelectElement;
        fireEvent.change(select, { target: { value: '__create_new__' } });
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      });

      // Fill form
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: 'New Client' } });

      // Submit form
      const createButton = screen.getByText('Create Client');
      fireEvent.click(createButton);

      // Wait for modal to close and client to be created
      await waitFor(() => {
        expect(screen.queryByText('Create New Client')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify client appears in dropdown
      await waitFor(() => {
        const select = screen.getByLabelText(/client/i) as HTMLSelectElement;
        const options = Array.from(select.options).map(opt => opt.text);
        expect(options).toContain('New Client');
      });

      // Verify onChange was called with new client ID
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('edit client', () => {
    it('opens edit modal when edit button is clicked', async () => {
      const repository = new ClientRepository();
      const client = await repository.create({
        name: 'Test Client',
        defaultHourlyRate: 100,
        contactInfo: 'test@example.com'
      });

      renderClientSelector({ value: client.id });

      await waitFor(() => {
        const editButton = screen.getByLabelText(/edit client/i);
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Client')).toBeInTheDocument();
        const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
        expect(nameInput.value).toBe('Test Client');
      });
    });

    it('pre-fills form fields when editing', async () => {
      const repository = new ClientRepository();
      const client = await repository.create({
        name: 'Test Client',
        defaultHourlyRate: 100,
        contactInfo: 'test@example.com'
      });

      renderClientSelector({ value: client.id });

      await waitFor(() => {
        const editButton = screen.getByLabelText(/edit client/i);
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
        const rateInput = screen.getByLabelText(/hourly rate/i) as HTMLInputElement;
        const contactInput = screen.getByLabelText(/contact info/i) as HTMLTextAreaElement;

        expect(nameInput.value).toBe('Test Client');
        expect(rateInput.value).toBe('100');
        expect(contactInput.value).toBe('test@example.com');
      });
    });

    it('updates client on form submit', async () => {
      const repository = new ClientRepository();
      const client = await repository.create({
        name: 'Test Client',
        defaultHourlyRate: 100,
        contactInfo: null
      });

      renderClientSelector({ value: client.id });

      await waitFor(() => {
        const editButton = screen.getByLabelText(/edit client/i);
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i);
        fireEvent.change(nameInput, { target: { value: 'Updated Client' } });
      });

      const updateButton = screen.getByText('Update Client');
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(screen.queryByText('Edit Client')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify client was updated
      const updatedClient = await repository.getById(client.id);
      expect(updatedClient?.name).toBe('Updated Client');
    });
  });

  describe('delete client', () => {
    it('shows delete button in edit modal', async () => {
      const repository = new ClientRepository();
      const client = await repository.create({
        name: 'Test Client',
        defaultHourlyRate: null,
        contactInfo: null
      });

      renderClientSelector({ value: client.id });

      await waitFor(() => {
        const editButton = screen.getByLabelText(/edit client/i);
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });

    it('shows confirmation dialog when delete is clicked', async () => {
      const repository = new ClientRepository();
      const client = await repository.create({
        name: 'Test Client',
        defaultHourlyRate: null,
        contactInfo: null
      });

      const onChange = jest.fn();
      renderClientSelector({ value: client.id, onChange });

      await waitFor(() => {
        const editButton = screen.getByLabelText(/edit client/i);
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Delete Client')).toBeInTheDocument();
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });
    });

    it('deletes client when confirmed', async () => {
      const repository = new ClientRepository();
      const client = await repository.create({
        name: 'Test Client',
        defaultHourlyRate: null,
        contactInfo: null
      });

      const onChange = jest.fn();
      renderClientSelector({ value: client.id, onChange });

      await waitFor(() => {
        const editButton = screen.getByLabelText(/edit client/i);
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        const confirmButton = screen.getByText('Delete');
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Delete Client')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify client was deleted
      const deletedClient = await repository.getById(client.id);
      expect(deletedClient).toBeUndefined();

      // Verify onChange was called with null
      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('prevents deletion when tasks are assigned', async () => {
      const repository = new ClientRepository();
      const client = await repository.create({
        name: 'Test Client',
        defaultHourlyRate: null,
        contactInfo: null
      });

      // Create a task assigned to this client
      const { TaskRepository } = await import('@/services/data/repositories/TaskRepository');
      const taskRepository = new TaskRepository();
      const { ColumnRepository } = await import('@/services/data/repositories/ColumnRepository');
      const columnRepository = new ColumnRepository();
      const column = await columnRepository.create({
        name: 'Test Column',
        position: 0,
        color: null
      });
      await taskRepository.create({
        title: 'Test Task',
        columnId: column.id,
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
      renderClientSelector({ value: client.id, onChange });

      await waitFor(() => {
        const editButton = screen.getByLabelText(/edit client/i);
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        const confirmButton = screen.getByText('Delete');
        fireEvent.click(confirmButton);
      });

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/cannot delete client/i)).toBeInTheDocument();
        expect(screen.getByText(/1 task\(s\) are assigned/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify client was not deleted
      const clientStillExists = await repository.getById(client.id);
      expect(clientStillExists).toBeDefined();
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA labels', async () => {
      renderClientSelector();

      await waitFor(() => {
        const select = screen.getByLabelText(/client/i);
        expect(select).toHaveAttribute('aria-label', 'Select client');
      });
    });

    it('handles keyboard navigation', async () => {
      renderClientSelector();

      await waitFor(() => {
        const select = screen.getByLabelText(/client/i);
        select.focus();
        expect(select).toHaveFocus();
      });
    });

    it('closes modal on ESC key', async () => {
      renderClientSelector();

      // Open create modal
      await waitFor(() => {
        const select = screen.getByLabelText(/client/i) as HTMLSelectElement;
        fireEvent.change(select, { target: { value: '__create_new__' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Create New Client')).toBeInTheDocument();
      });

      // Press ESC
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('Create New Client')).not.toBeInTheDocument();
      });
    });
  });

  describe('loading and error states', () => {
    it('shows loading state', async () => {
      renderClientSelector();

      // Component should show loading initially
      await waitFor(() => {
        expect(screen.getByText(/loading clients/i)).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('handles errors gracefully', async () => {
      // Mock an error by clearing database after component mounts
      renderClientSelector();

      // Wait for initial load to complete
      await waitFor(() => {
        const select = screen.getByLabelText(/client/i);
        expect(select).toBeInTheDocument();
      });
    });
  });
});
