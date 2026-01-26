import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Task } from '@/types/task';
import { TaskRepository } from '@/services/data/repositories/TaskRepository';
import { FilterState } from './FilterContext';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: Error | null;
  selectedTaskId: string | null;
  isPanelOpen: boolean;
}

interface TaskContextValue extends TaskState {
  createTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  getTasksByColumnId: (columnId: string) => Task[];
  getTaskById: (id: string) => Task | undefined;
  searchTasks: (tasks: Task[], query: string) => Task[];
  getFilteredTasks: (filters: FilterState) => Task[];
  getFilteredTasksByColumnId: (columnId: string, filters: FilterState) => Task[];
  openTaskPanel: (taskId: string) => void;
  closeTaskPanel: () => void;
  getSelectedTask: () => Task | null;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

interface TaskProviderProps {
  children: ReactNode;
}

/**
 * TaskProvider - Provides task state and operations to child components
 * 
 * Manages task state using React Context API. Loads tasks from IndexedDB on mount
 * and persists changes automatically. Uses optimistic updates for better UX.
 */
export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [state, setState] = useState<TaskState>({
    tasks: [],
    loading: true,
    error: null,
    selectedTaskId: null,
    isPanelOpen: false
  });

  const repository = useMemo(() => new TaskRepository(), []);

