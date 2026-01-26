import React, { useState, useEffect, useRef } from 'react';
import { SettingsSection } from './SettingsSection';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { useDebounce } from '@/hooks/useDebounce';

/**
 * TaskDefaultsSettings - Settings section for task default preferences
 * 
 * Provides controls for:
 * - Default billable status toggle
 * - Default hourly rate input with validation
 * 
 * Auto-saves changes with 500ms debounce for input fields.
 */
export const TaskDefaultsSettings: React.FC = () => {
  const { settings, updateSettings } = useSettingsContext();
  const [defaultBillableStatus, setDefaultBillableStatus] = useState(false);
  const [defaultHourlyRate, setDefaultHourlyRate] = useState<string>('');
  const [hourlyRateError, setHourlyRateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const isInitializing = useRef(true);
  const previousBillableStatus = useRef<boolean | null>(null);
  const previousHourlyRate = useRef<string | null>(null);

  // Initialize from settings
  useEffect(() => {
    if (settings) {
      isInitializing.current = true;
      const billableStatus = settings.defaultBillableStatus ?? false;
      const hourlyRate = settings.defaultHourlyRate !== null && settings.defaultHourlyRate !== undefined
        ? settings.defaultHourlyRate.toString()
        : '';
      
      setDefaultBillableStatus(billableStatus);
      setDefaultHourlyRate(hourlyRate);
      previousBillableStatus.current = billableStatus;
      previousHourlyRate.current = hourlyRate;
      
      // Mark initialization complete after a brief delay
      setTimeout(() => {
        isInitializing.current = false;
      }, 100);
    }
  }, [settings]);

  // Debounce hourly rate for auto-save
  const debouncedHourlyRate = useDebounce(defaultHourlyRate, 500);

  // Validate hourly rate
  const validateHourlyRate = (value: string): string | null => {
    if (value.trim() === '') {
      return null; // Empty is valid (clears the rate)
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return 'Must be a valid number';
    }
    if (numValue < 0) {
      return 'Must be a positive number';
    }
    if (numValue > 999999.99) {
      return 'Must be less than or equal to 999,999.99';
    }
    // Check decimal places
    const decimalParts = value.split('.');
    if (decimalParts.length === 2 && decimalParts[1].length > 2) {
      return 'Must have at most 2 decimal places';
    }
    return null;
  };

  // Auto-save billable status (only when user changes it, not on initialization)
  useEffect(() => {
    if (isInitializing.current || !settings) return;
    
    if (previousBillableStatus.current !== null && defaultBillableStatus !== previousBillableStatus.current) {
      const saveBillableStatus = async () => {
        try {
          setSaving(true);
          setSaved(false);
          await updateSettings({ defaultBillableStatus });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        } catch (error) {
          console.error('Error saving default billable status:', error);
        } finally {
          setSaving(false);
        }
      };
      saveBillableStatus();
      previousBillableStatus.current = defaultBillableStatus;
    }
  }, [defaultBillableStatus, settings, updateSettings]);

  // Auto-save hourly rate (debounced, only when user changes it)
  useEffect(() => {
    if (isInitializing.current || !settings) return;
    
    if (previousHourlyRate.current !== null && debouncedHourlyRate !== previousHourlyRate.current) {
      const error = validateHourlyRate(debouncedHourlyRate);
      if (error) {
        setHourlyRateError(error);
        return;
      }
      setHourlyRateError(null);
      
      const saveHourlyRate = async () => {
        try {
          setSaving(true);
          setSaved(false);
          const rateValue = debouncedHourlyRate.trim() === '' ? null : parseFloat(debouncedHourlyRate);
          await updateSettings({ defaultHourlyRate: rateValue });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        } catch (error) {
          console.error('Error saving default hourly rate:', error);
        } finally {
          setSaving(false);
        }
      };
      saveHourlyRate();
      previousHourlyRate.current = debouncedHourlyRate;
    }
  }, [debouncedHourlyRate, settings, updateSettings]);


  const handleBillableStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDefaultBillableStatus(e.target.checked);
  };

  const handleHourlyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDefaultHourlyRate(value);
    // Clear error on input change
    if (hourlyRateError) {
      const error = validateHourlyRate(value);
      setHourlyRateError(error);
    }
  };

  const handleHourlyRateBlur = () => {
    const error = validateHourlyRate(defaultHourlyRate);
    setHourlyRateError(error);
  };

  return (
    <SettingsSection
      title="Task Defaults"
      description="Set the default billable status and hourly rate for new tasks. You can override these for individual tasks."
    >
      {/* Default Billable Status */}
      <div className="py-2">
        <label
          htmlFor="default-billable-status"
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex-1">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Default Billable Status
            </span>
            <span className="block mt-1 text-xs text-gray-500 dark:text-gray-400">
              Set default billable status for new tasks
            </span>
          </div>
          <div className="ml-4">
            <input
              type="checkbox"
              id="default-billable-status"
              checked={defaultBillableStatus}
              onChange={handleBillableStatusChange}
              className="h-5 w-5 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600 rounded"
              aria-label="Default billable status"
            />
          </div>
        </label>
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          {defaultBillableStatus ? 'New tasks will be billable by default' : 'New tasks will be non-billable by default'}
        </div>
      </div>

      {/* Default Hourly Rate */}
      <div className="py-2">
        <label
          htmlFor="default-hourly-rate"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Default Hourly Rate
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Global default hourly rate for new tasks (can be overridden at client/project/task level)
        </p>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 dark:text-gray-400 text-sm">$</span>
          </div>
          <input
            type="number"
            id="default-hourly-rate"
            value={defaultHourlyRate}
            onChange={handleHourlyRateChange}
            onBlur={handleHourlyRateBlur}
            min="0"
            max="999999.99"
            step="0.01"
            placeholder="0.00"
            className={`
              block w-full pl-7 pr-3 py-2 border rounded-md shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
              sm:text-sm
              ${hourlyRateError
                ? 'border-red-300 dark:border-red-600 text-red-900 dark:text-red-200 placeholder-red-300 dark:placeholder-red-600'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500'
              }
            `}
            aria-label="Default hourly rate"
            aria-invalid={hourlyRateError ? 'true' : 'false'}
            aria-describedby={hourlyRateError ? 'hourly-rate-error' : undefined}
          />
        </div>
        {hourlyRateError && (
          <p
            id="hourly-rate-error"
            className="mt-2 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {hourlyRateError}
          </p>
        )}
        {!hourlyRateError && defaultHourlyRate && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Current value: ${parseFloat(defaultHourlyRate).toFixed(2)} per hour
          </p>
        )}
        {saving && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Saving...
          </p>
        )}
        {saved && !saving && (
          <p className="mt-2 text-xs text-green-600 dark:text-green-400">
            Saved
          </p>
        )}
      </div>
    </SettingsSection>
  );
};
