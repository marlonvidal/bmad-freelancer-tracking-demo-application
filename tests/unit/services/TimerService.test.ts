import { TimerService } from '@/services/TimerService';
import { db } from '@/services/data/database';
import { TimerState } from '@/types/timerState';

describe('TimerService', () => {
  let timerService: TimerService;

  beforeEach(async () => {
    timerService = new TimerService();
    await db.timerState.clear();
    await db.timeEntries.clear();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('startTimer', () => {
    it('starts timer successfully', async () => {
      const timerState = await timerService.startTimer('task1');

      expect(timerState.taskId).toBe('task1');
      expect(timerState.status).toBe('active');
      expect(timerState.startTime).toBeInstanceOf(Date);

      // Verify timer state was saved to IndexedDB
      const savedState = await db.timerState.get('task1');
      expect(savedState).toBeDefined();
      expect(savedState?.status).toBe('active');
    });

    it('enforces single active timer rule', async () => {
      // Start timer for task1
      await timerService.startTimer('task1');

      // Start timer for task2 (should stop task1)
      await timerService.startTimer('task2');

      // Verify task1 timer state was deleted
      const task1State = await db.timerState.get('task1');
      expect(task1State).toBeUndefined();

      // Verify task2 timer state exists
      const task2State = await db.timerState.get('task2');
      expect(task2State).toBeDefined();
      expect(task2State?.status).toBe('active');
    });

    it('creates time entry when stopping previous timer', async () => {
      // Start timer for task1
      await timerService.startTimer('task1');

      // Wait a bit to ensure duration > 0
      await new Promise(resolve => setTimeout(resolve, 100));

      // Start timer for task2 (should stop task1 and create time entry)
      await timerService.startTimer('task2');

      // Verify time entry was created for task1
      const timeEntries = await db.timeEntries.where('taskId').equals('task1').toArray();
      expect(timeEntries.length).toBe(1);
      expect(timeEntries[0].duration).toBeGreaterThanOrEqual(0);
      expect(timeEntries[0].isManual).toBe(false);
    });
  });

  describe('stopTimer', () => {
    it('stops timer and creates time entry', async () => {
      // Start timer
      await timerService.startTimer('task1');

      // Wait to ensure duration > 0
      await new Promise(resolve => setTimeout(resolve, 100));

      // Stop timer
      const timeEntry = await timerService.stopTimer();

      expect(timeEntry).not.toBeNull();
      expect(timeEntry?.taskId).toBe('task1');
      expect(timeEntry?.duration).toBeGreaterThanOrEqual(0);
      expect(timeEntry?.isManual).toBe(false);
      expect(timeEntry?.endTime).toBeInstanceOf(Date);

      // Verify timer state was deleted
      const deletedState = await db.timerState.get('task1');
      expect(deletedState).toBeUndefined();
    });

    it('returns null when no active timer exists', async () => {
      const result = await timerService.stopTimer();
      expect(result).toBeNull();
    });

    it('calculates duration correctly', async () => {
      const startTime = new Date(Date.now() - 120000); // 2 minutes ago
      
      // Manually create timer state with past start time
      const timerState: TimerState = {
        taskId: 'task1',
        startTime,
        lastUpdateTime: new Date(),
        status: 'active'
      };
      await db.timerState.add(timerState);

      const timeEntry = await timerService.stopTimer();

      expect(timeEntry).not.toBeNull();
      expect(timeEntry?.duration).toBeGreaterThanOrEqual(1); // At least 1 minute
    });
  });

  describe('getElapsedTime', () => {
    it('returns elapsed time for active timer', async () => {
      const startTime = new Date(Date.now() - 5000); // 5 seconds ago
      
      // Manually create timer state
      const timerState: TimerState = {
        taskId: 'task1',
        startTime,
        lastUpdateTime: new Date(),
        status: 'active'
      };
      await db.timerState.add(timerState);

      const elapsedTime = await timerService.getElapsedTime();

      expect(elapsedTime).toBeGreaterThanOrEqual(4); // At least 4 seconds
      expect(elapsedTime).toBeLessThan(10); // Less than 10 seconds (accounting for test execution time)
    });

    it('returns 0 when no active timer exists', async () => {
      const elapsedTime = await timerService.getElapsedTime();
      expect(elapsedTime).toBe(0);
    });

    it('returns 0 when taskId does not match active timer', async () => {
      await timerService.startTimer('task1');
      const elapsedTime = await timerService.getElapsedTime('task2');
      expect(elapsedTime).toBe(0);
    });

    it('returns elapsed time when taskId matches active timer', async () => {
      const startTime = new Date(Date.now() - 3000); // 3 seconds ago
      
      const timerState: TimerState = {
        taskId: 'task1',
        startTime,
        lastUpdateTime: new Date(),
        status: 'active'
      };
      await db.timerState.add(timerState);

      const elapsedTime = await timerService.getElapsedTime('task1');
      expect(elapsedTime).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getActiveTimer', () => {
    it('returns active timer state', async () => {
      await timerService.startTimer('task1');
      const activeTimer = await timerService.getActiveTimer();

      expect(activeTimer).not.toBeNull();
      expect(activeTimer?.taskId).toBe('task1');
      expect(activeTimer?.status).toBe('active');
    });

    it('returns null when no active timer exists', async () => {
      const activeTimer = await timerService.getActiveTimer();
      expect(activeTimer).toBeNull();
    });

    it('returns null when timer status is not active', async () => {
      const timerState: TimerState = {
        taskId: 'task1',
        startTime: new Date(),
        lastUpdateTime: new Date(),
        status: 'stopped'
      };
      await db.timerState.add(timerState);

      const activeTimer = await timerService.getActiveTimer();
      expect(activeTimer).toBeNull();
    });
  });

  describe('Service Worker Integration', () => {
    let mockServiceWorker: {
      ready: Promise<ServiceWorkerRegistration>;
      controller: ServiceWorker | null;
    };
    let mockRegistration: ServiceWorkerRegistration;
    let mockActiveWorker: ServiceWorker;
    let postMessageSpy: jest.Mock;

    beforeEach(() => {
      // Mock Service Worker API
      postMessageSpy = jest.fn();
      mockActiveWorker = {
        postMessage: postMessageSpy,
      } as unknown as ServiceWorker;

      mockRegistration = {
        active: mockActiveWorker,
      } as unknown as ServiceWorkerRegistration;

      mockServiceWorker = {
        ready: Promise.resolve(mockRegistration),
        controller: mockActiveWorker,
      };

      // Mock navigator.serviceWorker
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: mockServiceWorker,
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('sends TIMER_START message to Service Worker when available', async () => {
      await timerService.startTimer('task1');

      // Wait for async Service Worker message
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TIMER_START',
          taskId: 'task1',
          startTime: expect.any(String),
        })
      );
    });

    it('sends TIMER_STOP message to Service Worker when stopping timer', async () => {
      await timerService.startTimer('task1');
      await new Promise(resolve => setTimeout(resolve, 50));
      postMessageSpy.mockClear();

      await timerService.stopTimer();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TIMER_STOP',
          taskId: 'task1',
        })
      );
    });

    it('works gracefully when Service Worker is not available', async () => {
      // Remove Service Worker support
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      // Should not throw and should still save to IndexedDB
      const timerState = await timerService.startTimer('task1');

      expect(timerState).toBeDefined();
      expect(timerState.taskId).toBe('task1');

      // Verify timer state was saved to IndexedDB
      const savedState = await db.timerState.get('task1');
      expect(savedState).toBeDefined();
    });

    it('works gracefully when Service Worker registration fails', async () => {
      // Mock Service Worker that rejects
      const rejectingPromise = Promise.reject(new Error('Registration failed'));
      Object.defineProperty(navigator.serviceWorker, 'ready', {
        writable: true,
        configurable: true,
        value: rejectingPromise,
      });

      // Catch the rejection to prevent unhandled promise rejection warning
      rejectingPromise.catch(() => {
        // Expected rejection
      });

      // Should not throw and should still save to IndexedDB
      const timerState = await timerService.startTimer('task1');

      expect(timerState).toBeDefined();
      expect(timerState.taskId).toBe('task1');
    });

    it('requests timer state from Service Worker', async () => {
      // Set up message listener mock
      const messageHandler = jest.fn();
      (navigator.serviceWorker as any).addEventListener = jest.fn((event, handler) => {
        if (event === 'message') {
          messageHandler.mockImplementation(handler);
        }
      });
      (navigator.serviceWorker as any).removeEventListener = jest.fn();

      // Mock response message
      const mockState = {
        taskId: 'task1',
        startTime: new Date().toISOString(),
        lastUpdateTime: new Date().toISOString(),
        status: 'active',
      };

      // Start the request
      const requestPromise = timerService.requestTimerStateFromServiceWorker();

      // Simulate Service Worker response
      setTimeout(() => {
        messageHandler({
          data: {
            type: 'TIMER_STATE_RESPONSE',
            state: mockState,
          },
        });
      }, 10);

      const result = await requestPromise;

      expect(result).not.toBeNull();
      expect(result?.taskId).toBe('task1');
    });

    it('falls back to IndexedDB when Service Worker request times out', async () => {
      // Create timer state in IndexedDB
      await timerService.startTimer('task1');

      // Mock Service Worker that doesn't respond
      (navigator.serviceWorker as any).addEventListener = jest.fn();
      (navigator.serviceWorker as any).removeEventListener = jest.fn();

      // Request should timeout and fallback to IndexedDB
      const result = await timerService.requestTimerStateFromServiceWorker();

      // Should get state from IndexedDB
      expect(result).not.toBeNull();
      expect(result?.taskId).toBe('task1');
    });

    it('handles Service Worker message errors gracefully', async () => {
      // Mock postMessage that throws
      postMessageSpy.mockImplementation(() => {
        throw new Error('Message failed');
      });

      // Should not throw
      await expect(timerService.startTimer('task1')).resolves.toBeDefined();

      // Timer state should still be saved
      const savedState = await db.timerState.get('task1');
      expect(savedState).toBeDefined();
    });
  });

});
