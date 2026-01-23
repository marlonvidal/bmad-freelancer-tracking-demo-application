import React from 'react';
import { render, screen } from '@testing-library/react';
import { BillableIndicator } from '@/components/task/BillableIndicator';

describe('BillableIndicator', () => {
  describe('rendering', () => {
    it('renders indicator when isBillable is true', () => {
      render(<BillableIndicator isBillable={true} />);
      
      const indicator = screen.getByLabelText('Billable task');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveTextContent('Billable');
    });

    it('does not render when isBillable is false', () => {
      const { container } = render(<BillableIndicator isBillable={false} />);
      
      expect(container.firstChild).toBeNull();
    });

    it('has correct ARIA label when billable', () => {
      render(<BillableIndicator isBillable={true} />);
      
      const indicator = screen.getByLabelText('Billable task');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies correct CSS classes for billable indicator', () => {
      render(<BillableIndicator isBillable={true} />);
      
      const indicator = screen.getByLabelText('Billable task');
      expect(indicator).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200');
    });

    it('includes dollar sign icon', () => {
      render(<BillableIndicator isBillable={true} />);
      
      const indicator = screen.getByLabelText('Billable task');
      const svg = indicator.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA label', () => {
      render(<BillableIndicator isBillable={true} />);
      
      const indicator = screen.getByLabelText('Billable task');
      expect(indicator).toHaveAttribute('aria-label', 'Billable task');
    });

    it('has hidden icon for screen readers', () => {
      render(<BillableIndicator isBillable={true} />);
      
      const svg = screen.getByLabelText('Billable task').querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
