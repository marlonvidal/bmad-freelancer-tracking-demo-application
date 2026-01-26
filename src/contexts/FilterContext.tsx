import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

/**
 * FilterState - Represents the current filter state
 */
export interface FilterState {
  // Existing filters from Story 3.7
  clientId: string | null;       // Selected client filter (null = no filter)
  projectId: string | null;      // Selected project filter (null = no filter)
  
  // New filters for Story 4.2
  searchQuery: string;                    // Search text (empty string = no search)
  billableStatus: boolean | null;         // null = no filter, true = billable only, false = non-billable only
  priority: 'low' | 'medium' | 'high' | null;  // null = no filter
  dueDateRange: {                         // null dates = no filter for that bound
    start: Date | null;
    end: Date | null;
  };
  tags: string[];                         // Empty array = no filter, non-empty = tasks must have at least one matching tag
}

interface FilterContextValue {
  filters: FilterState;
  setClientFilter: (clientId: string | null) => void;
  setProjectFilter: (projectId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setBillableFilter: (status: boolean | null) => void;
  setPriorityFilter: (priority: 'low' | 'medium' | 'high' | null) => void;
  setDueDateRange: (start: Date | null, end: Date | null) => void;
  setTagFilters: (tags: string[]) => void;
  addTagFilter: (tag: string) => void;
  removeTagFilter: (tag: string) => void;
  clearFilters: () => void;
  getFilters: () => FilterState;
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined);

interface FilterProviderProps {
  children: ReactNode;
}

/**
 * FilterProvider - Provides filter state and operations to child components
 * 
 * Manages filter state using React Context API. Filter state is session-only
 * and does not persist across app reloads (per AC 9).
 */
export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>({
    clientId: null,
    projectId: null,
    searchQuery: '',
    billableStatus: null,
    priority: null,
    dueDateRange: {
      start: null,
      end: null
    },
    tags: []
  });

  /**
   * Set client filter
   * When client filter changes, project filter is reset (projects are client-scoped)
   */
  const setClientFilter = useCallback((clientId: string | null): void => {
    setFilters(prev => ({
      ...prev,
      clientId,
      projectId: null // Reset project filter when client changes
    }));
  }, []);

  /**
   * Set project filter
   * Project filter requires a client to be selected
   */
  const setProjectFilter = useCallback((projectId: string | null): void => {
    setFilters(prev => ({
      ...prev,
      projectId
    }));
  }, []);

  /**
   * Set search query
   */
  const setSearchQuery = useCallback((query: string): void => {
    setFilters(prev => ({
      ...prev,
      searchQuery: query
    }));
  }, []);

  /**
   * Set billable status filter
   */
  const setBillableFilter = useCallback((status: boolean | null): void => {
    setFilters(prev => ({
      ...prev,
      billableStatus: status
    }));
  }, []);

  /**
   * Set priority filter
   */
  const setPriorityFilter = useCallback((priority: 'low' | 'medium' | 'high' | null): void => {
    setFilters(prev => ({
      ...prev,
      priority
    }));
  }, []);

  /**
   * Set due date range filter
   */
  const setDueDateRange = useCallback((start: Date | null, end: Date | null): void => {
    setFilters(prev => ({
      ...prev,
      dueDateRange: {
        start,
        end
      }
    }));
  }, []);

  /**
   * Set tag filters (replaces all tags)
   */
  const setTagFilters = useCallback((tags: string[]): void => {
    setFilters(prev => ({
      ...prev,
      tags
    }));
  }, []);

  /**
   * Add a tag to the filter
   */
  const addTagFilter = useCallback((tag: string): void => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags : [...prev.tags, tag]
    }));
  }, []);

  /**
   * Remove a tag from the filter
   */
  const removeTagFilter = useCallback((tag: string): void => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  }, []);

  /**
   * Clear all filters including search
   */
  const clearFilters = useCallback((): void => {
    setFilters({
      clientId: null,
      projectId: null,
      searchQuery: '',
      billableStatus: null,
      priority: null,
      dueDateRange: {
        start: null,
        end: null
      },
      tags: []
    });
  }, []);

  /**
   * Get current filter state
   */
  const getFilters = useCallback((): FilterState => {
    return filters;
  }, [filters]);

  const value: FilterContextValue = useMemo(() => ({
    filters,
    setClientFilter,
    setProjectFilter,
    setSearchQuery,
    setBillableFilter,
    setPriorityFilter,
    setDueDateRange,
    setTagFilters,
    addTagFilter,
    removeTagFilter,
    clearFilters,
    getFilters
  }), [
    filters,
    setClientFilter,
    setProjectFilter,
    setSearchQuery,
    setBillableFilter,
    setPriorityFilter,
    setDueDateRange,
    setTagFilters,
    addTagFilter,
    removeTagFilter,
    clearFilters,
    getFilters
  ]);

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

/**
 * Hook to use FilterContext
 * @throws Error if used outside FilterProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useFilterContext = (): FilterContextValue => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
};
