import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddColumnButton } from '@/components/kanban/AddColumnButton';
import { ColumnProvider } from '@/contexts/ColumnContext';
import { ColumnRepository } from '@/services/data/repositories/ColumnRepository';
import { db } from '@/services/data/database';

describe('AddColumnButton', () => {
  beforeEach(async () => {
    await db.columns.clear();
  });

  afterAll(async () => {
    await db.close();
  });

  const renderAddColumnButton = () => {
    return render(
      <ColumnProvider>
        <AddColumnButton />
      </ColumnProvider>
    );
  };

  it('renders add column button initially', () => {
    renderAddColumnButton();
    expect(screen.getByLabelText('Add new column')).toBeInTheDocument();
    expect(screen.getByText('Add Column')).toBeInTheDocument();
  });

  it('opens form when button is clicked', async () => {
    const user = userEvent.setup();
    renderAddColumnButton();

    const button = screen.getByLabelText('Add new column');
    await user.click(button);

    expect(screen.getByLabelText('Column name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Column name')).toBeInTheDocument();
  });

  it('focuses input when form opens', async () => {
    const user = userEvent.setup();
    renderAddColumnButton();

    const button = screen.getByLabelText('Add new column');
    await user.click(button);

    const input = screen.getByLabelText('Column name');
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });

  it('creates column with valid name', async () => {
    const user = userEvent.setup();
    renderAddColumnButton();

    // Open form
    const button = screen.getByLabelText('Add new column');
    await user.click(button);

    // Enter column name
    const input = screen.getByLabelText('Column name');
    await user.type(input, 'New Column');

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Add' });
    await user.click(submitButton);

    // Column should be created
    await waitFor(() => {
      expect(screen.queryByLabelText('Column name')).not.toBeInTheDocument();
    });

    // Verify column exists
    const repository = new ColumnRepository();
    const columns = await repository.getAll();
    expect(columns.some(c => c.name === 'New Column')).toBe(true);
  });

  it('validates empty name', async () => {
    const user = userEvent.setup();
    renderAddColumnButton();

    // Open form
    const button = screen.getByLabelText('Add new column');
    await user.click(button);

    // Try to submit without name
    const submitButton = screen.getByRole('button', { name: 'Add' });
    await user.click(submitButton);

    expect(screen.getByText('Column name must be unique and not empty')).toBeInTheDocument();
    expect(screen.getByLabelText('Column name')).toHaveClass('border-red-500');
  });

  it('validates duplicate name', async () => {
    const user = userEvent.setup();
    const repository = new ColumnRepository();
    await repository.create({ name: 'Existing Column', position: 0, color: null });

    renderAddColumnButton();

    // Open form
    const button = screen.getByLabelText('Add new column');
    await user.click(button);

    // Enter duplicate name
    const input = screen.getByLabelText('Column name');
    await user.type(input, 'Existing Column');

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Add' });
    await user.click(submitButton);

    expect(screen.getByText('Column name must be unique and not empty')).toBeInTheDocument();
  });

  it('validates duplicate name case-insensitively', async () => {
    const user = userEvent.setup();
    const repository = new ColumnRepository();
    await repository.create({ name: 'Existing Column', position: 0, color: null });

    renderAddColumnButton();

    // Open form
    const button = screen.getByLabelText('Add new column');
    await user.click(button);

    // Enter duplicate name with different case
    const input = screen.getByLabelText('Column name');
    await user.type(input, 'EXISTING COLUMN');

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Add' });
    await user.click(submitButton);

    expect(screen.getByText('Column name must be unique and not empty')).toBeInTheDocument();
  });

  it('cancels form on Cancel button click', async () => {
    const user = userEvent.setup();
    renderAddColumnButton();

    // Open form
    const button = screen.getByLabelText('Add new column');
    await user.click(button);

    expect(screen.getByLabelText('Column name')).toBeInTheDocument();

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByLabelText('Column name')).not.toBeInTheDocument();
    });

    // Button should be visible again
    expect(screen.getByLabelText('Add new column')).toBeInTheDocument();
  });

  it('cancels form on Escape key', async () => {
    const user = userEvent.setup();
    renderAddColumnButton();

    // Open form
    const button = screen.getByLabelText('Add new column');
    await user.click(button);

    expect(screen.getByLabelText('Column name')).toBeInTheDocument();

    // Press Escape
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByLabelText('Column name')).not.toBeInTheDocument();
    });
  });

  it('closes form when clicking outside', async () => {
    const user = userEvent.setup();
    renderAddColumnButton();

    // Open form
    const button = screen.getByLabelText('Add new column');
    await user.click(button);

    expect(screen.getByLabelText('Column name')).toBeInTheDocument();

    // Click outside
    await user.click(document.body);

    await waitFor(() => {
      expect(screen.queryByLabelText('Column name')).not.toBeInTheDocument();
    });
  });

  it('trims whitespace from column name', async () => {
    const user = userEvent.setup();
    renderAddColumnButton();

    // Open form
    const button = screen.getByLabelText('Add new column');
    await user.click(button);

    // Enter name with whitespace
    const input = screen.getByLabelText('Column name');
    await user.type(input, '  Trimmed Column  ');

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Add' });
    await user.click(submitButton);

    // Should create column with trimmed name
    await waitFor(() => {
      const repository = new ColumnRepository();
      return repository.getAll().then(columns => 
        columns.some(c => c.name === 'Trimmed Column')
      );
    });
  });

  it('disables submit button when name is empty', async () => {
    const user = userEvent.setup();
    renderAddColumnButton();

    // Open form
    const button = screen.getByLabelText('Add new column');
    await user.click(button);

    const submitButton = screen.getByRole('button', { name: 'Add' });
    expect(submitButton).toBeDisabled();
  });

  it('shows loading state while submitting', async () => {
    const user = userEvent.setup();
    renderAddColumnButton();

    // Open form
    const button = screen.getByLabelText('Add new column');
    await user.click(button);

    // Enter column name
    const input = screen.getByLabelText('Column name');
    await user.type(input, 'Loading Test');

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Add' });
    await user.click(submitButton);

    // Should show loading state
    expect(screen.getByRole('button', { name: 'Adding...' })).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    renderAddColumnButton();

    const button = screen.getByLabelText('Add new column');
    expect(button).toBeInTheDocument();
  });

  it('has proper ARIA attributes for form', async () => {
    const user = userEvent.setup();
    renderAddColumnButton();

    // Open form
    const button = screen.getByLabelText('Add new column');
    await user.click(button);

    const input = screen.getByLabelText('Column name');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('shows aria-invalid when validation fails', async () => {
    const user = userEvent.setup();
    renderAddColumnButton();

    // Open form
    const button = screen.getByLabelText('Add new column');
    await user.click(button);

    // Try to submit empty
    const submitButton = screen.getByRole('button', { name: 'Add' });
    await user.click(submitButton);

    const input = screen.getByLabelText('Column name');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});
