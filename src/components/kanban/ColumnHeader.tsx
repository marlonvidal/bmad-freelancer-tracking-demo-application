import React, { useState, useRef, useEffect } from 'react';
import { Column as ColumnType } from '@/types/column';
import { useColumnContext } from '@/contexts/ColumnContext';

interface ColumnHeaderProps {
  column: ColumnType;
  taskCount: number;
  onDelete: (columnId: string) => void;
}

/**
 * ColumnHeader - Column header component with name, task count, and controls
 * 
 * Displays column name (editable inline), task count badge, and column menu.
 * Column menu includes: Edit Name, Delete Column.
 */
export const ColumnHeader: React.FC<ColumnHeaderProps> = ({ column, taskCount, onDelete }) => {
  const { updateColumn, columns } = useColumnContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(column.name);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMenuOpen]);

  /**
   * Handle inline editing start
   */
  const handleEditStart = () => {
    setIsEditing(true);
    setEditedName(column.name);
    setIsMenuOpen(false);
  };

  /**
   * Handle inline editing save
   */
  const handleSave = async () => {
    const trimmedName = editedName.trim();
    
    // Validate: name must not be empty
    if (!trimmedName) {
      setIsValid(false);
      return;
    }

    // Validate: name must be unique (check against other columns)
    const isDuplicate = columns.some(
      c => c.id !== column.id && c.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      setIsValid(false);
      return;
    }

    try {
      await updateColumn(column.id, { name: trimmedName });
      setIsEditing(false);
      setIsValid(true);
    } catch (error) {
      console.error('Error updating column name:', error);
      setIsValid(false);
    }
  };

  /**
   * Handle inline editing cancel
   */
  const handleCancel = () => {
    setIsEditing(false);
    setEditedName(column.name);
    setIsValid(true);
  };

  /**
   * Handle keyboard events for inline editing
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  /**
   * Handle blur - save if valid, cancel if invalid
   */
  const handleBlur = () => {
    if (isValid && editedName.trim()) {
      handleSave();
    } else {
      handleCancel();
    }
  };

  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      <div className="flex items-center justify-between gap-2">
        {/* Column Name - Editable */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex flex-col gap-1">
              <input
                ref={inputRef}
                type="text"
                value={editedName}
                onChange={(e) => {
                  setEditedName(e.target.value);
                  setIsValid(true);
                }}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className={`w-full px-2 py-1 text-sm font-semibold border rounded ${
                  isValid ? 'border-gray-300' : 'border-red-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                aria-label={`Edit column name, current name: ${column.name}`}
                aria-invalid={!isValid}
              />
              {!isValid && (
                <span className="text-xs text-red-600" role="alert">
                  Column name must be unique and not empty
                </span>
              )}
            </div>
          ) : (
            <button
              onClick={handleEditStart}
              className="text-left font-semibold text-gray-900 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 -ml-1"
              aria-label={`Edit column name: ${column.name}`}
            >
              {column.name}
            </button>
          )}
        </div>

        {/* Task Count Badge */}
        <span 
          className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-full whitespace-nowrap"
          aria-label={`${taskCount} tasks in ${column.name}`}
        >
          {taskCount}
        </span>

        {/* Column Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label={`${column.name} column options`}
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" 
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div 
              className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200"
              role="menu"
              aria-label="Column options menu"
            >
              <button
                onClick={handleEditStart}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                role="menuitem"
              >
                Edit Name
              </button>
              <button
                onClick={() => {
                  onDelete(column.id);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:bg-red-50"
                role="menuitem"
                aria-label={`Delete ${column.name} column`}
              >
                Delete Column
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
