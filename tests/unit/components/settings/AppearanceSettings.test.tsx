import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { SettingsRepository } from '@/services/data/repositories/SettingsRepository';
import { db } from '@/services/data/database';

const renderAppearanceSettings = () => {
  return render(
    <SettingsProvider>
      <AppearanceSettings />
    </SettingsProvider>
  );
};

describe('AppearanceSettings', () => {
  beforeEach(async () => {
    await db.open();
    await db.settings.clear();
  });

  describe('rendering', () => {
    it('renders the appearance section', async () => {
      renderAppearanceSettings();

      await waitFor(() => {
        expect(screen.getByText('Appearance')).toBeInTheDocument();
        expect(screen.getByText(/Reduce eye strain with dark mode/i)).toBeInTheDocument();
      });
    });

    it('displays dark mode toggle', async () => {
      renderAppearanceSettings();

      await waitFor(() => {
        const toggle = screen.getByRole('button', { name: /toggle dark mode/i });
        expect(toggle).toBeInTheDocument();
      });
    });

    it('shows current dark mode state', async () => {
      renderAppearanceSettings();

      await waitFor(() => {
        expect(screen.getByText(/Light mode is currently enabled/i)).toBeInTheDocument();
      });
    });

    it('shows dark mode enabled message when dark mode is on', async () => {
      const settingsRepo = new SettingsRepository();
      await settingsRepo.updateSettings({ darkMode: true });

      renderAppearanceSettings();

      await waitFor(() => {
        expect(screen.getByText(/Dark mode is currently enabled/i)).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('has proper heading structure', async () => {
      renderAppearanceSettings();

      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: 'Appearance' });
        expect(heading).toBeInTheDocument();
      });
    });

    it('has accessible label for dark mode toggle', async () => {
      renderAppearanceSettings();

      await waitFor(() => {
        const toggle = screen.getByRole('button', { name: /toggle dark mode/i });
        expect(toggle).toHaveAttribute('aria-label', 'Toggle dark mode');
      });
    });
  });
});
