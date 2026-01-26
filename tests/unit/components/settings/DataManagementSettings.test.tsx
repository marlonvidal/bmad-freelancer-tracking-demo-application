import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { DataManagementSettings } from '@/components/settings/DataManagementSettings';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { ColumnProvider } from '@/contexts/ColumnContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { TimerProvider } from '@/contexts/TimerContext';
import { db } from '@/services/data/database';

const renderDataManagementSettings = () => {
  return render(
    <SettingsProvider>
      <ColumnProvider>
        <TaskProvider>
          <ClientProvider>
            <ProjectProvider>
              <TimerProvider>
                <DataManagementSettings />
              </TimerProvider>
            </ProjectProvider>
          </ClientProvider>
        </TaskProvider>
      </ColumnProvider>
    </SettingsProvider>
  );
};

describe('DataManagementSettings', () => {
  beforeEach(async () => {
    await db.open();
    await db.settings.clear();
  });

  describe('rendering', () => {
    it('renders the data management section', async () => {
      renderDataManagementSettings();

      await waitFor(() => {
        expect(screen.getByText('Data Management')).toBeInTheDocument();
        expect(screen.getByText(/Export your data or backup\/restore/i)).toBeInTheDocument();
      });
    });

    it('displays export options section', async () => {
      renderDataManagementSettings();

      // Wait for Data Management section to render first
      await waitFor(() => {
        expect(screen.getByText('Data Management')).toBeInTheDocument();
      });

      // Wait for ExportOptions component to render (it has its own "Export Data" h2 heading)
      await waitFor(() => {
        // Look for the ExportOptions component's heading (h2) or its content
        const exportHeadings = screen.getAllByText('Export Data');
        expect(exportHeadings.length).toBeGreaterThan(0);
        // Also check for ExportOptions-specific content
        expect(screen.getByText(/Export your time tracking data and tasks/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('displays backup/restore options section', async () => {
      renderDataManagementSettings();

      // Wait for Data Management section to render first
      await waitFor(() => {
        expect(screen.getByText('Data Management')).toBeInTheDocument();
      });

      // Wait for BackupRestoreOptions component to render
      // Use getByRole to specifically target the h3 heading in DataManagementSettings
      // Then verify BackupRestoreOptions rendered by checking for its unique button
      await waitFor(() => {
        // Check for the h3 heading in DataManagementSettings (level 3 heading)
        const h3Headings = screen.getAllByRole('heading', { level: 3 });
        const backupHeading = h3Headings.find(heading => heading.textContent === 'Backup & Restore');
        expect(backupHeading).toBeInTheDocument();
        
        // Verify BackupRestoreOptions component rendered by checking for its unique button
        expect(screen.getByRole('button', { name: /Create Backup/i })).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('renders ExportOptions component', async () => {
      renderDataManagementSettings();

      // Wait for Data Management section to render first
      await waitFor(() => {
        expect(screen.getByText('Data Management')).toBeInTheDocument();
      });

      // Then wait for ExportOptions to render (it has "Export Data" heading and buttons)
      await waitFor(() => {
        // ExportOptions should render export buttons - look for aria-label or button text
        // The buttons have aria-labels like "Export time entries as CSV"
        const csvButton = screen.getByRole('button', { name: /Export time entries as CSV/i });
        expect(csvButton).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('renders BackupRestoreOptions component', async () => {
      renderDataManagementSettings();

      // Wait for Data Management section to render first
      await waitFor(() => {
        expect(screen.getByText('Data Management')).toBeInTheDocument();
      });

      // Then wait for BackupRestoreOptions to render (it has "Create Backup" button)
      await waitFor(() => {
        // BackupRestoreOptions should render backup button - look for specific button text
        expect(screen.getByRole('button', { name: /Create Backup/i })).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('accessibility', () => {
    it('has proper heading structure', async () => {
      renderDataManagementSettings();

      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: 'Data Management' });
        expect(heading).toBeInTheDocument();
      });
    });
  });
});
