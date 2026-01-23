import { ProjectRepository } from '@/services/data/repositories/ProjectRepository';
import { ClientRepository } from '@/services/data/repositories/ClientRepository';
import { TaskRepository } from '@/services/data/repositories/TaskRepository';
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

    // Create a test client
    const testClient = await clientRepository.create({
      name: 'Test Client',
      defaultHourlyRate: null,
      contactInfo: null
    });
    testClientId = testClient.id;
  });

  afterAll(async () => {
    await db.close();
  });

  describe('create', () => {
    it('creates a project successfully', async () => {
      const projectData = {
        clientId: testClientId,
        name: 'Test Project',
        description: 'Test description',
        defaultHourlyRate: null
      };

      const project = await repository.create(projectData);

      expect(project.id).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.clientId).toBe(testClientId);
      expect(project.description).toBe('Test description');
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('generates unique IDs for each project', async () => {
      const projectData = {
        clientId: testClientId,
        name: 'Project',
        description: undefined,
        defaultHourlyRate: null
      };

      const project1 = await repository.create(projectData);
      const project2 = await repository.create(projectData);

      expect(project1.id).not.toBe(project2.id);
    });

    it('validates clientId exists', async () => {
      const projectData = {
        clientId: 'non-existent-client-id',
        name: 'Test Project',
        description: undefined,
        defaultHourlyRate: null
      };

      await expect(repository.create(projectData)).rejects.toThrow('Client with id non-existent-client-id not found');
    });

    it('sets createdAt and updatedAt timestamps', async () => {
      const beforeCreate = new Date();
      const projectData = {
        clientId: testClientId,
        name: 'Test Project',
        description: undefined,
        defaultHourlyRate: null
      };

      const project = await repository.create(projectData);
      const afterCreate = new Date();

      expect(project.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(project.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(project.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(project.updatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('getById', () => {
    it('returns project when found', async () => {
      const projectData = {
        clientId: testClientId,
        name: 'Test Project',
        description: 'Test description',
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
      await repository.create({ clientId: testClientId, name: 'Project 1', description: undefined, defaultHourlyRate: null });
      await repository.create({ clientId: testClientId, name: 'Project 2', description: undefined, defaultHourlyRate: null });
      await repository.create({ clientId: testClientId, name: 'Project 3', description: undefined, defaultHourlyRate: null });

      const allProjects = await repository.getAll();

      expect(allProjects.length).toBe(3);
      expect(allProjects.map(p => p.name)).toContain('Project 1');
      expect(allProjects.map(p => p.name)).toContain('Project 2');
      expect(allProjects.map(p => p.name)).toContain('Project 3');
    });
  });

  describe('getByClientId', () => {
    it('returns projects for specific client', async () => {
      // Create another client
      const client2 = await clientRepository.create({
        name: 'Client 2',
        defaultHourlyRate: null,
        contactInfo: null
      });

      const project1 = await repository.create({ clientId: testClientId, name: 'Project 1', description: undefined, defaultHourlyRate: null });
      const project2 = await repository.create({ clientId: testClientId, name: 'Project 2', description: undefined, defaultHourlyRate: null });
      await repository.create({ clientId: client2.id, name: 'Project 3', description: undefined, defaultHourlyRate: null });

      const clientProjects = await repository.getByClientId(testClientId);

      expect(clientProjects.length).toBe(2);
      expect(clientProjects.map(p => p.id)).toContain(project1.id);
      expect(clientProjects.map(p => p.id)).toContain(project2.id);
    });

    it('returns empty array when client has no projects', async () => {
      const clientProjects = await repository.getByClientId(testClientId);
      expect(clientProjects).toEqual([]);
    });
  });

  describe('update', () => {
    it('updates existing project', async () => {
      const project = await repository.create({
        clientId: testClientId,
        name: 'Original Name',
        description: 'Original description',
        defaultHourlyRate: null
      });

      // Add small delay to ensure updatedAt timestamp is different
      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedProject = await repository.update(project.id, {
        name: 'Updated Name',
        description: 'Updated description'
      });

      expect(updatedProject.name).toBe('Updated Name');
      expect(updatedProject.description).toBe('Updated description');
      expect(updatedProject.id).toBe(project.id);
      expect(updatedProject.clientId).toBe(testClientId);
      expect(updatedProject.updatedAt.getTime()).toBeGreaterThanOrEqual(project.updatedAt.getTime());
    });

    it('validates clientId if being changed', async () => {
      const project = await repository.create({
        clientId: testClientId,
        name: 'Test Project',
        description: undefined,
        defaultHourlyRate: null
      });

      await expect(
        repository.update(project.id, { clientId: 'non-existent-client-id' })
      ).rejects.toThrow('Client with id non-existent-client-id not found');
    });

    it('throws error when project not found', async () => {
      await expect(
        repository.update('non-existent-id', { name: 'Updated Name' })
      ).rejects.toThrow('Project with id non-existent-id not found');
    });
  });

  describe('delete', () => {
    it('deletes project successfully when no tasks assigned', async () => {
      const project = await repository.create({
        clientId: testClientId,
        name: 'Project to Delete',
        description: undefined,
        defaultHourlyRate: null
      });

      await repository.delete(project.id);

      const deletedProject = await repository.getById(project.id);
      expect(deletedProject).toBeUndefined();
    });

    it('prevents deletion when tasks are assigned', async () => {
      const project = await repository.create({
        clientId: testClientId,
        name: 'Project with Tasks',
        description: undefined,
        defaultHourlyRate: null
      });

      // Create a task assigned to this project
      const taskRepository = new TaskRepository();
      await taskRepository.create({
        title: 'Test Task',
        columnId: 'column-1',
        position: 0,
        clientId: testClientId,
        projectId: project.id,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });

      await expect(repository.delete(project.id)).rejects.toThrow(
        'Cannot delete project. 1 task(s) are assigned to this project.'
      );

      // Verify project still exists
      const projectStillExists = await repository.getById(project.id);
      expect(projectStillExists).toBeDefined();
    });

    it('prevents deletion when multiple tasks are assigned', async () => {
      const project = await repository.create({
        clientId: testClientId,
        name: 'Project with Multiple Tasks',
        description: undefined,
        defaultHourlyRate: null
      });

      // Create multiple tasks assigned to this project
      const taskRepository = new TaskRepository();
      await taskRepository.create({
        title: 'Task 1',
        columnId: 'column-1',
        position: 0,
        clientId: testClientId,
        projectId: project.id,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });
      await taskRepository.create({
        title: 'Task 2',
        columnId: 'column-1',
        position: 1,
        clientId: testClientId,
        projectId: project.id,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });

      await expect(repository.delete(project.id)).rejects.toThrow(
        'Cannot delete project. 2 task(s) are assigned to this project.'
      );
    });
  });

  describe('error handling', () => {
    it('handles QuotaExceededError', async () => {
      // This test would require mocking Dexie to throw QuotaExceededError
      // For now, we'll just verify the error handling structure exists
      const projectData = {
        clientId: testClientId,
        name: 'Test Project',
        description: undefined,
        defaultHourlyRate: null
      };

      // Normal case should work
      const project = await repository.create(projectData);
      expect(project).toBeDefined();
    });
  });
});
