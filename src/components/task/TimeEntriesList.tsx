import React, { useState, useEffect, useMemo } from 'react';
import { TimeEntry } from '@/types/timeEntry';
import { TimeEntryRepository } from '@/services/data/repositories/TimeEntryRepository';
import { formatDuration } from '@/utils/timeUtils';
import { TimeEntryModal } from '@/components/timer/TimeEntryModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

interface TimeEntriesListProps {
  taskId: string;
  onTimeEntryChange?: () => void; // Callback when entries change (to refresh parent)
}

/**
 * TimeEntriesList - Component for displaying and managing time entries for a task
 * 
 * Features:
 * - Displays list of time entries
 * - Shows start time, end time, duration, description, manual/auto indicator
 * - Add/edit/delete time entries
 * - Calculates and displays total time spent
 */
export const TimeEntriesList: React.FC<TimeEntriesListProps> = ({
  taskId,
  onTimeEntryChange
}) => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmEntryId, setDeleteConfirmEntryId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const timeEntryRepository = useMemo(() => new TimeEntryRepository(), []);

  /**
   * Load time entries for this task
   */
  useEffect(() => {
    let isMounted = true;

    const loadTimeEntries = async () => {
      try {
        setIsLoading(true);
        const entries = await timeEntryRepository.getByTaskId(taskId);
        if (isMounted) {
          setTimeEntries(entries);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading time entries:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTimeEntries();

    return () => {
      isMounted = false;
    };
  }, [taskId, timeEntryRepository]);

  /**
   * Calculate total time spent
   */
  const totalTimeSpent = useMemo(() => {
    return timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
  }, [timeEntries]);

  /**
   * Format date/time for display
   */
  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  /**
   * Handle add time entry
   */
  const handleAddTimeEntry = async (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await timeEntryRepository.create(entry);
      // Reload entries
      const entries = await timeEntryRepository.getByTaskId(taskId);
      setTimeEntries(entries);
      setIsAddModalOpen(false);
      if (onTimeEntryChange) {
        onTimeEntryChange();
      }
    } catch (error) {
      console.error('Error creating time entry:', error);
      throw error;
    }
  };

  /**
   * Handle edit time entry
   */
  const handleEditTimeEntry = async (entryId: string, updates: Partial<TimeEntry>) => {
    try {
      await timeEntryRepository.update(entryId, updates);
      // Reload entries
      const entries = await timeEntryRepository.getByTaskId(taskId);
      setTimeEntries(entries);
      setEditingEntryId(null);
      if (onTimeEntryChange) {
        onTimeEntryChange();
      }
    } catch (error) {
      console.error('Error updating time entry:', error);
      throw error;
    }
  };

  /**
   * Handle delete button click - opens confirmation dialog
   */
  const handleDeleteClick = (entryId: string) => {
    setDeleteConfirmEntryId(entryId);
    setDeleteError(null);
  };

  /**
   * Handle delete confirmation
   */
  const handleConfirmDelete = async () => {
    if (!deleteConfirmEntryId) return;

    try {
      setDeleteError(null);
      await timeEntryRepository.delete(deleteConfirmEntryId);
      // Reload entries
      const entries = await timeEntryRepository.getByTaskId(taskId);
      setTimeEntries(entries);
      setDeleteConfirmEntryId(null);
      if (onTimeEntryChange) {
        onTimeEntryChange();
      }
    } catch (error) {
      console.error('Error deleting time entry:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete time entry. Please try again.';
      setDeleteError(errorMessage);
      // Keep dialog open to show error
    }
  };

  /**
   * Handle delete cancel
   */
  const handleCancelDelete = () => {
    setDeleteConfirmEntryId(null);
    setDeleteError(null);
  };

  /**
   * Get entry to edit
   */
  const entryToEdit = useMemo(() => {
    if (!editingEntryId) return null;
    return timeEntries.find(entry => entry.id === editingEntryId) || null;
  }, [editingEntryId, timeEntries]);

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500">
        Loading time entries...
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header with total time and add button */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Time Entries</h3>
            <p className="text-xs text-gray-500 mt-1">
              Total: {formatDuration(totalTimeSpent)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Add time entry"
          >
            <svg
              className="w-4 h-4 inline-block mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Entry
          </button>
        </div>

        {/* Time Entries List */}
        {timeEntries.length === 0 ? (
          <div className="text-sm text-gray-500 italic py-4 text-center border border-gray-200 rounded-md">
            No time entries yet. Click "Add Entry" to add one.
          </div>
        ) : (
          <div className="space-y-2">
            {timeEntries.map((entry) => (
              <div
                key={entry.id}
                className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Duration and Type */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDuration(entry.duration)}
                      </span>
                      {entry.isManual ? (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          Manual
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                          Auto
                        </span>
                      )}
                    </div>

                    {/* Time Range */}
                    <div className="text-xs text-gray-600 mb-1">
                      <div>
                        Start: {formatDateTime(entry.startTime)}
                      </div>
                      {entry.endTime && (
                        <div>
                          End: {formatDateTime(entry.endTime)}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {entry.description && (
                      <div className="text-sm text-gray-700 mt-1">
                        {entry.description}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingEntryId(entry.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      aria-label={`Edit time entry from ${formatDateTime(entry.startTime)}`}
                      title="Edit"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(entry.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                      aria-label={`Delete time entry from ${formatDateTime(entry.startTime)}`}
                      title="Delete"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Time Entry Modal */}
      <TimeEntryModal
        isOpen={isAddModalOpen}
        taskId={taskId}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddTimeEntry}
      />

      {/* Edit Time Entry Modal */}
      {editingEntryId && entryToEdit && (
        <TimeEntryModal
          isOpen={true}
          taskId={taskId}
          timeEntry={entryToEdit}
          onClose={() => setEditingEntryId(null)}
          onSubmit={async (entryData) => {
            await handleEditTimeEntry(editingEntryId, entryData);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmEntryId !== null}
        title="Delete Time Entry"
        message={
          deleteConfirmEntryId
            ? `Are you sure you want to delete this time entry? This action cannot be undone.${deleteError ? `\n\nError: ${deleteError}` : ''}`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  );
};
