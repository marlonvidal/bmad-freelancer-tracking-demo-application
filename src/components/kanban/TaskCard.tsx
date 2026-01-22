import React from 'react';
import { Task } from '@/types/task';
import { TimerControl } from '@/components/timer/TimerControl';

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
 */
export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  return (
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
          {task.title}
        </h3>
        <TimerControl taskId={task.id} />
      </div>

      {/* Task Metadata */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Priority Badge */}
        {task.priority && (
          <PriorityBadge priority={task.priority} />
        )}

        {/* Due Date */}
        {task.dueDate && (
          <DueDateDisplay dueDate={task.dueDate} />
        )}
      </div>
    </div>
  );
};
