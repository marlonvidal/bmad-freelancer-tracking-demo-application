import React, { useState, useRef, useEffect } from 'react';
import { useColumnContext } from '@/contexts/ColumnContext';

/**
 * AddColumnButton - Button and form for adding new columns
 * 
 * Shows add column form/modal when clicked.
 * Form collects: column name (required).
 * Creates new column with next available position.
 */
export const AddColumnButton: React.FC = () => {
  const { createColumn, columns } = useColumnContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [columnName, setColumnName] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Focus input when form opens
  useEffect(() => {
    if (isFormOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFormOpen]);

  // Close form when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        handleCancel();
      }
    };

    if (isFormOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isFormOpen]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = columnName.trim();

    // Validate: name must not be empty
    if (!trimmedName) {
      setIsValid(false);
      return;
    }

    // Validate: name must be unique
    const isDuplicate = columns.some(
      c => c.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      setIsValid(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await createColumn(trimmedName);
      setColumnName('');
      setIsFormOpen(false);
      setIsValid(true);
    } catch (error) {
      console.error('Error creating column:', error);
      setIsValid(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    setColumnName('');
    setIsFormOpen(false);
    setIsValid(true);
  };

  /**
   * Handle keyboard events
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (!isFormOpen) {
    return (
      <button
        onClick={() => setIsFormOpen(true)}
        className="flex items-center justify-center w-80 sm:w-80 md:w-80 lg:w-80 h-16 bg-gray-100 hover:bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
        aria-label="Add new column"
      >
        <svg 
          className="w-5 h-5 mr-2" 
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
        Add Column
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="w-80 sm:w-80 md:w-80 lg:w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex-shrink-0"
    >
      <input
        ref={inputRef}
        type="text"
        value={columnName}
        onChange={(e) => {
          setColumnName(e.target.value);
          setIsValid(true);
        }}
        placeholder="Column name"
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isValid ? 'border-gray-300' : 'border-red-500'
        }`}
        aria-label="Column name"
        aria-invalid={!isValid}
        aria-required="true"
        disabled={isSubmitting}
      />
      {!isValid && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          Column name must be unique and not empty
        </p>
      )}
      <div className="flex gap-2 mt-3">
        <button
          type="submit"
          disabled={isSubmitting || !columnName.trim()}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Adding...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
