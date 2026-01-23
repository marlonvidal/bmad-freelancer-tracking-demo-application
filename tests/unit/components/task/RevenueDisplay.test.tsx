import React from 'react';
import { render, screen } from '@testing-library/react';
import { RevenueDisplay } from '@/components/task/RevenueDisplay';
import { formatCurrency } from '@/utils/currencyUtils';

// Mock currencyUtils
jest.mock('@/utils/currencyUtils', () => ({
  formatCurrency: jest.fn((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  })
}));

describe('RevenueDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering with valid revenue', () => {
    it('renders formatted currency when revenue is set', () => {
      render(<RevenueDisplay revenue={1250.50} isBillable={true} />);
      
      expect(formatCurrency).toHaveBeenCalledWith(1250.50);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Revenue: $1,250.50');
      expect(screen.getByText('$1,250.50')).toBeInTheDocument();
    });

    it('renders with label when showLabel is true', () => {
      render(<RevenueDisplay revenue={100} isBillable={true} showLabel={true} />);
      
      expect(screen.getByText('Revenue:')).toBeInTheDocument();
      expect(formatCurrency).toHaveBeenCalledWith(100);
    });

    it('does not render label when showLabel is false', () => {
      render(<RevenueDisplay revenue={100} isBillable={true} showLabel={false} />);
      
      expect(screen.queryByText('Revenue:')).not.toBeInTheDocument();
      expect(formatCurrency).toHaveBeenCalledWith(100);
    });

    it('renders $0.00 when revenue is 0', () => {
      render(<RevenueDisplay revenue={0} isBillable={true} />);
      
      expect(formatCurrency).toHaveBeenCalledWith(0);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Revenue: $0.00');
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });
  });

  describe('rendering with null revenue', () => {
    it('shows "Rate not set" when revenue is null and task is billable', () => {
      render(<RevenueDisplay revenue={null} isBillable={true} />);
      
      expect(screen.getByText('Rate not set')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Rate not set');
    });

    it('shows label with "Rate not set" when showLabel is true', () => {
      render(<RevenueDisplay revenue={null} isBillable={true} showLabel={true} />);
      
      expect(screen.getByText('Revenue:')).toBeInTheDocument();
      expect(screen.getByText('Rate not set')).toBeInTheDocument();
    });
  });

  describe('rendering with non-billable task', () => {
    it('does not render when task is not billable', () => {
      const { container } = render(<RevenueDisplay revenue={100} isBillable={false} />);
      
      expect(container.firstChild).toBeNull();
    });

    it('does not render when task is not billable even with null revenue', () => {
      const { container } = render(<RevenueDisplay revenue={null} isBillable={false} />);
      
      expect(container.firstChild).toBeNull();
    });

    it('does not render when task is not billable even with 0 revenue', () => {
      const { container } = render(<RevenueDisplay revenue={0} isBillable={false} />);
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('ARIA labels', () => {
    it('has correct aria-label for valid revenue', () => {
      render(<RevenueDisplay revenue={500} isBillable={true} />);
      
      const element = screen.getByRole('status');
      expect(element).toHaveAttribute('aria-label', 'Revenue: $500.00');
    });

    it('has correct aria-label for null revenue', () => {
      render(<RevenueDisplay revenue={null} isBillable={true} />);
      
      const element = screen.getByRole('status');
      expect(element).toHaveAttribute('aria-label', 'Rate not set');
    });
  });

  describe('currency formatting', () => {
    it('uses formatCurrency utility for formatting', () => {
      render(<RevenueDisplay revenue={1234.56} isBillable={true} />);
      
      expect(formatCurrency).toHaveBeenCalledWith(1234.56);
    });

    it('formats large amounts correctly', () => {
      render(<RevenueDisplay revenue={100000} isBillable={true} />);
      
      expect(formatCurrency).toHaveBeenCalledWith(100000);
    });

    it('formats decimal amounts correctly', () => {
      render(<RevenueDisplay revenue={75.99} isBillable={true} />);
      
      expect(formatCurrency).toHaveBeenCalledWith(75.99);
    });
  });
});
