import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

/**
 * FilterState - Represents the current filter state
 */
export interface FilterState {
  clientId: string | null;       // Selected client filter (null = no filter)
  projectId: string | null;      // Selected project filter (null = no filter)
}

interface FilterContextValue {
  filters: FilterState;
  setClientFilter: (clientId: string | null) => void;
  setProjectFilter: (projectId: string | null) => void;
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
    projectId: null
  });

  /**
   * Set client filter
   * When client filter changes, project filter is reset (projects are client-scoped)
   */
  const setClientFilter = useCallback((clientId: string | null): void => {
    setFilters({
      clientId,
      projectId: null // Reset project filter when client changes
    });
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
   * Clear all filters
   */
  const clearFilters = useCallback((): void => {
    setFilters({
      clientId: null,
      projectId: null
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
    clearFilters,
    getFilters
  }), [filters, setClientFilter, setProjectFilter, clearFilters, getFilters]);

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
