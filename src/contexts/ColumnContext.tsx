import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Column } from '@/types/column';
import { ColumnRepository } from '@/services/data/repositories/ColumnRepository';

interface ColumnState {
  columns: Column[];
  loading: boolean;
  error: Error | null;
}

interface ColumnContextValue extends ColumnState {
  createColumn: (name: string, color?: string | null) => Promise<Column>;
  updateColumn: (id: string, updates: Partial<Column>) => Promise<Column>;
  deleteColumn: (id: string) => Promise<void>;
  reorderColumns: (columnIds: string[]) => Promise<void>;
  getColumnById: (id: string) => Column | undefined;
}

const ColumnContext = createContext<ColumnContextValue | undefined>(undefined);

interface ColumnProviderProps {
  children: ReactNode;
}

/**
 * ColumnProvider - Provides column state and operations to child components
 * 
 * Manages column state using React Context API. Loads columns from IndexedDB on mount
 * and persists changes automatically. Uses optimistic updates for better UX.
 */
export const ColumnProvider: React.FC<ColumnProviderProps> = ({ children }) => {
  const [state, setState] = useState<ColumnState>({
    columns: [],
    loading: true,
    error: null
  });

  const repository = useMemo(() => new ColumnRepository(), []);

  /**
   * Initialize default columns if none exist
   */
  const initializeDefaultColumns = useCallback(async (): Promise<void> => {
    try {
      const defaultColumns = [
        { name: 'Backlog', position: 0, color: null },
        { name: 'In Progress', position: 1, color: null },
        { name: 'Review', position: 2, color: null },
        { name: 'Done', position: 3, color: null }
      ];

      for (const columnData of defaultColumns) {
        await repository.create(columnData);
      }
    } catch (error) {
      console.error('Error initializing default columns:', error);
      throw error;
    }
  }, [repository]);

  /**
   * Load columns from IndexedDB
   * Initializes default columns if none exist
   */
  const loadColumns = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const columns = await repository.getAll();
      
      // Initialize default columns if none exist
      if (columns.length === 0) {
        await initializeDefaultColumns();
        // Reload columns after initialization
        const initializedColumns = await repository.getAll();
        setState({ columns: initializedColumns, loading: false, error: null });
      } else {
        setState({ columns, loading: false, error: null });
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to load columns');
      setState(prev => ({ ...prev, loading: false, error: errorObj }));
      console.error('Error loading columns:', error);
    }
  }, [repository, initializeDefaultColumns]);

  /**
   * Initialize columns on mount
   */
  useEffect(() => {
    loadColumns();
  }, [loadColumns]);

  /**
   * Create a new column
   * Uses optimistic update: adds column to state immediately, then persists to IndexedDB
   */
  const createColumn = useCallback(async (name: string, color: string | null = null): Promise<Column> => {
    try {
      // Optimistic update: calculate next position
      const nextPosition = state.columns.length > 0 
        ? Math.max(...state.columns.map(c => c.position)) + 1 
        : 0;

      // Create column in IndexedDB
      const newColumn = await repository.create({
        name,
        position: nextPosition,
        color
      });

      // Update state with new column
      setState(prev => ({
        ...prev,
        columns: [...prev.columns, newColumn].sort((a, b) => a.position - b.position),
        error: null
      }));

      return newColumn;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to create column');
      setState(prev => ({ ...prev, error: errorObj }));
      console.error('Error creating column:', error);
      throw errorObj;
    }
  }, [repository, state.columns]);

  /**
   * Update an existing column
   * Uses optimistic update: updates column in state immediately, then persists to IndexedDB
   */
  const updateColumn = useCallback(async (id: string, updates: Partial<Column>): Promise<Column> => {
    try {
      // Optimistic update: update column in state immediately
      setState(prev => ({
        ...prev,
        columns: prev.columns.map(col => 
          col.id === id ? { ...col, ...updates } : col
        ),
        error: null
      }));

      // Persist to IndexedDB
      const updatedColumn = await repository.update(id, updates);

      // Update state with persisted column (to ensure consistency)
      setState(prev => ({
        ...prev,
        columns: prev.columns.map(col => 
          col.id === id ? updatedColumn : col
        ).sort((a, b) => a.position - b.position)
      }));

      return updatedColumn;
    } catch (error) {
      // Revert optimistic update on error
      await loadColumns();
      const errorObj = error instanceof Error ? error : new Error('Failed to update column');
      setState(prev => ({ ...prev, error: errorObj }));
      console.error('Error updating column:', error);
      throw errorObj;
    }
  }, [repository, loadColumns]);

  /**
   * Delete a column
   * Uses optimistic update: removes column from state immediately, then deletes from IndexedDB
   */
  const deleteColumn = useCallback(async (id: string): Promise<void> => {
    try {
      // Optimistic update: remove column from state immediately
      setState(prev => ({
        ...prev,
        columns: prev.columns.filter(col => col.id !== id),
        error: null
      }));

      // Delete from IndexedDB
      await repository.delete(id);
    } catch (error) {
      // Revert optimistic update on error
      await loadColumns();
      const errorObj = error instanceof Error ? error : new Error('Failed to delete column');
      setState(prev => ({ ...prev, error: errorObj }));
      console.error('Error deleting column:', error);
      throw errorObj;
    }
  }, [repository, loadColumns]);

  /**
   * Reorder columns
   * Uses optimistic update: updates column positions in state immediately, then persists to IndexedDB
   */
  const reorderColumns = useCallback(async (columnIds: string[]): Promise<void> => {
    try {
      // Optimistic update: reorder columns in state immediately
      const columnMap = new Map(state.columns.map(col => [col.id, col]));
      const reorderedColumns = columnIds
        .map((id, index) => {
          const column = columnMap.get(id);
          return column ? { ...column, position: index } : null;
        })
        .filter((col): col is Column => col !== null);

      setState(prev => ({
        ...prev,
        columns: reorderedColumns,
        error: null
      }));

      // Persist new order to IndexedDB
      await repository.reorder(columnIds);
    } catch (error) {
      // Revert optimistic update on error
      await loadColumns();
      const errorObj = error instanceof Error ? error : new Error('Failed to reorder columns');
      setState(prev => ({ ...prev, error: errorObj }));
      console.error('Error reordering columns:', error);
      throw errorObj;
    }
  }, [repository, state.columns, loadColumns]);

  /**
   * Get a column by ID
   */
  const getColumnById = useCallback((id: string): Column | undefined => {
    return state.columns.find(col => col.id === id);
  }, [state.columns]);

  const value: ColumnContextValue = {
    ...state,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    getColumnById
  };

  return (
    <ColumnContext.Provider value={value}>
      {children}
    </ColumnContext.Provider>
  );
};

/**
 * Hook to use ColumnContext
 * @throws Error if used outside ColumnProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useColumnContext = (): ColumnContextValue => {
  const context = useContext(ColumnContext);
  if (context === undefined) {
    throw new Error('useColumnContext must be used within a ColumnProvider');
  }
  return context;
};
