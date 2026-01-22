import React, { useEffect, useRef, useState } from 'react';
import { TimeEntryForm } from './TimeEntryForm';
import { TimeEntryList } from './TimeEntryList';
import { TimeEntry } from '@/types/timeEntry';

interface TimeEntryModalProps {
  isOpen: boolean;
  taskId: string;
  timeEntry?: TimeEntry; // Optional, for edit mode
  onClose: () => void;
  onSubmit: (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

/**
 * TimeEntryModal - Modal component for adding/editing time entries
 * 
 * Displays TimeEntryForm inside a modal overlay with backdrop.
 * Handles modal open/close state, ESC key press, and focus management.
 * Supports both create and edit modes.
 */
export const TimeEntryModal: React.FC<TimeEntryModalProps> = ({
  isOpen,
  taskId,
  timeEntry,
  onClose,
  onSubmit
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const isEditMode = !!timeEntry;
  const [refreshKey, setRefreshKey] = useState(0);

  // Store the previously focused element when modal opens
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Focus management: trap focus within modal
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    // Focus the modal container
    modal.focus();

    // Get all focusable elements within the modal
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Handle Tab key to trap focus
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Handle ESC key to close modal
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Return focus to previously focused element when modal closes
  useEffect(() => {
    if (!isOpen && previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  /**
   * Handle backdrop click
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    await onSubmit(entry);
    // Refresh the time entry list
    setRefreshKey(prev => prev + 1);
    // Don't close modal in create mode so user can see the new entry
    if (isEditMode) {
      onClose();
    }
  };

  /**
   * Handle time entry list updates
   */
  const handleEntryUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  /**
   * Handle time entry deletion
   */
  const handleEntryDeleted = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="time-entry-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 
            id="time-entry-modal-title" 
            className="text-xl font-semibold text-gray-900"
          >
            {isEditMode ? 'Edit Time Entry' : 'Add Time Entry'}
          </h2>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {isEditMode ? 'Edit Entry' : 'New Entry'}
              </h3>
              <TimeEntryForm
                taskId={taskId}
                timeEntry={timeEntry}
                onSubmit={handleSubmit}
                onCancel={onClose}
              />
            </div>

            {/* Time Entries List Section */}
            {!isEditMode && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  All Time Entries
                </h3>
                <div className="max-h-[60vh] overflow-y-auto">
                  <TimeEntryList
                    key={refreshKey}
                    taskId={taskId}
                    onEntryUpdated={handleEntryUpdated}
                    onEntryDeleted={handleEntryDeleted}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
