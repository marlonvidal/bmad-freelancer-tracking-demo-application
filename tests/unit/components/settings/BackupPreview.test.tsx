import React from 'react';
import { render, screen } from '@testing-library/react';
import { BackupPreview } from '@/components/settings/BackupPreview';
import { BackupPreview as BackupPreviewType } from '@/types/backup';

describe('BackupPreview', () => {
  const createMockPreview = (overrides?: Partial<BackupPreviewType>): BackupPreviewType => ({
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
    ...overrides,
  });

  it('renders preview with all counts', () => {
    const preview = createMockPreview();
    render(<BackupPreview preview={preview} />);

    expect(screen.getByText('Backup Preview')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // taskCount
    expect(screen.getByText('10')).toBeInTheDocument(); // timeEntryCount
    expect(screen.getByText('2')).toBeInTheDocument(); // clientCount
    expect(screen.getByText('3')).toBeInTheDocument(); // projectCount
    expect(screen.getByText('4')).toBeInTheDocument(); // columnCount
  });

  it('displays date range', () => {
    const preview = createMockPreview();
    render(<BackupPreview preview={preview} />);

    expect(screen.getByText(/Date Range/i)).toBeInTheDocument();
  });

  it('displays export date and version', () => {
    const preview = createMockPreview();
    render(<BackupPreview preview={preview} />);

    expect(screen.getByText(/Exported/i)).toBeInTheDocument();
    expect(screen.getByText(/v0\.0\.0/i)).toBeInTheDocument();
  });

  it('displays warnings when present', () => {
    const preview = createMockPreview({
      warnings: ['Warning 1', 'Warning 2'],
    });
    render(<BackupPreview preview={preview} />);

    expect(screen.getByText('Warnings')).toBeInTheDocument();
    expect(screen.getByText('Warning 1')).toBeInTheDocument();
    expect(screen.getByText('Warning 2')).toBeInTheDocument();
  });

  it('does not display warnings section when no warnings', () => {
    const preview = createMockPreview();
    render(<BackupPreview preview={preview} />);

    expect(screen.queryByText('Warnings')).not.toBeInTheDocument();
  });
});
