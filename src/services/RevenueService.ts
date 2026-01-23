import { Task } from '@/types/task';
import { Client } from '@/types/client';
import { Project } from '@/types/project';
import { Settings } from '@/types/settings';
import { TimeEntry } from '@/types/timeEntry';
import { TimerState } from '@/types/timerState';
import { ClientRepository } from './data/repositories/ClientRepository';
import { ProjectRepository } from './data/repositories/ProjectRepository';
import { SettingsRepository } from './data/repositories/SettingsRepository';
import { TaskRepository } from './data/repositories/TaskRepository';
import { TimeEntryRepository } from './data/repositories/TimeEntryRepository';
import { DateRange } from '@/utils/dateUtils';

/**
 * Client revenue breakdown interface
 */
export interface ClientRevenueBreakdown {
  clientId: string;
  clientName: string;
  revenue: number;
  hours: number; // Total billable hours
}

/**
 * Project revenue breakdown interface
 */
export interface ProjectRevenueBreakdown {
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  revenue: number;
  hours: number; // Total billable hours
}

/**
 * RevenueService - Service for revenue calculation and rate management
 * 
 * Provides methods for calculating effective hourly rates based on hierarchy:
 * Task rate > Project rate > Client rate > Global default
 */
export class RevenueService {
  private clientRepository: ClientRepository;
  private projectRepository: ProjectRepository;
  private settingsRepository: SettingsRepository;
  private taskRepository: TaskRepository;
  private timeEntryRepository: TimeEntryRepository;

  constructor(
    clientRepository?: ClientRepository,
    projectRepository?: ProjectRepository,
    settingsRepository?: SettingsRepository,
    taskRepository?: TaskRepository,
    timeEntryRepository?: TimeEntryRepository
  ) {
    this.clientRepository = clientRepository || new ClientRepository();
    this.projectRepository = projectRepository || new ProjectRepository();
    this.settingsRepository = settingsRepository || new SettingsRepository();
    this.taskRepository = taskRepository || new TaskRepository();
    this.timeEntryRepository = timeEntryRepository || new TimeEntryRepository();
  }

  /**
   * Get the effective hourly rate for a task based on rate hierarchy
   * 
   * Rate hierarchy (highest to lowest priority):
   * 1. Task.hourlyRate (if set, overrides all)
   * 2. Project.defaultHourlyRate (if set, overrides client and global)
   * 3. Client.defaultHourlyRate (if set, overrides global)
   * 4. Settings.defaultHourlyRate (global default, fallback)
   * 
   * @param task - The task to get the effective rate for
   * @param client - Optional client object (if not provided, will need to be fetched)
   * @param project - Optional project object (if not provided, will need to be fetched)
   * @param settings - Optional settings object (if not provided, will need to be fetched)
   * @returns The effective hourly rate, or null if no rate is set at any level
   */
  getEffectiveHourlyRate(
    task: Task,
    client?: Client | null,
    project?: Project | null,
    settings?: Settings | null
  ): number | null {
    // 1. Check task rate first (highest priority)
    if (task.hourlyRate !== null && task.hourlyRate !== undefined) {
      return task.hourlyRate;
    }

    // 2. Check project rate (second priority)
    if (project?.defaultHourlyRate !== null && project?.defaultHourlyRate !== undefined) {
      return project.defaultHourlyRate;
    }

    // 3. Check client rate (third priority)
    if (client?.defaultHourlyRate !== null && client?.defaultHourlyRate !== undefined) {
      return client.defaultHourlyRate;
    }

    // 4. Check global default rate (lowest priority, fallback)
    if (settings?.defaultHourlyRate !== null && settings?.defaultHourlyRate !== undefined) {
      return settings.defaultHourlyRate;
    }

    // No rate set at any level
    return null;
  }

