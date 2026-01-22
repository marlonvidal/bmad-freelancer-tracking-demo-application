import { ClientRepository } from '@/services/data/repositories/ClientRepository';
import { db } from '@/services/data/database';

describe('ClientRepository', () => {
  let repository: ClientRepository;

  beforeEach(async () => {
    repository = new ClientRepository();
    await db.clients.clear();
    await db.tasks.clear();
    await db.projects.clear();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('create', () => {
    it('creates a client successfully', async () => {
      const clientData = {
        name: 'Test Client',
        defaultHourlyRate: null,
        contactInfo: null
      };

      const client = await repository.create(clientData);

      expect(client.id).toBeDefined();
      expect(client.name).toBe('Test Client');
      expect(client.createdAt).toBeInstanceOf(Date);
      expect(client.updatedAt).toBeInstanceOf(Date);
    });

    it('generates unique IDs for each client', async () => {
      const clientData = {
        name: 'Client',
        defaultHourlyRate: null,
        contactInfo: null
      };

      const client1 = await repository.create(clientData);
      const client2 = await repository.create(clientData);

      expect(client1.id).not.toBe(client2.id);
    });
  });

  describe('getById', () => {
    it('returns client when found', async () => {
      const clientData = {
        name: 'Test Client',
        defaultHourlyRate: null,
        contactInfo: null
      };

      const created = await repository.create(clientData);
      const retrieved = await repository.getById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe('Test Client');
    });

    it('returns undefined when client not found', async () => {
      const result = await repository.getById('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('returns all clients', async () => {
      await repository.create({ name: 'Client 1', defaultHourlyRate: null, contactInfo: null });
      await repository.create({ name: 'Client 2', defaultHourlyRate: null, contactInfo: null });
      await repository.create({ name: 'Client 3', defaultHourlyRate: null, contactInfo: null });

      const allClients = await repository.getAll();

      expect(allClients.length).toBe(3);
      expect(allClients.map(c => c.name)).toContain('Client 1');
      expect(allClients.map(c => c.name)).toContain('Client 2');
      expect(allClients.map(c => c.name)).toContain('Client 3');
    });

    it('returns empty array when no clients exist', async () => {
      const allClients = await repository.getAll();
      expect(allClients).toEqual([]);
    });
  });

  describe('update', () => {
    it('updates client successfully', async () => {
      const clientData = {
        name: 'Original Name',
        defaultHourlyRate: null,
        contactInfo: null
      };

      const created = await repository.create(clientData);
      const originalUpdatedAt = created.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await repository.update(created.id, { 
        name: 'Updated Name',
        defaultHourlyRate: 50
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.defaultHourlyRate).toBe(50);
      expect(updated.id).toBe(created.id);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('throws error when updating non-existent client', async () => {
      await expect(
        repository.update('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow('not found');
    });

    it('preserves client ID on update', async () => {
      const clientData = {
        name: 'Client',
        defaultHourlyRate: null,
        contactInfo: null
      };

      const created = await repository.create(clientData);
      const updated = await repository.update(created.id, { name: 'Updated Client' });

      expect(updated.id).toBe(created.id);
    });
  });

  describe('delete', () => {
    it('deletes client successfully', async () => {
      const clientData = {
        name: 'Client to Delete',
        defaultHourlyRate: null,
        contactInfo: null
      };

      const created = await repository.create(clientData);
      await repository.delete(created.id);

      const retrieved = await repository.getById(created.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('handles database errors gracefully', async () => {
      await db.close();

      const clientData = {
        name: 'Client',
        defaultHourlyRate: null,
        contactInfo: null
      };

      await expect(repository.create(clientData)).rejects.toThrow();
    });
  });
});
