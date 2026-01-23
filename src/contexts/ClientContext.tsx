import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Client } from '@/types/client';
import { ClientRepository } from '@/services/data/repositories/ClientRepository';
import { TaskRepository } from '@/services/data/repositories/TaskRepository';

interface ClientState {
  clients: Client[];
  loading: boolean;
  error: Error | null;
}

interface ClientContextValue extends ClientState {
  getAllClients: () => Client[];
  createClient: (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
}

const ClientContext = createContext<ClientContextValue | undefined>(undefined);

interface ClientProviderProps {
  children: ReactNode;
}

/**
 * ClientProvider - Provides client state and operations to child components
 * 
 * Manages client state using React Context API. Loads clients from IndexedDB on mount
 * and persists changes automatically. Uses optimistic updates for better UX.
 * Clients are sorted alphabetically by name.
 */
export const ClientProvider: React.FC<ClientProviderProps> = ({ children }) => {
  const [state, setState] = useState<ClientState>({
    clients: [],
    loading: true,
    error: null
  });

  const repository = useMemo(() => new ClientRepository(), []);
  const taskRepository = useMemo(() => new TaskRepository(), []);

  /**
   * Sort clients alphabetically by name (case-insensitive)
   */
  const sortClients = useCallback((clients: Client[]): Client[] => {
    return [...clients].sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }, []);

  /**
   * Load clients from IndexedDB
   */
  const loadClients = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const clients = await repository.getAll();
      const sortedClients = sortClients(clients);
      setState({ clients: sortedClients, loading: false, error: null });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to load clients');
      setState(prev => ({ ...prev, loading: false, error: errorObj }));
      console.error('Error loading clients:', error);
    }
  }, [repository, sortClients]);

  /**
   * Initialize clients on mount
   */
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  /**
   * Get all clients (sorted alphabetically)
   */
  const getAllClients = useCallback((): Client[] => {
    return sortClients(state.clients);
  }, [state.clients, sortClients]);

  /**
   * Create a new client
   * Uses optimistic update: adds client to state immediately, then persists to IndexedDB
   */
  const createClient = useCallback(async (
    clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Client> => {
    try {
      // Create client in IndexedDB
      const newClient = await repository.create(clientData);

      // Update state with new client (optimistic update)
      setState(prev => {
        const updatedClients = sortClients([...prev.clients, newClient]);
        return {
          ...prev,
          clients: updatedClients,
          error: null
        };
      });

      return newClient;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Failed to create client');
      setState(prev => ({ ...prev, error: errorObj }));
      console.error('Error creating client:', error);
      throw errorObj;
    }
  }, [repository, sortClients]);

  /**
   * Update an existing client
   * Uses optimistic update: updates client in state immediately, then persists to IndexedDB
   */
  const updateClient = useCallback(async (id: string, updates: Partial<Client>): Promise<Client> => {
    try {
      // Optimistic update: update client in state immediately
      setState(prev => {
        const updatedClients = prev.clients.map(client => 
          client.id === id ? { ...client, ...updates } : client
        );
        return {
          ...prev,
          clients: sortClients(updatedClients),
          error: null
        };
      });

      // Persist to IndexedDB
      const updatedClient = await repository.update(id, updates);

      // Update state with persisted client (to ensure consistency)
      setState(prev => {
        const updatedClients = prev.clients.map(client => 
          client.id === id ? updatedClient : client
        );
        return {
          ...prev,
          clients: sortClients(updatedClients)
        };
      });

      return updatedClient;
    } catch (error) {
      // Revert optimistic update on error
      await loadClients();
      const errorObj = error instanceof Error ? error : new Error('Failed to update client');
      setState(prev => ({ ...prev, error: errorObj }));
      console.error('Error updating client:', error);
      throw errorObj;
    }
  }, [repository, loadClients, sortClients]);

  /**
   * Delete a client
   * Checks if any tasks are assigned to the client before deletion.
   * Throws an error if tasks are found with a descriptive message.
   * Uses optimistic update: removes client from state immediately, then deletes from IndexedDB
   */
  const deleteClient = useCallback(async (id: string): Promise<void> => {
    try {
      // Check if any tasks are assigned to this client
      const tasks = await taskRepository.getByClientId(id);
      if (tasks.length > 0) {
        throw new Error(`Cannot delete client. ${tasks.length} task(s) are assigned to this client.`);
      }

      // Optimistic update: remove client from state immediately
      setState(prev => ({
        ...prev,
        clients: prev.clients.filter(client => client.id !== id),
        error: null
      }));

      // Delete from IndexedDB
      await repository.delete(id);
    } catch (error) {
      // Revert optimistic update on error
      await loadClients();
      const errorObj = error instanceof Error ? error : new Error('Failed to delete client');
      setState(prev => ({ ...prev, error: errorObj }));
      console.error('Error deleting client:', error);
      throw error;
    }
  }, [repository, taskRepository, loadClients]);

  const value: ClientContextValue = {
    ...state,
    getAllClients,
    createClient,
    updateClient,
    deleteClient
  };

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
};

/**
 * Hook to use ClientContext
 * @throws Error if used outside ClientProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useClientContext = (): ClientContextValue => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClientContext must be used within a ClientProvider');
  }
  return context;
};