  /**
   * Load tasks from IndexedDB
   */
  const loadTasks = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const tasks = await repository.getAll();
      setState({ tasks, loading: false, error: null });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to load tasks');
      setState(prev => ({ ...prev, loading: false, error: errorObj }));
      console.error('Error loading tasks:', error);
    }
  }, [repository]);

  /**
   * Initialize tasks on mount
   */
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  /**
   * Create a new task
   * Uses optimistic update: adds task to state immediately, then persists to IndexedDB
   */
  const createTask = useCallback(async (
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Task> => {
    try {
      // Create task in IndexedDB
      const newTask = await repository.create(taskData);

      // Update state with new task (optimistic update)
      setState(prev => ({
        ...prev,
        tasks: [...prev.tasks, newTask],
        error: null
      }));

      return newTask;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to create task');
      setState(prev => ({ ...prev, error: errorObj }));
      console.error('Error creating task:', error);
      throw errorObj;
    }
  }, [repository]);

  /**
   * Update an existing task
   * Uses optimistic update: updates task in state immediately, then persists to IndexedDB
   */
  const updateTask = useCallback(async (id: string, updates: Partial<Task>): Promise<Task> => {
    try {
      // Optimistic update: update task in state immediately
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => 
          task.id === id ? { ...task, ...updates } : task
        ),
        error: null
      }));

      // Persist to IndexedDB
      const updatedTask = await repository.update(id, updates);

      // Update state with persisted task (to ensure consistency)
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task => 
          task.id === id ? updatedTask : task
        )
      }));

      return updatedTask;
    } catch (error) {
      // Revert optimistic update on error
      await loadTasks();
      const errorObj = error instanceof Error ? error : new Error('Failed to update task');
      setState(prev => ({ ...prev, error: errorObj }));
      console.error('Error updating task:', error);
      throw errorObj;
    }
  }, [repository, loadTasks]);

  /**
   * Delete a task
   * Uses optimistic update: removes task from state immediately, then deletes from IndexedDB
   * Closes panel if the deleted task was selected
   */
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    try {
      // Optimistic update: remove task from state immediately
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(task => task.id !== id),
        error: null,
        // Close panel if deleted task was selected
        isPanelOpen: prev.selectedTaskId === id ? false : prev.isPanelOpen,
        selectedTaskId: prev.selectedTaskId === id ? null : prev.selectedTaskId
      }));

      // Delete from IndexedDB
      await repository.delete(id);
    } catch (error) {
      // Revert optimistic update on error
      await loadTasks();
      const errorObj = error instanceof Error ? error : new Error('Failed to delete task');
      setState(prev => ({ ...prev, error: errorObj }));
      console.error('Error deleting task:', error);
      throw errorObj;
    }
  }, [repository, loadTasks]);

  /**
   * Get tasks by column ID
   */
  const getTasksByColumnId = useCallback((columnId: string): Task[] => {
    return state.tasks
      .filter(task => task.columnId === columnId)
      .sort((a, b) => a.position - b.position);
  }, [state.tasks]);

  /**
   * Get a task by ID
   */
  const getTaskById = useCallback((id: string): Task | undefined => {
    return state.tasks.find(task => task.id === id);
  }, [state.tasks]);

  /**
   * Search tasks by query string
   * 
   * Searches in task title, description, and tags (case-insensitive, partial match).
   * Returns tasks that match any of the search fields (OR logic within search).
   * 
   * @param tasks - Tasks to search through
   * @param query - Search query string (empty string = no search)
   * @returns Filtered tasks that match the search query
   */
  const searchTasks = useCallback((tasks: Task[], query: string): Task[] => {
    if (!query || query.trim() === '') {
      return tasks; // No search query, return all tasks
    }

    const normalizedQuery = query.toLowerCase().trim();

    return tasks.filter(task => {
      // Search in title (case-insensitive, partial match)
      const titleMatch = task.title.toLowerCase().includes(normalizedQuery);

      // Search in description (case-insensitive, partial match)
      const descriptionMatch = task.description
        ? task.description.toLowerCase().includes(normalizedQuery)
        : false;

      // Search in tags (case-insensitive, exact or partial match)
      // Use Set for O(1) lookup performance
      const tagSet = new Set(task.tags.map(tag => tag.toLowerCase()));
      const tagMatch = Array.from(tagSet).some(tag =>
        tag.includes(normalizedQuery) || normalizedQuery.includes(tag)
      );

      // Return tasks that match any of the above fields (OR logic)
      return titleMatch || descriptionMatch || tagMatch;
    });
  }, []);

  /**
   * Get filtered tasks based on all filters (client, project, search, billable, priority, date range, tags)
   * 
   * Filtering logic:
   * 1. Apply search first (if searchQuery is not empty)
   * 2. Apply client filter
   * 3. Apply project filter
   * 4. Apply billable status filter
   * 5. Apply priority filter
   * 6. Apply due date range filter
   * 7. Apply tags filter
   * 
   * All filters use AND logic (all filters must match).
   * Tasks with null values show when no filter is set for that field.
   */
  const getFilteredTasks = useCallback((filters: FilterState): Task[] => {
    let filtered = state.tasks;

    // Apply search first (if search query exists)
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      filtered = searchTasks(filtered, filters.searchQuery);
    }

    // Apply client filter
    if (filters.clientId !== null) {
      filtered = filtered.filter(task => task.clientId === filters.clientId);
    }

    // Apply project filter
    if (filters.projectId !== null) {
      filtered = filtered.filter(task => task.projectId === filters.projectId);
    }

    // Apply billable status filter
    if (filters.billableStatus !== null) {
      filtered = filtered.filter(task => task.isBillable === filters.billableStatus);
    }

    // Apply priority filter
    if (filters.priority !== null) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Apply due date range filter
    if (filters.dueDateRange.start !== null || filters.dueDateRange.end !== null) {
      // Validate date range: start should not be after end
      const startDate = filters.dueDateRange.start ? new Date(filters.dueDateRange.start) : null;
      const endDate = filters.dueDateRange.end ? new Date(filters.dueDateRange.end) : null;
      
      // Only apply filter if date range is valid
      if (!startDate || !endDate || startDate <= endDate) {
        filtered = filtered.filter(task => {
          if (!task.dueDate) {
            return false; // Tasks without due date don't match date range filter
          }

          const taskDueDate = new Date(task.dueDate);
          taskDueDate.setHours(0, 0, 0, 0);

          if (startDate) {
            const normalizedStart = new Date(startDate);
            normalizedStart.setHours(0, 0, 0, 0);
            if (taskDueDate < normalizedStart) {
              return false;
            }
          }

          if (endDate) {
            const normalizedEnd = new Date(endDate);
            normalizedEnd.setHours(23, 59, 59, 999);
            if (taskDueDate > normalizedEnd) {
              return false;
            }
          }

          return true;
        });
      }
      // If date range is invalid (start > end), don't filter (show all tasks)
    }

    // Apply tags filter (tasks must have at least one matching tag)
    if (filters.tags.length > 0) {
      const tagSet = new Set(filters.tags.map(tag => tag.toLowerCase()));
      filtered = filtered.filter(task =>
        task.tags.some(taskTag => tagSet.has(taskTag.toLowerCase()))
      );
    }

    return filtered;
  }, [state.tasks, searchTasks]);

  /**
   * Get filtered tasks for a specific column
   * Combines column filtering with all filters (client, project, search, billable, priority, date range, tags)
   */
  const getFilteredTasksByColumnId = useCallback((columnId: string, filters: FilterState): Task[] => {
    const filtered = getFilteredTasks(filters);
    return filtered
      .filter(task => task.columnId === columnId)
      .sort((a, b) => a.position - b.position);
  }, [getFilteredTasks]);

  /**
   * Open task detail panel for a specific task
   */
  const openTaskPanel = useCallback((taskId: string) => {
    setState(prev => ({
      ...prev,
      selectedTaskId: taskId,
      isPanelOpen: true
    }));
  }, []);

  /**
   * Close task detail panel
   */
  const closeTaskPanel = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPanelOpen: false,
      // Keep selectedTaskId for potential focus restoration
      // Will be cleared when panel is actually closed
    }));
  }, []);

  /**
   * Get the currently selected task
   */
  const getSelectedTask = useCallback((): Task | null => {
    if (!state.selectedTaskId) return null;
    return state.tasks.find(task => task.id === state.selectedTaskId) || null;
  }, [state.selectedTaskId, state.tasks]);

  const value: TaskContextValue = {
    ...state,
    createTask,
    updateTask,
    deleteTask,
    getTasksByColumnId,
    getTaskById,
    searchTasks,
    getFilteredTasks,
    getFilteredTasksByColumnId,
    openTaskPanel,
    closeTaskPanel,
    getSelectedTask
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

/**
 * Hook to use TaskContext
 * @throws Error if used outside TaskProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useTaskContext = (): TaskContextValue => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};