  /**
   * Get the effective hourly rate for a task, fetching client/project/settings if not provided
   * 
   * This async version automatically fetches missing data from repositories.
   * Use this when you don't have client/project/settings data readily available.
   * 
   * @param task - The task to get the effective rate for
   * @param client - Optional client object (will be fetched if not provided and task.clientId is set)
   * @param project - Optional project object (will be fetched if not provided and task.projectId is set)
   * @param settings - Optional settings object (will be fetched if not provided)
   * @returns Promise resolving to the effective hourly rate, or null if no rate is set at any level
   */
  async getEffectiveHourlyRateAsync(
    task: Task,
    client?: Client | null,
    project?: Project | null,
    settings?: Settings | null
  ): Promise<number | null> {
    try {
      // Fetch client if not provided and task has clientId
      if (!client && task.clientId) {
        client = await this.clientRepository.getById(task.clientId) || null;
      }

      // Fetch project if not provided and task has projectId
      if (!project && task.projectId) {
        project = await this.projectRepository.getById(task.projectId) || null;
      }

      // Fetch settings if not provided
      if (!settings) {
        settings = await this.settingsRepository.getSettings();
      }

      // Use the synchronous method with fetched data
      return this.getEffectiveHourlyRate(task, client, project, settings);
    } catch (error) {
      console.error('Error fetching data for effective hourly rate:', error);
      // Fallback to synchronous method with available data
      return this.getEffectiveHourlyRate(task, client, project, settings);
    }
  }

  /**
   * Calculate revenue for a task based on billable hours and effective hourly rate
   * 
   * Revenue calculation formula:
   * - Total billable hours = Sum of all TimeEntry.duration (in minutes) + active timer elapsed time (in minutes)
   * - Convert to hours: billableHours = totalMinutes / 60
   * - Revenue = billableHours × effectiveHourlyRate
   * 
   * @param task - The task to calculate revenue for
   * @param timeEntries - Array of time entries for the task
   * @param activeTimer - Optional active timer state (if timer is running for this task)
   * @param client - Optional client object (if not provided, will need to be fetched)
   * @param project - Optional project object (if not provided, will need to be fetched)
   * @param settings - Optional settings object (if not provided, will need to be fetched)
   * @returns Calculated revenue amount, or null if task is not billable or no rate is set, or 0 if billable hours are 0
   */
  calculateTaskRevenue(
    task: Task,
    timeEntries: TimeEntry[],
    activeTimer?: TimerState | null,
    client?: Client | null,
    project?: Project | null,
    settings?: Settings | null
  ): number | null {
    // Return null if task is not billable
    if (!task.isBillable) {
      return null;
    }

    // Get effective hourly rate
    const effectiveRate = this.getEffectiveHourlyRate(task, client, project, settings);
    
    // Return null if no effective rate is set
    if (effectiveRate === null) {
      return null;
    }

    // Calculate total billable minutes
    let totalMinutes = 0;
    
    // Sum all time entry durations
    for (const entry of timeEntries) {
      totalMinutes += entry.duration;
    }

    // Add active timer elapsed time if timer is active for this task
    if (activeTimer && activeTimer.taskId === task.id && activeTimer.status === 'active') {
      const now = new Date();
      const startTime = new Date(activeTimer.startTime);
      const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
      // Only add if elapsed time is positive (handle edge cases)
      if (elapsedMinutes > 0) {
        totalMinutes += elapsedMinutes;
      }
    }

    // Return 0 if billable hours are 0 (even if rate is set)
    if (totalMinutes === 0) {
      return 0;
    }

    // Convert minutes to hours
    const billableHours = totalMinutes / 60;

    // Calculate revenue: billableHours × effectiveRate
    // Use proper rounding for currency (round to 2 decimal places)
    const revenue = Math.round(billableHours * effectiveRate * 100) / 100;

    return revenue;
  }

  /**
   * Filter time entries by date range
   * 
   * @param timeEntries - Array of time entries to filter
   * @param dateRange - Optional date range to filter by (inclusive)
   * @returns Filtered array of time entries within the date range
   */
  private filterTimeEntriesByDateRange(
    timeEntries: TimeEntry[],
    dateRange?: DateRange
  ): TimeEntry[] {
    if (!dateRange) {
      return timeEntries;
    }

    return timeEntries.filter(entry => {
      const entryTime = entry.startTime.getTime();
      const startTime = dateRange.start.getTime();
      const endTime = dateRange.end.getTime();
      return entryTime >= startTime && entryTime <= endTime;
    });
  }

