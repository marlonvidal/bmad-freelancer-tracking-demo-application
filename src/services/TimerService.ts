import { TimerState } from '@/types/timerState';
import { TimeEntry } from '@/types/timeEntry';
import { TimerStateRepository } from '@/services/data/repositories/TimerStateRepository';
import { TimeEntryRepository } from '@/services/data/repositories/TimeEntryRepository';

/**
 * TimerService - Business logic for timer operations
 * 
 * Handles timer start/stop operations, enforces single active timer rule,
 * and manages time entry creation. Integrates with repositories for persistence.
 */
export class TimerService {
  private timerStateRepository: TimerStateRepository;
  private timeEntryRepository: TimeEntryRepository;

  constructor() {
    this.timerStateRepository = new TimerStateRepository();
    this.timeEntryRepository = new TimeEntryRepository();
  }

  /**
   * Start timer for a task
   * Enforces single active timer rule: stops previous timer before starting new one
   * @param taskId - ID of the task to start timer for
   * @returns Promise resolving to the created TimerState
   */
  async startTimer(taskId: string): Promise<TimerState> {
    try {
      // Check if there's an active timer and stop it first (enforce single active timer rule)
      const activeTimer = await this.timerStateRepository.getActive();
      if (activeTimer && activeTimer.status === 'active') {
        await this.stopTimer();
      }

      const now = new Date();
      const timerState: TimerState = {
        taskId,
        startTime: now,
        lastUpdateTime: now,
        status: 'active'
      };

      // Save timer state to IndexedDB
      await this.timerStateRepository.save(timerState);

      return timerState;
    } catch (error) {
      console.error('Error starting timer:', error);
      throw new Error(`Failed to start timer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop the active timer and create a time entry
   * @returns Promise resolving to the created TimeEntry, or null if no active timer
   */
  async stopTimer(): Promise<TimeEntry | null> {
    try {
      const activeTimer = await this.timerStateRepository.getActive();
      
      if (!activeTimer || activeTimer.status !== 'active') {
        return null;
      }

      const endTime = new Date();
      const startTime = new Date(activeTimer.startTime);
      const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      // Create time entry
      const timeEntry = await this.timeEntryRepository.create({
        taskId: activeTimer.taskId,
        startTime,
        endTime,
        duration: durationMinutes,
        isManual: false
      });

      // Delete timer state from IndexedDB
      await this.timerStateRepository.delete(activeTimer.taskId);

      return timeEntry;
    } catch (error) {
      console.error('Error stopping timer:', error);
      throw new Error(`Failed to stop timer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get elapsed time for active timer (in seconds)
   * @param taskId - Optional task ID to check elapsed time for
   * @returns Promise resolving to elapsed time in seconds, or 0 if no active timer
   */
  async getElapsedTime(taskId?: string): Promise<number> {
    try {
      const activeTimer = await this.timerStateRepository.getActive();
      
      if (!activeTimer || activeTimer.status !== 'active') {
        return 0;
      }

      // If taskId is provided, only return elapsed time if it matches
      if (taskId && activeTimer.taskId !== taskId) {
        return 0;
      }

      const startTime = new Date(activeTimer.startTime);
      const now = new Date();
      return Math.floor((now.getTime() - startTime.getTime()) / 1000);
    } catch (error) {
      console.error('Error getting elapsed time:', error);
      return 0;
    }
  }

  /**
   * Get active timer state
   * @returns Promise resolving to TimerState or null if no active timer
   */
  async getActiveTimer(): Promise<TimerState | null> {
    try {
      const activeTimer = await this.timerStateRepository.getActive();
      return activeTimer && activeTimer.status === 'active' ? activeTimer : null;
    } catch (error) {
      console.error('Error getting active timer:', error);
      return null;
    }
  }
}
