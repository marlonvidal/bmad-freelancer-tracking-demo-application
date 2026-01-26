import { SampleDataService } from '@/services/SampleDataService';
import { ClientRepository } from '@/services/data/repositories/ClientRepository';
import { ProjectRepository } from '@/services/data/repositories/ProjectRepository';
import { ColumnRepository } from '@/services/data/repositories/ColumnRepository';
import { TaskRepository } from '@/services/data/repositories/TaskRepository';
import { TimeEntryRepository } from '@/services/data/repositories/TimeEntryRepository';
import { db } from '@/services/data/database';

describe('SampleDataService', () => {
  beforeEach(async () => {
    await db.open();
    await db.clients.clear();
    await db.projects.clear();
    await db.columns.clear();
    await db.tasks.clear();
    await db.timeEntries.clear();
  });

  afterEach(async () => {
    // Clean up sample data
    try {
      await SampleDataService.deleteSampleData();
    } catch (error) {
      // Ignore errors during cleanup
    }
    await db.clients.clear();
    await db.projects.clear();
    await db.columns.clear();
    await db.tasks.clear();
    await db.timeEntries.clear();
  });

  describe('generateSampleData', () => {
    it('creates sample clients', async () => {
      await SampleDataService.generateSampleData();

      const clientRepository = new ClientRepository();
      const clients = await clientRepository.getAll();

      expect(clients.length).toBeGreaterThanOrEqual(2);
      expect(clients.some(c => c.name === 'Acme Corporation')).toBe(true);
      expect(clients.some(c => c.name === 'TechStart Inc')).toBe(true);
    });

    it('creates sample projects', async () => {
      await SampleDataService.generateSampleData();

      const projectRepository = new ProjectRepository();
      const projects = await projectRepository.getAll();

      expect(projects.length).toBeGreaterThanOrEqual(2);
    });

    it('creates sample columns if they do not exist', async () => {
      await SampleDataService.generateSampleData();

      const columnRepository = new ColumnRepository();
      const columns = await columnRepository.getAll();

      const columnNames = columns.map(c => c.name);
      expect(columnNames).toContain('Backlog');
      expect(columnNames).toContain('In Progress');
      expect(columnNames).toContain('Review');
      expect(columnNames).toContain('Done');
    });

    it('does not duplicate existing columns', async () => {
      const columnRepository = new ColumnRepository();
      await columnRepository.create({
        name: 'Backlog',
        position: 0,
        color: null
      });

      await SampleDataService.generateSampleData();

      const columns = await columnRepository.getAll();
      const backlogColumns = columns.filter(c => c.name === 'Backlog');
      expect(backlogColumns.length).toBe(1);
    });

    it('creates sample tasks with [Sample] prefix', async () => {
      await SampleDataService.generateSampleData();

      const taskRepository = new TaskRepository();
      const tasks = await taskRepository.getAll();

      const sampleTasks = tasks.filter(t => t.title.startsWith('[Sample]'));
      expect(sampleTasks.length).toBeGreaterThanOrEqual(5);
    });

    it('creates sample time entries', async () => {
      await SampleDataService.generateSampleData();

      const timeEntryRepository = new TimeEntryRepository();
      const timeEntries = await timeEntryRepository.getAll();

      expect(timeEntries.length).toBeGreaterThanOrEqual(2);
    });

    it('creates tasks with various properties', async () => {
      await SampleDataService.generateSampleData();

      const taskRepository = new TaskRepository();
      const tasks = await taskRepository.getAll();
      const sampleTasks = tasks.filter(t => t.title.startsWith('[Sample]'));

      // Check that tasks have various properties
      const taskWithPriority = sampleTasks.find(t => t.priority === 'high');
      expect(taskWithPriority).toBeDefined();

      const taskWithTags = sampleTasks.find(t => t.tags.length > 0);
      expect(taskWithTags).toBeDefined();

      const billableTask = sampleTasks.find(t => t.isBillable === true);
      expect(billableTask).toBeDefined();
    });

    it('throws error if generation fails', async () => {
      // Mock repository to throw error
      const originalGetAll = ColumnRepository.prototype.getAll;
      jest.spyOn(ColumnRepository.prototype, 'getAll').mockRejectedValueOnce(
        new Error('Database error')
      );

      await expect(SampleDataService.generateSampleData()).rejects.toThrow();

      jest.restoreAllMocks();
    });
  });

  describe('deleteSampleData', () => {
    it('deletes all tasks with [Sample] prefix', async () => {
      await SampleDataService.generateSampleData();

      const taskRepository = new TaskRepository();
      let tasks = await taskRepository.getAll();
      const sampleTasksBefore = tasks.filter(t => t.title.startsWith('[Sample]'));
      expect(sampleTasksBefore.length).toBeGreaterThan(0);

      await SampleDataService.deleteSampleData();

      tasks = await taskRepository.getAll();
      const sampleTasksAfter = tasks.filter(t => t.title.startsWith('[Sample]'));
      expect(sampleTasksAfter.length).toBe(0);
    });

    it('deletes time entries associated with sample tasks', async () => {
      await SampleDataService.generateSampleData();

      const taskRepository = new TaskRepository();
      const timeEntryRepository = new TimeEntryRepository();
      
      const tasks = await taskRepository.getAll();
      const sampleTasks = tasks.filter(t => t.title.startsWith('[Sample]'));
      
      // Get time entries for sample tasks
      let sampleTimeEntries = 0;
      for (const task of sampleTasks) {
        const entries = await timeEntryRepository.getByTaskId(task.id);
        sampleTimeEntries += entries.length;
      }
      expect(sampleTimeEntries).toBeGreaterThan(0);

      await SampleDataService.deleteSampleData();

      // Verify time entries are deleted
      const allTimeEntries = await timeEntryRepository.getAll();
      const remainingSampleTimeEntries = allTimeEntries.filter(entry => {
        return sampleTasks.some(task => task.id === entry.taskId);
      });
      expect(remainingSampleTimeEntries.length).toBe(0);
    });

    it('does not delete non-sample tasks', async () => {
      // Create a regular task
      const taskRepository = new TaskRepository();
      const columnRepository = new ColumnRepository();
      
      const column = await columnRepository.create({
        name: 'Test Column',
        position: 0,
        color: null
      });

      const regularTask = await taskRepository.create({
        title: 'Regular Task',
        columnId: column.id,
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

      await SampleDataService.generateSampleData();
      await SampleDataService.deleteSampleData();

      const task = await taskRepository.getById(regularTask.id);
      expect(task).toBeDefined();
      expect(task?.title).toBe('Regular Task');
    });

    it('handles deletion when no sample data exists', async () => {
      // Should not throw when no sample data exists
      await expect(SampleDataService.deleteSampleData()).resolves.not.toThrow();
    });

    it('throws error if deletion fails', async () => {
      await SampleDataService.generateSampleData();

      // Mock repository to throw error
      const originalGetAll = TaskRepository.prototype.getAll;
      jest.spyOn(TaskRepository.prototype, 'getAll').mockRejectedValueOnce(
        new Error('Database error')
      );

      await expect(SampleDataService.deleteSampleData()).rejects.toThrow();

      jest.restoreAllMocks();
    });
  });

  describe('hasSampleData', () => {
    it('returns false when no sample data exists', async () => {
      const hasSample = await SampleDataService.hasSampleData();
      expect(hasSample).toBe(false);
    });

    it('returns true when sample data exists', async () => {
      await SampleDataService.generateSampleData();

      const hasSample = await SampleDataService.hasSampleData();
      expect(hasSample).toBe(true);
    });

    it('returns false after deleting sample data', async () => {
      await SampleDataService.generateSampleData();
      await SampleDataService.deleteSampleData();

      const hasSample = await SampleDataService.hasSampleData();
      expect(hasSample).toBe(false);
    });

    it('handles errors gracefully and returns false', async () => {
      // Mock repository to throw error
      jest.spyOn(TaskRepository.prototype, 'getAll').mockRejectedValueOnce(
        new Error('Database error')
      );

      const hasSample = await SampleDataService.hasSampleData();
      expect(hasSample).toBe(false);

      jest.restoreAllMocks();
    });
  });
});
