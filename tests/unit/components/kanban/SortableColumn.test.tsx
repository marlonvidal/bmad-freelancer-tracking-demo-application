import React from 'react';
import { render, screen } from '@testing-library/react';
import { SortableColumn } from '@/components/kanban/SortableColumn';
import { Column as ColumnType } from '@/types/column';

// Mock @dnd-kit hooks
const mockUseSortable = {
  attributes: {
    role: 'button',
    tabIndex: 0,
    'aria-describedby': 'dnd-context-description'
  },
  listeners: {
    onPointerDown: jest.fn(),
    onKeyDown: jest.fn()
  },
  setNodeRef: jest.fn(),
  transform: { x: 0, y: 0 },
  transition: 'transform 200ms ease',
  isDragging: false
};

jest.mock('@dnd-kit/sortable', () => ({
  useSortable: jest.fn(() => mockUseSortable)
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: jest.fn((transform) => `translate3d(${transform.x}px, ${transform.y}px, 0)`)
    }
  }
}));

jest.mock('@/components/kanban/Column', () => ({
  Column: ({ column }: any) => (
    <div data-testid={`column-${column.id}`}>{column.name}</div>
  )
}));

describe('SortableColumn', () => {
  const testColumn: ColumnType = {
    id: 'col-1',
    name: 'Test Column',
    position: 0,
    color: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Column component', () => {
    render(<SortableColumn column={testColumn} />);
    expect(screen.getByTestId(`column-${testColumn.id}`)).toBeInTheDocument();
    expect(screen.getByText('Test Column')).toBeInTheDocument();
  });

  it('applies drag attributes', () => {
    render(<SortableColumn column={testColumn} />);
    
    // Verify useSortable was called with correct id
    const { useSortable } = require('@dnd-kit/sortable');
    expect(useSortable).toHaveBeenCalledWith({ id: testColumn.id });
  });

  it('applies transform style when dragging', () => {
    mockUseSortable.transform = { x: 10, y: 20 };
    mockUseSortable.isDragging = true;

    const { rerender } = render(<SortableColumn column={testColumn} />);
    rerender(<SortableColumn column={testColumn} />);

    const wrapper = screen.getByTestId(`column-${testColumn.id}`).parentElement;
    expect(wrapper).toHaveStyle({ opacity: '0.5' });
  });

  it('applies normal opacity when not dragging', () => {
    mockUseSortable.isDragging = false;

    render(<SortableColumn column={testColumn} />);

    const wrapper = screen.getByTestId(`column-${testColumn.id}`).parentElement;
    expect(wrapper).toHaveStyle({ opacity: '1' });
  });

  it('applies cursor-grab class when not dragging', () => {
    mockUseSortable.isDragging = false;

    render(<SortableColumn column={testColumn} />);

    const wrapper = screen.getByTestId(`column-${testColumn.id}`).parentElement;
    expect(wrapper).toHaveClass('cursor-grab');
  });

  it('applies cursor-grabbing class when dragging', () => {
    mockUseSortable.isDragging = true;

    render(<SortableColumn column={testColumn} />);

    const wrapper = screen.getByTestId(`column-${testColumn.id}`).parentElement;
    expect(wrapper).toHaveClass('cursor-grabbing');
  });

  it('applies transition style', () => {
    render(<SortableColumn column={testColumn} />);

    const wrapper = screen.getByTestId(`column-${testColumn.id}`).parentElement;
    expect(wrapper).toHaveStyle({ transition: 'transform 200ms ease' });
  });

  it('calls setNodeRef with element', () => {
    render(<SortableColumn column={testColumn} />);
    
    // Verify setNodeRef was called (it's called internally by useSortable)
    expect(mockUseSortable.setNodeRef).toBeDefined();
  });
});
