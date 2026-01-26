import React from 'react';
import { SettingsSection } from './SettingsSection';
import { ExportOptions } from './ExportOptions';
import { BackupRestoreOptions } from './BackupRestoreOptions';

/**
 * DataManagementSettings - Settings section for data management options
 * 
 * Displays export and backup/restore options.
 * Uses ExportOptions component from Story 4.3 and BackupRestoreOptions from Story 4.4.
 */
export const DataManagementSettings: React.FC = () => {
  return (
    <SettingsSection
      title="Data Management"
      description="Export your data or backup/restore your application."
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Export Data
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Export your time tracking data in CSV or JSON format for use in other tools.
          </p>
          <ExportOptions />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Backup & Restore
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Create a backup of all your data or restore from a previous backup.
          </p>
          <BackupRestoreOptions />
        </div>
      </div>
    </SettingsSection>
  );
};
