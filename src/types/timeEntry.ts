/**
 * TimeEntry interface representing a time tracking entry
 */
export interface TimeEntry {
  id: string; // Unique identifier (UUID)
  taskId: string; // Reference to the task this time entry belongs to
  startTime: Date; // Start timestamp of the time entry
  endTime: Date | null; // End timestamp (null if timer is still running)
  duration: number; // Duration in minutes (calculated or manually entered)
  isManual: boolean; // Whether this entry was manually added (vs. tracked by timer)
  description?: string; // Optional notes/description for this time entry
  createdAt: Date; // Timestamp when entry was created
  updatedAt: Date; // Timestamp when entry was last updated
}
