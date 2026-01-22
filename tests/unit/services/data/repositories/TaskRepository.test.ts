import { TaskRepository } from '@/services/data/repositories/TaskRepository';
import { db } from '@/services/data/database';

describe('TaskRepository', () => {
  let repository: TaskRepository;

  beforeEach(async () => {
    repository = new TaskRepository();
    // Clear all tables before each test
    await db.tasks.clear();
    await db.clients.clear();
    await db.projects.clear();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('create', () => {
    it('creates a task successfully', async () => {
      const taskData = {
        title: 'Test Task',
        columnId: 'column-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null as const,
        tags: []
      };

      const task = await repository.create(taskData);

      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.columnId).toBe('column-1');
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.updatedAt).toBeInstanceOf(Date);
      expect(task.createdAt.getTime()).toBe(task.updatedAt.getTime());
    });

    it('generates unique IDs for each task', async () => {
      const taskData = {
        title: 'Task',
        columnId: 'column-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null as const,
        tags: []
      };

      const task1 = await repository.create(taskData);
      const task2 = await repository.create(taskData);

      expect(task1.id).not.toBe(task2.id);
    });
  });

  describe('getById', () => {
    it('returns task when found', async () => {
      const taskData = {
        title: 'Test Task',
        columnId: 'column-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null as const,
        tags: []
      };

      const created = await repository.create(taskData);
      const retrieved = await repository.getById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.title).toBe('Test Task');
    });

    it('returns undefined when task not found', async () => {
      const result = await repository.getById('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('returns all tasks', async () => {
      const taskData = {
        title: 'Task',
        columnId: 'column-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null as const,
        tags: []
      };

      await repository.create({ ...taskData, title: 'Task 1' });
      await repository.create({ ...taskData, title: 'Task 2' });
      await repository.create({ ...taskData, title: 'Task 3' });

      const allTasks = await repository.getAll();

      expect(allTasks.length).toBe(3);
      expect(allTasks.map(t => t.title)).toContain('Task 1');
      expect(allTasks.map(t => t.title)).toContain('Task 2');
      expect(allTasks.map(t => t.title)).toContain('Task 3');
    });

    it('returns empty array when no tasks exist', async () => {
      const allTasks = await repository.getAll();
      expect(allTasks).toEqual([]);
    });
  });

  describe('getByColumnId', () => {
    it('returns tasks for specified column', async () => {
      const taskData = {
        title: 'Task',
        columnId: 'column-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null as const,
        tags: []
      };

      await repository.create({ ...taskData, columnId: 'column-1', title: 'Task 1' });
      await repository.create({ ...taskData, columnId: 'column-1', title: 'Task 2' });
      await repository.create({ ...taskData, columnId: 'column-2', title: 'Task 3' });

      const column1Tasks = await repository.getByColumnId('column-1');

      expect(column1Tasks.length).toBe(2);
      expect(column1Tasks.every(t => t.columnId === 'column-1')).toBe(true);
    });
  });

  describe('getByClientId', () => {
    it('returns tasks for specified client', async () => {
      const taskData = {
        title: 'Task',
        columnId: 'column-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null as const,
        tags: []
      };

      const clientId = 'client-1';
      await repository.create({ ...taskData, clientId, title: 'Task 1' });
      await repository.create({ ...taskData, clientId, title: 'Task 2' });
      await repository.create({ ...taskData, clientId: null, title: 'Task 3' });

      const clientTasks = await repository.getByClientId(clientId);

      expect(clientTasks.length).toBe(2);
      expect(clientTasks.every(t => t.clientId === clientId)).toBe(true);
    });
  });

  describe('getByProjectId', () => {
    it('returns tasks for specified project', async () => {
      const taskData = {
        title: 'Task',
        columnId: 'column-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null as const,
        tags: []
      };

      const projectId = 'project-1';
      await repository.create({ ...taskData, projectId, title: 'Task 1' });
      await repository.create({ ...taskData, projectId, title: 'Task 2' });
      await repository.create({ ...taskData, projectId: null, title: 'Task 3' });

      const projectTasks = await repository.getByProjectId(projectId);

      expect(projectTasks.length).toBe(2);
      expect(projectTasks.every(t => t.projectId === projectId)).toBe(true);
    });
  });

  describe('update', () => {
    it('updates task successfully', async () => {
      const taskData = {
        title: 'Original Title',
        columnId: 'column-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null as const,
        tags: []
      };

      const created = await repository.create(taskData);
      const originalUpdatedAt = created.updatedAt;

      // Wait a bit to ensure updatedAt changes
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await repository.update(created.id, { title: 'Updated Title' });

      expect(updated.title).toBe('Updated Title');
      expect(updated.id).toBe(created.id);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('throws error when updating non-existent task', async () => {
      await expect(
        repository.update('non-existent-id', { title: 'New Title' })
      ).rejects.toThrow('not found');
    });

    it('preserves task ID on update', async () => {
      const taskData = {
        title: 'Task',
        columnId: 'column-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null as const,
        tags: []
      };

      const created = await repository.create(taskData);
      const updated = await repository.update(created.id, { title: 'Updated Task' });

      expect(updated.id).toBe(created.id);
    });
  });

  describe('delete', () => {
    it('deletes task successfully', async () => {
      const taskData = {
        title: 'Task to Delete',
        columnId: 'column-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null as const,
        tags: []
      };

      const created = await repository.create(taskData);
      await repository.delete(created.id);

      const retrieved = await repository.getById(created.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('handles database errors gracefully', async () => {
      // Close database to simulate error
      await db.close();

      const taskData = {
        title: 'Task',
        columnId: 'column-1',
        position: 0,
        clientId: null,
        projectId: null,
        isBillable: false,
        hourlyRate: null,
        timeEstimate: null,
        dueDate: null,
        priority: null as const,
        tags: []
      };

      await expect(repository.create(taskData)).rejects.toThrow();
    });
  });
});
