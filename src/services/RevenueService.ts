import { Task } from '@/types/task';
import { Client } from '@/types/client';
import { Project } from '@/types/project';
import { Settings } from '@/types/settings';
import { TimeEntry } from '@/types/timeEntry';
import { TimerState } from '@/types/timerState';
import { ClientRepository } from './data/repositories/ClientRepository';
import { ProjectRepository } from './data/repositories/ProjectRepository';
import { SettingsRepository } from './data/repositories/SettingsRepository';

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

  constructor(
    clientRepository?: ClientRepository,
    projectRepository?: ProjectRepository,
    settingsRepository?: SettingsRepository
  ) {
    this.clientRepository = clientRepository || new ClientRepository();
    this.projectRepository = projectRepository || new ProjectRepository();
    this.settingsRepository = settingsRepository || new SettingsRepository();
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
}

// Export singleton instance
export const revenueService = new RevenueService();
