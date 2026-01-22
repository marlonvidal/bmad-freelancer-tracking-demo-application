import { TaskRepository } from '@/services/data/repositories/TaskRepository';
import { ClientRepository } from '@/services/data/repositories/ClientRepository';
import { ProjectRepository } from '@/services/data/repositories/ProjectRepository';
import { DatabaseService } from '@/services/data/DatabaseService';
import { db } from '@/services/data/database';

/**
 * Integration tests for data persistence
 * 
 * These tests verify that data persists across database operations
 * and that the database maintains state correctly.
 */
describe('Data Persistence Integration Tests', () => {
  let taskRepository: TaskRepository;
  let clientRepository: ClientRepository;
  let projectRepository: ProjectRepository;

  beforeEach(async () => {
    DatabaseService.reset();
    await db.close();
    await DatabaseService.initialize();
    
    taskRepository = new TaskRepository();
    clientRepository = new ClientRepository();
    projectRepository = new ProjectRepository();
    
    await db.tasks.clear();
    await db.clients.clear();
    await db.projects.clear();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('Data Persistence', () => {
    it('persists data across multiple operations', async () => {
      // Create a client
      const client = await clientRepository.create({
        name: 'Test Client',
        defaultHourlyRate: null,
        contactInfo: null
      });

      // Create a project
      const project = await projectRepository.create({
        clientId: client.id,
        name: 'Test Project',
        defaultHourlyRate: null
      });

      // Create tasks
      const task1 = await taskRepository.create({
        title: 'Task 1',
        columnId: 'column-1',
        position: 0,
        clientId: client.id,
        projectId: project.id,
        isBillable: true,
        hourlyRate: 50,
        timeEstimate: null,
        dueDate: null,
        priority: 'high',
        tags: ['urgent']
      });

      const task2 = await taskRepository.create({
        title: 'Task 2',
        columnId: 'column-2',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: 120,
        dueDate: null,
        priority: null,
        tags: []
      });

      // Verify data exists
      const retrievedClient = await clientRepository.getById(client.id);
      expect(retrievedClient).toBeDefined();
      expect(retrievedClient?.name).toBe('Test Client');

      const retrievedProject = await projectRepository.getById(project.id);
      expect(retrievedProject).toBeDefined();
      expect(retrievedProject?.name).toBe('Test Project');
      expect(retrievedProject?.clientId).toBe(client.id);

      const retrievedTask1 = await taskRepository.getById(task1.id);
      expect(retrievedTask1).toBeDefined();
      expect(retrievedTask1?.title).toBe('Task 1');
      expect(retrievedTask1?.clientId).toBe(client.id);
      expect(retrievedTask1?.projectId).toBe(project.id);

      const retrievedTask2 = await taskRepository.getById(task2.id);
      expect(retrievedTask2).toBeDefined();
      expect(retrievedTask2?.title).toBe('Task 2');
    });

    it('persists data after updates', async () => {
      const task = await taskRepository.create({
        title: 'Original Title',
        columnId: 'column-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });

      // Update the task
      await taskRepository.update(task.id, { title: 'Updated Title' });

      // Verify update persisted
      const updated = await taskRepository.getById(task.id);
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.id).toBe(task.id);
    });

    it('maintains referential integrity', async () => {
      const client = await clientRepository.create({
        name: 'Client',
        defaultHourlyRate: null,
        contactInfo: null
      });

      const project = await projectRepository.create({
        clientId: client.id,
        name: 'Project',
        defaultHourlyRate: null
      });

      // Verify project is linked to client
      const projects = await projectRepository.getByClientId(client.id);
      expect(projects.length).toBe(1);
      expect(projects[0].id).toBe(project.id);

      // Verify tasks can be linked to project
      const task = await taskRepository.create({
        title: 'Task',
        columnId: 'column-1',
        position: 0,
        clientId: client.id,
        projectId: project.id,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null,
        tags: []
      });

      const tasksByProject = await taskRepository.getByProjectId(project.id);
      expect(tasksByProject.length).toBe(1);
      expect(tasksByProject[0].id).toBe(task.id);
    });
  });
});
