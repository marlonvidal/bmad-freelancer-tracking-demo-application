import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { DarkModeToggle } from '@/components/common/DarkModeToggle';
import { DarkModeApplier } from '@/components/common/DarkModeApplier';
import { Navigation } from '@/components/common/Navigation';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { SettingsRepository } from '@/services/data/repositories/SettingsRepository';
import { db } from '@/services/data/database';
import { ColumnProvider } from '@/contexts/ColumnContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { ProjectProvider } from '@/contexts/ProjectContext';
import { FilterProvider } from '@/contexts/FilterContext';
import { TimerProvider } from '@/contexts/TimerContext';
import { ViewProvider } from '@/contexts/ViewContext';

const renderWithAllProviders = (component: React.ReactElement) => {
  return render(
    <ViewProvider>
      <SettingsProvider>
        <DarkModeApplier />
        <ColumnProvider>
          <TaskProvider>
            <ClientProvider>
              <ProjectProvider>
                <FilterProvider>
                  <TimerProvider>
                    {component}
                  </TimerProvider>
                </FilterProvider>
              </ProjectProvider>
            </ClientProvider>
          </TaskProvider>
        </ColumnProvider>
      </SettingsProvider>
    </ViewProvider>
  );
};

describe('Dark Mode Integration Tests', () => {
  beforeEach(async () => {
    await db.open();
    await db.settings.clear();
    await db.columns.clear();
    await db.tasks.clear();
    
    // Ensure document starts without dark class
    document.documentElement.classList.remove('dark');
  });

  describe('dark mode toggle workflow', () => {
    it('toggles dark mode and applies class to document element', async () => {
      renderWithAllProviders(
        <>
          <Navigation />
          <DarkModeToggle />
        </>
      );

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });

      const toggleButton = screen.getByRole('button', { name: /toggle dark mode/i });
      
      // Toggle to dark mode
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });

      // Toggle back to light mode
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });
    });

    it('persists dark mode preference across component remounts', async () => {
      const { unmount } = renderWithAllProviders(
        <>
          <Navigation />
          <DarkModeToggle />
        </>
      );

      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /toggle dark mode/i });
        expect(toggleButton).toBeInTheDocument();
      });

      const toggleButton = screen.getByRole('button', { name: /toggle dark mode/i });
      
      // Toggle to dark mode
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });

      // Unmount
      unmount();

      // Remount
      renderWithAllProviders(
        <>
          <Navigation />
          <DarkModeToggle />
        </>
      );

      await waitFor(() => {
        // Dark mode should still be applied after remount
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });

    it('applies dark mode class on initial load if preference is set', async () => {
      // Set dark mode preference before rendering
      const repository = new SettingsRepository();
      await repository.updateSettings({ darkMode: true });

      renderWithAllProviders(
        <>
          <DarkModeApplier />
          <Navigation />
        </>
      );

      await waitFor(() => {
        // Dark class should be applied immediately
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });
  });

  describe('dark mode applies to components', () => {
    it('applies dark mode styles to Navigation component', async () => {
      renderWithAllProviders(<Navigation />);

      await waitFor(() => {
        const nav = screen.getByRole('navigation');
        expect(nav).toBeInTheDocument();
      });

      const nav = screen.getByRole('navigation');
      
      // Toggle to dark mode
      const toggleButton = screen.getByRole('button', { name: /toggle dark mode/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });

      // Navigation should have dark mode classes
      expect(nav).toHaveClass('dark:bg-gray-900');
      expect(nav).toHaveClass('dark:border-gray-700');
    });

    it('applies dark mode styles to KanbanBoard component', async () => {
      renderWithAllProviders(
        <>
          <Navigation />
          <KanbanBoard />
        </>
      );

      await waitFor(() => {
        const board = screen.getByRole('region', { name: /kanban board/i });
        expect(board).toBeInTheDocument();
      });

      const board = screen.getByRole('region', { name: /kanban board/i });
      
      // Toggle to dark mode
      const toggleButton = screen.getByRole('button', { name: /toggle dark mode/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });

      // KanbanBoard should have dark mode classes
      expect(board).toHaveClass('dark:bg-gray-900');
    });
  });

  describe('dark mode persistence', () => {
    it('loads dark mode preference from IndexedDB on mount', async () => {
      // Set dark mode in IndexedDB
      const repository = new SettingsRepository();
      await repository.updateSettings({ darkMode: true });

      renderWithAllProviders(
        <>
          <DarkModeApplier />
          <Navigation />
        </>
      );

      await waitFor(() => {
        // Dark mode should be loaded and applied
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });

    it('saves dark mode preference to IndexedDB when toggled', async () => {
      renderWithAllProviders(
        <>
          <Navigation />
          <DarkModeToggle />
        </>
      );

      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /toggle dark mode/i });
        expect(toggleButton).toBeInTheDocument();
      });

      const toggleButton = screen.getByRole('button', { name: /toggle dark mode/i });
      
      // Toggle to dark mode
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });

      // Verify persistence in IndexedDB
      const repository = new SettingsRepository();
      const settings = await repository.getSettings();
      expect(settings.darkMode).toBe(true);
    });
  });

  describe('dark mode applier component', () => {
    it('applies dark class when darkMode is true', async () => {
      const repository = new SettingsRepository();
      await repository.updateSettings({ darkMode: true });

      renderWithAllProviders(<DarkModeApplier />);

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });

    it('removes dark class when darkMode is false', async () => {
      // Set dark mode first
      const repository = new SettingsRepository();
      await repository.updateSettings({ darkMode: true });
      document.documentElement.classList.add('dark');

      renderWithAllProviders(
        <>
          <DarkModeApplier />
          <DarkModeToggle />
        </>
      );

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });

      // Toggle to light mode
      const toggleButton = screen.getByRole('button', { name: /toggle dark mode/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });
    });

    it('does not apply dark class when settings are loading', () => {
      // Mock getSettings to delay
      jest.spyOn(SettingsRepository.prototype, 'getSettings').mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithAllProviders(<DarkModeApplier />);

      // Should not have dark class while loading
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      jest.restoreAllMocks();
    });
  });

  describe('dark mode toggle in navigation', () => {
    it('renders toggle button in navigation', async () => {
      renderWithAllProviders(<Navigation />);

      await waitFor(() => {
        const toggleButton = screen.getByRole('button', { name: /toggle dark mode/i });
        expect(toggleButton).toBeInTheDocument();
      });
    });

    it('toggles dark mode when clicked from navigation', async () => {
      renderWithAllProviders(
        <>
          <DarkModeApplier />
          <Navigation />
        </>
      );

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });

      const toggleButton = screen.getByRole('button', { name: /toggle dark mode/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });
  });
});