  /**
   * Calculate total revenue for a client within an optional date range
   * 
   * Gets all billable tasks for the client, filters time entries by date range,
   * and calculates revenue for each task using calculateTaskRevenue().
   * 
   * @param clientId - The client ID to calculate revenue for
   * @param dateRange - Optional date range to filter time entries (inclusive)
   * @returns Promise resolving to total revenue amount, or 0 if no revenue
   */
  async calculateClientRevenue(
    clientId: string,
    dateRange?: DateRange
  ): Promise<number> {
    try {
      // Get all tasks for client, filter by isBillable=true
      const allTasks = await this.taskRepository.getByClientId(clientId);
      const billableTasks = allTasks.filter(task => task.isBillable);

      if (billableTasks.length === 0) {
        return 0;
      }

      // Get client, project, and settings for rate calculation
      const client = await this.clientRepository.getById(clientId);
      const settings = await this.settingsRepository.getSettings();

      let totalRevenue = 0;

      // Calculate revenue for each task
      for (const task of billableTasks) {
        // Get project if task has projectId
        const project = task.projectId
          ? await this.projectRepository.getById(task.projectId)
          : null;

        // Get all time entries for this task
        const allTimeEntries = await this.timeEntryRepository.getByTaskId(task.id);

        // Filter by date range if provided
        const timeEntries = this.filterTimeEntriesByDateRange(allTimeEntries, dateRange);

        // Calculate revenue for this task
        const taskRevenue = this.calculateTaskRevenue(
          task,
          timeEntries,
          null, // No active timer for aggregate calculations
          client || null,
          project || null,
          settings || null
        );

        if (taskRevenue !== null) {
          totalRevenue += taskRevenue;
        }
      }

      return Math.round(totalRevenue * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('Error calculating client revenue:', error);
      throw new Error(`Failed to calculate client revenue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate total revenue for a project within an optional date range
   * 
   * Gets all billable tasks for the project, filters time entries by date range,
   * and calculates revenue for each task using calculateTaskRevenue().
   * 
   * @param projectId - The project ID to calculate revenue for
   * @param dateRange - Optional date range to filter time entries (inclusive)
   * @returns Promise resolving to total revenue amount, or 0 if no revenue
   */
  async calculateProjectRevenue(
    projectId: string,
    dateRange?: DateRange
  ): Promise<number> {
    try {
      // Get all tasks for project, filter by isBillable=true
      const allTasks = await this.taskRepository.getByProjectId(projectId);
      const billableTasks = allTasks.filter(task => task.isBillable);

      if (billableTasks.length === 0) {
        return 0;
      }

      // Get project, client, and settings for rate calculation
      const project = await this.projectRepository.getById(projectId);
      if (!project) {
        return 0;
      }

      const client = await this.clientRepository.getById(project.clientId);
      const settings = await this.settingsRepository.getSettings();

      let totalRevenue = 0;

      // Calculate revenue for each task
      for (const task of billableTasks) {
        // Get all time entries for this task
        const allTimeEntries = await this.timeEntryRepository.getByTaskId(task.id);

        // Filter by date range if provided
        const timeEntries = this.filterTimeEntriesByDateRange(allTimeEntries, dateRange);

        // Calculate revenue for this task
        const taskRevenue = this.calculateTaskRevenue(
          task,
          timeEntries,
          null, // No active timer for aggregate calculations
          client || null,
          project || null,
          settings || null
        );

        if (taskRevenue !== null) {
          totalRevenue += taskRevenue;
        }
      }

      return Math.round(totalRevenue * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('Error calculating project revenue:', error);
      throw new Error(`Failed to calculate project revenue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate total revenue across all clients/projects within an optional date range
   * 
   * Gets all billable tasks, filters time entries by date range,
   * and calculates revenue for each task.
   * 
   * @param dateRange - Optional date range to filter time entries (inclusive)
   * @returns Promise resolving to total revenue amount, or 0 if no revenue
   */
  async calculateTotalRevenue(dateRange?: DateRange): Promise<number> {
    try {
      // Get all tasks, filter by isBillable=true
      const allTasks = await this.taskRepository.getAll();
      const billableTasks = allTasks.filter(task => task.isBillable);

      if (billableTasks.length === 0) {
        return 0;
      }

      // Get settings for rate calculation
      const settings = await this.settingsRepository.getSettings();

      // Cache clients and projects to avoid repeated lookups
      const clientCache = new Map<string, Client | null>();
      const projectCache = new Map<string, Project | null>();

      let totalRevenue = 0;

      // Calculate revenue for each task
      for (const task of billableTasks) {
        // Get client (with caching)
        let client: Client | null = null;
        if (task.clientId) {
          if (!clientCache.has(task.clientId)) {
            clientCache.set(task.clientId, await this.clientRepository.getById(task.clientId) || null);
          }
          client = clientCache.get(task.clientId) || null;
        }

        // Get project (with caching)
        let project: Project | null = null;
        if (task.projectId) {
          if (!projectCache.has(task.projectId)) {
            projectCache.set(task.projectId, await this.projectRepository.getById(task.projectId) || null);
          }
          project = projectCache.get(task.projectId) || null;
        }

        // Get all time entries for this task
        const allTimeEntries = await this.timeEntryRepository.getByTaskId(task.id);

        // Filter by date range if provided
        const timeEntries = this.filterTimeEntriesByDateRange(allTimeEntries, dateRange);

        // Calculate revenue for this task
        const taskRevenue = this.calculateTaskRevenue(
          task,
          timeEntries,
          null, // No active timer for aggregate calculations
          client,
          project,
          settings || null
        );

        if (taskRevenue !== null) {
          totalRevenue += taskRevenue;
        }
      }

      return Math.round(totalRevenue * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('Error calculating total revenue:', error);
      throw new Error(`Failed to calculate total revenue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate total billable hours across all billable tasks within an optional date range
   * 
   * Gets all billable tasks, filters time entries by date range,
   * and sums all durations (in minutes), then converts to hours.
   * 
   * @param dateRange - Optional date range to filter time entries (inclusive)
   * @returns Promise resolving to total billable hours, or 0 if no billable hours
   */
  async calculateTotalBillableHours(dateRange?: DateRange): Promise<number> {
    try {
      // Get all tasks, filter by isBillable=true
      const allTasks = await this.taskRepository.getAll();
      const billableTasks = allTasks.filter(task => task.isBillable);

      if (billableTasks.length === 0) {
        return 0;
      }

      let totalMinutes = 0;

      // Sum durations for all billable tasks
      for (const task of billableTasks) {
        // Get all time entries for this task
        const allTimeEntries = await this.timeEntryRepository.getByTaskId(task.id);

        // Filter by date range if provided
        const timeEntries = this.filterTimeEntriesByDateRange(allTimeEntries, dateRange);

        // Sum durations (in minutes)
        for (const entry of timeEntries) {
          totalMinutes += entry.duration;
        }
      }

      // Convert minutes to hours and round to 2 decimal places
      const totalHours = totalMinutes / 60;
      return Math.round(totalHours * 100) / 100;
    } catch (error) {
      console.error('Error calculating total billable hours:', error);
      throw new Error(`Failed to calculate total billable hours: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate billable hours for a client within an optional date range
   * 
   * @param clientId - The client ID to calculate hours for
   * @param dateRange - Optional date range to filter time entries (inclusive)
   * @returns Promise resolving to total billable hours, or 0 if no billable hours
   */
  private async calculateClientBillableHours(
    clientId: string,
    dateRange?: DateRange
  ): Promise<number> {
    try {
      // Get all tasks for client, filter by isBillable=true
      const allTasks = await this.taskRepository.getByClientId(clientId);
      const billableTasks = allTasks.filter(task => task.isBillable);

      if (billableTasks.length === 0) {
        return 0;
      }

      let totalMinutes = 0;

      // Sum durations for all billable tasks
      for (const task of billableTasks) {
        // Get all time entries for this task
        const allTimeEntries = await this.timeEntryRepository.getByTaskId(task.id);

        // Filter by date range if provided
        const timeEntries = this.filterTimeEntriesByDateRange(allTimeEntries, dateRange);

        // Sum durations (in minutes)
        for (const entry of timeEntries) {
          totalMinutes += entry.duration;
        }
      }

      // Convert minutes to hours and round to 2 decimal places
      const totalHours = totalMinutes / 60;
      return Math.round(totalHours * 100) / 100;
    } catch (error) {
      console.error('Error calculating client billable hours:', error);
      throw new Error(`Failed to calculate client billable hours: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate billable hours for a project within an optional date range
   * 
   * @param projectId - The project ID to calculate hours for
   * @param dateRange - Optional date range to filter time entries (inclusive)
   * @returns Promise resolving to total billable hours, or 0 if no billable hours
   */
  private async calculateProjectBillableHours(
    projectId: string,
    dateRange?: DateRange
  ): Promise<number> {
    try {
      // Get all tasks for project, filter by isBillable=true
      const allTasks = await this.taskRepository.getByProjectId(projectId);
      const billableTasks = allTasks.filter(task => task.isBillable);

      if (billableTasks.length === 0) {
        return 0;
      }

      let totalMinutes = 0;

      // Sum durations for all billable tasks
      for (const task of billableTasks) {
        // Get all time entries for this task
        const allTimeEntries = await this.timeEntryRepository.getByTaskId(task.id);

        // Filter by date range if provided
        const timeEntries = this.filterTimeEntriesByDateRange(allTimeEntries, dateRange);

        // Sum durations (in minutes)
        for (const entry of timeEntries) {
          totalMinutes += entry.duration;
        }
      }

      // Convert minutes to hours and round to 2 decimal places
      const totalHours = totalMinutes / 60;
      return Math.round(totalHours * 100) / 100;
    } catch (error) {
      console.error('Error calculating project billable hours:', error);
      throw new Error(`Failed to calculate project billable hours: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get revenue breakdown by client within an optional date range
   * 
   * Gets all clients, calculates revenue and hours for each client,
   * and returns an array sorted by revenue descending.
   * 
   * @param dateRange - Optional date range to filter time entries (inclusive)
   * @returns Promise resolving to array of client revenue breakdowns, sorted by revenue descending
   */
  async getClientRevenueBreakdown(dateRange?: DateRange): Promise<ClientRevenueBreakdown[]> {
    try {
      // Get all clients
      const clients = await this.clientRepository.getAll();

      // Calculate revenue and hours for each client
      const breakdowns: ClientRevenueBreakdown[] = [];

      for (const client of clients) {
        const revenue = await this.calculateClientRevenue(client.id, dateRange);
        const hours = await this.calculateClientBillableHours(client.id, dateRange);

        // Only include clients with revenue > 0 or hours > 0
        if (revenue > 0 || hours > 0) {
          breakdowns.push({
            clientId: client.id,
            clientName: client.name,
            revenue,
            hours
          });
        }
      }

      // Sort by revenue descending
      breakdowns.sort((a, b) => b.revenue - a.revenue);

      return breakdowns;
    } catch (error) {
      console.error('Error getting client revenue breakdown:', error);
      throw new Error(`Failed to get client revenue breakdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get revenue breakdown by project within an optional date range
   * 
   * Gets all projects, calculates revenue and hours for each project,
   * and returns an array sorted by revenue descending.
   * 
   * @param dateRange - Optional date range to filter time entries (inclusive)
   * @returns Promise resolving to array of project revenue breakdowns, sorted by revenue descending
   */
  async getProjectRevenueBreakdown(dateRange?: DateRange): Promise<ProjectRevenueBreakdown[]> {
    try {
      // Get all projects
      const projects = await this.projectRepository.getAll();

      // Calculate revenue and hours for each project
      const breakdowns: ProjectRevenueBreakdown[] = [];

      for (const project of projects) {
        const revenue = await this.calculateProjectRevenue(project.id, dateRange);
        const hours = await this.calculateProjectBillableHours(project.id, dateRange);

        // Only include projects with revenue > 0 or hours > 0
        if (revenue > 0 || hours > 0) {
          // Get client name
          const client = await this.clientRepository.getById(project.clientId);
          const clientName = client?.name || 'Unknown Client';

          breakdowns.push({
            projectId: project.id,
            projectName: project.name,
            clientId: project.clientId,
            clientName,
            revenue,
            hours
          });
        }
      }

      // Sort by revenue descending
      breakdowns.sort((a, b) => b.revenue - a.revenue);

      return breakdowns;
    } catch (error) {
      console.error('Error getting project revenue breakdown:', error);
      throw new Error(`Failed to get project revenue breakdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const revenueService = new RevenueService();
