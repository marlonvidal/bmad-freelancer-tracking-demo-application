import { Task } from '@/types/task';
import { db } from '../database';

/**
 * TaskRepository - Repository for Task CRUD operations
 * 
 * Provides data access methods for tasks using IndexedDB via Dexie.js.
 * All methods use async/await pattern and handle errors appropriately.
 */
export class TaskRepository {
  /**
   * Create a new task
   * @param task - Task data without id, createdAt, and updatedAt (auto-generated)
   * @returns Promise resolving to the created Task
   */
  async create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    try {
      const now = new Date();
      const newTask: Task = {
        ...task,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      };
      await db.tasks.add(newTask);
      return newTask;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('Storage limit exceeded. Please export some data to free up space.');
      }
      throw new Error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a task by ID
   * @param id - Task ID
   * @returns Promise resolving to Task or undefined if not found
   */
  async getById(id: string): Promise<Task | undefined> {
    try {
      return await db.tasks.get(id);
    } catch (error) {
      console.error('Error getting task by ID:', error);
      throw new Error(`Failed to get task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all tasks
   * @returns Promise resolving to array of all Tasks
   */
  async getAll(): Promise<Task[]> {
    try {
      return await db.tasks.toArray();
    } catch (error) {
      console.error('Error getting all tasks:', error);
      throw new Error(`Failed to get all tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get tasks by column ID
   * @param columnId - Column ID to filter by
   * @returns Promise resolving to array of Tasks in the specified column
   */
  async getByColumnId(columnId: string): Promise<Task[]> {
    try {
      return await db.tasks.where('columnId').equals(columnId).toArray();
    } catch (error) {
      console.error('Error getting tasks by column ID:', error);
      throw new Error(`Failed to get tasks by column: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get tasks by client ID
   * @param clientId - Client ID to filter by
   * @returns Promise resolving to array of Tasks for the specified client
   */
  async getByClientId(clientId: string): Promise<Task[]> {
    try {
      return await db.tasks.where('clientId').equals(clientId).toArray();
    } catch (error) {
      console.error('Error getting tasks by client ID:', error);
      throw new Error(`Failed to get tasks by client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get tasks by project ID
   * @param projectId - Project ID to filter by
   * @returns Promise resolving to array of Tasks for the specified project
   */
  async getByProjectId(projectId: string): Promise<Task[]> {
    try {
      return await db.tasks.where('projectId').equals(projectId).toArray();
    } catch (error) {
      console.error('Error getting tasks by project ID:', error);
      throw new Error(`Failed to get tasks by project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a task
   * @param id - Task ID to update
   * @param updates - Partial task data to update
   * @returns Promise resolving to the updated Task
   */
  async update(id: string, updates: Partial<Task>): Promise<Task> {
    try {
      const existingTask = await db.tasks.get(id);
      if (!existingTask) {
        throw new Error(`Task with id ${id} not found`);
      }

      const updatedTask: Task = {
        ...existingTask,
        ...updates,
        id, // Ensure ID cannot be changed
        updatedAt: new Date() // Always update timestamp
      };

      await db.tasks.update(id, updatedTask);
      return updatedTask;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      console.error('Error updating task:', error);
      throw new Error(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a task
   * @param id - Task ID to delete
   * @returns Promise resolving when deletion is complete
   */
  async delete(id: string): Promise<void> {
    try {
      await db.tasks.delete(id);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw new Error(`Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
