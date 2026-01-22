import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useColumnContext } from '@/contexts/ColumnContext';
import { SortableColumn } from './SortableColumn';
import { AddColumnButton } from './AddColumnButton';

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
   * Handle drag end event
   * Reorders columns based on new position
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return; // No change in position
    }

    // Get current column order
    const columnIds = columns.map(col => col.id);
    const oldIndex = columnIds.indexOf(active.id as string);
    const newIndex = columnIds.indexOf(over.id as string);

    if (oldIndex !== -1 && newIndex !== -1) {
      // Reorder array
      const newColumnIds = [...columnIds];
      const [removed] = newColumnIds.splice(oldIndex, 1);
      newColumnIds.splice(newIndex, 0, removed);

      // Persist new order
      reorderColumns(newColumnIds).catch((error) => {
        console.error('Error reordering columns:', error);
      });
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
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
    </div>
  );
};
