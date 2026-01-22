 
 
import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim, skipWaiting } from 'workbox-core';
import { CacheFirst } from 'workbox-strategies';
import { registerRoute } from 'workbox-routing';
import Dexie from 'dexie';

// Workbox setup
skipWaiting();
clientsClaim();

// Precache assets
precacheAndRoute(self.__WB_MANIFEST || []);

// Runtime caching for static assets
registerRoute(
  ({ request }) => request.destination === 'script' || 
                   request.destination === 'style' || 
                   request.destination === 'image',
  new CacheFirst({
    cacheName: 'static-assets-cache',
  })
);

// Database setup in Service Worker
class TimeTrackingDB extends Dexie {
  timerState!: Dexie.Table<TimerState, string>;
  timeEntries!: Dexie.Table<any, string>;

  constructor() {
    super('TimeTrackingDB');
    
    this.version(3).stores({
      timerState: 'taskId',
      timeEntries: 'id, taskId, startTime, endTime, [taskId+startTime]',
    });
  }
}

interface TimerState {
  taskId: string;
  startTime: Date;
  lastUpdateTime: Date;
  status: 'active' | 'paused' | 'stopped';
}

const db = new TimeTrackingDB();

// Timer state management
let timerInterval: ReturnType<typeof setInterval> | null = null;
const TIMER_UPDATE_INTERVAL = 30000; // 30 seconds

/**
 * Update timer state in IndexedDB
 */
async function updateTimerState(): Promise<void> {
  try {
    const states = await db.timerState.toArray();
    const activeState = states.find(state => state.status === 'active');
    
    if (activeState) {
      const now = new Date();
      await db.timerState.put({
        ...activeState,
        lastUpdateTime: now,
      });
    }
  } catch (error) {
    console.error('[SW] Error updating timer state:', error);
  }
}

/**
 * Start timer interval
 */
function startTimerInterval(): void {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  timerInterval = setInterval(() => {
    updateTimerState();
  }, TIMER_UPDATE_INTERVAL);
}

/**
 * Stop timer interval
 */
function stopTimerInterval(): void {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

/**
 * Handle timer start message
 */
async function handleTimerStart(data: { taskId: string; startTime: string }): Promise<void> {
  try {
    const { taskId, startTime } = data;
    const timerState: TimerState = {
      taskId,
      startTime: new Date(startTime),
      lastUpdateTime: new Date(startTime),
      status: 'active',
    };
    
    await db.timerState.put(timerState);
    startTimerInterval();
    
    // Notify all clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'TIMER_STARTED',
        taskId,
      });
    });
  } catch (error) {
    console.error('[SW] Error handling timer start:', error);
  }
}

/**
 * Handle timer stop message
 */
async function handleTimerStop(data: { taskId: string }): Promise<void> {
  try {
    const { taskId } = data;
    await db.timerState.delete(taskId);
    stopTimerInterval();
    
    // Notify all clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'TIMER_STOPPED',
        taskId,
      });
    });
  } catch (error) {
    console.error('[SW] Error handling timer stop:', error);
  }
}

/**
 * Handle timer state request
 */
async function handleTimerStateRequest(): Promise<void> {
  try {
    const states = await db.timerState.toArray();
    const activeState = states.find(state => state.status === 'active');
    
    // Send response to all clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'TIMER_STATE_RESPONSE',
        state: activeState || null,
      });
    });
  } catch (error) {
    console.error('[SW] Error handling timer state request:', error);
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'TIMER_STATE_RESPONSE',
        state: null,
      });
    });
  }
}

/**
 * Message handler
 */
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { type, ...data } = event.data as { type: string; taskId?: string; startTime?: string };
  
  switch (type) {
    case 'TIMER_START':
      if (data.taskId && data.startTime) {
        handleTimerStart({ taskId: data.taskId, startTime: data.startTime });
      }
      break;
    case 'TIMER_STOP':
      if (data.taskId) {
        handleTimerStop({ taskId: data.taskId });
      }
      break;
    case 'TIMER_STATE_REQUEST':
      handleTimerStateRequest();
      break;
    default:
      console.warn('[SW] Unknown message type:', type);
  }
});

// Initialize timer interval if there's an active timer on Service Worker activation
self.addEventListener('activate', async () => {
  try {
    const states = await db.timerState.toArray();
    const activeState = states.find(state => state.status === 'active');
    if (activeState) {
      startTimerInterval();
    }
  } catch (error) {
    console.error('[SW] Error checking active timer on activate:', error);
  }
});
