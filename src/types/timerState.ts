/**
 * TimerState interface representing the state of an active timer
 */
export interface TimerState {
  taskId: string; // Primary key - ID of the task with active timer
  startTime: Date; // Timestamp when timer started
  lastUpdateTime: Date; // Last time timer state was updated (for background sync)
  status: 'active' | 'paused' | 'stopped'; // Current timer status
}
