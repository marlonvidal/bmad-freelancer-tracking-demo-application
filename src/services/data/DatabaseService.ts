import { db } from './database';

/**
 * DatabaseService - Handles database initialization and migrations
 * 
 * Provides initialization function that can be called safely multiple times (idempotent).
 * Sets up migration strategy for future schema changes.
 */
export class DatabaseService {
  private static initialized = false;

  /**
   * Initialize the database
   * 
   * This function is idempotent - it can be called multiple times safely.
   * Opens the database connection and ensures schema is up to date.
   * 
   * @returns Promise resolving when initialization is complete
   * @throws Error if database initialization fails
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Open database connection - Dexie will handle schema creation/updates
      await db.open();
      this.initialized = true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw new Error(
        `Failed to initialize database: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Reset initialization flag (useful for testing)
   */
  static reset(): void {
    this.initialized = false;
  }
}
