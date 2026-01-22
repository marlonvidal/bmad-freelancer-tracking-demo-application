import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Task } from '@/types/task';
import { TaskRepository } from '@/services/data/repositories/TaskRepository';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: Error | null;
}

interface TaskContextValue extends TaskState {
  createTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  getTasksByColumnId: (columnId: string) => Task[];
  getTaskById: (id: string) => Task | undefined;
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
    error: null
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
   */
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    try {
      // Optimistic update: remove task from state immediately
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(task => task.id !== id),
        error: null
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

  const value: TaskContextValue = {
    ...state,
    createTask,
    updateTask,
    deleteTask,
    getTasksByColumnId,
    getTaskById
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
