import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { ColumnProvider } from '@/contexts/ColumnContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { TimerProvider } from '@/contexts/TimerContext';
import { ViewProvider } from '@/contexts/ViewContext';
import { SettingsRepository } from '@/services/data/repositories/SettingsRepository';
import { db } from '@/services/data/database';

const renderSettingsWorkflow = () => {
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

describe('Settings Workflow Integration Tests', () => {
  beforeEach(async () => {
    await db.open();
    await db.settings.clear();
  });

  describe('complete settings workflow', () => {
    it('allows changing dark mode', async () => {
      renderSettingsWorkflow();

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Find dark mode toggle
      const darkModeToggle = screen.getByRole('button', { name: /toggle dark mode/i });
      
      // Verify initial state (light mode)
      await waitFor(() => {
        expect(screen.getByText(/Light mode is currently enabled/i)).toBeInTheDocument();
      });

      // Toggle dark mode
      await act(async () => {
        fireEvent.click(darkModeToggle);
      });

      // Verify dark mode is enabled
      await waitFor(() => {
        expect(screen.getByText(/Dark mode is currently enabled/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      // Verify settings persisted
      const settingsRepo = new SettingsRepository();
      const settings = await settingsRepo.getSettings();
      expect(settings.darkMode).toBe(true);
    });

    it('allows changing default billable status', async () => {
      renderSettingsWorkflow();

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Wait for component initialization to complete (100ms delay in component)
      await new Promise(resolve => setTimeout(resolve, 150));

      const checkbox = screen.getByLabelText(/default billable status/i) as HTMLInputElement;
      
      // Verify initial state (unchecked)
      expect(checkbox.checked).toBe(false);

      // Toggle billable status
      await act(async () => {
        fireEvent.click(checkbox);
      });

      // Verify it's checked
      await waitFor(() => {
        expect(checkbox.checked).toBe(true);
      }, { timeout: 3000 });

      // Verify settings persisted
      await waitFor(async () => {
        const settingsRepo = new SettingsRepository();
        const settings = await settingsRepo.getSettings();
        expect(settings.defaultBillableStatus).toBe(true);
      }, { timeout: 3000 });
    });

    it('allows changing default hourly rate', async () => {
      renderSettingsWorkflow();

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Wait for component initialization to complete (100ms delay in component)
      await new Promise(resolve => setTimeout(resolve, 150));

      const input = screen.getByLabelText(/default hourly rate/i) as HTMLInputElement;
      
      // Set hourly rate
      await act(async () => {
        fireEvent.change(input, { target: { value: '100.50' } });
      });

      // Wait for debounce (500ms) + save operation
      await waitFor(async () => {
        const settingsRepo = new SettingsRepository();
        const settings = await settingsRepo.getSettings();
        expect(settings.defaultHourlyRate).toBe(100.50);
      }, { timeout: 4000 });
    });

    it('validates hourly rate and prevents invalid values', async () => {
      renderSettingsWorkflow();

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/default hourly rate/i) as HTMLInputElement;
      
      // Try invalid value
      await act(async () => {
        fireEvent.change(input, { target: { value: '-10' } });
        fireEvent.blur(input);
      });

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/Must be a positive number/i)).toBeInTheDocument();
      });

      // Verify invalid value was not saved
      await waitFor(async () => {
        const settingsRepo = new SettingsRepository();
        const settings = await settingsRepo.getSettings();
        expect(settings.defaultHourlyRate).not.toBe(-10);
      });
    });

    it('allows resetting to defaults', async () => {
      // Set up initial settings
      const settingsRepo = new SettingsRepository();
      await settingsRepo.updateSettings({
        darkMode: true,
        defaultBillableStatus: true,
        defaultHourlyRate: 75
      });

      renderSettingsWorkflow();

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Wait for component initialization to complete (100ms delay in component)
      await new Promise(resolve => setTimeout(resolve, 150));

      // Verify initial settings
      const checkbox = screen.getByLabelText(/default billable status/i) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);

      // Click reset button
      const resetButton = screen.getByRole('button', { name: /reset settings to defaults/i });
      await act(async () => {
        fireEvent.click(resetButton);
      });

      // Confirm reset
      await waitFor(() => {
        expect(screen.getByText('Reset Settings to Defaults?')).toBeInTheDocument();
      });

      // Find the confirm button by exact label "Reset" (not "Reset to Defaults")
      const confirmButton = screen.getByRole('button', { name: /^Reset$/ });
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      // Verify settings were reset
      await waitFor(async () => {
        const settings = await settingsRepo.getSettings();
        expect(settings.darkMode).toBe(false);
        expect(settings.defaultBillableStatus).toBe(false);
        expect(settings.defaultHourlyRate).toBeNull();
      }, { timeout: 4000 });
    });

    it('persists settings across component remounts', async () => {
      const settingsRepo = new SettingsRepository();
      await settingsRepo.updateSettings({
        darkMode: true,
        defaultBillableStatus: true,
        defaultHourlyRate: 50
      });

      const { unmount } = renderSettingsWorkflow();

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Verify settings are loaded
      const checkbox = screen.getByLabelText(/default billable status/i) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);

      // Unmount and remount
      unmount();

      renderSettingsWorkflow();

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Verify settings persisted
      const checkbox2 = screen.getByLabelText(/default billable status/i) as HTMLInputElement;
      await waitFor(() => {
        expect(checkbox2.checked).toBe(true);
      });
    });
  });

  describe('auto-save workflow', () => {
    it('auto-saves billable status immediately', async () => {
      renderSettingsWorkflow();

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Wait for component initialization to complete (100ms delay in component)
      await new Promise(resolve => setTimeout(resolve, 150));

      const checkbox = screen.getByLabelText(/default billable status/i) as HTMLInputElement;
      
      await act(async () => {
        fireEvent.click(checkbox);
      });

      // Verify save indicator appears (may appear briefly, so check with longer timeout)
      await waitFor(() => {
        const savingText = screen.queryByText(/Saving/i);
        const savedText = screen.queryByText(/Saved/i);
        // Either "Saving" or "Saved" should appear (they transition quickly)
        expect(savingText || savedText).toBeTruthy();
      }, { timeout: 4000 });

      // Verify saved indicator appears eventually
      await waitFor(() => {
        expect(screen.getByText(/Saved/i)).toBeInTheDocument();
      }, { timeout: 4000 });
    });

    it('auto-saves hourly rate after debounce', async () => {
      renderSettingsWorkflow();

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      // Wait for component initialization to complete (100ms delay in component)
      await new Promise(resolve => setTimeout(resolve, 150));

      const input = screen.getByLabelText(/default hourly rate/i) as HTMLInputElement;
      
      await act(async () => {
        fireEvent.change(input, { target: { value: '75' } });
      });

      // Wait for debounce (500ms) + save operation
      await waitFor(async () => {
        const settingsRepo = new SettingsRepository();
        const settings = await settingsRepo.getSettings();
        expect(settings.defaultHourlyRate).toBe(75);
      }, { timeout: 4000 });
    });
  });
});
