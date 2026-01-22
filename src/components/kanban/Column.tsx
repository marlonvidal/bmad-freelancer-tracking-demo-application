import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column as ColumnType } from '@/types/column';
import { useColumnContext } from '@/contexts/ColumnContext';
import { useTaskContext } from '@/contexts/TaskContext';
import { EmptyColumnState } from './EmptyColumnState';
import { ColumnHeader } from './ColumnHeader';
import { DeleteColumnDialog } from './DeleteColumnDialog';
import { SortableTaskCard } from './SortableTaskCard';
import { TaskCreationModal } from '../task/TaskCreationModal';
import { Task } from '@/types/task';

interface ColumnProps {
  column: ColumnType;
}

/**
 * Column - Individual column component
 * 
 * Displays column header with name and task count.
 * Shows column content area (empty state or tasks).
 * Scrollable if content exceeds height.
 */
export const Column: React.FC<ColumnProps> = ({ column }) => {
  const { deleteColumn } = useColumnContext();
  const { getTasksByColumnId, createTask } = useTaskContext();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Get tasks for this column, sorted by position
  const tasks = React.useMemo(() => {
    return getTasksByColumnId(column.id);
  }, [getTasksByColumnId, column.id]);

  const taskCount = tasks.length;
  const taskIds = tasks.map(task => task.id);

  // Make column a drop zone
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
  });

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteColumn(column.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting column:', error);
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  const handleAddTask = () => {
    setIsTaskModalOpen(true);
  };

  const handleTaskSubmit = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createTask(taskData);
  };

  return (
    <div
      ref={setDroppableRef}
      className={`
        flex flex-col w-80 sm:w-80 md:w-80 lg:w-80 bg-white rounded-lg shadow-sm border flex-shrink-0
        ${isOver ? 'border-blue-400 bg-blue-50/10 ring-2 ring-blue-200' : 'border-gray-200'}
        transition-colors duration-150 ease-out
      `}
      role="region"
      aria-label={`${column.name} column drop zone`}
      aria-dropeffect="move"
      data-testid={`column-drop-zone-${column.id}`}
    >
      {/* Column Header */}
      <ColumnHeader 
        column={column} 
        taskCount={taskCount} 
        onDelete={handleDeleteClick}
        onAddTask={handleAddTask}
      />

      {/* Column Content */}
      <div 
        className="flex-1 p-4 overflow-y-auto min-h-[200px] max-h-[calc(100vh-200px)]"
        role="region"
        aria-label={`Tasks in ${column.name}`}
      >
        {tasks.length === 0 ? (
          <EmptyColumnState columnName={column.name} />
        ) : (
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-0">
              {tasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  onClick={() => {
                    // Future: Open task detail view
                    console.log('Task clicked:', task.id);
                  }}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteColumnDialog
        column={column}
        taskCount={taskCount}
        isOpen={showDeleteDialog}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={isTaskModalOpen}
        initialColumnId={column.id}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleTaskSubmit}
      />
    </div>
  );
};
