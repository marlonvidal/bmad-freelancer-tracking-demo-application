/**
 * Project interface representing a project under a client
 */
export interface Project {
  id: string;
  clientId: string;
  name: string;
  description?: string;
  defaultHourlyRate: number | null;
  createdAt: Date;
  updatedAt: Date;
}
