import { ClientRepository } from './data/repositories/ClientRepository';
import { ProjectRepository } from './data/repositories/ProjectRepository';
import { ColumnRepository } from './data/repositories/ColumnRepository';
import { TaskRepository } from './data/repositories/TaskRepository';
import { TimeEntryRepository } from './data/repositories/TimeEntryRepository';
// Note: db import not needed - repositories handle database access

/**
 * SampleDataService - Service for generating and deleting sample data
 * 
 * Provides methods to create sample data for onboarding and exploration,
 * and to delete all sample data marked with [Sample] prefix.
 */
export class SampleDataService {
  private static readonly SAMPLE_PREFIX = '[Sample]';

  /**
   * Generate sample data for onboarding
   * Creates sample clients, projects, columns, tasks, and time entries
   */
  static async generateSampleData(): Promise<void> {
    try {
      // Create sample columns if they don't exist
      const columnRepository = new ColumnRepository();
      const existingColumns = await columnRepository.getAll();
      
      let backlogColumn = existingColumns.find(c => c.name === 'Backlog');
      let inProgressColumn = existingColumns.find(c => c.name === 'In Progress');
      let reviewColumn = existingColumns.find(c => c.name === 'Review');
      let doneColumn = existingColumns.find(c => c.name === 'Done');

      if (!backlogColumn) {
        backlogColumn = await columnRepository.create({
          name: 'Backlog',
          position: 0,
          color: null
        });
      }
      if (!inProgressColumn) {
        inProgressColumn = await columnRepository.create({
          name: 'In Progress',
          position: 1,
          color: null
        });
      }
      if (!reviewColumn) {
        reviewColumn = await columnRepository.create({
          name: 'Review',
          position: 2,
          color: null
        });
      }
      if (!doneColumn) {
        doneColumn = await columnRepository.create({
          name: 'Done',
          position: 3,
          color: null
        });
      }

      // Create sample clients
      const clientRepository = new ClientRepository();
      const client1 = await clientRepository.create({
        name: 'Acme Corporation',
        defaultHourlyRate: 150,
        contactInfo: 'contact@acme.com'
      });

      const client2 = await clientRepository.create({
        name: 'TechStart Inc',
        defaultHourlyRate: 120,
        contactInfo: 'hello@techstart.io'
      });

      const client3 = await clientRepository.create({
        name: 'Design Studio',
        defaultHourlyRate: 100,
        contactInfo: null
      });

      // Create sample projects
      const projectRepository = new ProjectRepository();
      const project1 = await projectRepository.create({
        name: 'Website Redesign',
        clientId: client1.id,
        description: 'Complete redesign of company website',
        defaultHourlyRate: 150
      });

      const project2 = await projectRepository.create({
        name: 'Mobile App Development',
        clientId: client2.id,
        description: 'iOS and Android app development',
        defaultHourlyRate: 120
      });

      const project3 = await projectRepository.create({
        name: 'Brand Identity',
        clientId: client3.id,
        description: 'Logo and brand guidelines',
        defaultHourlyRate: 100
      });

      // Create sample tasks
      const taskRepository = new TaskRepository();
      const timeEntryRepository = new TimeEntryRepository();

      // Client 1, Project 1 tasks
      await taskRepository.create({
        title: `${this.SAMPLE_PREFIX} Research competitors`,
        description: 'Analyze competitor websites and features',
        columnId: backlogColumn.id,
        position: 0,
        clientId: client1.id,
        projectId: project1.id,
        isBillable: true,
        hourlyRate: 150,
        timeEstimate: 240, // 4 hours
        dueDate: null,
        priority: 'high',
        tags: ['research', 'planning']
      });

      const task2 = await taskRepository.create({
        title: `${this.SAMPLE_PREFIX} Design mockups`,
        description: 'Create initial design mockups for homepage',
        columnId: inProgressColumn.id,
        position: 0,
        clientId: client1.id,
        projectId: project1.id,
        isBillable: true,
        hourlyRate: 150,
        timeEstimate: 480, // 8 hours
        dueDate: null,
        priority: 'high',
        tags: ['design', 'ui']
      });

      // Client 2, Project 2 tasks
      const task3 = await taskRepository.create({
        title: `${this.SAMPLE_PREFIX} Set up development environment`,
        description: 'Configure React Native and dependencies',
        columnId: doneColumn.id,
        position: 0,
        clientId: client2.id,
        projectId: project2.id,
        isBillable: true,
        hourlyRate: 120,
        timeEstimate: 120, // 2 hours
        dueDate: null,
        priority: 'medium',
        tags: ['setup', 'development']
      });

      const task4 = await taskRepository.create({
        title: `${this.SAMPLE_PREFIX} Implement user authentication`,
        description: 'Add login and signup functionality',
        columnId: inProgressColumn.id,
        position: 1,
        clientId: client2.id,
        projectId: project2.id,
        isBillable: true,
        hourlyRate: 120,
        timeEstimate: 600, // 10 hours
        dueDate: null,
        priority: 'high',
        tags: ['development', 'auth']
      });

      // Client 3, Project 3 tasks
      await taskRepository.create({
        title: `${this.SAMPLE_PREFIX} Create logo concepts`,
        description: 'Develop 3-5 logo concept options',
        columnId: reviewColumn.id,
        position: 0,
        clientId: client3.id,
        projectId: project3.id,
        isBillable: true,
        hourlyRate: 100,
        timeEstimate: 360, // 6 hours
        dueDate: null,
        priority: 'medium',
        tags: ['design', 'logo']
      });

      await taskRepository.create({
        title: `${this.SAMPLE_PREFIX} Design business cards`,
        description: 'Create business card designs',
        columnId: backlogColumn.id,
        position: 1,
        clientId: client3.id,
        projectId: project3.id,
        isBillable: true,
        hourlyRate: 100,
        timeEstimate: 180, // 3 hours
        dueDate: null,
        priority: 'low',
        tags: ['design', 'print']
      });

      // Create sample time entries for some tasks
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      // Time entry for task2 (completed)
      await timeEntryRepository.create({
        taskId: task2.id,
        startTime: twoDaysAgo,
        endTime: new Date(twoDaysAgo.getTime() + 3 * 60 * 60 * 1000), // 3 hours
        duration: 180,
        isManual: false,
        description: 'Worked on homepage mockups'
      });

      // Time entry for task3 (completed)
      await timeEntryRepository.create({
        taskId: task3.id,
        startTime: yesterday,
        endTime: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000), // 2 hours
        duration: 120,
        isManual: false,
        description: 'Set up React Native project'
      });

      // Time entry for task4 (in progress)
      await timeEntryRepository.create({
        taskId: task4.id,
        startTime: new Date(yesterday.getTime() + 4 * 60 * 60 * 1000),
        endTime: new Date(yesterday.getTime() + 6 * 60 * 60 * 1000), // 2 hours
        duration: 120,
        isManual: false,
        description: 'Started auth implementation'
      });
    } catch (error) {
      console.error('Error generating sample data:', error);
      throw new Error(`Failed to generate sample data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete all sample data marked with [Sample] prefix
   * Deletes tasks with [Sample] prefix and their associated time entries
   */
  static async deleteSampleData(): Promise<void> {
    try {
      const taskRepository = new TaskRepository();
      const timeEntryRepository = new TimeEntryRepository();

      // Get all tasks
      const allTasks = await taskRepository.getAll();

      // Find all sample tasks
      const sampleTasks = allTasks.filter(task => task.title.startsWith(this.SAMPLE_PREFIX));

      // Delete time entries for sample tasks
      for (const task of sampleTasks) {
        const timeEntries = await timeEntryRepository.getByTaskId(task.id);
        for (const entry of timeEntries) {
          await timeEntryRepository.delete(entry.id);
        }
        // Delete the task
        await taskRepository.delete(task.id);
      }
    } catch (error) {
      console.error('Error deleting sample data:', error);
      throw new Error(`Failed to delete sample data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if sample data exists
   * @returns true if any tasks with [Sample] prefix exist
   */
  static async hasSampleData(): Promise<boolean> {
    try {
      const taskRepository = new TaskRepository();
      const allTasks = await taskRepository.getAll();
      return allTasks.some(task => task.title.startsWith(this.SAMPLE_PREFIX));
    } catch (error) {
      console.error('Error checking for sample data:', error);
      return false;
    }
  }
}
