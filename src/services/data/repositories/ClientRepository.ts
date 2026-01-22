import { Client } from '@/types/client';
import { db } from '../database';

/**
 * ClientRepository - Repository for Client CRUD operations
 * 
 * Provides data access methods for clients using IndexedDB via Dexie.js.
 * All methods use async/await pattern and handle errors appropriately.
 */
export class ClientRepository {
  /**
   * Create a new client
   * @param client - Client data without id, createdAt, and updatedAt (auto-generated)
   * @returns Promise resolving to the created Client
   */
  async create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    try {
      const now = new Date();
      const newClient: Client = {
        ...client,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      };
      await db.clients.add(newClient);
      return newClient;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('Storage limit exceeded. Please export some data to free up space.');
      }
      throw new Error(`Failed to create client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a client by ID
   * @param id - Client ID
   * @returns Promise resolving to Client or undefined if not found
   */
  async getById(id: string): Promise<Client | undefined> {
    try {
      return await db.clients.get(id);
    } catch (error) {
      console.error('Error getting client by ID:', error);
      throw new Error(`Failed to get client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all clients
   * @returns Promise resolving to array of all Clients
   */
  async getAll(): Promise<Client[]> {
    try {
      return await db.clients.toArray();
    } catch (error) {
      console.error('Error getting all clients:', error);
      throw new Error(`Failed to get all clients: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a client
   * @param id - Client ID to update
   * @param updates - Partial client data to update
   * @returns Promise resolving to the updated Client
   */
  async update(id: string, updates: Partial<Client>): Promise<Client> {
    try {
      const existingClient = await db.clients.get(id);
      if (!existingClient) {
        throw new Error(`Client with id ${id} not found`);
      }

      const updatedClient: Client = {
        ...existingClient,
        ...updates,
        id, // Ensure ID cannot be changed
        updatedAt: new Date() // Always update timestamp
      };

      await db.clients.update(id, updatedClient);
      return updatedClient;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      console.error('Error updating client:', error);
      throw new Error(`Failed to update client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a client
   * @param id - Client ID to delete
   * @returns Promise resolving when deletion is complete
   */
  async delete(id: string): Promise<void> {
    try {
      await db.clients.delete(id);
    } catch (error) {
      console.error('Error deleting client:', error);
      throw new Error(`Failed to delete client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
