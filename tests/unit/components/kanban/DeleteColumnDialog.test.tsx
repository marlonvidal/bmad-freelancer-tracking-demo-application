import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteColumnDialog } from '@/components/kanban/DeleteColumnDialog';
import { Column as ColumnType } from '@/types/column';

describe('DeleteColumnDialog', () => {
  const testColumn: ColumnType = {
    id: 'col-1',
    name: 'Test Column',
    position: 0,
    color: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const defaultProps = {
    column: testColumn,
    taskCount: 0,
    isOpen: true,
    onConfirm: jest.fn(),
    onCancel: jest.fn()
  };

  it('does not render when closed', () => {
    render(<DeleteColumnDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog when open', () => {
    render(<DeleteColumnDialog {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('displays column name in title', () => {
    render(<DeleteColumnDialog {...defaultProps} />);
    const title = screen.getByRole('heading', { name: 'Delete Column' });
    expect(title).toBeInTheDocument();
  });

  it('displays confirmation message for empty column', () => {
    render(<DeleteColumnDialog {...defaultProps} taskCount={0} />);
    expect(screen.getByText(/Are you sure you want to delete the column "Test Column"/)).toBeInTheDocument();
  });

  it('displays warning message for column with tasks', () => {
    render(<DeleteColumnDialog {...defaultProps} taskCount={5} />);
    expect(screen.getByText(/The column "Test Column" contains 5 tasks/)).toBeInTheDocument();
    expect(screen.getByText(/Deleting this column will permanently delete all tasks in it/)).toBeInTheDocument();
  });

  it('displays singular task message correctly', () => {
    render(<DeleteColumnDialog {...defaultProps} taskCount={1} />);
    expect(screen.getByText(/contains 1 task/)).toBeInTheDocument();
  });

  it('displays plural task message correctly', () => {
    render(<DeleteColumnDialog {...defaultProps} taskCount={5} />);
    expect(screen.getByText(/contains 5 tasks/)).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    render(<DeleteColumnDialog {...defaultProps} onConfirm={onConfirm} />);

    const confirmButton = screen.getByLabelText('Confirm deletion of Test Column column');
    await user.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    render(<DeleteColumnDialog {...defaultProps} onCancel={onCancel} />);

    const cancelButton = screen.getByLabelText('Cancel deletion');
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when clicking backdrop', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    render(<DeleteColumnDialog {...defaultProps} onCancel={onCancel} />);

    const backdrop = screen.getByRole('dialog').parentElement;
    await user.click(backdrop!);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onCancel when clicking dialog content', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    render(<DeleteColumnDialog {...defaultProps} onCancel={onCancel} />);

    const dialogContent = screen.getByText('Delete Column').closest('div');
    await user.click(dialogContent!);

    expect(onCancel).not.toHaveBeenCalled();
  });

  it('has proper ARIA attributes', () => {
    render(<DeleteColumnDialog {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'delete-dialog-title');
  });

  it('displays note about moving tasks for columns with tasks', () => {
    render(<DeleteColumnDialog {...defaultProps} taskCount={3} />);
    expect(screen.getByText(/Moving tasks to another column will be available in a future update/)).toBeInTheDocument();
  });

  it('does not display note for empty columns', () => {
    render(<DeleteColumnDialog {...defaultProps} taskCount={0} />);
    expect(screen.queryByText(/Moving tasks to another column/)).not.toBeInTheDocument();
  });
});
