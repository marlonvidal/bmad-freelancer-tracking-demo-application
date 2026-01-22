import React from 'react';
import { render, screen } from '@testing-library/react';
import { EmptyColumnState } from '@/components/kanban/EmptyColumnState';

describe('EmptyColumnState', () => {
  it('renders empty state message', () => {
    render(<EmptyColumnState columnName="Test Column" />);
    expect(screen.getByText('No tasks in this column')).toBeInTheDocument();
  });

  it('displays column name in ARIA label', () => {
    render(<EmptyColumnState columnName="Backlog" />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-label', 'No tasks in Backlog column');
  });

  it('renders icon', () => {
    render(<EmptyColumnState columnName="Test Column" />);
    const icon = screen.getByRole('status').querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('has proper semantic structure', () => {
    render(<EmptyColumnState columnName="Test Column" />);
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
  });

  it('displays correct message for different column names', () => {
    const { rerender } = render(<EmptyColumnState columnName="In Progress" />);
    expect(screen.getByText('No tasks in this column')).toBeInTheDocument();

    rerender(<EmptyColumnState columnName="Done" />);
    expect(screen.getByText('No tasks in this column')).toBeInTheDocument();
  });
});
