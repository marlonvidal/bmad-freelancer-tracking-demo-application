import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { KeyboardShortcutsSection } from '@/components/settings/KeyboardShortcutsSection';

describe('KeyboardShortcutsSection', () => {
  describe('rendering', () => {
    it('renders the keyboard shortcuts section', () => {
      render(<KeyboardShortcutsSection />);

      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
      expect(screen.getByText(/Keyboard shortcuts help you navigate faster/i)).toBeInTheDocument();
    });

    it('displays keyboard shortcuts table', () => {
      render(<KeyboardShortcutsSection />);

      expect(screen.getByRole('table', { name: /keyboard shortcuts reference/i })).toBeInTheDocument();
    });

    it('displays all shortcut rows', () => {
      render(<KeyboardShortcutsSection />);

      expect(screen.getByText(/Focus search/i)).toBeInTheDocument();
      expect(screen.getByText(/Close modals\/panels/i)).toBeInTheDocument();
      expect(screen.getByText(/Navigate between elements/i)).toBeInTheDocument();
      expect(screen.getByText(/Activate buttons/i)).toBeInTheDocument();
    });

    it('shows platform-specific shortcuts', () => {
      // Mock navigator to simulate Mac
      const originalPlatform = navigator.platform;
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true
      });

      render(<KeyboardShortcutsSection />);

      expect(screen.getByText(/Cmd \+ F/i)).toBeInTheDocument();

      // Restore
      Object.defineProperty(navigator, 'platform', {
        value: originalPlatform,
        configurable: true
      });
    });

    it('shows Ctrl shortcuts for Windows/Linux', () => {
      // Mock navigator to simulate Windows
      const originalPlatform = navigator.platform;
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true
      });

      render(<KeyboardShortcutsSection />);

      expect(screen.getByText(/Ctrl \+ F/i)).toBeInTheDocument();

      // Restore
      Object.defineProperty(navigator, 'platform', {
        value: originalPlatform,
        configurable: true
      });
    });
  });

  describe('accessibility', () => {
    it('has proper heading structure', () => {
      render(<KeyboardShortcutsSection />);

      const heading = screen.getByRole('heading', { name: 'Keyboard Shortcuts' });
      expect(heading).toBeInTheDocument();
    });

    it('has accessible table structure', () => {
      render(<KeyboardShortcutsSection />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveAttribute('aria-label', 'Keyboard shortcuts reference');

      // Check for table headers
      expect(screen.getByText('Shortcut')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });
});
