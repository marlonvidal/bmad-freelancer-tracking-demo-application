import React from 'react';
import { Column as ColumnType } from '@/types/column';

interface DeleteColumnDialogProps {
  column: ColumnType;
  taskCount: number;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * DeleteColumnDialog - Confirmation dialog for deleting columns
 * 
 * Shows warning if column contains tasks.
 * Options: Move tasks to another column or delete column and all tasks.
 */
export const DeleteColumnDialog: React.FC<DeleteColumnDialogProps> = ({
  column,
  taskCount,
  isOpen,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 
          id="delete-dialog-title"
          className="text-lg font-semibold text-gray-900 mb-4"
        >
          Delete Column
        </h2>

        {taskCount > 0 ? (
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              The column <strong>"{column.name}"</strong> contains <strong>{taskCount} task{taskCount !== 1 ? 's' : ''}</strong>.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Deleting this column will permanently delete all tasks in it. This action cannot be undone.
            </p>
            <p className="text-sm text-gray-500 italic">
              Note: Moving tasks to another column will be available in a future update.
            </p>
          </div>
        ) : (
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete the column <strong>"{column.name}"</strong>?
          </p>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Cancel deletion"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label={`Confirm deletion of ${column.name} column`}
          >
            Delete Column
          </button>
        </div>
      </div>
    </div>
  );
};
