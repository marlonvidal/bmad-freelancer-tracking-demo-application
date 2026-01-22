import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Column as ColumnType } from '@/types/column';
import { Column } from './Column';

interface SortableColumnProps {
  column: ColumnType;
}

/**
 * SortableColumn - Wrapper component that makes Column draggable
 * 
 * Uses @dnd-kit's useSortable hook to enable drag-and-drop.
 * Provides visual feedback during drag operations.
 */
export const SortableColumn: React.FC<SortableColumnProps> = ({ column }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
    >
      <Column column={column} />
    </div>
  );
};
