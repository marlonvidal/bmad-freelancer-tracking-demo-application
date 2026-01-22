/**
 * Task interface representing a task in the kanban board
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  position: number;
  clientId: string | null;
  projectId: string | null;
  isBillable: boolean;
  hourlyRate: number | null;
  timeEstimate: number | null; // in minutes
  dueDate: Date | null;
  priority: 'low' | 'medium' | 'high' | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
