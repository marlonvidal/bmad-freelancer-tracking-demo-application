import React, { useState } from 'react';
import { TimeEntry } from '@/types/timeEntry';
import { formatDuration } from '@/utils/timeUtils';
import { TimeEntryModal } from './TimeEntryModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TimeEntryRepository } from '@/services/data/repositories/TimeEntryRepository';

interface TimeEntryListItemProps {
  timeEntry: TimeEntry;
  onUpdated?: () => void;
  onDeleted?: () => void;
}

/**
 * TimeEntryListItem - Displays individual time entry with edit/delete actions
 * 
 * Shows duration, date/time, description, and manual indicator.
 * Provides edit and delete buttons with confirmation.
 */
export const TimeEntryListItem: React.FC<TimeEntryListItemProps> = ({
  timeEntry,
  onUpdated,
  onDeleted
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const timeEntryRepository = new TimeEntryRepository();

  /**
   * Format date/time for display
   */
  const formatDateTime = (date: Date): string => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  /**
   * Handle edit button click
   */
  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  /**
   * Handle delete button click
   */
  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  /**
   * Handle edit modal close
   */
  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
  };

  /**
   * Handle edit submission
   */
  const handleEditSubmit = async (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await timeEntryRepository.update(timeEntry.id, entry);
      setIsEditModalOpen(false);
      onUpdated?.();
    } catch (error) {
      console.error('Error updating time entry:', error);
      throw error; // Re-throw to let modal handle error display
    }
  };

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await timeEntryRepository.delete(timeEntry.id);
      setIsDeleteDialogOpen(false);
      onDeleted?.();
    } catch (error) {
      console.error('Error deleting time entry:', error);
      alert('Failed to delete time entry. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Handle delete cancellation
   */
  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <div
        className="flex items-start justify-between gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors"
        role="listitem"
      >
        {/* Entry Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Manual Indicator */}
            {timeEntry.isManual && (
              <span
                className="flex-shrink-0"
                aria-label="Manual entry"
                title="Manual entry"
              >
                <svg
                  className="w-4 h-4 text-gray-500"
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
              </span>
            )}
            
            {/* Tracked Indicator */}
            {!timeEntry.isManual && (
              <span
                className="flex-shrink-0"
                aria-label="Tracked entry"
                title="Tracked entry"
              >
                <svg
                  className="w-4 h-4 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
            )}

            {/* Duration */}
            <span className="text-sm font-medium text-gray-900">
              {formatDuration(timeEntry.duration)}
            </span>
          </div>

          {/* Date/Time */}
          <div className="text-xs text-gray-500 mt-1">
            {formatDateTime(timeEntry.startTime)}
          </div>

          {/* Description */}
          {timeEntry.description && (
            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
              {timeEntry.description}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Edit Button */}
          <button
            onClick={handleEditClick}
            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Edit time entry"
            title="Edit time entry"
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

          {/* Delete Button */}
          <button
            onClick={handleDeleteClick}
            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Delete time entry"
            title="Delete time entry"
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

      {/* Edit Modal */}
      <TimeEntryModal
        isOpen={isEditModalOpen}
        taskId={timeEntry.taskId}
        timeEntry={timeEntry}
        onClose={handleEditModalClose}
        onSubmit={handleEditSubmit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Time Entry"
        message="Are you sure you want to delete this time entry? This action cannot be undone."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        variant="danger"
      />
    </>
  );
};
