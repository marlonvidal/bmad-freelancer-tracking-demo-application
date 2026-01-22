import React, { useState, useEffect, useRef } from 'react';
import { TimeEntry } from '@/types/timeEntry';

interface TimeEntryFormProps {
  taskId: string;
  timeEntry?: TimeEntry; // Optional, for edit mode
  onSubmit: (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

interface FormErrors {
  hours?: string;
  minutes?: string;
  startDate?: string;
  startTime?: string;
  duration?: string;
}

/**
 * TimeEntryForm - Form component for adding/editing time entries
 * 
 * Collects time entry information: hours, minutes, description (optional),
 * and start date/time. Validates input and shows error messages.
 * Supports both create and edit modes.
 */
export const TimeEntryForm: React.FC<TimeEntryFormProps> = ({ 
  taskId, 
  timeEntry, 
  onSubmit, 
  onCancel 
}) => {
  const isEditMode = !!timeEntry;
  
  // Calculate initial hours and minutes from duration if editing
  const getInitialHours = () => {
    if (timeEntry) {
      return Math.floor(timeEntry.duration / 60);
    }
    return 0;
  };
  
  const getInitialMinutes = () => {
    if (timeEntry) {
      return timeEntry.duration % 60;
    }
    return 0;
  };

  const [hours, setHours] = useState<number>(getInitialHours());
  const [minutes, setMinutes] = useState<number>(getInitialMinutes());
  const [description, setDescription] = useState<string>(timeEntry?.description || '');
  const [startDate, setStartDate] = useState<string>(() => {
    if (timeEntry?.startTime) {
      const date = new Date(timeEntry.startTime);
      return date.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState<string>(() => {
    if (timeEntry?.startTime) {
      const date = new Date(timeEntry.startTime);
      const hours = String(date.getHours()).padStart(2, '0');
      const mins = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${mins}`;
    }
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hoursInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus hours input on mount
  useEffect(() => {
    if (hoursInputRef.current) {
      hoursInputRef.current.focus();
    }
  }, []);

  /**
   * Validate form fields
   */
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Hours must be >= 0
    if (hours < 0) {
      newErrors.hours = 'Hours must be 0 or greater';
    }

    // Minutes must be >= 0 and < 60
    if (minutes < 0) {
      newErrors.minutes = 'Minutes must be 0 or greater';
    } else if (minutes >= 60) {
      newErrors.minutes = 'Minutes must be less than 60';
    }

    // At least one of hours or minutes must be > 0
    if (hours === 0 && minutes === 0) {
      newErrors.duration = 'At least one of hours or minutes must be greater than 0';
    }

    // Total duration must be reasonable (< 24 hours per entry)
    const totalMinutes = (hours * 60) + minutes;
    if (totalMinutes >= 24 * 60) {
      newErrors.duration = 'Total duration must be less than 24 hours';
    }

    // Validate date format
    if (startDate) {
      const date = new Date(startDate);
      if (isNaN(date.getTime())) {
        newErrors.startDate = 'Invalid date format';
      }
    }

    // Validate time format
    if (startTime) {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime)) {
        newErrors.startTime = 'Invalid time format (use HH:MM)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate total duration in minutes
      const totalMinutes = (hours * 60) + minutes;

      // Parse start date and time
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const startDateTime = new Date(startDate);
      startDateTime.setHours(startHour, startMinute, 0, 0);

      // Calculate end time: startTime + duration
      const endDateTime = new Date(startDateTime.getTime() + totalMinutes * 60 * 1000);

      // Create time entry data
      const entryData: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        taskId,
        startTime: startDateTime,
        endTime: endDateTime,
        duration: totalMinutes,
        isManual: true,
        description: description.trim() || undefined
      };

      await onSubmit(entryData);
    } catch (error) {
      console.error('Error submitting time entry form:', error);
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle form cancellation
   */
  const handleCancel = () => {
    onCancel();
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      onKeyDown={handleKeyDown}
      className="space-y-4"
      aria-label={isEditMode ? 'Edit time entry' : 'Add time entry'}
    >
      {/* Hours Input */}
      <div>
        <label 
          htmlFor="time-entry-hours" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Hours
        </label>
        <input
          ref={hoursInputRef}
          id="time-entry-hours"
          type="number"
          min="0"
          max="999"
          value={hours}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10) || 0;
            setHours(value);
            if (errors.hours || errors.duration) {
              setErrors(prev => ({ ...prev, hours: undefined, duration: undefined }));
            }
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.hours || errors.duration ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="0"
          aria-required="true"
          aria-invalid={!!(errors.hours || errors.duration)}
          aria-describedby={errors.hours || errors.duration ? 'hours-error' : undefined}
        />
        {(errors.hours || errors.duration) && (
          <p 
            id="hours-error" 
            className="mt-1 text-sm text-red-600" 
            role="alert"
          >
            {errors.hours || errors.duration}
          </p>
        )}
      </div>

      {/* Minutes Input */}
      <div>
        <label 
          htmlFor="time-entry-minutes" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Minutes
        </label>
        <input
          id="time-entry-minutes"
          type="number"
          min="0"
          max="59"
          value={minutes}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10) || 0;
            setMinutes(value);
            if (errors.minutes || errors.duration) {
              setErrors(prev => ({ ...prev, minutes: undefined, duration: undefined }));
            }
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.minutes || errors.duration ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="0"
          aria-required="true"
          aria-invalid={!!(errors.minutes || errors.duration)}
          aria-describedby={errors.minutes || errors.duration ? 'minutes-error' : undefined}
        />
        {(errors.minutes || errors.duration) && (
          <p 
            id="minutes-error" 
            className="mt-1 text-sm text-red-600" 
            role="alert"
          >
            {errors.minutes || errors.duration}
          </p>
        )}
      </div>

      {/* Start Date */}
      <div>
        <label 
          htmlFor="time-entry-start-date" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Date
        </label>
        <input
          id="time-entry-start-date"
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            if (errors.startDate) {
              setErrors(prev => ({ ...prev, startDate: undefined }));
            }
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.startDate ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-required="true"
          aria-invalid={!!errors.startDate}
          aria-describedby={errors.startDate ? 'start-date-error' : undefined}
        />
        {errors.startDate && (
          <p 
            id="start-date-error" 
            className="mt-1 text-sm text-red-600" 
            role="alert"
          >
            {errors.startDate}
          </p>
        )}
      </div>

      {/* Start Time */}
      <div>
        <label 
          htmlFor="time-entry-start-time" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Time
        </label>
        <input
          id="time-entry-start-time"
          type="time"
          value={startTime}
          onChange={(e) => {
            setStartTime(e.target.value);
            if (errors.startTime) {
              setErrors(prev => ({ ...prev, startTime: undefined }));
            }
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.startTime ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-required="true"
          aria-invalid={!!errors.startTime}
          aria-describedby={errors.startTime ? 'start-time-error' : undefined}
        />
        {errors.startTime && (
          <p 
            id="start-time-error" 
            className="mt-1 text-sm text-red-600" 
            role="alert"
          >
            {errors.startTime}
          </p>
        )}
      </div>

      {/* Description - Optional */}
      <div>
        <label 
          htmlFor="time-entry-description" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description / Notes
        </label>
        <textarea
          id="time-entry-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter description or notes (optional)"
          aria-label="Time entry description"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Cancel time entry"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isEditMode ? 'Save changes' : 'Save time entry'}
        >
          {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Save'}
        </button>
      </div>
    </form>
  );
};
