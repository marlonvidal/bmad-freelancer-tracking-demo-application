/**
 * Column interface representing a column in the kanban board
 */
export interface Column {
  id: string;
  name: string;
  position: number;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}
