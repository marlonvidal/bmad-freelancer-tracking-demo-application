import React, { useState, useRef, useMemo } from 'react';
import { ExportService } from '@/services/ExportService';
import { ImportService } from '@/services/ImportService';
import { BackupPreview } from '@/types/backup';
import { BackupPreview as BackupPreviewComponent } from './BackupPreview';
import { RestoreConfirmationDialog } from './RestoreConfirmationDialog';
import { useTaskContext } from '@/contexts/TaskContext';
import { useClientContext } from '@/contexts/ClientContext';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useColumnContext } from '@/contexts/ColumnContext';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { useTimerContext } from '@/contexts/TimerContext';

/**
 * BackupRestoreOptions - Component for backup and restore functionality
 * 
 * Provides UI for creating backups and restoring from backup files.
 * Handles file upload, validation, preview, and restore workflow.
 */
export const BackupRestoreOptions: React.FC = () => {
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Context hooks for refreshing data after restore
  const { refreshTasks } = useTaskContext();
  const { refreshClients } = useClientContext();
  const { refreshProjects } = useProjectContext();
  const { refreshColumns } = useColumnContext();
  const { refreshSettings } = useSettingsContext();
  const { refreshTimerState } = useTimerContext();

  const exportService = useMemo(() => new ExportService(), []);
  const importService = useMemo(() => new ImportService(), []);

  /**
   * Clear messages after a delay
   */
  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  /**
   * Handle backup creation
   */
  const handleCreateBackup = async () => {
    try {
      setBackupLoading(true);
      setError(null);
      setSuccess(null);
      await exportService.backupAllData();
      setSuccess('Backup created successfully');
      clearMessages();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create backup';
      setError(errorMessage);
      clearMessages();
    } finally {
      setBackupLoading(false);
    }
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
      setError('Please select a JSON backup file');
      clearMessages();
      return;
    }

    // Validate file size (warn if > 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setError(`File size is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 50MB.`);
      clearMessages();
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setSelectedFile(file);

      // Validate and preview backup file
      const validation = await importService.validateBackupFile(file);
      if (!validation.isValid) {
        setError(`Invalid backup file: ${validation.errors.join('; ')}`);
        clearMessages();
        setSelectedFile(null);
        return;
      }

      // Generate preview
      const backupPreview = await importService.previewBackupData(file);
      setPreview(backupPreview);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to process backup file';
      setError(errorMessage);
      clearMessages();
      setSelectedFile(null);
      setPreview(null);
    }
  };

  /**
   * Handle file input click (trigger file picker)
   */
  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handle restore confirmation
   */
  const handleRestoreConfirm = async (mode: 'replace' | 'merge') => {
    if (!selectedFile) {
      return;
    }

    try {
      setRestoreLoading(true);
      setRestoreProgress(0);
      setError(null);
      setSuccess(null);
      setShowConfirmation(false);

      // Show progress indicator for large files (>10MB)
      const showProgress = selectedFile.size > 10 * 1024 * 1024;
      if (showProgress) {
        // Simulate progress updates during restore
        const progressInterval = setInterval(() => {
          setRestoreProgress((prev) => {
            if (prev === null) return 10;
            if (prev >= 90) return prev;
            return prev + 10;
          });
        }, 200);
        
        try {
          const stats = await importService.restoreBackup(selectedFile, mode);
          clearInterval(progressInterval);
          setRestoreProgress(100);
          
          if (mode === 'merge' && stats) {
            const statsMsg = [
              `Added: ${stats.added.tasks} tasks, ${stats.added.timeEntries} time entries, ${stats.added.clients} clients, ${stats.added.projects} projects, ${stats.added.columns} columns`,
              `Updated: ${stats.updated.tasks} tasks, ${stats.updated.timeEntries} time entries, ${stats.updated.clients} clients, ${stats.updated.projects} projects, ${stats.updated.columns} columns`,
            ].join('. ');
            setSuccess(`Restore completed successfully. ${statsMsg}`);
          } else {
            setSuccess('Restore completed successfully. All data has been replaced.');
          }

          // Refresh all contexts to reflect restored data
          await Promise.all([
            refreshTasks(),
            refreshClients(),
            refreshProjects(),
            refreshColumns(),
            refreshSettings(),
            refreshTimerState(),
          ]);
        } catch (restoreError) {
          clearInterval(progressInterval);
          throw restoreError;
        }
      } else {
        // Small file - no progress indicator needed
        const stats = await importService.restoreBackup(selectedFile, mode);
        
        if (mode === 'merge' && stats) {
          const statsMsg = [
            `Added: ${stats.added.tasks} tasks, ${stats.added.timeEntries} time entries, ${stats.added.clients} clients, ${stats.added.projects} projects, ${stats.added.columns} columns`,
            `Updated: ${stats.updated.tasks} tasks, ${stats.updated.timeEntries} time entries, ${stats.updated.clients} clients, ${stats.updated.projects} projects, ${stats.updated.columns} columns`,
          ].join('. ');
          setSuccess(`Restore completed successfully. ${statsMsg}`);
        } else {
          setSuccess('Restore completed successfully. All data has been replaced.');
        }

        // Refresh all contexts to reflect restored data
        await Promise.all([
          refreshTasks(),
          refreshClients(),
          refreshProjects(),
          refreshColumns(),
          refreshSettings(),
          refreshTimerState(),
        ]);
      }

      // Reset state
      setSelectedFile(null);
      setPreview(null);
      setRestoreProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      clearMessages();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to restore backup';
      setError(errorMessage);
      setRestoreProgress(null);
      clearMessages();
    } finally {
      setRestoreLoading(false);
    }
  };

  /**
   * Handle restore cancel
   */
  const handleRestoreCancel = () => {
    setShowConfirmation(false);
  };

  /**
   * Reset file selection
   */
  const handleResetFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Backup & Restore
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Create a backup of all your data or restore from a previous backup file.
      </p>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600" role="alert">
            {success}
          </p>
        </div>
      )}

      {/* Backup Section */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Create Backup
        </h3>
        <p className="text-xs text-gray-600 mb-3">
          Export all your data (tasks, time entries, clients, projects, columns, settings) to a JSON backup file.
        </p>
        <button
          type="button"
          onClick={handleCreateBackup}
          disabled={backupLoading || restoreLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Create backup"
        >
          {backupLoading ? 'Creating Backup...' : 'Create Backup'}
        </button>
      </div>

      {/* Restore Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Restore from Backup
        </h3>
        <p className="text-xs text-gray-600 mb-3">
          Upload a backup file to restore your data. You can choose to replace all existing data or merge with existing data.
        </p>

        {/* File Input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Select backup file"
        />

        {/* File Selection UI */}
        {!selectedFile ? (
          <div>
            <button
              type="button"
              onClick={handleFileInputClick}
              disabled={restoreLoading || backupLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Select backup file"
            >
              Select Backup File
            </button>
            <p className="mt-2 text-xs text-gray-500">
              Select a JSON backup file (.json)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected File Info */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetFile}
                  disabled={restoreLoading}
                  className="ml-4 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Remove selected file"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Preview */}
            {preview && (
              <BackupPreviewComponent preview={preview} />
            )}

            {/* Progress Indicator */}
            {restoreLoading && restoreProgress !== null && (
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Restoring...</span>
                  <span className="text-sm font-medium text-gray-900">{restoreProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${restoreProgress}%` }}
                    role="progressbar"
                    aria-valuenow={restoreProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            )}

            {/* Restore Button */}
            <button
              type="button"
              onClick={() => setShowConfirmation(true)}
              disabled={restoreLoading || backupLoading || !preview}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Restore backup"
            >
              {restoreLoading ? 'Restoring...' : 'Restore Backup'}
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && preview && selectedFile && (
        <RestoreConfirmationDialog
          preview={preview}
          onConfirm={handleRestoreConfirm}
          onCancel={handleRestoreCancel}
        />
      )}
    </div>
  );
};
