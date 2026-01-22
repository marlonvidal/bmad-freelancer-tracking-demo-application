import React, { useState, useEffect, useMemo } from 'react';
import { TimeEntry } from '@/types/timeEntry';
import { TimeEntryRepository } from '@/services/data/repositories/TimeEntryRepository';
import { formatDuration } from '@/utils/timeUtils';
import { TimeEntryListItem } from './TimeEntryListItem';

interface TimeEntryListProps {
  taskId: string;
  onEntryUpdated?: () => void;
  onEntryDeleted?: () => void;
}

/**
 * TimeEntryList - Displays list of all time entries for a task
 * 
 * Shows time entries in chronological order (newest first).
 * Displays duration, date/time, description, and manual indicator for each entry.
 * Handles loading and empty states.
 */
export const TimeEntryList: React.FC<TimeEntryListProps> = ({ 
  taskId, 
  onEntryUpdated,
  onEntryDeleted 
}) => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const timeEntryRepository = useMemo(() => new TimeEntryRepository(), []);

  // Load time entries on mount and when taskId changes
  useEffect(() => {
    const loadEntries = async () => {
      setLoading(true);
      setError(null);
      try {
        const taskEntries = await timeEntryRepository.getByTaskId(taskId);
        // Sort by startTime descending (newest first)
        const sortedEntries = taskEntries.sort((a, b) => {
          const aTime = new Date(a.startTime).getTime();
          const bTime = new Date(b.startTime).getTime();
          return bTime - aTime;
        });
        setEntries(sortedEntries);
      } catch (err) {
        console.error('Error loading time entries:', err);
        setError(err instanceof Error ? err : new Error('Failed to load time entries'));
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, [taskId, timeEntryRepository]);

  /**
   * Calculate total time from all entries
   */
  const totalTime = useMemo(() => {
    return entries.reduce((sum, entry) => sum + entry.duration, 0);
  }, [entries]);

  /**
   * Handle entry update
   */
  const handleEntryUpdated = async () => {
    // Reload entries to get updated data
    try {
      const taskEntries = await timeEntryRepository.getByTaskId(taskId);
      const sortedEntries = taskEntries.sort((a, b) => {
        const aTime = new Date(a.startTime).getTime();
        const bTime = new Date(b.startTime).getTime();
        return bTime - aTime;
      });
      setEntries(sortedEntries);
      onEntryUpdated?.();
    } catch (err) {
      console.error('Error reloading time entries:', err);
    }
  };

  /**
   * Handle entry deletion
   */
  const handleEntryDeleted = async () => {
    // Reload entries to get updated data
    try {
      const taskEntries = await timeEntryRepository.getByTaskId(taskId);
      const sortedEntries = taskEntries.sort((a, b) => {
        const aTime = new Date(a.startTime).getTime();
        const bTime = new Date(b.startTime).getTime();
        return bTime - aTime;
      });
      setEntries(sortedEntries);
      onEntryDeleted?.();
    } catch (err) {
      console.error('Error reloading time entries:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-gray-500" role="status" aria-live="polite">
        Loading time entries...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center text-red-600" role="alert">
        Error loading time entries: {error.message}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500" role="status">
        <p>No time entries yet.</p>
        <p className="text-sm mt-1">Start tracking time or add a manual entry.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" role="list" aria-label="Time entries">
      {/* Total Time Display */}
      <div className="pb-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Total Time:</span>
          <span className="text-sm font-semibold text-gray-900">{formatDuration(totalTime)}</span>
        </div>
      </div>

      {/* Time Entries List */}
      <div className="space-y-1">
        {entries.map((entry) => (
          <TimeEntryListItem
            key={entry.id}
            timeEntry={entry}
            onUpdated={handleEntryUpdated}
            onDeleted={handleEntryDeleted}
          />
        ))}
      </div>
    </div>
  );
};
