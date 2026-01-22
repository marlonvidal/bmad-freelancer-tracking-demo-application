import { Column } from '@/types/column';
import { db } from '../database';

/**
 * ColumnRepository - Repository for Column CRUD operations
 * 
 * Provides data access methods for columns using IndexedDB via Dexie.js.
 * All methods use async/await pattern and handle errors appropriately.
 */
export class ColumnRepository {
  /**
   * Create a new column
   * @param column - Column data without id, createdAt, and updatedAt (auto-generated)
   * @returns Promise resolving to the created Column
   */
  async create(column: Omit<Column, 'id' | 'createdAt' | 'updatedAt'>): Promise<Column> {
    try {
      const now = new Date();
      const newColumn: Column = {
        ...column,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      };
      await db.columns.add(newColumn);
      return newColumn;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('Storage limit exceeded. Please export some data to free up space.');
      }
      throw new Error(`Failed to create column: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a column by ID
   * @param id - Column ID
   * @returns Promise resolving to Column or undefined if not found
   */
  async getById(id: string): Promise<Column | undefined> {
    try {
      return await db.columns.get(id);
    } catch (error) {
      console.error('Error getting column by ID:', error);
      throw new Error(`Failed to get column: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all columns ordered by position
   * @returns Promise resolving to array of all Columns ordered by position
   */
  async getAll(): Promise<Column[]> {
    try {
      return await db.columns.orderBy('position').toArray();
    } catch (error) {
      console.error('Error getting all columns:', error);
      throw new Error(`Failed to get all columns: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a column
   * @param id - Column ID to update
   * @param updates - Partial column data to update
   * @returns Promise resolving to the updated Column
   */
  async update(id: string, updates: Partial<Column>): Promise<Column> {
    try {
      const existingColumn = await db.columns.get(id);
      if (!existingColumn) {
        throw new Error(`Column with id ${id} not found`);
      }

      const updatedColumn: Column = {
        ...existingColumn,
        ...updates,
        id, // Ensure ID cannot be changed
        updatedAt: new Date() // Always update timestamp
      };

      await db.columns.update(id, updatedColumn);
      return updatedColumn;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      console.error('Error updating column:', error);
      throw new Error(`Failed to update column: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a column
   * @param id - Column ID to delete
   * @returns Promise resolving when deletion is complete
   */
  async delete(id: string): Promise<void> {
    try {
      await db.columns.delete(id);
    } catch (error) {
      console.error('Error deleting column:', error);
      throw new Error(`Failed to delete column: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reorder columns by updating their positions
   * @param columnIds - Array of column IDs in the desired order
   * @returns Promise resolving when reordering is complete
   */
  async reorder(columnIds: string[]): Promise<void> {
    try {
      const updates = columnIds.map((id, index) => ({
        id,
        position: index
      }));

      await db.transaction('rw', db.columns, async () => {
        for (const { id, position } of updates) {
          await db.columns.update(id, { position });
        }
      });
    } catch (error) {
      console.error('Error reordering columns:', error);
      throw new Error(`Failed to reorder columns: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
