import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimerControl } from '@/components/timer/TimerControl';
import { TimerProvider, useTimerContext } from '@/contexts/TimerContext';
import { db } from '@/services/data/database';

// Mock the timer context for testing
const mockStartTimer = jest.fn();
const mockStopTimer = jest.fn();

jest.mock('@/contexts/TimerContext', () => {
  const actual = jest.requireActual('@/contexts/TimerContext');
  return {
    ...actual,
    useTimerContext: jest.fn(),
  };
});

const mockUseTimerContext = useTimerContext as jest.MockedFunction<typeof useTimerContext>;

describe('TimerControl', () => {
  beforeEach(async () => {
    await db.timerState.clear();
    await db.timeEntries.clear();
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('displays Start button when timer is not active', () => {
      mockUseTimerContext.mockReturnValue({
        activeTaskId: null,
        startTime: null,
        elapsedTime: 0,
        status: 'idle',
        loading: false,
        error: null,
        startTimer: mockStartTimer,
        stopTimer: mockStopTimer,
        getElapsedTime: () => 0,
        isActive: () => false,
      });

      render(<TimerControl taskId="task1" />);

      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByLabelText('Start timer')).toBeInTheDocument();
    });

    it('displays Stop button when timer is active', () => {
      mockUseTimerContext.mockReturnValue({
        activeTaskId: 'task1',
        startTime: new Date(),
        elapsedTime: 0,
        status: 'active',
        loading: false,
        error: null,
        startTimer: mockStartTimer,
        stopTimer: mockStopTimer,
        getElapsedTime: () => 0,
        isActive: (taskId: string) => taskId === 'task1',
      });

      render(<TimerControl taskId="task1" />);

      expect(screen.getByText('Stop')).toBeInTheDocument();
      expect(screen.getByLabelText('Stop timer')).toBeInTheDocument();
    });

    it('shows active state styling when timer is active', () => {
      mockUseTimerContext.mockReturnValue({
        activeTaskId: 'task1',
        startTime: new Date(),
        elapsedTime: 0,
        status: 'active',
        loading: false,
        error: null,
        startTimer: mockStartTimer,
        stopTimer: mockStopTimer,
        getElapsedTime: () => 0,
        isActive: (taskId: string) => taskId === 'task1',
      });

      render(<TimerControl taskId="task1" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-500');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('shows inactive state styling when timer is not active', () => {
      mockUseTimerContext.mockReturnValue({
        activeTaskId: null,
        startTime: null,
        elapsedTime: 0,
        status: 'idle',
        loading: false,
        error: null,
        startTimer: mockStartTimer,
        stopTimer: mockStopTimer,
        getElapsedTime: () => 0,
        isActive: () => false,
      });

      render(<TimerControl taskId="task1" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-green-500');
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('interactions', () => {
    it('calls startTimer when Start button is clicked', async () => {
      mockStartTimer.mockResolvedValue(undefined);
      mockUseTimerContext.mockReturnValue({
        activeTaskId: null,
        startTime: null,
        elapsedTime: 0,
        status: 'idle',
        loading: false,
        error: null,
        startTimer: mockStartTimer,
        stopTimer: mockStopTimer,
        getElapsedTime: () => 0,
        isActive: () => false,
      });

      render(<TimerControl taskId="task1" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockStartTimer).toHaveBeenCalledWith('task1');
      });
    });

    it('calls stopTimer when Stop button is clicked', async () => {
      mockStopTimer.mockResolvedValue(null);
      mockUseTimerContext.mockReturnValue({
        activeTaskId: 'task1',
        startTime: new Date(),
        elapsedTime: 0,
        status: 'active',
        loading: false,
        error: null,
        startTimer: mockStartTimer,
        stopTimer: mockStopTimer,
        getElapsedTime: () => 0,
        isActive: (taskId: string) => taskId === 'task1',
      });

      render(<TimerControl taskId="task1" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockStopTimer).toHaveBeenCalled();
      });
    });

    it('prevents card click propagation when timer button is clicked', () => {
      const cardClickHandler = jest.fn();
      mockUseTimerContext.mockReturnValue({
        activeTaskId: null,
        startTime: null,
        elapsedTime: 0,
        status: 'idle',
        loading: false,
        error: null,
        startTimer: mockStartTimer,
        stopTimer: mockStopTimer,
        getElapsedTime: () => 0,
        isActive: () => false,
      });

      render(
        <div onClick={cardClickHandler}>
          <TimerControl taskId="task1" />
        </div>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(cardClickHandler).not.toHaveBeenCalled();
    });
  });

  describe('keyboard accessibility', () => {
    it('supports Enter key to start/stop timer', async () => {
      mockStartTimer.mockResolvedValue(undefined);
      mockUseTimerContext.mockReturnValue({
        activeTaskId: null,
        startTime: null,
        elapsedTime: 0,
        status: 'idle',
        loading: false,
        error: null,
        startTimer: mockStartTimer,
        stopTimer: mockStopTimer,
        getElapsedTime: () => 0,
        isActive: () => false,
      });

      render(<TimerControl taskId="task1" />);

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(mockStartTimer).toHaveBeenCalledWith('task1');
      });
    });

    it('supports Space key to start/stop timer', async () => {
      mockStartTimer.mockResolvedValue(undefined);
      mockUseTimerContext.mockReturnValue({
        activeTaskId: null,
        startTime: null,
        elapsedTime: 0,
        status: 'idle',
        loading: false,
        error: null,
        startTimer: mockStartTimer,
        stopTimer: mockStopTimer,
        getElapsedTime: () => 0,
        isActive: () => false,
      });

      render(<TimerControl taskId="task1" />);

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });

      await waitFor(() => {
        expect(mockStartTimer).toHaveBeenCalledWith('task1');
      });
    });

    it('prevents default behavior on Enter/Space key', () => {
      mockUseTimerContext.mockReturnValue({
        activeTaskId: null,
        startTime: null,
        elapsedTime: 0,
        status: 'idle',
        loading: false,
        error: null,
        startTimer: mockStartTimer,
        stopTimer: mockStopTimer,
        getElapsedTime: () => 0,
        isActive: () => false,
      });

      render(<TimerControl taskId="task1" />);

      const button = screen.getByRole('button');
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(enterEvent, 'preventDefault');
      
      fireEvent(button, enterEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('ARIA attributes', () => {
    it('has correct ARIA label for Start button', () => {
      mockUseTimerContext.mockReturnValue({
        activeTaskId: null,
        startTime: null,
        elapsedTime: 0,
        status: 'idle',
        loading: false,
        error: null,
        startTimer: mockStartTimer,
        stopTimer: mockStopTimer,
        getElapsedTime: () => 0,
        isActive: () => false,
      });

      render(<TimerControl taskId="task1" />);

      expect(screen.getByLabelText('Start timer')).toBeInTheDocument();
    });

    it('has correct ARIA label for Stop button', () => {
      mockUseTimerContext.mockReturnValue({
        activeTaskId: 'task1',
        startTime: new Date(),
        elapsedTime: 0,
        status: 'active',
        loading: false,
        error: null,
        startTimer: mockStartTimer,
        stopTimer: mockStopTimer,
        getElapsedTime: () => 0,
        isActive: (taskId: string) => taskId === 'task1',
      });

      render(<TimerControl taskId="task1" />);

      expect(screen.getByLabelText('Stop timer')).toBeInTheDocument();
    });

    it('has aria-pressed attribute', () => {
      mockUseTimerContext.mockReturnValue({
        activeTaskId: 'task1',
        startTime: new Date(),
        elapsedTime: 0,
        status: 'active',
        loading: false,
        error: null,
        startTimer: mockStartTimer,
        stopTimer: mockStopTimer,
        getElapsedTime: () => 0,
        isActive: (taskId: string) => taskId === 'task1',
      });

      render(<TimerControl taskId="task1" />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('disabled state', () => {
    it('disables button when timer status is paused', () => {
      mockUseTimerContext.mockReturnValue({
        activeTaskId: null,
        startTime: null,
        elapsedTime: 0,
        status: 'paused',
        loading: false,
        error: null,
        startTimer: mockStartTimer,
        stopTimer: mockStopTimer,
        getElapsedTime: () => 0,
        isActive: () => false,
      });

      render(<TimerControl taskId="task1" />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });
});
