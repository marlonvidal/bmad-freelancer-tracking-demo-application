import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';
import { Task } from '@/types/task';

interface SortableTaskCardProps {
  task: Task;
  onClick?: () => void;
}

/**
 * SortableTaskCard - Wrapper component that makes TaskCard draggable and sortable
 * 
 * Uses @dnd-kit's useSortable hook to enable drag-and-drop.
 * Provides visual feedback during drag operations.
 * Supports both dragging between columns and reordering within columns.
 */
export const SortableTaskCard: React.FC<SortableTaskCardProps> = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition, // Disable transitions during drag for performance
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        ${isDragging ? 'cursor-grabbing z-50' : 'cursor-grab'}
        will-change-transform
        touch-none
      `}
      role="button"
      aria-label={`Drag task ${task.title} to move between columns`}
      aria-describedby={`task-${task.id}-description`}
      tabIndex={0}
      onKeyDown={(e) => {
        // Handle ESC key to cancel drag (handled by DndContext, but add for clarity)
        if (e.key === 'Escape' && isDragging) {
          e.stopPropagation();
        }
      }}
    >
      <div
        className={`
          ${isDragging ? 'shadow-lg' : ''}
          transition-none
        `}
        style={{
          transform: isDragging ? 'scale(1.05)' : undefined,
          transition: isDragging ? 'none' : undefined, // Disable transitions during drag
        }}
      >
        <TaskCard task={task} onClick={onClick} />
      </div>
    </div>
  );
};
