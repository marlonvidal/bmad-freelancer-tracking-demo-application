import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BackupRestoreOptions } from '@/components/settings/BackupRestoreOptions';
import { ExportService } from '@/services/ExportService';
import { ImportService } from '@/services/ImportService';
import { TaskProvider } from '@/contexts/TaskContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { ColumnProvider } from '@/contexts/ColumnContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { TimerProvider } from '@/contexts/TimerContext';

// Mock services
jest.mock('@/services/ExportService');
jest.mock('@/services/ImportService');

// Wrapper component with all required providers
const renderWithProviders = async (component: React.ReactElement) => {
  const result = render(
    <SettingsProvider>
      <ClientProvider>
        <ProjectProvider>
          <ColumnProvider>
            <TaskProvider>
              <TimerProvider>
                {component}
              </TimerProvider>
            </TaskProvider>
          </ColumnProvider>
        </ProjectProvider>
      </ClientProvider>
    </SettingsProvider>
  );
  
  // Wait for contexts to finish loading
  await waitFor(() => {
    // Check that component has rendered (no loading states blocking it)
    expect(screen.queryByText('Backup & Restore')).toBeInTheDocument();
  }, { timeout: 3000 });
  
  return result;
};

describe('BackupRestoreOptions', () => {
  let mockExportService: jest.Mocked<ExportService>;
  let mockImportService: jest.Mocked<ImportService>;

  const createMockFile = (content: string, name = 'backup.json'): File => {
    const blob = new Blob([content], { type: 'application/json' });
    return new File([blob], name, { type: 'application/json' });
  };

  beforeEach(() => {
    mockExportService = {
      backupAllData: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockImportService = {
      validateBackupFile: jest.fn().mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
      }),
      previewBackupData: jest.fn().mockResolvedValue({
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
      }),
      restoreBackup: jest.fn().mockResolvedValue(undefined),
    } as any;

    (ExportService as jest.MockedClass<typeof ExportService>).mockImplementation(
      () => mockExportService
    );
    (ImportService as jest.MockedClass<typeof ImportService>).mockImplementation(
      () => mockImportService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders backup and restore sections', async () => {
      const { container } = await renderWithProviders(<BackupRestoreOptions />);

      const headings = container.querySelectorAll('h3');
      const headingTexts = Array.from(headings).map(h => h.textContent);
      expect(headingTexts.some(text => text?.includes('Create Backup'))).toBe(true);
      expect(headingTexts.some(text => text?.includes('Restore from Backup'))).toBe(true);
    });

    it('renders create backup button', async () => {
      await renderWithProviders(<BackupRestoreOptions />);

      expect(screen.getAllByLabelText('Create backup')[0]).toBeInTheDocument();
    });

    it('renders select backup file button', async () => {
      await renderWithProviders(<BackupRestoreOptions />);

      const buttons = screen.getAllByLabelText('Select backup file');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('backup functionality', () => {
    it('creates backup when button clicked', async () => {
      await renderWithProviders(<BackupRestoreOptions />);

      const backupButton = screen.getAllByLabelText('Create backup')[0];
      fireEvent.click(backupButton);

      await waitFor(() => {
        expect(mockExportService.backupAllData).toHaveBeenCalled();
      });
    });

    it('shows loading state during backup', async () => {
      mockExportService.backupAllData.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      await renderWithProviders(<BackupRestoreOptions />);

      const backupButton = screen.getAllByLabelText('Create backup')[0];
      fireEvent.click(backupButton);

      expect(screen.getByText('Creating Backup...')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockExportService.backupAllData).toHaveBeenCalled();
      });
    });

    it('shows success message after backup', async () => {
      await renderWithProviders(<BackupRestoreOptions />);

      const backupButton = screen.getAllByLabelText('Create backup')[0];
      fireEvent.click(backupButton);

      await waitFor(() => {
        expect(screen.getByText(/Backup created successfully/i)).toBeInTheDocument();
      });
    });

    it('shows error message if backup fails', async () => {
      mockExportService.backupAllData.mockRejectedValue(new Error('Backup failed'));

      await renderWithProviders(<BackupRestoreOptions />);

      const backupButton = screen.getAllByLabelText('Create backup')[0];
      fireEvent.click(backupButton);

      await waitFor(
        () => {
          // Error message can be either "Failed to create backup" or the actual error message
          const errorElement = screen.queryByText(/Failed to create backup|Backup failed/i);
          expect(errorElement).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('restore functionality', () => {
    it('validates and previews backup file when selected', async () => {
      const backupData = JSON.stringify({
        tasks: [],
        timeEntries: [],
        clients: [],
        projects: [],
        columns: [],
        settings: { id: 'default', darkMode: false },
        metadata: { exportDate: new Date().toISOString(), version: '0.0.0', counts: {} },
      });
      const file = createMockFile(backupData);

      await renderWithProviders(<BackupRestoreOptions />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        });
        fireEvent.change(fileInput);
      }

      await waitFor(() => {
        expect(mockImportService.validateBackupFile).toHaveBeenCalled();
        expect(mockImportService.previewBackupData).toHaveBeenCalled();
      });
    });

    it('shows preview after file selection', async () => {
      const backupData = JSON.stringify({
        tasks: [],
        timeEntries: [],
        clients: [],
        projects: [],
        columns: [],
        settings: { id: 'default', darkMode: false },
        metadata: { exportDate: new Date().toISOString(), version: '0.0.0', counts: {} },
      });
      const file = createMockFile(backupData);

      await renderWithProviders(<BackupRestoreOptions />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        });
        fireEvent.change(fileInput);
      }

      await waitFor(() => {
        expect(screen.getByText('Backup Preview')).toBeInTheDocument();
      });
    });

    it('shows error for invalid file', async () => {
      mockImportService.validateBackupFile.mockResolvedValue({
        isValid: false,
        errors: ['Invalid backup file'],
        warnings: [],
      });

      const file = createMockFile('invalid json');
      await renderWithProviders(<BackupRestoreOptions />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        });
        fireEvent.change(fileInput);
      }

      await waitFor(() => {
        expect(screen.getByText(/Invalid backup file/i)).toBeInTheDocument();
      });
    });
  });
});
