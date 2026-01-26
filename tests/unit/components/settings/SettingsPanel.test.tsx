import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { ColumnProvider } from '@/contexts/ColumnContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { TimerProvider } from '@/contexts/TimerContext';
import { SettingsRepository } from '@/services/data/repositories/SettingsRepository';
import { db } from '@/services/data/database';
import { ViewProvider } from '@/contexts/ViewContext';

const renderSettingsPanel = () => {
  return render(
    <ViewProvider>
      <SettingsProvider>
        <ColumnProvider>
          <TaskProvider>
            <ClientProvider>
              <ProjectProvider>
                <TimerProvider>
                  <SettingsPanel />
                </TimerProvider>
              </ProjectProvider>
            </ClientProvider>
          </TaskProvider>
        </ColumnProvider>
      </SettingsProvider>
    </ViewProvider>
  );
};

describe('SettingsPanel', () => {
  beforeEach(async () => {
    await db.open();
    await db.settings.clear();
  });

  describe('rendering', () => {
    it('renders the settings panel with header', async () => {
      renderSettingsPanel();

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText(/Configure your application preferences/i)).toBeInTheDocument();
      });
    });

    it('renders all settings sections', async () => {
      renderSettingsPanel();

      await waitFor(() => {
        expect(screen.getByText('Appearance')).toBeInTheDocument();
        expect(screen.getByText('Task Defaults')).toBeInTheDocument();
        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
        expect(screen.getByText('Data Management')).toBeInTheDocument();
      });
    });

    it('shows loading state while settings load', () => {
      // Mock SettingsRepository to delay loading
      jest.spyOn(SettingsRepository.prototype, 'getSettings').mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderSettingsPanel();

      expect(screen.getByText('Loading settings...')).toBeInTheDocument();

      jest.restoreAllMocks();
    });

    it('shows error state when settings fail to load', async () => {
      jest.spyOn(SettingsRepository.prototype, 'getSettings').mockRejectedValueOnce(
        new Error('Failed to load')
      );

      renderSettingsPanel();

      await waitFor(() => {
        expect(screen.getByText(/Error loading settings/i)).toBeInTheDocument();
        expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
      });

      jest.restoreAllMocks();
    });
  });

  describe('reset to defaults', () => {
    it('shows reset to defaults section', async () => {
      renderSettingsPanel();

      // Wait for loading to complete first
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Then wait for reset section heading (more specific than getByText)
      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: 'Reset to Defaults' });
        expect(heading).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('opens confirmation dialog when reset button is clicked', async () => {
      renderSettingsPanel();

      // Wait for loading to complete first
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Then wait for reset button to be available
      await waitFor(() => {
        const resetButton = screen.getByRole('button', { name: /reset settings to defaults/i });
        expect(resetButton).toBeInTheDocument();
      }, { timeout: 3000 });

      const resetButton = screen.getByRole('button', { name: /reset settings to defaults/i });
      await act(async () => {
        fireEvent.click(resetButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Reset Settings to Defaults?')).toBeInTheDocument();
        expect(screen.getByText(/This will reset all settings/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('resets settings when confirmed', async () => {
      // Set up initial settings
      const settingsRepo = new SettingsRepository();
      await settingsRepo.updateSettings({
        darkMode: true,
        defaultBillableStatus: true,
        defaultHourlyRate: 50
      });

      renderSettingsPanel();

      // Wait for loading to complete first
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Then wait for reset button to be available
      await waitFor(() => {
        const resetButton = screen.getByRole('button', { name: /reset settings to defaults/i });
        expect(resetButton).toBeInTheDocument();
      }, { timeout: 3000 });

      const resetButton = screen.getByRole('button', { name: /reset settings to defaults/i });
      await act(async () => {
        fireEvent.click(resetButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Reset Settings to Defaults?')).toBeInTheDocument();
      }, { timeout: 3000 });

      const confirmButton = screen.getByRole('button', { name: /^Reset$/ });
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        // Dialog should close
        expect(screen.queryByText('Reset Settings to Defaults?')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Wait for settings update to complete
      await waitFor(async () => {
        const updatedSettings = await settingsRepo.getSettings();
        expect(updatedSettings.darkMode).toBe(false);
        expect(updatedSettings.defaultBillableStatus).toBe(false);
        expect(updatedSettings.defaultHourlyRate).toBeNull();
      }, { timeout: 3000 });
    });

    it('cancels reset when cancel button is clicked', async () => {
      renderSettingsPanel();

      // Wait for loading to complete first
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Then wait for reset button to be available
      await waitFor(() => {
        const resetButton = screen.getByRole('button', { name: /reset settings to defaults/i });
        expect(resetButton).toBeInTheDocument();
      }, { timeout: 3000 });

      const resetButton = screen.getByRole('button', { name: /reset settings to defaults/i });
      await act(async () => {
        fireEvent.click(resetButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Reset Settings to Defaults?')).toBeInTheDocument();
      }, { timeout: 3000 });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await act(async () => {
        fireEvent.click(cancelButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Reset Settings to Defaults?')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('accessibility', () => {
    it('has proper heading structure', async () => {
      renderSettingsPanel();

      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: 'Settings' });
        expect(heading).toBeInTheDocument();
        expect(heading.tagName).toBe('H1');
      });
    });

    it('has accessible section headings', async () => {
      renderSettingsPanel();

      await waitFor(() => {
        const appearanceHeading = screen.getByRole('heading', { name: 'Appearance' });
        expect(appearanceHeading).toBeInTheDocument();
        expect(appearanceHeading.tagName).toBe('H2');
      });
    });
  });
});
