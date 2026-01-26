import React, { useState, useRef, useEffect } from 'react';
import { useFilterContext } from '@/contexts/FilterContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

/**
 * SearchBar - Search input component for kanban board
 * 
 * Provides search functionality with debouncing to prevent excessive filtering.
 * Supports keyboard shortcut (Ctrl/Cmd + F) to focus the search input.
 * Includes clear button that appears when search query exists.
 */
export const SearchBar: React.FC = () => {
  const { filters, setSearchQuery } = useFilterContext();
  const [localQuery, setLocalQuery] = useState<string>(filters.searchQuery);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Debounce search query (300ms delay)
  const debouncedQuery = useDebounce(localQuery, 300);

  // Update FilterContext when debounced query changes
  useEffect(() => {
    setSearchQuery(debouncedQuery);
  }, [debouncedQuery, setSearchQuery]);

  // Sync local query with FilterContext when it changes externally (e.g., clear filters)
  useEffect(() => {
    setLocalQuery(filters.searchQuery);
  }, [filters.searchQuery]);

  /**
   * Handle keyboard shortcut (Ctrl/Cmd + F) to focus search input
   */
  useKeyboardShortcut('f', () => {
    searchInputRef.current?.focus();
  }, {
    ctrlKey: true,
    metaKey: true,
    preventDefault: true
  });

  /**
   * Handle search input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  };

  /**
   * Handle clear button click
   */
  const handleClear = () => {
    setLocalQuery('');
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 mb-4"
      role="search"
      aria-label="Search tasks"
    >
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Search Input */}
        <input
          ref={searchInputRef}
          type="text"
          value={localQuery}
          onChange={handleInputChange}
          placeholder="Search tasks by title, description, or tags..."
          className={`
            w-full pl-10 pr-10 py-2 border rounded-md
            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
            border-gray-300 dark:border-gray-600
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400
            ${localQuery ? '' : ''}
          `}
          aria-label="Search tasks by title, description, or tags"
          aria-describedby="search-help-text"
        />

        {/* Clear Button */}
        {localQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded-md"
            aria-label="Clear search"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Help Text */}
      <p 
        id="search-help-text" 
        className="mt-1 text-xs text-gray-500 dark:text-gray-400"
      >
        Press <kbd className="px-1 py-0.5 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Ctrl+F</kbd> or <kbd className="px-1 py-0.5 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Cmd+F</kbd> to focus search
      </p>
    </div>
  );
};
