import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Settings } from '@/types/settings';
import { SettingsRepository } from '@/services/data/repositories/SettingsRepository';

interface SettingsContextValue {
  settings: Settings | null;
  loading: boolean;
  error: Error | null;
  updateSettings: (updates: Partial<Omit<Settings, 'id'>>) => Promise<void>;
  getDefaultBillableStatus: () => boolean;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

/**
 * SettingsProvider - Provides settings state and operations to child components
 * 
 * Manages settings state using React Context API. Loads settings from IndexedDB on mount
 * and persists changes automatically. Uses optimistic updates for better UX.
 */
export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const repository = useMemo(() => new SettingsRepository(), []);

  /**
   * Load settings from IndexedDB
   */
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedSettings = await repository.getSettings();
      setSettings(loadedSettings);
      setLoading(false);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to load settings');
      setError(errorObj);
      setLoading(false);
      console.error('Error loading settings:', err);
    }
  }, [repository]);

  /**
   * Initialize settings on mount
   */
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /**
   * Update settings
   * Uses optimistic update: updates settings in state immediately, then persists to IndexedDB
   */
  const updateSettings = useCallback(async (updates: Partial<Omit<Settings, 'id'>>): Promise<void> => {
    if (!settings) {
      throw new Error('Settings not loaded');
    }

    try {
      // Optimistic update: update settings in state immediately
      setSettings(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
      setError(null);

      // Persist to IndexedDB
      const updatedSettings = await repository.updateSettings(updates);

      // Update state with persisted settings (to ensure consistency)
      setSettings(updatedSettings);
    } catch (err) {
      // Revert optimistic update on error
      await loadSettings();
      const errorObj = err instanceof Error ? err : new Error('Failed to update settings');
      setError(errorObj);
      console.error('Error updating settings:', err);
      throw errorObj;
    }
  }, [repository, settings, loadSettings]);

  /**
   * Get default billable status from settings
   * @returns Default billable status (false if settings not loaded)
   */
  const getDefaultBillableStatus = useCallback((): boolean => {
    return settings?.defaultBillableStatus ?? false;
  }, [settings]);

  const value: SettingsContextValue = {
    settings,
    loading,
    error,
    updateSettings,
    getDefaultBillableStatus
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Hook to use SettingsContext
 * @throws Error if used outside SettingsProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useSettingsContext = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};
