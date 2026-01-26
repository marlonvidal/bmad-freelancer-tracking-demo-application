import React, { useState, useMemo } from 'react';
import { ExportService } from '@/services/ExportService';
import { ExportFilters } from '@/types/export';

/**
 * ExportOptions - Component for exporting data to CSV and JSON formats
 * 
 * Provides UI for exporting time entries, tasks, and all data with optional
 * date range filtering. Shows loading states and success/error messages.
 */
export const ExportOptions: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const exportService = useMemo(() => new ExportService(), []);

  /**
   * Format date string (YYYY-MM-DD) to Date object
   */
  const parseDate = (dateStr: string): Date => {
    const date = new Date(dateStr);
    // Set to start/end of day for proper range filtering
    if (dateStr === startDate) {
      date.setHours(0, 0, 0, 0);
    } else {
      date.setHours(23, 59, 59, 999);
    }
    return date;
  };

  /**
   * Get export filters from date range inputs
   */
  const getFilters = (): ExportFilters | undefined => {
    if (startDate && endDate) {
      // Validate date range
      const start = parseDate(startDate);
      const end = parseDate(endDate);
      if (start > end) {
        setError('Start date must be before or equal to end date');
        return undefined;
      }
      return { dateRange: { start, end } };
    }
    return undefined;
  };

  /**
   * Clear messages after a delay
   */
  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  /**
   * Handle export with error handling
   */
  const handleExport = async (
    exportFn: () => Promise<void>,
    exportType: string
  ) => {
    try {
      setLoading(exportType);
      setError(null);
      setSuccess(null);
      await exportFn();
      setSuccess(`${exportType} exported successfully`);
      clearMessages();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to export data';
      setError(errorMessage);
      clearMessages();
    } finally {
      setLoading(null);
    }
  };

  /**
   * Export time entries
   */
  const handleExportTimeEntries = async (format: 'csv' | 'json') => {
    const filters = getFilters();
    if (filters === undefined && (startDate || endDate)) {
      return; // Error already set by getFilters
    }
    await handleExport(
      () => exportService.exportTimeEntries(format, filters),
      `Time entries (${format.toUpperCase()})`
    );
  };

  /**
   * Export tasks
   */
  const handleExportTasks = async (format: 'csv' | 'json') => {
    const filters = getFilters();
    if (filters === undefined && (startDate || endDate)) {
      return; // Error already set by getFilters
    }
    await handleExport(
      () => exportService.exportTasks(format, filters),
      `Tasks (${format.toUpperCase()})`
    );
  };

  /**
   * Export all data
   */
  const handleExportAllData = async (format: 'csv' | 'json') => {
    await handleExport(
      () => exportService.exportAllData(format),
      `All data (${format.toUpperCase()})`
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Export Data
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Export your time tracking data and tasks to CSV or JSON format for
        backup or use in other tools.
      </p>

      {/* Date Range Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date Range (Optional)
        </label>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label
              htmlFor="export-start-date"
              className="block text-xs text-gray-600 mb-1"
            >
              Start Date
            </label>
            <input
              id="export-start-date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setError(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Export start date"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="export-end-date"
              className="block text-xs text-gray-600 mb-1"
            >
              End Date
            </label>
            <input
              id="export-end-date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setError(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Export end date"
            />
          </div>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setError(null);
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Clear date range"
            >
              Clear
            </button>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-2 text-sm text-green-600" role="alert">
            {success}
          </p>
        )}
      </div>

      {/* Export Options */}
      <div className="space-y-6">
        {/* Time Entries Export */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Export Time Entries
          </h3>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleExportTimeEntries('csv')}
              disabled={!!loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Export time entries as CSV"
            >
              {loading === 'Time entries (CSV)' ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              type="button"
              onClick={() => handleExportTimeEntries('json')}
              disabled={!!loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Export time entries as JSON"
            >
              {loading === 'Time entries (JSON)' ? 'Exporting...' : 'Export JSON'}
            </button>
          </div>
        </div>

        {/* Tasks Export */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Export Tasks
          </h3>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleExportTasks('csv')}
              disabled={!!loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Export tasks as CSV"
            >
              {loading === 'Tasks (CSV)' ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              type="button"
              onClick={() => handleExportTasks('json')}
              disabled={!!loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Export tasks as JSON"
            >
              {loading === 'Tasks (JSON)' ? 'Exporting...' : 'Export JSON'}
            </button>
          </div>
        </div>

        {/* All Data Export */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Export All Data
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Exports all tasks, time entries, clients, projects, columns, and
            settings.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleExportAllData('csv')}
              disabled={!!loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Export all data as CSV"
            >
              {loading === 'All data (CSV)' ? 'Exporting...' : 'Export CSV'}
            </button>
            <button
              type="button"
              onClick={() => handleExportAllData('json')}
              disabled={!!loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Export all data as JSON"
            >
              {loading === 'All data (JSON)' ? 'Exporting...' : 'Export JSON'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
