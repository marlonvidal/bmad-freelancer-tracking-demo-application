import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useColumnContext } from '@/contexts/ColumnContext';
import { useTaskContext } from '@/contexts/TaskContext';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { useClientContext } from '@/contexts/ClientContext';
import { useProjectContext } from '@/contexts/ProjectContext';
import { ClientSelector } from '@/components/client/ClientSelector';
import { ProjectSelector } from '@/components/project/ProjectSelector';
import { RateDisplay } from '@/components/common/RateDisplay';
import { revenueService } from '@/services/RevenueService';
import { Task } from '@/types/task';

interface TaskFormProps {
  initialColumnId?: string;
  initialClientId?: string | null; // Optional initial clientId for new tasks
  initialProjectId?: string | null; // Optional initial projectId for new tasks
  task?: Task; // Optional, for edit mode
  onSubmit: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

interface FormErrors {
  title?: string;
  dueDate?: string;
  priority?: string;
  estimateHours?: string;
  estimateMinutes?: string;
  hourlyRate?: string;
}

/**
 * TaskForm - Form component for creating tasks
 * 
 * Collects task information: title (required), description (optional),
 * due date (optional), priority (optional), tags (optional), column selection.
 * Validates required fields and shows error messages.
 */
export const TaskForm: React.FC<TaskFormProps> = ({ 
  initialColumnId,
  initialClientId,
  initialProjectId,
  task,
  onSubmit, 
  onCancel 
}) => {
  const { columns } = useColumnContext();
  const { getTasksByColumnId } = useTaskContext();
  const { getDefaultBillableStatus, settings } = useSettingsContext();
  const { getAllClients } = useClientContext();
  const { getProjectsByClientId } = useProjectContext();
  const isEditMode = !!task;
  
  // Calculate initial hours and minutes from timeEstimate if editing
  const getInitialEstimateHours = () => {
    if (task?.timeEstimate) {
      return Math.floor(task.timeEstimate / 60);
    }
    return 0;
  };
  
  const getInitialEstimateMinutes = () => {
    if (task?.timeEstimate) {
      return task.timeEstimate % 60;
    }
    return 0;
  };
  
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState<string>(() => {
    if (task?.dueDate) {
      const date = new Date(task.dueDate);
      return date.toISOString().split('T')[0];
    }
    return '';
  });
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | null>(task?.priority || null);
  const [tags, setTags] = useState<string>(task?.tags?.join(', ') || '');
  const [columnId, setColumnId] = useState<string>(task?.columnId || initialColumnId || '');
  const [clientId, setClientId] = useState<string | null>(task?.clientId ?? initialClientId ?? null);
  const [projectId, setProjectId] = useState<string | null>(task?.projectId ?? initialProjectId ?? null);
  const [estimateHours, setEstimateHours] = useState<number>(getInitialEstimateHours());
  const [estimateMinutes, setEstimateMinutes] = useState<number>(getInitialEstimateMinutes());
  const [isBillable, setIsBillable] = useState<boolean>(
    task?.isBillable ?? getDefaultBillableStatus()
  );
  const [hourlyRate, setHourlyRate] = useState<string>(() => {
    if (task?.hourlyRate !== null && task?.hourlyRate !== undefined) {
      return task.hourlyRate.toString();
    }
    return '';
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Set default column to Backlog if no initialColumnId provided
  useEffect(() => {
    if (!columnId && columns.length > 0) {
      const backlogColumn = columns.find(col => col.name.toLowerCase() === 'backlog');
      setColumnId(backlogColumn?.id || columns[0].id);
    }
  }, [columns, columnId]);

  // Reset projectId when clientId changes (projects are client-scoped)
  useEffect(() => {
    if (clientId === null) {
      setProjectId(null);
    } else if (projectId) {
      // Validate that selected project belongs to selected client
      // This will be handled by ProjectSelector, but we can also check here
      // For now, ProjectSelector will handle this automatically
    }
  }, [clientId, projectId]);

  // Auto-focus title input on mount
  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, []);

  // Calculate effective rate preview
  const effectiveRatePreview = useMemo(() => {
    // Create a temporary task object with current form values for rate calculation
    const tempTask: Task = {
      id: task?.id || '',
      title: title,
      columnId: columnId,
      position: task?.position || 0,
      clientId: clientId,
      projectId: projectId,
      isBillable: isBillable,
      hourlyRate: hourlyRate.trim() ? parseFloat(hourlyRate) : null,
      timeEstimate: task?.timeEstimate || null,
      dueDate: task?.dueDate || null,
      priority: priority,
      tags: task?.tags || [],
      createdAt: task?.createdAt || new Date(),
      updatedAt: task?.updatedAt || new Date()
    };

    // Get client and project from contexts
    const currentClient = clientId ? getAllClients().find(c => c.id === clientId) : null;
    const currentProject = projectId ? getProjectsByClientId(clientId || '').find(p => p.id === projectId) : null;

    // Calculate effective rate
    const effectiveRate = revenueService.getEffectiveHourlyRate(
      tempTask,
      currentClient || undefined,
      currentProject || undefined,
      settings || undefined
    );

    // Determine source
    let source: 'task' | 'project' | 'client' | 'global' | undefined;
    if (tempTask.hourlyRate !== null && tempTask.hourlyRate !== undefined) {
      source = 'task';
    } else if (currentProject?.defaultHourlyRate !== null && currentProject?.defaultHourlyRate !== undefined) {
      source = 'project';
    } else if (currentClient?.defaultHourlyRate !== null && currentClient?.defaultHourlyRate !== undefined) {
      source = 'client';
    } else if (settings?.defaultHourlyRate !== null && settings?.defaultHourlyRate !== undefined) {
      source = 'global';
    }

    return { rate: effectiveRate, source };
  }, [hourlyRate, clientId, projectId, getAllClients, getProjectsByClientId, settings, title, columnId, isBillable, priority, task]);

  /**
   * Validate form fields
   */
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Title is required
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    // Validate due date format if provided
    if (dueDate) {
      const date = new Date(dueDate);
      if (isNaN(date.getTime())) {
        newErrors.dueDate = 'Invalid date format';
      }
    }

    // Validate priority
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      newErrors.priority = 'Priority must be low, medium, or high';
    }

    // Validate estimate hours
    if (estimateHours < 0) {
      newErrors.estimateHours = 'Hours must be 0 or greater';
    }
    if (estimateHours > 999) {
      newErrors.estimateHours = 'Hours must be 999 or less';
    }

    // Validate estimate minutes
    if (estimateMinutes < 0) {
      newErrors.estimateMinutes = 'Minutes must be 0 or greater';
    }
    if (estimateMinutes >= 60) {
      newErrors.estimateMinutes = 'Minutes must be less than 60';
    }

    // Validate hourly rate if provided
    if (hourlyRate.trim()) {
      const rate = parseFloat(hourlyRate);
      if (isNaN(rate) || rate < 0) {
        newErrors.hourlyRate = 'Rate must be 0 or greater';
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
      // Parse tags from comma-separated string
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Calculate next position in column (only for new tasks)
      const columnTasks = getTasksByColumnId(columnId);
      const nextPosition = isEditMode ? task!.position : columnTasks.length;

      // Parse due date
      const dueDateObj = dueDate ? new Date(dueDate) : null;

      // Convert estimate hours + minutes to total minutes
      const totalEstimateMinutes = (estimateHours * 60) + estimateMinutes;
      const timeEstimate = totalEstimateMinutes > 0 ? totalEstimateMinutes : null;

      // Validate projectId requires clientId
      if (projectId && !clientId) {
        // This shouldn't happen due to ProjectSelector being disabled, but validate anyway
        throw new Error('Project requires a client to be selected');
      }

      // Create task data
      const taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        description: description.trim() || undefined,
        columnId,
        position: nextPosition,
        clientId,
        projectId: projectId || null,
        isBillable,
        hourlyRate: hourlyRate.trim() ? parseFloat(hourlyRate) : null,
        timeEstimate,
        dueDate: dueDateObj,
        priority,
        tags: tagsArray
      };

      await onSubmit(taskData);
    } catch (error) {
      console.error('Error submitting task form:', error);
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
          aria-label={isEditMode ? "Edit task" : "Create new task"}
    >
      {/* Title - Required */}
      <div>
        <label 
          htmlFor="task-title" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Title <span className="text-red-500" aria-label="required">*</span>
        </label>
        <input
          ref={titleInputRef}
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) {
              setErrors(prev => ({ ...prev, title: undefined }));
            }
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter task title"
          aria-required="true"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <p 
            id="title-error" 
            className="mt-1 text-sm text-red-600" 
            role="alert"
          >
            {errors.title}
          </p>
        )}
      </div>

      {/* Description - Optional */}
      <div>
        <label 
          htmlFor="task-description" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter task description (optional)"
        />
      </div>

      {/* Column Selection */}
      <div>
        <label 
          htmlFor="task-column" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Column
        </label>
        <select
          id="task-column"
          value={columnId}
          onChange={(e) => setColumnId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Select column for task"
        >
          {columns.map(column => (
            <option key={column.id} value={column.id}>
              {column.name}
            </option>
          ))}
        </select>
      </div>

      {/* Client Selection */}
      <div>
        <ClientSelector
          value={clientId || undefined}
          onChange={(newClientId) => {
            setClientId(newClientId);
            // Reset projectId when client changes (projects are client-scoped)
            if (newClientId !== clientId) {
              setProjectId(null);
            }
          }}
        />
      </div>

      {/* Project Selection */}
      <div>
        <ProjectSelector
          clientId={clientId}
          value={projectId || undefined}
          onChange={setProjectId}
        />
      </div>

      {/* Due Date - Optional */}
      <div>
        <label 
          htmlFor="task-due-date" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Due Date
        </label>
        <input
          id="task-due-date"
          type="date"
          value={dueDate}
          onChange={(e) => {
            setDueDate(e.target.value);
            if (errors.dueDate) {
              setErrors(prev => ({ ...prev, dueDate: undefined }));
            }
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.dueDate ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-invalid={!!errors.dueDate}
          aria-describedby={errors.dueDate ? 'due-date-error' : undefined}
        />
        {errors.dueDate && (
          <p 
            id="due-date-error" 
            className="mt-1 text-sm text-red-600" 
            role="alert"
          >
            {errors.dueDate}
          </p>
        )}
      </div>

      {/* Priority - Optional */}
      <div>
        <label 
          htmlFor="task-priority" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Priority
        </label>
        <select
          id="task-priority"
          value={priority || ''}
          onChange={(e) => {
            const value = e.target.value;
            setPriority(value === '' ? null : value as 'low' | 'medium' | 'high');
            if (errors.priority) {
              setErrors(prev => ({ ...prev, priority: undefined }));
            }
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.priority ? 'border-red-500' : 'border-gray-300'
          }`}
          aria-label="Select task priority"
          aria-invalid={!!errors.priority}
          aria-describedby={errors.priority ? 'priority-error' : undefined}
        >
          <option value="">None</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        {errors.priority && (
          <p 
            id="priority-error" 
            className="mt-1 text-sm text-red-600" 
            role="alert"
          >
            {errors.priority}
          </p>
        )}
      </div>

      {/* Tags - Optional */}
      <div>
        <label 
          htmlFor="task-tags" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Tags
        </label>
        <input
          id="task-tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter tags separated by commas (e.g., urgent, frontend)"
          aria-label="Enter task tags"
        />
        <p className="mt-1 text-xs text-gray-500">
          Separate multiple tags with commas
        </p>
      </div>

      {/* Billable Toggle - Optional */}
      <div>
        <label 
          htmlFor="task-billable" 
          className="flex items-center gap-2 cursor-pointer"
        >
          <input
            id="task-billable"
            type="checkbox"
            checked={isBillable}
            onChange={(e) => setIsBillable(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            aria-label="Mark task as billable"
            aria-checked={isBillable}
          />
          <span className="text-sm font-medium text-gray-700">
            Billable
          </span>
        </label>
        <p className="mt-1 text-xs text-gray-500 ml-6">
          Mark this task as billable to distinguish revenue-generating work
        </p>
      </div>

      {/* Hourly Rate - Optional */}
      <div>
        <label 
          htmlFor="task-hourly-rate" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Hourly Rate
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">$</span>
          <input
            id="task-hourly-rate"
            type="number"
            min="0"
            step="0.01"
            value={hourlyRate}
            onChange={(e) => {
              setHourlyRate(e.target.value);
              if (errors.hourlyRate) {
                setErrors(prev => ({ ...prev, hourlyRate: undefined }));
              }
            }}
            className={`w-full pl-7 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.hourlyRate ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.00"
            aria-label="Hourly rate (optional - overrides client/project rate)"
            aria-invalid={!!errors.hourlyRate}
            aria-describedby={errors.hourlyRate ? 'hourly-rate-error' : 'hourly-rate-help'}
          />
        </div>
        {errors.hourlyRate && (
          <p 
            id="hourly-rate-error" 
            className="mt-1 text-sm text-red-600" 
            role="alert"
          >
            {errors.hourlyRate}
          </p>
        )}
        <p id="hourly-rate-help" className="mt-1 text-xs text-gray-500">
          Optional - overrides client/project rate
        </p>
        {/* Effective Rate Preview */}
        {(effectiveRatePreview.rate !== null || effectiveRatePreview.source) && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-blue-900 dark:text-blue-100">Effective rate:</span>
              <RateDisplay
                rate={effectiveRatePreview.rate}
                showSource={true}
                source={effectiveRatePreview.source}
              />
            </div>
            <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
              Rate hierarchy: Task rate &gt; Project rate &gt; Client rate &gt; Global default
            </p>
          </div>
        )}
      </div>

      {/* Time Estimate - Optional */}
      <div>
        <label 
          htmlFor="task-estimate-hours" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Time Estimate
        </label>
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <label 
              htmlFor="task-estimate-hours" 
              className="block text-xs text-gray-600 mb-1"
            >
              Hours
            </label>
            <input
              id="task-estimate-hours"
              type="number"
              min="0"
              max="999"
              value={estimateHours}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10) || 0;
                setEstimateHours(value);
                if (errors.estimateHours) {
                  setErrors(prev => ({ ...prev, estimateHours: undefined }));
                }
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.estimateHours ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
              aria-label="Estimated hours"
              aria-invalid={!!errors.estimateHours}
              aria-describedby={errors.estimateHours ? 'estimate-hours-error' : undefined}
            />
            {errors.estimateHours && (
              <p 
                id="estimate-hours-error" 
                className="mt-1 text-sm text-red-600" 
                role="alert"
              >
                {errors.estimateHours}
              </p>
            )}
          </div>
          <div className="flex-1">
            <label 
              htmlFor="task-estimate-minutes" 
              className="block text-xs text-gray-600 mb-1"
            >
              Minutes
            </label>
            <input
              id="task-estimate-minutes"
              type="number"
              min="0"
              max="59"
              value={estimateMinutes}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10) || 0;
                setEstimateMinutes(value);
                if (errors.estimateMinutes) {
                  setErrors(prev => ({ ...prev, estimateMinutes: undefined }));
                }
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.estimateMinutes ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
              aria-label="Estimated minutes"
              aria-invalid={!!errors.estimateMinutes}
              aria-describedby={errors.estimateMinutes ? 'estimate-minutes-error' : undefined}
            />
            {errors.estimateMinutes && (
              <p 
                id="estimate-minutes-error" 
                className="mt-1 text-sm text-red-600" 
                role="alert"
              >
                {errors.estimateMinutes}
              </p>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Leave both fields empty to clear the estimate
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Cancel task creation"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isEditMode ? "Update task" : "Create task"}
        >
          {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Task' : 'Create Task')}
        </button>
      </div>
    </form>
  );
};
