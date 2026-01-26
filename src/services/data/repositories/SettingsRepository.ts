import { Settings } from '@/types/settings';
import { db } from '../database';

/**
 * SettingsRepository - Repository for Settings CRUD operations
 * 
 * Provides data access methods for settings using IndexedDB via Dexie.js.
 * Uses singleton pattern - only one settings record with id: 'default'.
 * All methods use async/await pattern and handle errors appropriately.
 */
const DEFAULT_SETTINGS_ID = 'default';

export class SettingsRepository {
  /**
   * Get settings or create defaults if they don't exist
   * @returns Promise resolving to Settings
   */
  async getSettings(): Promise<Settings> {
    try {
      // Use where().first() instead of get() to avoid potential fake-indexeddb issues
      let settings = await db.settings.where('id').equals(DEFAULT_SETTINGS_ID).first();
      
      // Create default settings if they don't exist
      if (!settings) {
        settings = this.createDefaultSettings();
        await db.settings.add(settings);
      } else {
        // Ensure Date fields are properly converted from IndexedDB storage
        settings = {
          ...settings,
          updatedAt: settings.updatedAt instanceof Date ? settings.updatedAt : new Date(settings.updatedAt)
        };
      }
      
      return settings;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('Storage limit exceeded. Please export some data to free up space.');
      }
      console.error('Error getting settings:', error);
      throw new Error(`Failed to get settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update settings
   * @param updates - Partial settings data to update
   * @returns Promise resolving to the updated Settings
   */
  async updateSettings(updates: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
    try {
      const existingSettings = await this.getSettings();
      
      const changes = {
        ...updates,
        updatedAt: new Date() // Always update timestamp
      };

      await db.settings.update(DEFAULT_SETTINGS_ID, changes);
      
      const updatedSettings: Settings = {
        ...existingSettings,
        ...changes,
        id: DEFAULT_SETTINGS_ID // Ensure ID cannot be changed
      };
      
      return updatedSettings;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('Storage limit exceeded. Please export some data to free up space.');
      }
      console.error('Error updating settings:', error);
      throw new Error(`Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create default settings
   * @returns Default Settings object
   */
  private createDefaultSettings(): Settings {
    return {
      id: DEFAULT_SETTINGS_ID,
      darkMode: false,
      defaultBillableStatus: false,
      defaultHourlyRate: null,
      keyboardShortcuts: {},
      onboardingCompleted: false,
      onboardingStep: 0, // 0 = not started
      updatedAt: new Date()
    };
  }
}
