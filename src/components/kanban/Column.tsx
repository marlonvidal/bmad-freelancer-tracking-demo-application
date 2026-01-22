import React from 'react';
import { Column as ColumnType } from '@/types/column';
import { TaskRepository } from '@/services/data/repositories/TaskRepository';
import { useColumnContext } from '@/contexts/ColumnContext';
import { EmptyColumnState } from './EmptyColumnState';
import { ColumnHeader } from './ColumnHeader';
import { DeleteColumnDialog } from './DeleteColumnDialog';

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
  const [taskCount, setTaskCount] = React.useState<number>(0);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  // Memoize TaskRepository to avoid creating new instances on every render
  const taskRepository = React.useMemo(() => new TaskRepository(), []);

  // Load task count for this column
  React.useEffect(() => {
    const loadTaskCount = async () => {
      try {
        const tasks = await taskRepository.getByColumnId(column.id);
        setTaskCount(tasks.length);
      } catch (error) {
        console.error('Error loading task count:', error);
      }
    };

    loadTaskCount();
  }, [column.id, taskRepository]);

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

  return (
    <div
      className="flex flex-col w-80 sm:w-80 md:w-80 lg:w-80 bg-white rounded-lg shadow-sm border border-gray-200 flex-shrink-0"
      role="group"
      aria-label={`${column.name} column`}
    >
      {/* Column Header */}
      <ColumnHeader 
        column={column} 
        taskCount={taskCount} 
        onDelete={handleDeleteClick}
      />

      {/* Column Content */}
      <div 
        className="flex-1 p-4 overflow-y-auto min-h-[200px] max-h-[calc(100vh-200px)]"
        role="region"
        aria-label={`Tasks in ${column.name}`}
      >
        {/* Empty state or tasks will go here */}
        <EmptyColumnState columnName={column.name} />
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteColumnDialog
        column={column}
        taskCount={taskCount}
        isOpen={showDeleteDialog}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};
