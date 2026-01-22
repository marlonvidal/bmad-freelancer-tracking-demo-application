/**
 * Client interface representing a client/customer
 */
export interface Client {
  id: string;
  name: string;
  defaultHourlyRate: number | null;
  contactInfo: string | null;
  createdAt: Date;
  updatedAt: Date;
}
