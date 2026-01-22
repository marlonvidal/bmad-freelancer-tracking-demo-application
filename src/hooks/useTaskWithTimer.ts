import { useTaskContext } from '@/contexts/TaskContext';
import { useTimerContext } from '@/contexts/TimerContext';

/**
 * Custom hook that combines TaskContext and TimerContext for a specific task
 * 
 * Provides convenient access to both task data and timer state for a given task ID.
 * Useful for components that need to display task information along with timer status.
 * 
 * @param taskId - The ID of the task to get combined data for
 * @returns Object containing task data, timer active status, and elapsed time
 * 
 * @example
 * ```tsx
 * const { task, isActive, elapsedTime } = useTaskWithTimer('task-123');
 * 
 * if (isActive) {
 *   console.log(`Timer running for ${task?.title}: ${elapsedTime}s`);
 * }
 * ```
 */
export const useTaskWithTimer = (taskId: string) => {
  const taskContext = useTaskContext();
  const timerContext = useTimerContext();
  
  const task = taskContext.getTaskById(taskId);
  const isActive = timerContext.isActive(taskId);
  const elapsedTime = timerContext.getElapsedTime(taskId);
  
  return {
    task,
    isActive,
    elapsedTime,
    // Expose timer methods for convenience
    startTimer: timerContext.startTimer,
    stopTimer: timerContext.stopTimer,
    // Expose task methods for convenience
    updateTask: taskContext.updateTask,
    deleteTask: taskContext.deleteTask,
  };
};
