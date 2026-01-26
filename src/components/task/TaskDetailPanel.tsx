import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useTaskContext } from '@/contexts/TaskContext';
import { ClientSelector } from '@/components/client/ClientSelector';
import { ProjectSelector } from '@/components/project/ProjectSelector';
import { TimeEntryRepository } from '@/services/data/repositories/TimeEntryRepository';
import { formatDuration } from '@/utils/timeUtils';
import { useDebouncedAutoSave } from '@/hooks/useDebouncedAutoSave';
import { Task } from '@/types/task';
import { TimeEntriesList } from './TimeEntriesList';

interface TaskDetailPanelProps {
  isOpen: boolean;
  taskId: string | null;
  onClose: () => void;
}

/**
 * TaskDetailPanel - Side panel component for viewing and editing task details
 * 
 * Features:
 * - Slides in from right side
 * - Responsive design (full width on mobile, fixed width on desktop)
 * - Smooth animations (60fps)
 * - Keyboard accessible (ESC to close, focus trap)
 * - Click outside to close
 * - ARIA compliant
 */
export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  isOpen,
  taskId,
  onClose
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const { getTaskById, updateTask } = useTaskContext();
  const timeEntryRepository = useMemo(() => new TimeEntryRepository(), []);

  // Get task data
  const task = taskId ? getTaskById(taskId) : null;

  // Local state for editable fields (optimistic updates)
  const [localTask, setLocalTask] = useState<Task | null>(null);

  // Sync local state with task when task changes
  useEffect(() => {
    if (task) {
      setLocalTask(task);
    }
  }, [task]);

  // Auto-save handler
  const handleSave = useCallback(async (updates: Partial<Task>) => {
    if (!taskId) return;
    await updateTask(taskId, updates);
  }, [taskId, updateTask]);

  // Debounced auto-save for title
  const titleSaveState = useDebouncedAutoSave(
    localTask?.title || '',
    {
      delay: 500,
      onSave: async (value: string) => {
        await handleSave({ title: value });
      }
    }
  );

  // Debounced auto-save for description
  const descriptionSaveState = useDebouncedAutoSave(
    localTask?.description || '',
    {
      delay: 500,
      onSave: async (value: string) => {
        await handleSave({ description: value || undefined });
      }
    }
  );

  // Debounced auto-save for time estimate
  const timeEstimateSaveState = useDebouncedAutoSave(
    localTask?.timeEstimate ?? null,
    {
      delay: 500,
      onSave: async (value: number | null) => {
        await handleSave({ timeEstimate: value });
      }
    }
  );

  // Load time entries for this task to calculate time spent
  const [totalTimeSpent, setTotalTimeSpent] = React.useState<number>(0);
  const [isLoadingTime, setIsLoadingTime] = React.useState(true);
  const [refreshTimeKey, setRefreshTimeKey] = React.useState(0);

  const refreshTimeSpent = useCallback(() => {
    setRefreshTimeKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!taskId) {
      setTotalTimeSpent(0);
      setIsLoadingTime(false);
      return;
    }

    let isMounted = true;

    const loadTotalTime = async () => {
      try {
        setIsLoadingTime(true);
        const total = await timeEntryRepository.getTotalTimeForTask(taskId);
        if (isMounted) {
          setTotalTimeSpent(total);
          setIsLoadingTime(false);
        }
      } catch (err) {
        console.error('Error loading total time:', err);
        if (isMounted) {
          setIsLoadingTime(false);
        }
      }
    };

    loadTotalTime();

    return () => {
      isMounted = false;
    };
  }, [taskId, timeEntryRepository, refreshTimeKey]);

  /**
   * Handle ESC key to close panel
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  /**
   * Handle backdrop click to close panel
   */
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  /**
   * Focus trap: Trap focus within panel when open
   */
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const panel = panelRef.current;
    
    // Get all focusable elements within panel
    const getFocusableElements = (): HTMLElement[] => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ].join(', ');

      return Array.from(panel.querySelectorAll<HTMLElement>(focusableSelectors))
        .filter(el => {
          // Filter out elements that are not visible
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });
    };

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: focus previous element
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: focus next element
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    
    // Focus first focusable element when panel opens
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0 && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  /**
   * Prevent body scroll when panel is open
   */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Don't render if panel is closed
  if (!isOpen || !task) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ease-out"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-panel-title"
        className={`
          fixed top-0 right-0 h-full z-50
          w-full md:w-[500px]
          bg-white shadow-xl
          transform transition-transform duration-300 ease-out
          will-change-transform
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}
      >
        {/* Panel Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2
            id="task-detail-panel-title"
            className="text-xl font-semibold text-gray-900"
          >
            Task Details
          </h2>
          <button
            ref={(el) => {
              if (el) firstFocusableRef.current = el;
            }}
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Close task detail panel"
            title="Close (ESC)"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        {/* Panel Content - Scrollable */}
        <main className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Task Title - Editable */}
            <section>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="task-title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Title
                </label>
                {titleSaveState.status === 'saving' && (
                  <span className="text-xs text-gray-500">Saving...</span>
                )}
                {titleSaveState.status === 'saved' && (
                  <span className="text-xs text-green-600">Saved</span>
                )}
                {titleSaveState.status === 'error' && (
                  <span className="text-xs text-red-600">Error</span>
                )}
              </div>
              <input
                id="task-title"
                type="text"
                value={localTask?.title || ''}
                onChange={(e) => {
                  setLocalTask(prev => prev ? { ...prev, title: e.target.value } : null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold text-gray-900"
                aria-describedby="task-title-description"
              />
              <p id="task-title-description" className="sr-only">
                Task title
              </p>
            </section>

            {/* Description - Editable */}
            <section>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="task-description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                {descriptionSaveState.status === 'saving' && (
                  <span className="text-xs text-gray-500">Saving...</span>
                )}
                {descriptionSaveState.status === 'saved' && (
                  <span className="text-xs text-green-600">Saved</span>
                )}
                {descriptionSaveState.status === 'error' && (
                  <span className="text-xs text-red-600">Error</span>
                )}
              </div>
              <textarea
                id="task-description"
                value={localTask?.description || ''}
                onChange={(e) => {
                  setLocalTask(prev => prev ? { ...prev, description: e.target.value } : null);
                }}
                rows={4}
                placeholder="Add a description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 resize-y"
                aria-describedby="task-description-description"
              />
              <p id="task-description-description" className="sr-only">
                Task description
              </p>
            </section>

            {/* Due Date - Editable */}
            <section>
              <label
                htmlFor="task-due-date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                value={localTask?.dueDate ? new Date(localTask.dueDate).toISOString().split('T')[0] : ''}
                onChange={async (e) => {
                  const newDate = e.target.value ? new Date(e.target.value) : null;
                  setLocalTask(prev => prev ? { ...prev, dueDate: newDate } : null);
                  await handleSave({ dueDate: newDate });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                aria-describedby="task-due-date-description"
              />
              <p id="task-due-date-description" className="sr-only">
                Task due date
              </p>
            </section>

            {/* Priority - Editable */}
            <section>
              <label
                htmlFor="task-priority"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={localTask?.priority || ''}
                onChange={async (e) => {
                  const newPriority = e.target.value === '' ? null : e.target.value as 'low' | 'medium' | 'high';
                  setLocalTask(prev => prev ? { ...prev, priority: newPriority } : null);
                  await handleSave({ priority: newPriority });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                aria-describedby="task-priority-description"
              >
                <option value="">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <p id="task-priority-description" className="sr-only">
                Task priority level
              </p>
            </section>

            {/* Tags - Editable (simple comma-separated input) */}
            <section>
              <label
                htmlFor="task-tags"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tags (comma-separated)
              </label>
              <input
                id="task-tags"
                type="text"
                value={localTask?.tags.join(', ') || ''}
                onChange={async (e) => {
                  const tags = e.target.value
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0);
                  setLocalTask(prev => prev ? { ...prev, tags } : null);
                  await handleSave({ tags });
                }}
                placeholder="tag1, tag2, tag3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                aria-describedby="task-tags-description"
              />
              <p id="task-tags-description" className="sr-only">
                Task tags, comma-separated
              </p>
              {localTask && localTask.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {localTask.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Client - Editable */}
            <section>
              <ClientSelector
                value={localTask?.clientId || undefined}
                onChange={async (clientId) => {
                  setLocalTask(prev => prev ? { ...prev, clientId, projectId: null } : null);
                  await handleSave({ clientId, projectId: null });
                }}
              />
            </section>

            {/* Project - Editable */}
            <section>
              <ProjectSelector
                clientId={localTask?.clientId || null}
                value={localTask?.projectId || undefined}
                onChange={async (projectId) => {
                  setLocalTask(prev => prev ? { ...prev, projectId } : null);
                  await handleSave({ projectId });
                }}
              />
            </section>

            {/* Billable Status - Editable */}
            <section>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billable Status
              </label>
              <button
                type="button"
                onClick={async () => {
                  const newValue = !localTask?.isBillable;
                  setLocalTask(prev => prev ? { ...prev, isBillable: newValue } : null);
                  await handleSave({ isBillable: newValue });
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  localTask?.isBillable
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                aria-label={`Mark task as ${localTask?.isBillable ? 'non-billable' : 'billable'}`}
              >
                {localTask?.isBillable ? 'Billable' : 'Non-billable'}
              </button>
            </section>

            {/* Time Spent */}
            <section>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Spent
              </label>
              <div className="text-sm text-gray-700">
                {isLoadingTime ? (
                  <span className="text-gray-400">Loading...</span>
                ) : (
                  formatDuration(totalTimeSpent)
                )}
              </div>
            </section>

            {/* Time Estimate - Editable */}
            <section>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="task-time-estimate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Time Estimate (minutes)
                </label>
                {timeEstimateSaveState.status === 'saving' && (
                  <span className="text-xs text-gray-500">Saving...</span>
                )}
                {timeEstimateSaveState.status === 'saved' && (
                  <span className="text-xs text-green-600">Saved</span>
                )}
                {timeEstimateSaveState.status === 'error' && (
                  <span className="text-xs text-red-600">Error</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="task-time-estimate"
                  type="number"
                  min="0"
                  step="1"
                  value={localTask?.timeEstimate ?? ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
                    setLocalTask(prev => prev ? { ...prev, timeEstimate: value } : null);
                  }}
                  placeholder="No estimate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  aria-describedby="task-time-estimate-description"
                />
                {localTask && localTask.timeEstimate !== null && localTask.timeEstimate !== undefined && (
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    ({formatDuration(localTask.timeEstimate)})
                  </span>
                )}
              </div>
              <p id="task-time-estimate-description" className="sr-only">
                Time estimate in minutes
              </p>
            </section>

            {/* Time Entries List */}
            <section>
              <TimeEntriesList
                taskId={taskId}
                onTimeEntryChange={refreshTimeSpent}
              />
            </section>
          </div>
        </main>
      </div>
    </>
  );
};
