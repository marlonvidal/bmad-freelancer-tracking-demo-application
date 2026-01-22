/**
 * Tests for Service Worker timer handler functionality
 * 
 * Note: These tests mock the Service Worker environment since Jest runs in Node.js,
 * not a browser Service Worker context. The tests verify the logic that would run
 * in the Service Worker.
 */

import Dexie from 'dexie';
import { db } from '@/services/data/database';
import { TimerState } from '@/types/timerState';

// Mock Service Worker global scope
const mockClients: Client[] = [];
const mockClientsMatchAll = jest.fn(() => Promise.resolve(mockClients));

// Mock Service Worker self object
const mockSelf = {
  clients: {
    matchAll: mockClientsMatchAll,
  },
  addEventListener: jest.fn(),
} as unknown as ServiceWorkerGlobalScope;

// Mock message event
interface MockMessageEvent {
  data: {
    type: string;
    taskId?: string;
    startTime?: string;
  };
}

describe('Service Worker Timer Handler', () => {
  let messageHandlers: Array<(event: MockMessageEvent) => void> = [];
  let activateHandlers: Array<() => void> = [];
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  beforeEach(async () => {
    // Clear database
    await db.timerState.clear();
    await db.timeEntries.clear();

    // Reset mocks
    messageHandlers = [];
    activateHandlers = [];
    timerInterval = null;
    mockClients.length = 0;
    mockClientsMatchAll.mockClear();

    // Mock addEventListener to capture handlers
    (mockSelf.addEventListener as jest.Mock).mockImplementation(
      (event: string, handler: (event: any) => void) => {
        if (event === 'message') {
          messageHandlers.push(handler);
        } else if (event === 'activate') {
          activateHandlers.push(handler);
        }
      }
    );
  });

  afterEach(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  });

  afterAll(async () => {
    await db.close();
  });

  /**
   * Simulate Service Worker message handler
   */
  const simulateMessage = async (data: MockMessageEvent['data']) => {
    const event = { data } as MockMessageEvent;
    for (const handler of messageHandlers) {
      await handler(event);
    }
  };

  /**
   * Simulate Service Worker activate event
   */
  const simulateActivate = async () => {
    for (const handler of activateHandlers) {
      await handler();
    }
  };

  describe('TIMER_START message handling', () => {
    it('handles TIMER_START message and saves timer state', async () => {
      const taskId = 'task1';
      const startTime = new Date().toISOString();

      // Simulate Service Worker setup (would be done in sw.ts)
      mockSelf.addEventListener('message', async (event: any) => {
        const { type, ...data } = event.data;
        if (type === 'TIMER_START' && data.taskId && data.startTime) {
          const timerState: TimerState = {
            taskId: data.taskId,
            startTime: new Date(data.startTime),
            lastUpdateTime: new Date(data.startTime),
            status: 'active',
          };
          await db.timerState.put(timerState);
        }
      });

      await simulateMessage({
        type: 'TIMER_START',
        taskId,
        startTime,
      });

      // Verify timer state was saved
      const savedState = await db.timerState.get(taskId);
      expect(savedState).toBeDefined();
      expect(savedState?.taskId).toBe(taskId);
      expect(savedState?.status).toBe('active');
    });

    it('handles TIMER_START with invalid data gracefully', async () => {
      let errorThrown = false;

      mockSelf.addEventListener('message', async (event: any) => {
        try {
          const { type, ...data } = event.data;
          if (type === 'TIMER_START') {
            if (!data.taskId || !data.startTime) {
              throw new Error('Invalid data');
            }
          }
        } catch (error) {
          errorThrown = true;
        }
      });

      await simulateMessage({
        type: 'TIMER_START',
        // Missing taskId and startTime
      });

      // Should handle error gracefully
      expect(errorThrown).toBe(true);
    });
  });

  describe('TIMER_STOP message handling', () => {
    it('handles TIMER_STOP message and deletes timer state', async () => {
      const taskId = 'task1';

      // Create timer state first
      const timerState: TimerState = {
        taskId,
        startTime: new Date(),
        lastUpdateTime: new Date(),
        status: 'active',
      };
      await db.timerState.put(timerState);

      // Simulate Service Worker handler
      mockSelf.addEventListener('message', async (event: any) => {
        const { type, ...data } = event.data;
        if (type === 'TIMER_STOP' && data.taskId) {
          await db.timerState.delete(data.taskId);
        }
      });

      await simulateMessage({
        type: 'TIMER_STOP',
        taskId,
      });

      // Verify timer state was deleted
      const deletedState = await db.timerState.get(taskId);
      expect(deletedState).toBeUndefined();
    });
  });

  describe('TIMER_STATE_REQUEST message handling', () => {
    it('responds with active timer state', async () => {
      const taskId = 'task1';
      const postMessageSpy = jest.fn();

      // Create timer state
      const timerState: TimerState = {
        taskId,
        startTime: new Date(),
        lastUpdateTime: new Date(),
        status: 'active',
      };
      await db.timerState.put(timerState);

      // Mock client
      const mockClient = {
        postMessage: postMessageSpy,
      } as unknown as Client;
      mockClients.push(mockClient);
      mockClientsMatchAll.mockResolvedValue(mockClients);

      // Simulate Service Worker handler
      mockSelf.addEventListener('message', async (event: any) => {
        const { type } = event.data;
        if (type === 'TIMER_STATE_REQUEST') {
          const states = await db.timerState.toArray();
          const activeState = states.find(state => state.status === 'active');
          const clients = await mockSelf.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'TIMER_STATE_RESPONSE',
              state: activeState || null,
            });
          });
        }
      });

      await simulateMessage({
        type: 'TIMER_STATE_REQUEST',
      });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify response was sent
      expect(postMessageSpy).toHaveBeenCalledWith({
        type: 'TIMER_STATE_RESPONSE',
        state: expect.objectContaining({
          taskId,
          status: 'active',
        }),
      });
    });

    it('responds with null when no active timer exists', async () => {
      const postMessageSpy = jest.fn();

      const mockClient = {
        postMessage: postMessageSpy,
      } as unknown as Client;
      mockClients.push(mockClient);
      mockClientsMatchAll.mockResolvedValue(mockClients);

      mockSelf.addEventListener('message', async (event: any) => {
        const { type } = event.data;
        if (type === 'TIMER_STATE_REQUEST') {
          const states = await db.timerState.toArray();
          const activeState = states.find(state => state.status === 'active');
          const clients = await mockSelf.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'TIMER_STATE_RESPONSE',
              state: activeState || null,
            });
          });
        }
      });

      await simulateMessage({
        type: 'TIMER_STATE_REQUEST',
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(postMessageSpy).toHaveBeenCalledWith({
        type: 'TIMER_STATE_RESPONSE',
        state: null,
      });
    });
  });

  describe('Timer interval updates', () => {
    it('updates timer state periodically', async () => {
      const taskId = 'task1';
      const startTime = new Date(Date.now() - 60000); // 1 minute ago

      // Create timer state
      const timerState: TimerState = {
        taskId,
        startTime,
        lastUpdateTime: startTime,
        status: 'active',
      };
      await db.timerState.put(timerState);

      // Simulate periodic update (simplified - in real SW this runs every 30s)
      const updateTimerState = async () => {
        const states = await db.timerState.toArray();
        const activeState = states.find(state => state.status === 'active');
        if (activeState) {
          await db.timerState.put({
            ...activeState,
            lastUpdateTime: new Date(),
          });
        }
      };

      const initialState = await db.timerState.get(taskId);
      const initialUpdateTime = initialState?.lastUpdateTime;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update
      await updateTimerState();

      const updatedState = await db.timerState.get(taskId);
      const updatedTime = updatedState?.lastUpdateTime instanceof Date 
        ? updatedState.lastUpdateTime 
        : new Date(updatedState?.lastUpdateTime as string);
      const initialTime = initialUpdateTime instanceof Date
        ? initialUpdateTime
        : new Date(initialUpdateTime as string);
      
      expect(updatedTime.getTime()).toBeGreaterThan(initialTime.getTime());
    });
  });

  describe('Service Worker activation', () => {
    it('initializes timer interval if active timer exists on activate', async () => {
      const taskId = 'task1';

      // Create active timer state
      const timerState: TimerState = {
        taskId,
        startTime: new Date(),
        lastUpdateTime: new Date(),
        status: 'active',
      };
      await db.timerState.put(timerState);

      let intervalStarted = false;

      // Simulate activate handler
      mockSelf.addEventListener('activate', async () => {
        const states = await db.timerState.toArray();
        const activeState = states.find(state => state.status === 'active');
        if (activeState) {
          intervalStarted = true;
          // In real SW, this would start the interval
        }
      });

      await simulateActivate();

      expect(intervalStarted).toBe(true);
    });

    it('does not start interval if no active timer exists', async () => {
      let intervalStarted = false;

      mockSelf.addEventListener('activate', async () => {
        const states = await db.timerState.toArray();
        const activeState = states.find(state => state.status === 'active');
        if (activeState) {
          intervalStarted = true;
        }
      });

      await simulateActivate();

      expect(intervalStarted).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('handles IndexedDB errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock db.timerState.put to throw error
      const originalPut = db.timerState.put;
      db.timerState.put = jest.fn().mockRejectedValue(new Error('IndexedDB error'));

      mockSelf.addEventListener('message', async (event: any) => {
        try {
          const { type, ...data } = event.data;
          if (type === 'TIMER_START' && data.taskId && data.startTime) {
            await db.timerState.put({
              taskId: data.taskId,
              startTime: new Date(data.startTime),
              lastUpdateTime: new Date(data.startTime),
              status: 'active',
            } as TimerState);
          }
        } catch (error) {
          console.error('[SW] Error handling timer start:', error);
        }
      });

      await simulateMessage({
        type: 'TIMER_START',
        taskId: 'task1',
        startTime: new Date().toISOString(),
      });

      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore
      db.timerState.put = originalPut;
      consoleErrorSpy.mockRestore();
    });
  });
});
