import React from 'react';
import { SettingsSection } from './SettingsSection';

/**
 * KeyboardShortcutsSection - Settings section displaying keyboard shortcuts reference
 * 
 * Displays a table of available keyboard shortcuts for faster navigation.
 * Read-only reference (no editing in MVP).
 */
export const KeyboardShortcutsSection: React.FC = () => {
  // Detect platform for shortcut display
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modifierKey = isMac ? 'Cmd' : 'Ctrl';

  const shortcuts = [
    {
      shortcut: `${modifierKey} + F`,
      action: 'Focus search',
      description: 'Focus the search bar to quickly find tasks'
    },
    {
      shortcut: 'ESC',
      action: 'Close modals/panels',
      description: 'Close any open modal dialog or side panel'
    },
    {
      shortcut: 'Tab',
      action: 'Navigate between elements',
      description: 'Move focus between interactive elements'
    },
    {
      shortcut: 'Enter / Space',
      action: 'Activate buttons',
      description: 'Activate focused buttons or toggle switches'
    }
  ];

  return (
    <SettingsSection
      title="Keyboard Shortcuts"
      description="Keyboard shortcuts help you navigate faster. Use these shortcuts throughout the application."
    >
      <div className="overflow-x-auto">
        <table
          className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
          role="table"
          aria-label="Keyboard shortcuts reference"
        >
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Shortcut
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Action
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Description
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {shortcuts.map((item, index) => (
              <tr
                key={index}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                    {item.shortcut}
                  </kbd>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.action}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {item.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SettingsSection>
  );
};
