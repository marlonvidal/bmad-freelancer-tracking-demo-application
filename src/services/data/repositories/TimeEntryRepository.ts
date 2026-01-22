import { TimeEntry } from '@/types/timeEntry';
import { db } from '../database';

/**
 * TimeEntryRepository - Repository for TimeEntry CRUD operations
 * 
 * Provides data access methods for time entries using IndexedDB via Dexie.js.
 * All methods use async/await pattern and handle errors appropriately.
 */
export class TimeEntryRepository {
  /**
   * Create a new time entry
   * @param entry - TimeEntry data without id, createdAt, and updatedAt (auto-generated)
   * @returns Promise resolving to the created TimeEntry
   */
  async create(entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimeEntry> {
    try {
      const now = new Date();
      const newEntry: TimeEntry = {
        ...entry,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      };
      await db.timeEntries.add(newEntry);
      return newEntry;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('Storage limit exceeded. Please export some data to free up space.');
      }
      console.error('Error creating time entry:', error);
      throw new Error(`Failed to create time entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a time entry by ID
   * @param id - TimeEntry ID
   * @returns Promise resolving to TimeEntry or undefined if not found
   */
  async getById(id: string): Promise<TimeEntry | undefined> {
    try {
      return await db.timeEntries.get(id);
    } catch (error) {
      console.error('Error getting time entry by ID:', error);
      throw new Error(`Failed to get time entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all time entries
   * @returns Promise resolving to array of all TimeEntries
   */
  async getAll(): Promise<TimeEntry[]> {
    try {
      return await db.timeEntries.toArray();
    } catch (error) {
      console.error('Error getting all time entries:', error);
      throw new Error(`Failed to get all time entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get time entries by task ID
   * @param taskId - Task ID to filter by
   * @returns Promise resolving to array of TimeEntries for the specified task
   */
  async getByTaskId(taskId: string): Promise<TimeEntry[]> {
    try {
      return await db.timeEntries.where('taskId').equals(taskId).toArray();
    } catch (error) {
      console.error('Error getting time entries by task ID:', error);
      throw new Error(`Failed to get time entries by task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a time entry
   * @param id - TimeEntry ID to update
   * @param updates - Partial time entry data to update
   * @returns Promise resolving to the updated TimeEntry
   */
  async update(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry> {
    try {
      const existingEntry = await db.timeEntries.get(id);
      if (!existingEntry) {
        throw new Error(`Time entry with id ${id} not found`);
      }

      const updatedEntry: TimeEntry = {
        ...existingEntry,
        ...updates,
        id, // Ensure ID cannot be changed
        updatedAt: new Date() // Always update timestamp
      };

      await db.timeEntries.update(id, updatedEntry);
      return updatedEntry;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      console.error('Error updating time entry:', error);
      throw new Error(`Failed to update time entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a time entry
   * @param id - TimeEntry ID to delete
   * @returns Promise resolving when deletion is complete
   */
  async delete(id: string): Promise<void> {
    try {
      await db.timeEntries.delete(id);
    } catch (error) {
      console.error('Error deleting time entry:', error);
      throw new Error(`Failed to delete time entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
