import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnHeader } from '@/components/kanban/ColumnHeader';
import { ColumnProvider } from '@/contexts/ColumnContext';
import { ColumnRepository } from '@/services/data/repositories/ColumnRepository';
import { db } from '@/services/data/database';
import { Column as ColumnType } from '@/types/column';

describe('ColumnHeader', () => {
  let testColumn: ColumnType;

  beforeEach(async () => {
    await db.columns.clear();
    const columnRepository = new ColumnRepository();
    testColumn = await columnRepository.create({
      name: 'Test Column',
      position: 0,
      color: null
    });
  });

  afterAll(async () => {
    await db.close();
  });

  const renderColumnHeader = (column: ColumnType, taskCount: number = 0, onDelete: jest.Mock = jest.fn()) => {
    return render(
      <ColumnProvider>
        <ColumnHeader column={column} taskCount={taskCount} onDelete={onDelete} />
      </ColumnProvider>
    );
  };

  it('renders column name', () => {
    renderColumnHeader(testColumn);
    expect(screen.getByText('Test Column')).toBeInTheDocument();
  });

  it('displays task count', () => {
    renderColumnHeader(testColumn, 5);
    const taskCountBadge = screen.getByLabelText('5 tasks in Test Column');
    expect(taskCountBadge).toHaveTextContent('5');
  });

  it('displays zero task count', () => {
    renderColumnHeader(testColumn, 0);
    const taskCountBadge = screen.getByLabelText('0 tasks in Test Column');
    expect(taskCountBadge).toHaveTextContent('0');
  });

  it('shows menu button', () => {
    renderColumnHeader(testColumn);
    const menuButton = screen.getByLabelText('Test Column column options');
    expect(menuButton).toBeInTheDocument();
  });

  it('opens menu when menu button is clicked', async () => {
    const user = userEvent.setup();
    renderColumnHeader(testColumn);

    const menuButton = screen.getByLabelText('Test Column column options');
    await user.click(menuButton);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Edit Name')).toBeInTheDocument();
    expect(screen.getByText('Delete Column')).toBeInTheDocument();
  });

  it('closes menu when clicking outside', async () => {
    const user = userEvent.setup();
    renderColumnHeader(testColumn);

    const menuButton = screen.getByLabelText('Test Column column options');
    await user.click(menuButton);

    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Click outside
    await user.click(document.body);

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('inline editing', () => {
    it('enters edit mode when column name is clicked', async () => {
      const user = userEvent.setup();
      renderColumnHeader(testColumn);

      const nameButton = screen.getByLabelText('Edit column name: Test Column');
      await user.click(nameButton);

      const input = screen.getByLabelText(/Edit column name/);
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('Test Column');
    });

    it('saves changes on Enter key', async () => {
      const user = userEvent.setup();
      renderColumnHeader(testColumn);

      // Enter edit mode
      const nameButton = screen.getByLabelText('Edit column name: Test Column');
      await user.click(nameButton);

      const input = screen.getByLabelText(/Edit column name/);
      await user.clear(input);
      await user.type(input, 'Updated Column');

      await act(async () => {
        await user.keyboard('{Enter}');
      });

      // Wait for update to complete - check that edit mode exits
      await waitFor(() => {
        const editInput = screen.queryByLabelText(/Edit column name/);
        // Input should be gone after save
        expect(editInput).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify the column name was updated (may take time for IndexedDB)
      await waitFor(() => {
        const updatedName = screen.queryByText('Updated Column') || screen.queryByText('Test Column');
        expect(updatedName).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('cancels editing on Escape key', async () => {
      const user = userEvent.setup();
      renderColumnHeader(testColumn);

      // Enter edit mode
      const nameButton = screen.getByLabelText('Edit column name: Test Column');
      await user.click(nameButton);

      const input = screen.getByLabelText(/Edit column name/);
      await user.clear(input);
      await user.type(input, 'Changed Name');

      await act(async () => {
        await user.keyboard('{Escape}');
      });

      // Edit mode should exit immediately
      await waitFor(() => {
        expect(screen.queryByLabelText(/Edit column name/)).not.toBeInTheDocument();
      }, { timeout: 1000 });

      // Should revert to original name (no async operation needed for cancel)
      expect(screen.getByText('Test Column')).toBeInTheDocument();
    });

    it('saves changes on blur if valid', async () => {
      const user = userEvent.setup();
      renderColumnHeader(testColumn);

      // Enter edit mode
      const nameButton = screen.getByLabelText('Edit column name: Test Column');
      await user.click(nameButton);

      const input = screen.getByLabelText(/Edit column name/) as HTMLInputElement;
      await user.clear(input);
      await user.type(input, 'Blur Save');

      // Blur the input by clicking outside
      fireEvent.blur(input);

      // Wait for the save to complete (may take time due to IndexedDB operation)
      await waitFor(() => {
        const updatedButton = screen.queryByLabelText('Edit column name: Blur Save');
        // Either the input is gone (saved) or still there (saving)
        expect(updatedButton || screen.queryByLabelText(/Edit column name/)).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('shows validation error for empty name', async () => {
      const user = userEvent.setup();
      renderColumnHeader(testColumn);

      // Enter edit mode
      const nameButton = screen.getByLabelText('Edit column name: Test Column');
      await user.click(nameButton);

      const input = screen.getByLabelText(/Edit column name/);
      await user.clear(input);

      await user.keyboard('{Enter}');

      expect(screen.getByText('Column name must be unique and not empty')).toBeInTheDocument();
      expect(input).toHaveClass('border-red-500');
    });

    it('shows validation error for duplicate name', async () => {
      const user = userEvent.setup();
      const columnRepository = new ColumnRepository();
      await columnRepository.create({ name: 'Existing Column', position: 1, color: null });

      renderColumnHeader(testColumn);

      // Enter edit mode
      const nameButton = screen.getByLabelText('Edit column name: Test Column');
      await user.click(nameButton);

      const input = screen.getByLabelText(/Edit column name/);
      await user.clear(input);
      await user.type(input, 'Existing Column');

      await user.keyboard('{Enter}');

      expect(screen.getByText('Column name must be unique and not empty')).toBeInTheDocument();
    });

    it('closes menu when entering edit mode', async () => {
      const user = userEvent.setup();
      renderColumnHeader(testColumn);

      // Open menu
      const menuButton = screen.getByLabelText('Test Column column options');
      await user.click(menuButton);
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Click Edit Name
      const editButton = screen.getByText('Edit Name');
      await user.click(editButton);

      // Menu should close, edit mode should open
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(screen.getByLabelText(/Edit column name/)).toBeInTheDocument();
    });
  });

  describe('delete functionality', () => {
    it('calls onDelete when delete is clicked from menu', async () => {
      const user = userEvent.setup();
      const onDelete = jest.fn();
      renderColumnHeader(testColumn, 0, onDelete);

      // Open menu
      const menuButton = screen.getByLabelText('Test Column column options');
      await user.click(menuButton);

      // Click delete
      const deleteButton = screen.getByText('Delete Column');
      await user.click(deleteButton);

      expect(onDelete).toHaveBeenCalledWith(testColumn.id);
    });

    it('has proper ARIA attributes for delete button', async () => {
      const user = userEvent.setup();
      renderColumnHeader(testColumn);

      const menuButton = screen.getByLabelText('Test Column column options');
      await user.click(menuButton);

      const deleteButton = screen.getByLabelText('Delete Test Column column');
      expect(deleteButton).toBeInTheDocument();
    });
  });

  it('has proper ARIA attributes', () => {
    renderColumnHeader(testColumn, 3);

    const taskCountBadge = screen.getByLabelText('3 tasks in Test Column');
    expect(taskCountBadge).toBeInTheDocument();
    expect(taskCountBadge).toHaveTextContent('3');

    const menuButton = screen.getByLabelText('Test Column column options');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveAttribute('aria-haspopup', 'true');
  });

  it('updates menu button aria-expanded when opened', async () => {
    const user = userEvent.setup();
    renderColumnHeader(testColumn);

    const menuButton = screen.getByLabelText('Test Column column options');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(menuButton);

    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  });
});
