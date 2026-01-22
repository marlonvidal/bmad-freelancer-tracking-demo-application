import { ProjectRepository } from '@/services/data/repositories/ProjectRepository';
import { ClientRepository } from '@/services/data/repositories/ClientRepository';
import { db } from '@/services/data/database';

describe('ProjectRepository', () => {
  let repository: ProjectRepository;
  let clientRepository: ClientRepository;
  let testClientId: string;

  beforeEach(async () => {
    repository = new ProjectRepository();
    clientRepository = new ClientRepository();
    await db.projects.clear();
    await db.clients.clear();
    await db.tasks.clear();

    // Create a test client for projects
    const client = await clientRepository.create({
      name: 'Test Client',
      defaultHourlyRate: null,
      contactInfo: null
    });
    testClientId = client.id;
  });

  afterAll(async () => {
    await db.close();
  });

  describe('create', () => {
    it('creates a project successfully', async () => {
      const projectData = {
        clientId: testClientId,
        name: 'Test Project',
        description: 'Test Description',
        defaultHourlyRate: null
      };

      const project = await repository.create(projectData);

      expect(project.id).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.clientId).toBe(testClientId);
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('throws error when clientId does not exist', async () => {
      const projectData = {
        clientId: 'non-existent-client-id',
        name: 'Test Project',
        defaultHourlyRate: null
      };

      await expect(repository.create(projectData)).rejects.toThrow('not found');
    });

    it('generates unique IDs for each project', async () => {
      const projectData = {
        clientId: testClientId,
        name: 'Project',
        defaultHourlyRate: null
      };

      const project1 = await repository.create(projectData);
      const project2 = await repository.create(projectData);

      expect(project1.id).not.toBe(project2.id);
    });
  });

  describe('getById', () => {
    it('returns project when found', async () => {
      const projectData = {
        clientId: testClientId,
        name: 'Test Project',
        defaultHourlyRate: null
      };

      const created = await repository.create(projectData);
      const retrieved = await repository.getById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe('Test Project');
    });

    it('returns undefined when project not found', async () => {
      const result = await repository.getById('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('returns all projects', async () => {
      await repository.create({ clientId: testClientId, name: 'Project 1', defaultHourlyRate: null });
      await repository.create({ clientId: testClientId, name: 'Project 2', defaultHourlyRate: null });
      await repository.create({ clientId: testClientId, name: 'Project 3', defaultHourlyRate: null });

      const allProjects = await repository.getAll();

      expect(allProjects.length).toBe(3);
      expect(allProjects.map(p => p.name)).toContain('Project 1');
      expect(allProjects.map(p => p.name)).toContain('Project 2');
      expect(allProjects.map(p => p.name)).toContain('Project 3');
    });

    it('returns empty array when no projects exist', async () => {
      const allProjects = await repository.getAll();
      expect(allProjects).toEqual([]);
    });
  });

  describe('getByClientId', () => {
    it('returns projects for specified client', async () => {
      const client2 = await clientRepository.create({
        name: 'Client 2',
        defaultHourlyRate: null,
        contactInfo: null
      });

      await repository.create({ clientId: testClientId, name: 'Project 1', defaultHourlyRate: null });
      await repository.create({ clientId: testClientId, name: 'Project 2', defaultHourlyRate: null });
      await repository.create({ clientId: client2.id, name: 'Project 3', defaultHourlyRate: null });

      const client1Projects = await repository.getByClientId(testClientId);

      expect(client1Projects.length).toBe(2);
      expect(client1Projects.every(p => p.clientId === testClientId)).toBe(true);
    });
  });

  describe('update', () => {
    it('updates project successfully', async () => {
      const projectData = {
        clientId: testClientId,
        name: 'Original Name',
        defaultHourlyRate: null
      };

      const created = await repository.create(projectData);
      const originalUpdatedAt = created.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await repository.update(created.id, { 
        name: 'Updated Name',
        defaultHourlyRate: 75
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.defaultHourlyRate).toBe(75);
      expect(updated.id).toBe(created.id);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('throws error when updating non-existent project', async () => {
      await expect(
        repository.update('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow('not found');
    });

    it('validates clientId when updating', async () => {
      const projectData = {
        clientId: testClientId,
        name: 'Project',
        defaultHourlyRate: null
      };

      const created = await repository.create(projectData);

      await expect(
        repository.update(created.id, { clientId: 'non-existent-client-id' })
      ).rejects.toThrow('not found');
    });

    it('preserves project ID on update', async () => {
      const projectData = {
        clientId: testClientId,
        name: 'Project',
        defaultHourlyRate: null
      };

      const created = await repository.create(projectData);
      const updated = await repository.update(created.id, { name: 'Updated Project' });

      expect(updated.id).toBe(created.id);
    });
  });

  describe('delete', () => {
    it('deletes project successfully', async () => {
      const projectData = {
        clientId: testClientId,
        name: 'Project to Delete',
        defaultHourlyRate: null
      };

      const created = await repository.create(projectData);
      await repository.delete(created.id);

      const retrieved = await repository.getById(created.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('handles database errors gracefully', async () => {
      await db.close();

      const projectData = {
        clientId: testClientId,
        name: 'Project',
        defaultHourlyRate: null
      };

      await expect(repository.create(projectData)).rejects.toThrow();
    });
  });
});
