import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { DarkModeToggle } from '@/components/common/DarkModeToggle';
import { DarkModeApplier } from '@/components/common/DarkModeApplier';
import { SettingsProvider, useSettingsContext } from '@/contexts/SettingsContext';
import { SettingsRepository } from '@/services/data/repositories/SettingsRepository';
import { db } from '@/services/data/database';

// Test component that uses the context
const TestComponent: React.FC = () => {
  const { isDarkMode } = useSettingsContext();
  return (
    <div>
      <DarkModeApplier />
      <DarkModeToggle />
      <div data-testid="dark-mode-status">{isDarkMode() ? 'dark' : 'light'}</div>
    </div>
  );
};

const renderDarkModeToggle = () => {
  return render(
    <SettingsProvider>
      <TestComponent />
    </SettingsProvider>
  );
};

describe('DarkModeToggle', () => {
  beforeEach(async () => {
    await db.open();
    await db.settings.clear();
  });

  describe('rendering', () => {
    it('renders the toggle button', async () => {
      renderDarkModeToggle();
      
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle dark mode/i });
        expect(button).toBeInTheDocument();
      });
    });

    it('shows sun icon when in light mode', async () => {
      renderDarkModeToggle();
      
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle dark mode/i });
        expect(button).toBeInTheDocument();
      });

      // Check for sun icon (light mode)
      const button = screen.getByRole('button', { name: /toggle dark mode/i });
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
      
      // Verify it's the sun icon by checking the path data (sun icon path contains "M12 3v1")
      const path = svg?.querySelector('path');
      expect(path).toBeInTheDocument();
      expect(path?.getAttribute('d')).toContain('M12 3v1'); // Sun icon path starts with this
    });

    it('shows moon icon when in dark mode', async () => {
      // Set dark mode in settings first
      const settingsRepo = new SettingsRepository();
      await settingsRepo.updateSettings({ darkMode: true });

      renderDarkModeToggle();
      
      await waitFor(() => {
        expect(screen.getByTestId('dark-mode-status')).toHaveTextContent('dark');
      });

      const button = screen.getByRole('button', { name: /toggle dark mode/i });
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
      
      // Verify it's the moon icon (moon has single path)
      const paths = svg?.querySelectorAll('path');
      expect(paths?.length).toBe(1); // Moon icon has single path
    });
  });

  describe('accessibility', () => {
    it('has correct ARIA label', async () => {
      renderDarkModeToggle();
      
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle dark mode/i });
        expect(button).toHaveAttribute('aria-label', 'Toggle dark mode');
      });
    });

    it('has title attribute for tooltip', async () => {
      renderDarkModeToggle();
      
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle dark mode/i });
        expect(button).toHaveAttribute('title');
      });
    });

    it('is keyboard accessible with Enter key', async () => {
      renderDarkModeToggle();
      
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle dark mode/i });
        expect(button).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /toggle dark mode/i });
      const initialStatus = screen.getByTestId('dark-mode-status').textContent;

      // Press Enter - need to trigger the keyDown handler
      await act(async () => {
        fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      });

      await waitFor(() => {
        const newStatus = screen.getByTestId('dark-mode-status').textContent;
        expect(newStatus).not.toBe(initialStatus);
      }, { timeout: 2000 });
    });

    it('is keyboard accessible with Space key', async () => {
      renderDarkModeToggle();
      
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle dark mode/i });
        expect(button).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /toggle dark mode/i });
      const initialStatus = screen.getByTestId('dark-mode-status').textContent;

      // Press Space - need to trigger the keyDown handler
      await act(async () => {
        fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      });

      await waitFor(() => {
        const newStatus = screen.getByTestId('dark-mode-status').textContent;
        expect(newStatus).not.toBe(initialStatus);
      }, { timeout: 2000 });
    });

    it('is disabled when settings are loading', () => {
      // Mock SettingsRepository to delay loading
      jest.spyOn(SettingsRepository.prototype, 'getSettings').mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderDarkModeToggle();

      const button = screen.getByRole('button', { name: /toggle dark mode/i });
      expect(button).toBeDisabled();

      jest.restoreAllMocks();
    });
  });

  describe('toggle functionality', () => {
    it('toggles dark mode when clicked', async () => {
      renderDarkModeToggle();
      
      await waitFor(() => {
        expect(screen.getByTestId('dark-mode-status')).toHaveTextContent('light');
      });

      const button = screen.getByRole('button', { name: /toggle dark mode/i });
      
      // Click to toggle
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByTestId('dark-mode-status')).toHaveTextContent('dark');
      }, { timeout: 2000 });

      // Click again to toggle back
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByTestId('dark-mode-status')).toHaveTextContent('light');
      }, { timeout: 2000 });
    });

    it('applies dark class to document element when toggled', async () => {
      // Ensure we start in light mode
      document.documentElement.classList.remove('dark');

      renderDarkModeToggle();
      
      await waitFor(() => {
        expect(screen.getByTestId('dark-mode-status')).toHaveTextContent('light');
      });

      const button = screen.getByRole('button', { name: /toggle dark mode/i });
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      }, { timeout: 2000 });

      // Toggle back
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      }, { timeout: 2000 });
    });

    it('handles errors gracefully', async () => {
      renderDarkModeToggle();
      
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle dark mode/i });
        expect(button).toBeInTheDocument();
      });

      // Mock updateSettings to throw error
      jest.spyOn(SettingsRepository.prototype, 'updateSettings').mockRejectedValueOnce(
        new Error('Update failed')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const button = screen.getByRole('button', { name: /toggle dark mode/i });
      await act(async () => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error toggling dark mode:',
          expect.any(Error)
        );
      }, { timeout: 2000 });

      consoleSpy.mockRestore();
      jest.restoreAllMocks();
    });
  });

  describe('styling', () => {
    it('has proper CSS classes for styling', async () => {
      renderDarkModeToggle();
      
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle dark mode/i });
        expect(button).toHaveClass('p-2', 'rounded-md');
        expect(button).toHaveClass('transition-colors', 'duration-200');
      });
    });

    it('has dark mode styles applied', async () => {
      renderDarkModeToggle();
      
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /toggle dark mode/i });
        // Check for dark mode classes
        const classList = Array.from(button.classList);
        expect(classList.some(cls => cls.includes('dark:'))).toBe(true);
      });
    });
  });
});
