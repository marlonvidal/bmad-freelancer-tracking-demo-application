/**
 * Integration tests for background timer workflow
 * 
 * Tests the complete flow of timer operation when tab becomes inactive/active,
 * including Service Worker communication, state synchronization, and recovery.
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { TimerProvider, useTimerContext } from '@/contexts/TimerContext';
import { db } from '@/services/data/database';
import { TimerState } from '@/types/timerState';

// Mock Service Worker
let mockServiceWorkerReady: Promise<ServiceWorkerRegistration>;
let mockPostMessage: jest.Mock;
let mockMessageListeners: Array<(event: MessageEvent) => void> = [];

const mockServiceWorker = {
  ready: Promise.resolve({
    active: {
      postMessage: jest.fn(),
    },
  } as unknown as ServiceWorkerRegistration),
  addEventListener: jest.fn((event: string, handler: (event: MessageEvent) => void) => {
    if (event === 'message') {
      mockMessageListeners.push(handler);
    }
  }),
  removeEventListener: jest.fn(),
};

beforeEach(() => {
  mockPostMessage = jest.fn();
  mockMessageListeners = [];
  
  Object.defineProperty(navigator, 'serviceWorker', {
    writable: true,
    configurable: true,
    value: {
      ready: Promise.resolve({
        active: {
          postMessage: mockPostMessage,
        },
      } as unknown as ServiceWorkerRegistration),
      addEventListener: mockServiceWorker.addEventListener,
      removeEventListener: mockServiceWorker.removeEventListener,
    },
  });

  // Mock BroadcastChannel
  global.BroadcastChannel = jest.fn().mockImplementation(() => ({
    postMessage: jest.fn(),
    close: jest.fn(),
    onmessage: null,
  })) as any;
});

// Test component that uses timer
const TestTimerComponent: React.FC = () => {
  const { activeTaskId, elapsedTime, status, startTimer, stopTimer } = useTimerContext();

  return (
    <div>
      <div data-testid="active-task-id">{activeTaskId || 'none'}</div>
      <div data-testid="elapsed-time">{elapsedTime}</div>
      <div data-testid="status">{status}</div>
      <button
        data-testid="start-button"
        onClick={() => startTimer('test-task-1')}
      >
        Start
      </button>
      <button
        data-testid="stop-button"
        onClick={() => stopTimer()}
      >
        Stop
      </button>
    </div>
  );
};

describe('Background Timer Workflow', () => {
  beforeEach(async () => {
    await db.timerState.clear();
    await db.timeEntries.clear();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('Timer state persistence', () => {
    it('saves timer state to IndexedDB when timer starts', async () => {
      render(
        <TimerProvider>
          <TestTimerComponent />
        </TimerProvider>
      );

      const startButton = screen.getByTestId('start-button');
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('active');
      });

      // Verify timer state was saved
      const timerState = await db.timerState.get('test-task-1');
      expect(timerState).toBeDefined();
      expect(timerState?.status).toBe('active');
    });

    it('deletes timer state from IndexedDB when timer stops', async () => {
      render(
        <TimerProvider>
          <TestTimerComponent />
        </TimerProvider>
      );

      // Start timer first
      const startButton = screen.getByTestId('start-button');
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('active');
      });

      // Wait a bit to ensure timer is fully started
      await new Promise(resolve => setTimeout(resolve, 100));

      // Stop timer
      const stopButton = screen.getByTestId('stop-button');
      await act(async () => {
        stopButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('idle');
      });

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify timer state was deleted
      const deletedState = await db.timerState.get('test-task-1');
      expect(deletedState).toBeUndefined();
    });
  });

  describe('Timer recovery on app load', () => {
    it('recovers active timer state when app loads', async () => {
      const startTime = new Date(Date.now() - 60000); // 1 minute ago

      // Create active timer state
      const timerState: TimerState = {
        taskId: 'test-task-1',
        startTime,
        lastUpdateTime: startTime,
        status: 'active',
      };
      await db.timerState.put(timerState);

      render(
        <TimerProvider>
          <TestTimerComponent />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('active');
      });

      expect(screen.getByTestId('active-task-id')).toHaveTextContent('test-task-1');
      
      // Elapsed time should be approximately 60 seconds
      const elapsedTime = parseInt(screen.getByTestId('elapsed-time').textContent || '0');
      expect(elapsedTime).toBeGreaterThanOrEqual(55); // Allow some margin
      expect(elapsedTime).toBeLessThan(70);
    });

    it('clears stale timer state (>24 hours)', async () => {
      const startTime = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago

      const timerState: TimerState = {
        taskId: 'test-task-1',
        startTime,
        lastUpdateTime: startTime,
        status: 'active',
      };
      await db.timerState.put(timerState);

      render(
        <TimerProvider>
          <TestTimerComponent />
        </TimerProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('idle');
      });

      // Verify stale state was cleared
      const clearedState = await db.timerState.get('test-task-1');
      expect(clearedState).toBeUndefined();
    });
  });

  describe('Tab visibility synchronization', () => {
    it('stops main thread timer updates when tab becomes inactive', async () => {
      const { container } = render(
        <TimerProvider>
          <TestTimerComponent />
        </TimerProvider>
      );

      const startButton = screen.getByTestId('start-button');
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('active');
      });

      // Get initial elapsed time
      const initialElapsed = parseInt(screen.getByTestId('elapsed-time').textContent || '0');

      // Simulate tab becoming inactive
      Object.defineProperty(document, 'hidden', {
        writable: true,
        configurable: true,
        value: true,
      });

      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Elapsed time should not have increased significantly (main thread timer stopped)
      const newElapsed = parseInt(screen.getByTestId('elapsed-time').textContent || '0');
      // Should be same or very close (within 1 second margin)
      expect(newElapsed - initialElapsed).toBeLessThan(2);
    });

    it('syncs with Service Worker when tab becomes active', async () => {
      const startTime = new Date(Date.now() - 120000); // 2 minutes ago

      // Create timer state
      const timerState: TimerState = {
        taskId: 'test-task-1',
        startTime,
        lastUpdateTime: startTime,
        status: 'active',
      };
      await db.timerState.put(timerState);

      render(
        <TimerProvider>
          <TestTimerComponent />
        </TimerProvider>
      );

      // Simulate tab being inactive, then becoming active
      await act(async () => {
        Object.defineProperty(document, 'hidden', {
          writable: true,
          configurable: true,
          value: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Simulate Service Worker response
      await act(async () => {
        mockMessageListeners.forEach(listener => {
          listener({
            data: {
              type: 'TIMER_STATE_RESPONSE',
              state: timerState,
            },
          } as MessageEvent);
        });
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Tab becomes active
      await act(async () => {
        Object.defineProperty(document, 'hidden', {
          writable: true,
          configurable: true,
          value: false,
        });
        document.dispatchEvent(new Event('visibilitychange'));
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('active');
      });

      // Elapsed time should reflect the 2 minutes
      const elapsedTime = parseInt(screen.getByTestId('elapsed-time').textContent || '0');
      expect(elapsedTime).toBeGreaterThanOrEqual(115); // ~2 minutes
      expect(elapsedTime).toBeLessThan(125);
    });
  });

  describe('Periodic state saves', () => {
    it('saves timer state periodically', async () => {
      jest.useFakeTimers();

      render(
        <TimerProvider>
          <TestTimerComponent />
        </TimerProvider>
      );

      const startButton = screen.getByTestId('start-button');
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('active');
      });

      const initialState = await db.timerState.get('test-task-1');
      const initialUpdateTime = initialState?.lastUpdateTime;

      // Fast-forward 31 seconds (past the 30-second save interval)
      act(() => {
        jest.advanceTimersByTime(31000);
      });

      await waitFor(async () => {
        const updatedState = await db.timerState.get('test-task-1');
        const updatedTime = updatedState?.lastUpdateTime instanceof Date 
          ? updatedState.lastUpdateTime 
          : new Date(updatedState?.lastUpdateTime as string);
        const initialTime = initialUpdateTime instanceof Date
          ? initialUpdateTime
          : new Date(initialUpdateTime as string);
        
        expect(updatedTime.getTime()).toBeGreaterThan(initialTime.getTime());
      });

      jest.useRealTimers();
    });
  });

  describe('Cross-tab synchronization', () => {
    it('notifies other tabs when timer starts', async () => {
      const mockChannel = {
        postMessage: jest.fn(),
        close: jest.fn(),
        onmessage: null,
      };

      (global.BroadcastChannel as jest.Mock).mockImplementation(() => mockChannel);

      render(
        <TimerProvider>
          <TestTimerComponent />
        </TimerProvider>
      );

      const startButton = screen.getByTestId('start-button');
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        expect(mockChannel.postMessage).toHaveBeenCalledWith({
          type: 'TIMER_STARTED',
          taskId: 'test-task-1',
        });
      });
    });

    it('notifies other tabs when timer stops', async () => {
      const mockChannel = {
        postMessage: jest.fn(),
        close: jest.fn(),
        onmessage: null,
      };

      (global.BroadcastChannel as jest.Mock).mockImplementation(() => mockChannel);

      render(
        <TimerProvider>
          <TestTimerComponent />
        </TimerProvider>
      );

      // Start timer first
      const startButton = screen.getByTestId('start-button');
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('active');
      });

      // Clear previous messages
      mockChannel.postMessage.mockClear();

      // Stop timer
      const stopButton = screen.getByTestId('stop-button');
      await act(async () => {
        stopButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('idle');
      });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify message was sent
      expect(mockChannel.postMessage).toHaveBeenCalledWith({
        type: 'TIMER_STOPPED',
        taskId: 'test-task-1',
      });
    });
  });

  describe('Graceful shutdown', () => {
    it('saves timer state on beforeunload', async () => {
      render(
        <TimerProvider>
          <TestTimerComponent />
        </TimerProvider>
      );

      const startButton = screen.getByTestId('start-button');
      await act(async () => {
        startButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('active');
      });

      // Simulate beforeunload
      await act(async () => {
        const beforeUnloadEvent = new Event('beforeunload') as BeforeUnloadEvent;
        window.dispatchEvent(beforeUnloadEvent);
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Verify state was saved
      const savedState = await db.timerState.get('test-task-1');
      expect(savedState).toBeDefined();
      expect(savedState?.status).toBe('active');
    });
  });
});
