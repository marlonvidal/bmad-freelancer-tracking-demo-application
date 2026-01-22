import { TimerState } from '@/types/timerState';
import { db } from '../database';

/**
 * TimerStateRepository - Repository for TimerState CRUD operations
 * 
 * Provides data access methods for timer state using IndexedDB via Dexie.js.
 * All methods use async/await pattern and handle errors appropriately.
 * 
 * Note: Only one timer can be active at a time, so timerState table uses taskId as primary key.
 */
export class TimerStateRepository {
  /**
   * Get the active timer state
   * @returns Promise resolving to TimerState or undefined if no active timer
   */
  async getActive(): Promise<TimerState | undefined> {
    try {
      // Since only one timer can be active, get the first (and only) entry
      const states = await db.timerState.toArray();
      return states.find(state => state.status === 'active') || states[0] || undefined;
    } catch (error) {
      console.error('Error getting active timer state:', error);
      throw new Error(`Failed to get active timer state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get timer state by task ID
   * @param taskId - Task ID to get timer state for
   * @returns Promise resolving to TimerState or undefined if not found
   */
  async getByTaskId(taskId: string): Promise<TimerState | undefined> {
    try {
      return await db.timerState.get(taskId);
    } catch (error) {
      console.error('Error getting timer state by task ID:', error);
      throw new Error(`Failed to get timer state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save timer state (create or update)
   * @param state - TimerState to save
   * @returns Promise resolving to the saved TimerState
   */
  async save(state: TimerState): Promise<TimerState> {
    try {
      await db.timerState.put(state);
      return state;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('Storage limit exceeded. Please export some data to free up space.');
      }
      console.error('Error saving timer state:', error);
      throw new Error(`Failed to save timer state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete timer state by task ID
   * @param taskId - Task ID to delete timer state for
   * @returns Promise resolving when deletion is complete
   */
  async delete(taskId: string): Promise<void> {
    try {
      await db.timerState.delete(taskId);
    } catch (error) {
      console.error('Error deleting timer state:', error);
      throw new Error(`Failed to delete timer state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all timer states
   * @returns Promise resolving when clearing is complete
   */
  async clear(): Promise<void> {
    try {
      await db.timerState.clear();
    } catch (error) {
      console.error('Error clearing timer states:', error);
      throw new Error(`Failed to clear timer states: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
