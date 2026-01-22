import React from 'react';
import { render, screen } from '@testing-library/react';
import { TimeEstimateDisplay } from '@/components/timer/TimeEstimateDisplay';
import { Task } from '@/types/task';
import * as timeUtils from '@/utils/timeUtils';
import * as estimateUtils from '@/utils/estimateUtils';

// Mock the utility functions
jest.mock('@/utils/timeUtils');
jest.mock('@/utils/estimateUtils');

const mockFormatDuration = timeUtils.formatDuration as jest.MockedFunction<typeof timeUtils.formatDuration>;
const mockCalculateEstimateComparison = estimateUtils.calculateEstimateComparison as jest.MockedFunction<typeof estimateUtils.calculateEstimateComparison>;

describe('TimeEstimateDisplay', () => {
  const mockTask: Task = {
    id: 'task1',
    title: 'Test Task',
    columnId: 'col1',
    position: 0,
    clientId: null,
    projectId: null,
    isBillable: false,
    hourlyRate: null,
    timeEstimate: 60, // 1 hour estimate
    dueDate: null,
    priority: null,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatDuration.mockImplementation((minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
      if (hours > 0) return `${hours}h`;
      return `${mins}m`;
    });
  });

  describe('rendering with estimate and actual time', () => {
    it('renders estimate and actual time when both are present', () => {
      mockCalculateEstimateComparison.mockReturnValue({
        difference: 15,
        percentage: 25,
        status: 'over'
      });

      render(<TimeEstimateDisplay task={mockTask} totalTime={75} />);

      expect(screen.getByText(/Est:/)).toBeInTheDocument();
      expect(screen.getByText(/Actual:/)).toBeInTheDocument();
      expect(mockFormatDuration).toHaveBeenCalledWith(60); // estimate
      expect(mockFormatDuration).toHaveBeenCalledWith(75); // actual
    });

    it('displays over estimate indicator', () => {
      mockCalculateEstimateComparison.mockReturnValue({
        difference: 15,
        percentage: 25,
        status: 'over'
      });

      const { container } = render(<TimeEstimateDisplay task={mockTask} totalTime={75} />);

      const indicator = screen.getByText('⚠️');
      expect(indicator).toBeInTheDocument();
      // The parent span should have the red color class
      const parentSpan = indicator.parentElement;
      expect(parentSpan).toHaveClass('text-red-600');
    });

    it('displays under estimate indicator', () => {
      mockCalculateEstimateComparison.mockReturnValue({
        difference: -15,
        percentage: -25,
        status: 'under'
      });

      render(<TimeEstimateDisplay task={mockTask} totalTime={45} />);

      // There are multiple ✓ symbols (one for under estimate, one might be in on-track)
      // Find the one that's in a green-colored span
      const greenSpans = screen.getAllByText('✓').filter(el => {
        const parent = el.parentElement;
        return parent && parent.classList.contains('text-green-600');
      });
      expect(greenSpans.length).toBeGreaterThan(0);
    });

    it('displays on-track status without extra indicator', () => {
      mockCalculateEstimateComparison.mockReturnValue({
        difference: 2,
        percentage: 3.33,
        status: 'on-track'
      });

      render(<TimeEstimateDisplay task={mockTask} totalTime={62} />);

      expect(screen.getByText(/Est:/)).toBeInTheDocument();
      expect(screen.getByText(/Actual:/)).toBeInTheDocument();
      expect(screen.queryByText('⚠️')).not.toBeInTheDocument();
      expect(screen.queryByText('✓')).not.toBeInTheDocument();
    });
  });

  describe('rendering without estimate', () => {
    it('does not render when timeEstimate is null', () => {
      const taskWithoutEstimate = { ...mockTask, timeEstimate: null };
      const { container } = render(<TimeEstimateDisplay task={taskWithoutEstimate} totalTime={75} />);
      expect(container.firstChild).toBeNull();
    });

    it('does not render when timeEstimate is 0', () => {
      const taskWithoutEstimate = { ...mockTask, timeEstimate: 0 };
      const { container } = render(<TimeEstimateDisplay task={taskWithoutEstimate} totalTime={75} />);
      expect(container.firstChild).toBeNull();
    });

    it('does not render when timeEstimate is negative', () => {
      const taskWithoutEstimate = { ...mockTask, timeEstimate: -10 };
      const { container } = render(<TimeEstimateDisplay task={taskWithoutEstimate} totalTime={75} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA label', () => {
      mockCalculateEstimateComparison.mockReturnValue({
        difference: 15,
        percentage: 25,
        status: 'over'
      });

      render(<TimeEstimateDisplay task={mockTask} totalTime={75} />);

      const element = screen.getByRole('status');
      expect(element).toHaveAttribute('aria-label');
      expect(element.getAttribute('aria-label')).toContain('Estimate:');
      expect(element.getAttribute('aria-label')).toContain('Actual:');
    });

    it('includes screen reader text for over estimate', () => {
      mockCalculateEstimateComparison.mockReturnValue({
        difference: 15,
        percentage: 25,
        status: 'over'
      });

      render(<TimeEstimateDisplay task={mockTask} totalTime={75} />);

      const srText = screen.getByText(/Over estimate by 15 minutes/i);
      expect(srText).toHaveClass('sr-only');
    });

    it('includes screen reader text for under estimate', () => {
      mockCalculateEstimateComparison.mockReturnValue({
        difference: -15,
        percentage: -25,
        status: 'under'
      });

      render(<TimeEstimateDisplay task={mockTask} totalTime={45} />);

      const srText = screen.getByText(/Under estimate by 15 minutes/i);
      expect(srText).toHaveClass('sr-only');
    });
  });

  describe('format consistency', () => {
    it('uses formatDuration for estimate display', () => {
      mockCalculateEstimateComparison.mockReturnValue({
        difference: 0,
        percentage: 0,
        status: 'on-track'
      });

      render(<TimeEstimateDisplay task={mockTask} totalTime={60} />);

      expect(mockFormatDuration).toHaveBeenCalledWith(60); // estimate
    });

    it('uses formatDuration for actual time display', () => {
      mockCalculateEstimateComparison.mockReturnValue({
        difference: 0,
        percentage: 0,
        status: 'on-track'
      });

      render(<TimeEstimateDisplay task={mockTask} totalTime={90} />);

      expect(mockFormatDuration).toHaveBeenCalledWith(90); // actual
    });
  });

  describe('edge cases', () => {
    it('handles zero actual time', () => {
      mockCalculateEstimateComparison.mockReturnValue({
        difference: -60,
        percentage: -100,
        status: 'under'
      });

      render(<TimeEstimateDisplay task={mockTask} totalTime={0} />);

      expect(screen.getByText(/Actual:/)).toBeInTheDocument();
      expect(mockFormatDuration).toHaveBeenCalledWith(0);
    });

    it('handles very large actual time', () => {
      mockCalculateEstimateComparison.mockReturnValue({
        difference: 1000,
        percentage: 1666.67,
        status: 'over'
      });

      render(<TimeEstimateDisplay task={mockTask} totalTime={1060} />);

      expect(screen.getByText(/Actual:/)).toBeInTheDocument();
      expect(mockFormatDuration).toHaveBeenCalledWith(1060);
    });
  });
});
