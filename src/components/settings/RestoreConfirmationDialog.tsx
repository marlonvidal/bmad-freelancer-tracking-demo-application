import React, { useState, useEffect, useRef } from 'react';
import { BackupPreview } from '@/types/backup';
import { RestoreMode } from '@/types/backup';

interface RestoreConfirmationDialogProps {
  preview: BackupPreview;
  onConfirm: (mode: RestoreMode) => void;
  onCancel: () => void;
}

/**
 * RestoreConfirmationDialog - Modal dialog for confirming restore operation
 * 
 * Allows user to select restore mode (replace or merge) and requires
 * explicit confirmation before proceeding. Includes focus trap and
 * keyboard navigation support.
 */
export const RestoreConfirmationDialog: React.FC<RestoreConfirmationDialogProps> = ({
  preview,
  onConfirm,
  onCancel,
}) => {
  const [mode, setMode] = useState<RestoreMode>('merge');
  const [confirmationText, setConfirmationText] = useState('');
  const [isValid, setIsValid] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Focus trap: trap focus within dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Focus first focusable element
    firstFocusableRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
        return;
      }

      // Tab trapping
      if (event.key === 'Tab') {
        const focusableElements = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  // Validate confirmation text for replace mode
  useEffect(() => {
    if (mode === 'replace') {
      setIsValid(confirmationText.trim().toUpperCase() === 'RESTORE');
    } else {
      setIsValid(true); // Merge mode doesn't require confirmation text
    }
  }, [mode, confirmationText]);

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(mode);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restore-dialog-title"
      aria-describedby="restore-dialog-description"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="restore-dialog-title"
          className="text-xl font-semibold text-gray-900 mb-4"
        >
          Confirm Restore
        </h2>

        <div
          id="restore-dialog-description"
          className="mb-6"
        >
          <p className="text-sm text-gray-600 mb-4">
            Choose how you want to restore the backup data:
          </p>

          {/* Mode Selection */}
          <div className="space-y-3 mb-4">
            <label className="flex items-start p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="restore-mode"
                value="merge"
                checked={mode === 'merge'}
                onChange={(e) => {
                  setMode(e.target.value as RestoreMode);
                  setConfirmationText('');
                }}
                className="mt-1 mr-3"
                aria-label="Merge with existing data"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Merge with Existing Data
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Import backup data and keep existing data. Duplicate IDs will be updated.
                </p>
              </div>
            </label>

            <label className="flex items-start p-3 border border-red-300 rounded-md cursor-pointer hover:bg-red-50">
              <input
                type="radio"
                name="restore-mode"
                value="replace"
                checked={mode === 'replace'}
                onChange={(e) => {
                  setMode(e.target.value as RestoreMode);
                  setConfirmationText('');
                }}
                className="mt-1 mr-3"
                aria-label="Replace all data"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Replace All Data
                </p>
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ This will delete all existing data and replace it with backup data. This action cannot be undone.
                </p>
              </div>
            </label>
          </div>

          {/* Preview Summary */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md mb-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Backup Contains:
            </p>
            <p className="text-xs text-gray-600">
              {preview.taskCount} tasks, {preview.timeEntryCount} time entries,{' '}
              {preview.clientCount} clients, {preview.projectCount} projects,{' '}
              {preview.columnCount} columns
            </p>
          </div>

          {/* Confirmation Text Input (for replace mode) */}
          {mode === 'replace' && (
            <div className="mb-4">
              <label
                htmlFor="confirmation-text"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Type "RESTORE" to confirm:
              </label>
              <input
                id="confirmation-text"
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="RESTORE"
                aria-label="Confirmation text"
                aria-required="true"
              />
            </div>
          )}

          {/* Warnings */}
          {preview.warnings && preview.warnings.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-xs font-semibold text-yellow-800 mb-1">
                Warnings:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {preview.warnings.slice(0, 3).map((warning, index) => (
                  <li key={index} className="text-xs text-yellow-700">
                    {warning}
                  </li>
                ))}
                {preview.warnings.length > 3 && (
                  <li className="text-xs text-yellow-700">
                    ...and {preview.warnings.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            ref={firstFocusableRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Cancel restore"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Confirm restore"
          >
            {mode === 'replace' ? 'Replace All Data' : 'Merge Data'}
          </button>
        </div>
      </div>
    </div>
  );
};
