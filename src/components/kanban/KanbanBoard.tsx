import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useColumnContext } from '@/contexts/ColumnContext';
import { useTaskContext } from '@/contexts/TaskContext';
import { SortableColumn } from './SortableColumn';
import { AddColumnButton } from './AddColumnButton';
import { TaskFilterBar } from './TaskFilterBar';
import { TaskCreationModal } from '../task/TaskCreationModal';
import { Task } from '@/types/task';

/**
 * KanbanBoard - Main kanban board container component
 * 
 * Displays columns horizontally in a scrollable container.
 * Handles loading and error states.
 * Responsive layout that adapts to window size.
 * Supports drag-and-drop column reordering.
 */
export const KanbanBoard: React.FC = () => {
  const { columns, loading, error, reorderColumns } = useColumnContext();
  const { createTask, updateTask, tasks } = useTaskContext();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [initialColumnId, setInitialColumnId] = useState<string | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);

  // Configure sensors for mouse and keyboard drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Handle keyboard shortcut for creating task (Cmd/Ctrl + N or T)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N or T
      if ((e.metaKey || e.ctrlKey) && (e.key === 'n' || e.key === 't')) {
        e.preventDefault();
        setInitialColumnId(undefined);
        setIsTaskModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  /**
   * Handle task creation
   */
  const handleTaskSubmit = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createTask(taskData);
  };

  /**
   * Handle drag start event
   * Tracks which item is being dragged (column or task)
   * Prevents multiple simultaneous drags
   */
  const handleDragStart = () => {
    if (isDragging) {
      // Prevent multiple simultaneous drags
      return;
    }
    setIsDragging(true);
  };

  /**
   * Handle drag over event
   * Provides visual feedback during drag
   */
  const handleDragOver = () => {
    // Visual feedback is handled by individual components
    // This handler can be used for additional logic if needed
  };

  /**
   * Handle drag end event
   * Handles both column reordering and task movement/reordering
   * 
   * Supports three drag operations:
   * 1. Column reordering: When a column is dragged over another column
   * 2. Task movement between columns: When a task is dragged over a column
   * 3. Task reordering within/between columns: When a task is dragged over another task
   * 
   * @param event - DragEndEvent from @dnd-kit containing active and over items
   * @throws Logs errors but doesn't throw (errors handled by TaskContext rollback)
   */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Reset dragging state
    setIsDragging(false);

    if (!over || active.id === over.id) {
      return; // No change in position
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dragging a column (column reordering)
    const columnIds = columns.map(col => col.id);
    const isColumnDrag = columnIds.includes(activeId);

    if (isColumnDrag && columnIds.includes(overId)) {
      // Column reordering
      const oldIndex = columnIds.indexOf(activeId);
      const newIndex = columnIds.indexOf(overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newColumnIds = [...columnIds];
        const [removed] = newColumnIds.splice(oldIndex, 1);
        newColumnIds.splice(newIndex, 0, removed);

        reorderColumns(newColumnIds).catch((error) => {
          console.error('Error reordering columns:', error);
        });
      }
      return;
    }

    // Check if dragging a task
    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) {
      return; // Not a task drag
    }

    // Check if dropping on a column (task movement between columns)
    const targetColumn = columns.find(col => col.id === overId);
    if (targetColumn) {
      // Task moved to different column - append to end
      const targetColumnTasks = tasks
        .filter(t => t.columnId === targetColumn.id && t.id !== activeId)
        .sort((a, b) => a.position - b.position);
      
      // Calculate new position (append to end)
      const maxPosition = targetColumnTasks.length > 0 
        ? Math.max(...targetColumnTasks.map(t => t.position))
        : 0;
      const newPosition = maxPosition + 1;

      try {
        // Verify column still exists
        const columnStillExists = columns.find(col => col.id === targetColumn.id);
        if (!columnStillExists) {
          console.warn('Target column was deleted during drag operation');
          return;
        }
        
        // Verify task still exists
        const taskStillExists = tasks.find(t => t.id === activeTask.id);
        if (!taskStillExists) {
          console.warn('Task was deleted during drag operation');
          return;
        }

        await updateTask(activeTask.id, {
          columnId: targetColumn.id,
          position: newPosition
        });
      } catch (error) {
        console.error('Error moving task to column:', error);
        // Error is already handled by TaskContext (rollback optimistic update)
      }
      return;
    }

    // Check if dropping on another task (task reordering)
    const overTask = tasks.find(t => t.id === overId);
    if (overTask) {
      if (activeTask.columnId === overTask.columnId) {
        // Same column reordering
        // Get all tasks in column, sorted by position
        const columnTasks = tasks
          .filter(t => t.columnId === activeTask.columnId)
          .sort((a, b) => a.position - b.position);
        
        const oldIndex = columnTasks.findIndex(t => t.id === activeId);
        const newIndex = columnTasks.findIndex(t => t.id === overId);
        
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
          return;
        }

        // Remove active task from array
        const reorderedTasks = [...columnTasks];
        const [movedTask] = reorderedTasks.splice(oldIndex, 1);
        reorderedTasks.splice(newIndex, 0, movedTask);

        // Recalculate positions (simple incrementing: 0, 1, 2, 3...)
        const tasksToUpdate = reorderedTasks.map((task, index) => ({
          id: task.id,
          position: index
        }));

        // Update all affected tasks
        try {
          // Verify column and tasks still exist
          const columnStillExists = columns.find(col => col.id === activeTask.columnId);
          if (!columnStillExists) {
            console.warn('Column was deleted during drag operation');
            return;
          }

          await Promise.all(
            tasksToUpdate.map(({ id, position }) =>
              updateTask(id, { position })
            )
          );
        } catch (error) {
          console.error('Error reordering tasks:', error);
          // Error is already handled by TaskContext (rollback optimistic update)
        }
      } else {
        // Different column - move task to new column at overTask's position
        const targetColumnTasks = tasks
          .filter(t => t.columnId === overTask.columnId && t.id !== activeId)
          .sort((a, b) => a.position - b.position);
        
        const insertIndex = targetColumnTasks.findIndex(t => t.id === overId);
        
        if (insertIndex === -1) {
          return;
        }

        // Insert active task at insertIndex position
        const reorderedTasks = [...targetColumnTasks];
        reorderedTasks.splice(insertIndex, 0, activeTask);

        // Recalculate positions for all tasks in target column
        const tasksToUpdate = reorderedTasks.map((task, index) => ({
          id: task.id,
          columnId: overTask.columnId,
          position: index
        }));

        try {
          // Verify target column and tasks still exist
          const columnStillExists = columns.find(col => col.id === overTask.columnId);
          if (!columnStillExists) {
            console.warn('Target column was deleted during drag operation');
            return;
          }

          // Update all affected tasks
          await Promise.all(
            tasksToUpdate.map(({ id, columnId, position }) =>
              updateTask(id, { columnId, position })
            )
          );
        } catch (error) {
          console.error('Error moving task between columns:', error);
          // Error is already handled by TaskContext (rollback optimistic update)
        }
      }
    }
  };

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen bg-gray-50"
        role="status"
        aria-label="Loading kanban board"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading columns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen bg-gray-50"
        role="alert"
        aria-label="Error loading kanban board"
      >
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Board</h2>
          <p className="text-red-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gray-50 p-4"
      role="region"
      aria-label="Kanban board"
    >
      {/* Task Filter Bar */}
      <TaskFilterBar />

      {/* Quick Add Task Button */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => {
            setInitialColumnId(undefined);
            setIsTaskModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          aria-label="Add new task (Cmd/Ctrl + N)"
          title="Add new task (Cmd/Ctrl + N)"
        >
          <svg
            className="w-5 h-5"
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
          <span>Add Task</span>
          <span className="text-xs opacity-75">(⌘N)</span>
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          // Drag cancelled - reset state
          setIsDragging(false);
        }}
      >
        <div className="max-w-full overflow-x-auto">
          <SortableContext
            items={columns.map(col => col.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div 
              className="flex flex-row gap-4 min-w-max p-2"
              // Responsive layout:
              // Mobile (< 640px): Horizontal scroll, columns maintain width
              // Tablet (640px - 1024px): Horizontal scroll, 2-3 columns visible
              // Desktop (> 1024px): All columns in single row, horizontal scroll if needed
            >
              {columns.map((column) => (
                <SortableColumn key={column.id} column={column} />
              ))}
              <AddColumnButton />
            </div>
          </SortableContext>
        </div>
      </DndContext>

      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={isTaskModalOpen}
        initialColumnId={initialColumnId}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleTaskSubmit}
      />
    </div>
  );
};
