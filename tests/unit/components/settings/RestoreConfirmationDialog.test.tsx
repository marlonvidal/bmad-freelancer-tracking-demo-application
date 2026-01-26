import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RestoreConfirmationDialog } from '@/components/settings/RestoreConfirmationDialog';
import { BackupPreview } from '@/types/backup';

describe('RestoreConfirmationDialog', () => {
  const mockPreview: BackupPreview = {
    taskCount: 5,
    timeEntryCount: 10,
    clientCount: 2,
    projectCount: 3,
    columnCount: 4,
    dateRange: {
      earliest: new Date('2026-01-01'),
      latest: new Date('2026-01-26'),
    },
    exportDate: new Date('2026-01-26'),
    version: '0.0.0',
  };

  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dialog with title', () => {
    render(
      <RestoreConfirmationDialog
        preview={mockPreview}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Confirm Restore')).toBeInTheDocument();
  });

  it('renders mode selection options', () => {
    render(
      <RestoreConfirmationDialog
        preview={mockPreview}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText('Merge with existing data')).toBeInTheDocument();
    expect(screen.getByLabelText('Replace all data')).toBeInTheDocument();
  });

  it('shows confirmation text input for replace mode', () => {
    render(
      <RestoreConfirmationDialog
        preview={mockPreview}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const replaceRadio = screen.getByLabelText('Replace all data');
    fireEvent.click(replaceRadio);

    expect(screen.getByLabelText(/Type "RESTORE" to confirm/i)).toBeInTheDocument();
  });

  it('does not show confirmation text input for merge mode', () => {
    render(
      <RestoreConfirmationDialog
        preview={mockPreview}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByLabelText(/Type "RESTORE" to confirm/i)).not.toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', () => {
    render(
      <RestoreConfirmationDialog
        preview={mockPreview}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByLabelText('Cancel restore');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables confirm button for replace mode until RESTORE is typed', () => {
    render(
      <RestoreConfirmationDialog
        preview={mockPreview}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const replaceRadio = screen.getByLabelText('Replace all data');
    fireEvent.click(replaceRadio);

    const confirmButton = screen.getByLabelText('Confirm restore');
    expect(confirmButton).toBeDisabled();

    const input = screen.getByLabelText(/Type "RESTORE" to confirm/i);
    fireEvent.change(input, { target: { value: 'RESTORE' } });

    expect(confirmButton).not.toBeDisabled();
  });

  it('enables confirm button for merge mode immediately', () => {
    render(
      <RestoreConfirmationDialog
        preview={mockPreview}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByLabelText('Confirm restore');
    expect(confirmButton).not.toBeDisabled();
  });

  it('calls onConfirm with merge mode when merge confirmed', () => {
    render(
      <RestoreConfirmationDialog
        preview={mockPreview}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByLabelText('Confirm restore');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledWith('merge');
  });

  it('calls onConfirm with replace mode when replace confirmed', () => {
    render(
      <RestoreConfirmationDialog
        preview={mockPreview}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const replaceRadio = screen.getByLabelText('Replace all data');
    fireEvent.click(replaceRadio);

    const input = screen.getByLabelText(/Type "RESTORE" to confirm/i);
    fireEvent.change(input, { target: { value: 'RESTORE' } });

    const confirmButton = screen.getByLabelText('Confirm restore');
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledWith('replace');
  });

  it('displays preview information', () => {
    render(
      <RestoreConfirmationDialog
        preview={mockPreview}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/5 tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/10 time entries/i)).toBeInTheDocument();
  });

  it('displays warnings when present', () => {
    const previewWithWarnings = {
      ...mockPreview,
      warnings: ['Warning 1', 'Warning 2'],
    };

    render(
      <RestoreConfirmationDialog
        preview={previewWithWarnings}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Warnings:')).toBeInTheDocument();
    expect(screen.getByText('Warning 1')).toBeInTheDocument();
  });
});
