import React, { useState, useEffect, useMemo } from 'react';
import { Task } from '@/types/task';
import { TimerControl } from '@/components/timer/TimerControl';
import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { TimeEstimateDisplay } from '@/components/timer/TimeEstimateDisplay';
import { TimeEntryModal } from '@/components/timer/TimeEntryModal';
import { BillableIndicator } from '@/components/task/BillableIndicator';
import { RevenueDisplay } from '@/components/task/RevenueDisplay';
import { TimeEntryRepository } from '@/services/data/repositories/TimeEntryRepository';
import { TimeEntry } from '@/types/timeEntry';
import { TimerState } from '@/types/timerState';
import { useTaskContext } from '@/contexts/TaskContext';
import { useFilterContext } from '@/contexts/FilterContext';
import { useClientContext } from '@/contexts/ClientContext';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { useTimerContext } from '@/contexts/TimerContext';
import { revenueService } from '@/services/RevenueService';
import { highlightTaskTitle } from '@/utils/searchUtils';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

/**
 * PriorityBadge - Displays priority as color-coded badge
 */
const PriorityBadge: React.FC<{ priority: 'low' | 'medium' | 'high' }> = ({ priority }) => {
  const colors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-orange-100 text-orange-800 border-orange-200',
    low: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const labels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low'
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full border ${colors[priority]}`}
      aria-label={`Priority: ${labels[priority]}`}
    >
      {labels[priority]}
    </span>
  );
};

/**
 * DueDateDisplay - Formats and displays due date
 */
const DueDateDisplay: React.FC<{ dueDate: Date }> = ({ dueDate }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let displayText: string;
  if (diffDays === 0) {
    displayText = 'Today';
  } else if (diffDays === 1) {
    displayText = 'Tomorrow';
  } else if (diffDays === -1) {
    displayText = 'Yesterday';
  } else if (diffDays < 0) {
    displayText = `${Math.abs(diffDays)} days ago`;
  } else if (diffDays <= 7) {
    displayText = `In ${diffDays} days`;
  } else {
    // Format as "Jan 24" or "Dec 31"
    displayText = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="flex items-center gap-1 text-sm text-gray-600">
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <span aria-label={`Due date: ${displayText}`}>{displayText}</span>
    </div>
  );
};

/**
 * TaskCard - Individual task card component
 * 
 * Displays task title prominently, due date (if set), and priority indicator (if set).
 * Styled with Tailwind CSS for visual distinction and readability.
 * 
 * Optimized with React.memo to prevent unnecessary re-renders when other tasks change.
 * Only re-renders when this specific task's props change or when timer state changes for this task.
 */
const TaskCardComponent: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const [isTimeEntryModalOpen, setIsTimeEntryModalOpen] = useState(false);
  const [timerDisplayRefreshKey, setTimerDisplayRefreshKey] = useState(0);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [isLoadingTotalTime, setIsLoadingTotalTime] = useState(true);
  const [isTogglingBillable, setIsTogglingBillable] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoadingTimeEntries, setIsLoadingTimeEntries] = useState(true);
  const [activeTimer, setActiveTimer] = useState<TimerState | null>(null);
  const timeEntryRepository = useMemo(() => new TimeEntryRepository(), []);
  const { updateTask } = useTaskContext();
  const { filters } = useFilterContext();
  const { getAllClients } = useClientContext();
  const { getAllProjects } = useProjectContext();
  const { settings } = useSettingsContext();
  const { isActive: isTimerActive, activeTaskId, startTime, status: timerStatus, elapsedTime } = useTimerContext();

  // Get search query for highlighting
  const searchQuery = filters.searchQuery.trim();

  // Load total time for estimate comparison
  useEffect(() => {
    let isMounted = true;

    const loadTotalTime = async () => {
      try {
        setIsLoadingTotalTime(true);
        const total = await timeEntryRepository.getTotalTimeForTask(task.id);
        if (isMounted) {
          setTotalTime(total);
          setIsLoadingTotalTime(false);
        }
      } catch (err) {
        console.error('Error loading total time for estimate:', err);
        if (isMounted) {
          setIsLoadingTotalTime(false);
        }
      }
    };

    loadTotalTime();

    return () => {
      isMounted = false;
    };
  }, [task.id, timerDisplayRefreshKey, timeEntryRepository]);

  // Load time entries for revenue calculation
  useEffect(() => {
    let isMounted = true;

    const loadTimeEntries = async () => {
      try {
        setIsLoadingTimeEntries(true);
        const entries = await timeEntryRepository.getByTaskId(task.id);
        if (isMounted) {
          setTimeEntries(entries);
          setIsLoadingTimeEntries(false);
        }
      } catch (err) {
        console.error('Error loading time entries:', err);
        if (isMounted) {
          setIsLoadingTimeEntries(false);
        }
      }
    };

    loadTimeEntries();

    return () => {
      isMounted = false;
    };
  }, [task.id, timerDisplayRefreshKey, timeEntryRepository]);

  // Create active timer state from TimerContext for revenue calculation
  // This updates in real-time as the timer runs (elapsedTime changes every second)
  useEffect(() => {
    if (isTimerActive(task.id) && activeTaskId === task.id && startTime && timerStatus === 'active') {
      // Create TimerState object from TimerContext for calculateTaskRevenue
      // Use elapsedTime in dependency to trigger updates every second
      const timerState: TimerState = {
        taskId: task.id,
        startTime: startTime,
        lastUpdateTime: new Date(),
        status: 'active'
      };
      setActiveTimer(timerState);
    } else {
      setActiveTimer(null);
    }
  }, [task.id, isTimerActive, activeTaskId, startTime, timerStatus, elapsedTime]);

  // Calculate revenue using useMemo for performance
  const revenue = useMemo(() => {
    if (!task.isBillable) {
      return null;
    }

    try {
      // Get client and project from contexts
      const client = task.clientId ? getAllClients().find(c => c.id === task.clientId) : null;
      const project = task.projectId ? getAllProjects().find(p => p.id === task.projectId) : null;

      // Calculate revenue
      return revenueService.calculateTaskRevenue(
        task,
        timeEntries,
        activeTimer,
        client || undefined,
        project || undefined,
        settings || undefined
      );
    } catch (error) {
      console.error('Error calculating revenue:', error);
      return null;
    }
  }, [task, timeEntries, activeTimer, getAllClients, getAllProjects, settings]);

  /**
   * Handle opening time entry modal
   */
  const handleAddTimeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setIsTimeEntryModalOpen(true);
  };

  /**
   * Handle closing time entry modal
   */
  const handleCloseModal = () => {
    setIsTimeEntryModalOpen(false);
    // Refresh TimerDisplay and revenue in case entries were edited/deleted in modal
    setTimerDisplayRefreshKey(prev => prev + 1);
  };

  /**
   * Handle time entry submission
   */
  const handleTimeEntrySubmit = async (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await timeEntryRepository.create(entry);
      // Trigger TimerDisplay refresh
      setTimerDisplayRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error creating time entry:', error);
      throw error; // Re-throw to let modal handle error display
    }
  };

  /**
   * Handle billable status toggle
   */
  const handleBillableToggle = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (isTogglingBillable) {
      return; // Prevent multiple simultaneous toggles
    }

    try {
      setIsTogglingBillable(true);
      await updateTask(task.id, { isBillable: !task.isBillable });
    } catch (error) {
      console.error('Error toggling billable status:', error);
      // Error is handled by TaskContext, but we can show user feedback if needed
    } finally {
      setIsTogglingBillable(false);
    }
  };

  /**
   * Handle keyboard events for billable toggle
   */
  const handleBillableToggleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleBillableToggle(e);
    }
  };

  return (
    <>
      <div
        role="article"
        aria-labelledby={`task-${task.id}-title`}
        onClick={onClick}
        className={`
          bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3
          cursor-pointer transition-all duration-200
          hover:shadow-md hover:scale-[1.02]
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${onClick ? '' : 'cursor-default'}
        `}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {/* Task Header with Timer Control */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            id={`task-${task.id}-title`}
            className="text-base font-semibold text-gray-900 line-clamp-2 flex-1"
          >
            {searchQuery ? highlightTaskTitle(task, searchQuery) : task.title}
          </h3>
          <TimerControl taskId={task.id} />
        </div>

        {/* Task Metadata */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Priority Badge */}
            {task.priority && (
              <PriorityBadge priority={task.priority} />
            )}

            {/* Billable Indicator with Toggle */}
            {task.isBillable ? (
              <button
                onClick={handleBillableToggle}
                onKeyDown={handleBillableToggleKeyDown}
                disabled={isTogglingBillable}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                aria-label="Mark as non-billable"
                title="Click to mark as non-billable"
              >
                <BillableIndicator isBillable={true} />
              </button>
            ) : (
              <button
                onClick={handleBillableToggle}
                onKeyDown={handleBillableToggleKeyDown}
                disabled={isTogglingBillable}
                className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-green-600 rounded-full border border-gray-300 hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                aria-label="Mark as billable"
                title="Click to mark as billable"
              >
                <svg
                  className="w-3 h-3 inline-block mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Mark Billable</span>
              </button>
            )}
          </div>

          {/* Due Date */}
          {task.dueDate && (
            <DueDateDisplay dueDate={task.dueDate} />
          )}
        </div>

        {/* Time Display */}
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between gap-2 mb-1">
            <TimerDisplay taskId={task.id} refreshKey={timerDisplayRefreshKey} />
            <button
              onClick={handleAddTimeClick}
              className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Add manual time entry"
              title="Add manual time entry"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
          {/* Time Estimate Display */}
          {!isLoadingTotalTime && (
            <TimeEstimateDisplay task={task} totalTime={totalTime} />
          )}
          {/* Revenue Display */}
          {!isLoadingTimeEntries && task.isBillable && (
            <div className="mt-1">
              <RevenueDisplay revenue={revenue} isBillable={task.isBillable} />
            </div>
          )}
        </div>
      </div>

      {/* Time Entry Modal */}
      <TimeEntryModal
        isOpen={isTimeEntryModalOpen}
        taskId={task.id}
        onClose={handleCloseModal}
        onSubmit={handleTimeEntrySubmit}
      />
    </>
  );
};

// Memoize component to prevent unnecessary re-renders
// Only re-renders when task prop changes or when timer state changes for this specific task
export const TaskCard = React.memo(TaskCardComponent, (prevProps, nextProps) => {
  // Custom comparison: only re-render if task data actually changed
  // Timer state changes are handled by TimerDisplay and TimerControl components internally
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.description === nextProps.task.description &&
    prevProps.task.columnId === nextProps.task.columnId &&
    prevProps.task.position === nextProps.task.position &&
    prevProps.task.priority === nextProps.task.priority &&
    prevProps.task.dueDate?.getTime() === nextProps.task.dueDate?.getTime() &&
    prevProps.task.timeEstimate === nextProps.task.timeEstimate &&
    prevProps.task.isBillable === nextProps.task.isBillable &&
    prevProps.task.hourlyRate === nextProps.task.hourlyRate &&
    prevProps.task.clientId === nextProps.task.clientId &&
    prevProps.task.projectId === nextProps.task.projectId &&
    prevProps.onClick === nextProps.onClick
  );
});
