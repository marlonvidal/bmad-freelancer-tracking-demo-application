import { TaskRepository } from './data/repositories/TaskRepository';
import { TimeEntryRepository } from './data/repositories/TimeEntryRepository';
import { ClientRepository } from './data/repositories/ClientRepository';
import { ProjectRepository } from './data/repositories/ProjectRepository';
import { ColumnRepository } from './data/repositories/ColumnRepository';
import { SettingsRepository } from './data/repositories/SettingsRepository';
import { Task } from '@/types/task';
import { TimeEntry } from '@/types/timeEntry';
import { Client } from '@/types/client';
import { Project } from '@/types/project';
import { Column } from '@/types/column';
import { Settings } from '@/types/settings';
import {
  BackupData,
  BackupValidationResult,
  BackupPreview,
  RestoreMode,
  MergeStatistics,
} from '@/types/backup';
import { db } from './data/database';

/**
 * ImportService - Service for importing and restoring backup data
 * 
 * Provides methods for validating backup files, previewing backup data,
 * and restoring backups in replace or merge mode. Handles data integrity,
 * relationship validation, and transaction management.
 */
export class ImportService {
  private taskRepository: TaskRepository;
  private timeEntryRepository: TimeEntryRepository;
  private clientRepository: ClientRepository;
  private projectRepository: ProjectRepository;
  private columnRepository: ColumnRepository;
  private settingsRepository: SettingsRepository;

  constructor(
    taskRepository?: TaskRepository,
    timeEntryRepository?: TimeEntryRepository,
    clientRepository?: ClientRepository,
    projectRepository?: ProjectRepository,
    columnRepository?: ColumnRepository,
    settingsRepository?: SettingsRepository
  ) {
    this.taskRepository = taskRepository || new TaskRepository();
    this.timeEntryRepository = timeEntryRepository || new TimeEntryRepository();
    this.clientRepository = clientRepository || new ClientRepository();
    this.projectRepository = projectRepository || new ProjectRepository();
    this.columnRepository = columnRepository || new ColumnRepository();
    this.settingsRepository = settingsRepository || new SettingsRepository();
  }

  /**
   * Read and parse backup file
   * @param file - Backup file to read
   * @returns Promise resolving to parsed BackupData
   */
  private async readBackupFile(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          if (!text) {
            reject(new Error('Failed to read file content'));
            return;
          }

          const data = JSON.parse(text) as BackupData;
          resolve(data);
        } catch (error) {
          if (error instanceof SyntaxError) {
            reject(new Error(`Invalid JSON format: ${error.message}`));
          } else {
            reject(new Error(`Failed to parse backup file: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Validate backup file format and structure
   * @param file - Backup file to validate
   * @returns Promise resolving to validation result
   */
  async validateBackupFile(file: File): Promise<BackupValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.json')) {
        errors.push('File must be a JSON file (.json extension)');
      }

      if (file.type && file.type !== 'application/json' && file.type !== 'text/json') {
        warnings.push(`Unexpected MIME type: ${file.type}. Expected application/json`);
      }

      // Validate file size (warn if > 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        warnings.push(`File size is large (${(file.size / 1024 / 1024).toFixed(2)}MB). Import may take a while.`);
      }

      // Read and parse file
      let backupData: BackupData;
      try {
        backupData = await this.readBackupFile(file);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Failed to read or parse file');
        return { isValid: false, errors, warnings };
      }

      // Validate root structure
      if (!backupData.tasks || !Array.isArray(backupData.tasks)) {
        errors.push('Missing or invalid tasks array');
      }
      if (!backupData.timeEntries || !Array.isArray(backupData.timeEntries)) {
        errors.push('Missing or invalid timeEntries array');
      }
      if (!backupData.clients || !Array.isArray(backupData.clients)) {
        errors.push('Missing or invalid clients array');
      }
      if (!backupData.projects || !Array.isArray(backupData.projects)) {
        errors.push('Missing or invalid projects array');
      }
      if (!backupData.columns || !Array.isArray(backupData.columns)) {
        errors.push('Missing or invalid columns array');
      }
      if (!backupData.settings || typeof backupData.settings !== 'object') {
        errors.push('Missing or invalid settings object');
      }
      if (!backupData.metadata || typeof backupData.metadata !== 'object') {
        errors.push('Missing or invalid metadata object');
      }

      // Validate metadata structure
      if (backupData.metadata) {
        if (!backupData.metadata.exportDate || typeof backupData.metadata.exportDate !== 'string') {
          errors.push('Missing or invalid metadata.exportDate');
        }
        if (!backupData.metadata.version || typeof backupData.metadata.version !== 'string') {
          errors.push('Missing or invalid metadata.version');
        }
        if (!backupData.metadata.counts || typeof backupData.metadata.counts !== 'object') {
          errors.push('Missing or invalid metadata.counts');
        }
      }

      // Validate data types and required fields
      if (backupData.tasks) {
        backupData.tasks.forEach((task, index) => {
          if (!task.id || typeof task.id !== 'string') {
            errors.push(`Task at index ${index} is missing or has invalid id`);
          }
          if (!task.title || typeof task.title !== 'string') {
            errors.push(`Task at index ${index} is missing or has invalid title`);
          }
          if (!task.columnId || typeof task.columnId !== 'string') {
            errors.push(`Task at index ${index} is missing or has invalid columnId`);
          }
        });
      }

      if (backupData.timeEntries) {
        backupData.timeEntries.forEach((entry, index) => {
          if (!entry.id || typeof entry.id !== 'string') {
            errors.push(`TimeEntry at index ${index} is missing or has invalid id`);
          }
          if (!entry.taskId || typeof entry.taskId !== 'string') {
            errors.push(`TimeEntry at index ${index} is missing or has invalid taskId`);
          }
          if (!entry.startTime) {
            errors.push(`TimeEntry at index ${index} is missing startTime`);
          }
        });
      }

      if (backupData.clients) {
        backupData.clients.forEach((client, index) => {
          if (!client.id || typeof client.id !== 'string') {
            errors.push(`Client at index ${index} is missing or has invalid id`);
          }
          if (!client.name || typeof client.name !== 'string') {
            errors.push(`Client at index ${index} is missing or has invalid name`);
          }
        });
      }

      if (backupData.projects) {
        backupData.projects.forEach((project, index) => {
          if (!project.id || typeof project.id !== 'string') {
            errors.push(`Project at index ${index} is missing or has invalid id`);
          }
          if (!project.name || typeof project.name !== 'string') {
            errors.push(`Project at index ${index} is missing or has invalid name`);
          }
        });
      }

      if (backupData.columns) {
        backupData.columns.forEach((column, index) => {
          if (!column.id || typeof column.id !== 'string') {
            errors.push(`Column at index ${index} is missing or has invalid id`);
          }
          if (!column.name || typeof column.name !== 'string') {
            errors.push(`Column at index ${index} is missing or has invalid name`);
          }
        });
      }

      // Validate date formats (ISO 8601)
      const dateFields = [
        { data: backupData.tasks, type: 'task', fields: ['createdAt', 'updatedAt', 'dueDate'] },
        { data: backupData.timeEntries, type: 'timeEntry', fields: ['startTime', 'endTime', 'createdAt', 'updatedAt'] },
        { data: backupData.clients, type: 'client', fields: ['createdAt', 'updatedAt'] },
        { data: backupData.projects, type: 'project', fields: ['createdAt', 'updatedAt'] },
        { data: backupData.columns, type: 'column', fields: ['createdAt', 'updatedAt'] },
      ];

      for (const { data, type, fields } of dateFields) {
        if (Array.isArray(data)) {
          data.forEach((item, index) => {
            for (const field of fields) {
              const value = (item as Record<string, unknown>)[field];
              if (value !== null && value !== undefined) {
                if (typeof value === 'string') {
                  const date = new Date(value);
                  if (isNaN(date.getTime())) {
                    errors.push(`${type} at index ${index} has invalid ${field} date format`);
                  }
                } else {
                  errors.push(`${type} at index ${index} has invalid ${field} type (expected string)`);
                }
              }
            }
          });
        }
      }

      // Validate relationships (warnings, not errors - we'll repair them)
      const relationshipWarnings = this.validateRelationships(backupData);
      warnings.push(...relationshipWarnings);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Validate relationships between entities
   * Returns warnings for orphaned references
   */
  private validateRelationships(backupData: BackupData): string[] {
    const warnings: string[] = [];

    const clientIds = new Set(backupData.clients.map((c) => c.id));
    const projectIds = new Set(backupData.projects.map((p) => p.id));
    const columnIds = new Set(backupData.columns.map((c) => c.id));
    const taskIds = new Set(backupData.tasks.map((t) => t.id));

    // Validate projects reference valid clients
    backupData.projects.forEach((project) => {
      if (project.clientId && !clientIds.has(project.clientId)) {
        warnings.push(`Project "${project.name}" references non-existent clientId: ${project.clientId}`);
      }
    });

    // Validate tasks reference valid clients, projects, and columns
    backupData.tasks.forEach((task) => {
      if (task.clientId && !clientIds.has(task.clientId)) {
        warnings.push(`Task "${task.title}" references non-existent clientId: ${task.clientId}`);
      }
      if (task.projectId && !projectIds.has(task.projectId)) {
        warnings.push(`Task "${task.title}" references non-existent projectId: ${task.projectId}`);
      }
      if (task.columnId && !columnIds.has(task.columnId)) {
        warnings.push(`Task "${task.title}" references non-existent columnId: ${task.columnId}`);
      }
      // Validate project.clientId matches task.clientId if both exist
      if (task.projectId && task.clientId) {
        const project = backupData.projects.find((p) => p.id === task.projectId);
        if (project && project.clientId !== task.clientId) {
          warnings.push(`Task "${task.title}" clientId (${task.clientId}) doesn't match project's clientId (${project.clientId})`);
        }
      }
    });

    // Validate time entries reference valid tasks
    backupData.timeEntries.forEach((entry) => {
      if (!taskIds.has(entry.taskId)) {
        warnings.push(`TimeEntry references non-existent taskId: ${entry.taskId}`);
      }
    });

    return warnings;
  }

  /**
   * Generate preview of backup data
   * @param file - Backup file to preview
   * @returns Promise resolving to backup preview
   */
  async previewBackupData(file: File): Promise<BackupPreview> {
    const backupData = await this.readBackupFile(file);

    // Calculate record counts
    const taskCount = backupData.tasks?.length || 0;
    const timeEntryCount = backupData.timeEntries?.length || 0;
    const clientCount = backupData.clients?.length || 0;
    const projectCount = backupData.projects?.length || 0;
    const columnCount = backupData.columns?.length || 0;

    // Calculate date range
    const allDates: Date[] = [];

    // Collect dates from tasks
    backupData.tasks?.forEach((task) => {
      if (task.createdAt) allDates.push(new Date(task.createdAt));
      if (task.updatedAt) allDates.push(new Date(task.updatedAt));
      if (task.dueDate) allDates.push(new Date(task.dueDate));
    });

    // Collect dates from time entries
    backupData.timeEntries?.forEach((entry) => {
      if (entry.startTime) allDates.push(new Date(entry.startTime));
      if (entry.endTime) allDates.push(new Date(entry.endTime));
      if (entry.createdAt) allDates.push(new Date(entry.createdAt));
      if (entry.updatedAt) allDates.push(new Date(entry.updatedAt));
    });

    const earliest = allDates.length > 0 ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : new Date();
    const latest = allDates.length > 0 ? new Date(Math.max(...allDates.map((d) => d.getTime()))) : new Date();

    // Extract export date and version
    const exportDate = backupData.metadata?.exportDate ? new Date(backupData.metadata.exportDate) : new Date();
    const version = backupData.metadata?.version || 'unknown';

    // Get validation warnings
    const validation = await this.validateBackupFile(file);
    const warnings = validation.warnings;

    return {
      taskCount,
      timeEntryCount,
      clientCount,
      projectCount,
      columnCount,
      dateRange: {
        earliest,
        latest,
      },
      exportDate,
      version,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Restore backup data
   * @param file - Backup file to restore
   * @param mode - Restore mode: 'replace' or 'merge'
   * @returns Promise resolving to merge statistics (if merge mode) or void
   */
  async restoreBackup(file: File, mode: RestoreMode): Promise<MergeStatistics | void> {
    // Validate backup file first
    const validation = await this.validateBackupFile(file);
    if (!validation.isValid) {
      throw new Error(`Backup file validation failed: ${validation.errors.join('; ')}`);
    }

    const backupData = await this.readBackupFile(file);

    // Parse date strings back to Date objects
    const parsedData = this.parseBackupData(backupData);

    // Repair relationships before import
    const repairedData = this.repairRelationships({
      tasks: parsedData.tasks,
      timeEntries: parsedData.timeEntries,
      clients: parsedData.clients,
      projects: parsedData.projects,
      columns: parsedData.columns,
    });

    const finalData = {
      ...repairedData,
      settings: parsedData.settings,
    };

    if (mode === 'replace') {
      await this.restoreReplaceMode(finalData);
    } else {
      return await this.restoreMergeMode(finalData);
    }
  }

  /**
   * Repair orphaned references in backup data
   * Sets invalid references to null or skips entries with critical missing references
   */
  private repairRelationships(parsedData: {
    tasks: Task[];
    timeEntries: TimeEntry[];
    clients: Client[];
    projects: Project[];
    columns: Column[];
  }): {
    tasks: Task[];
    timeEntries: TimeEntry[];
    clients: Client[];
    projects: Project[];
    columns: Column[];
  } {
    const clientIds = new Set(parsedData.clients.map((c) => c.id));
    const projectIds = new Set(parsedData.projects.map((p) => p.id));
    const columnIds = new Set(parsedData.columns.map((c) => c.id));
    const taskIds = new Set(parsedData.tasks.map((t) => t.id));

    // Repair projects: set clientId to null if client doesn't exist
    const repairedProjects = parsedData.projects.map((project) => {
      if (project.clientId && !clientIds.has(project.clientId)) {
        return { ...project, clientId: null };
      }
      return project;
    });

    // Repair tasks: set invalid references to null
    const repairedTasks = parsedData.tasks
      .map((task) => {
        // Skip tasks with invalid columnId (required field)
        if (!columnIds.has(task.columnId)) {
          return null;
        }

        // Repair optional references
        const repairedTask = { ...task };
        if (task.clientId && !clientIds.has(task.clientId)) {
          repairedTask.clientId = null;
        }
        if (task.projectId && !projectIds.has(task.projectId)) {
          repairedTask.projectId = null;
        }
        // Validate project.clientId matches task.clientId if both exist
        if (task.projectId && task.clientId) {
          const project = repairedProjects.find((p) => p.id === task.projectId);
          if (project && project.clientId !== task.clientId) {
            repairedTask.clientId = project.clientId || null;
          }
        }
        return repairedTask;
      })
      .filter((task): task is Task => task !== null);

    // Repair time entries: skip entries with invalid taskId (required field)
    const repairedTimeEntries = parsedData.timeEntries.filter((entry) =>
      taskIds.has(entry.taskId)
    );

    return {
      tasks: repairedTasks,
      timeEntries: repairedTimeEntries,
      clients: parsedData.clients,
      projects: repairedProjects,
      columns: parsedData.columns,
    };
  }

  /**
   * Parse backup data: convert ISO date strings to Date objects
   */
  private parseBackupData(backupData: BackupData): {
    tasks: Task[];
    timeEntries: TimeEntry[];
    clients: Client[];
    projects: Project[];
    columns: Column[];
    settings: Settings;
  } {
    return {
      tasks: backupData.tasks.map((task) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
      })) as Task[],
      timeEntries: backupData.timeEntries.map((entry) => ({
        ...entry,
        startTime: new Date(entry.startTime),
        endTime: entry.endTime ? new Date(entry.endTime) : null,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt),
      })) as TimeEntry[],
      clients: backupData.clients.map((client) => ({
        ...client,
        createdAt: new Date(client.createdAt),
        updatedAt: new Date(client.updatedAt),
      })) as Client[],
      projects: backupData.projects.map((project) => ({
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
      })) as Project[],
      columns: backupData.columns.map((column) => ({
        ...column,
        createdAt: new Date(column.createdAt),
        updatedAt: new Date(column.updatedAt),
      })) as Column[],
      settings: {
        ...backupData.settings,
        updatedAt: new Date(backupData.settings.updatedAt),
      } as Settings,
    };
  }

  /**
   * Restore in replace mode: clear all data and import backup
   */
  private async restoreReplaceMode(parsedData: {
    tasks: Task[];
    timeEntries: TimeEntry[];
    clients: Client[];
    projects: Project[];
    columns: Column[];
    settings: Settings;
  }): Promise<void> {
    // Use Dexie transaction for atomicity
    await db.transaction('rw', db.clients, db.projects, db.columns, db.tasks, db.timeEntries, db.settings, async () => {
      // Clear all tables in correct order (respecting foreign keys)
      await db.timeEntries.clear();
      await db.tasks.clear();
      await db.columns.clear();
      await db.projects.clear();
      await db.clients.clear();
      await db.settings.clear();

      // Import data in correct order: clients → projects → columns → tasks → time entries → settings
      if (parsedData.clients.length > 0) {
        await db.clients.bulkAdd(parsedData.clients);
      }
      if (parsedData.projects.length > 0) {
        await db.projects.bulkAdd(parsedData.projects);
      }
      if (parsedData.columns.length > 0) {
        await db.columns.bulkAdd(parsedData.columns);
      }
      if (parsedData.tasks.length > 0) {
        await db.tasks.bulkAdd(parsedData.tasks);
      }
      if (parsedData.timeEntries.length > 0) {
        await db.timeEntries.bulkAdd(parsedData.timeEntries);
      }
      await db.settings.put(parsedData.settings);
    });
  }

  /**
   * Restore in merge mode: merge backup data with existing data
   */
  private async restoreMergeMode(parsedData: {
    tasks: Task[];
    timeEntries: TimeEntry[];
    clients: Client[];
    projects: Project[];
    columns: Column[];
    settings: Settings;
  }): Promise<MergeStatistics> {
    const stats: MergeStatistics = {
      added: { tasks: 0, timeEntries: 0, clients: 0, projects: 0, columns: 0 },
      updated: { tasks: 0, timeEntries: 0, clients: 0, projects: 0, columns: 0 },
      skipped: { tasks: 0, timeEntries: 0, clients: 0, projects: 0, columns: 0 },
    };

    // Use Dexie transaction for atomicity
    await db.transaction('rw', db.clients, db.projects, db.columns, db.tasks, db.timeEntries, db.settings, async () => {
      // Load existing data
      const existingClients = await db.clients.toArray();
      const existingProjects = await db.projects.toArray();
      const existingColumns = await db.columns.toArray();
      const existingTasks = await db.tasks.toArray();
      const existingTimeEntries = await db.timeEntries.toArray();

      const existingClientIds = new Set(existingClients.map((c) => c.id));
      const existingProjectIds = new Set(existingProjects.map((p) => p.id));
      const existingColumnIds = new Set(existingColumns.map((c) => c.id));
      const existingTaskIds = new Set(existingTasks.map((t) => t.id));
      const existingTimeEntryIds = new Set(existingTimeEntries.map((e) => e.id));

      // Merge clients: import if ID doesn't exist, update if exists
      const clientsToAdd: Client[] = [];
      const clientsToUpdate: Client[] = [];
      parsedData.clients.forEach((client) => {
        if (existingClientIds.has(client.id)) {
          clientsToUpdate.push(client);
          stats.updated.clients++;
        } else {
          clientsToAdd.push(client);
          stats.added.clients++;
        }
      });
      if (clientsToAdd.length > 0) {
        await db.clients.bulkAdd(clientsToAdd);
      }
      for (const client of clientsToUpdate) {
        await db.clients.put(client);
      }

      // Merge projects: import if ID doesn't exist, update if exists
      const projectsToAdd: Project[] = [];
      const projectsToUpdate: Project[] = [];
      parsedData.projects.forEach((project) => {
        if (existingProjectIds.has(project.id)) {
          projectsToUpdate.push(project);
          stats.updated.projects++;
        } else {
          projectsToAdd.push(project);
          stats.added.projects++;
        }
      });
      if (projectsToAdd.length > 0) {
        await db.projects.bulkAdd(projectsToAdd);
      }
      for (const project of projectsToUpdate) {
        await db.projects.put(project);
      }

      // Merge columns: import if ID doesn't exist, update if exists
      const columnsToAdd: Column[] = [];
      const columnsToUpdate: Column[] = [];
      parsedData.columns.forEach((column) => {
        if (existingColumnIds.has(column.id)) {
          columnsToUpdate.push(column);
          stats.updated.columns++;
        } else {
          columnsToAdd.push(column);
          stats.added.columns++;
        }
      });
      if (columnsToAdd.length > 0) {
        await db.columns.bulkAdd(columnsToAdd);
      }
      for (const column of columnsToUpdate) {
        await db.columns.put(column);
      }

      // Merge tasks: import if ID doesn't exist, update if exists
      const tasksToAdd: Task[] = [];
      const tasksToUpdate: Task[] = [];
      parsedData.tasks.forEach((task) => {
        if (existingTaskIds.has(task.id)) {
          tasksToUpdate.push(task);
          stats.updated.tasks++;
        } else {
          tasksToAdd.push(task);
          stats.added.tasks++;
        }
      });
      if (tasksToAdd.length > 0) {
        await db.tasks.bulkAdd(tasksToAdd);
      }
      for (const task of tasksToUpdate) {
        await db.tasks.put(task);
      }

      // Merge time entries: import if ID doesn't exist, update if exists
      const timeEntriesToAdd: TimeEntry[] = [];
      const timeEntriesToUpdate: TimeEntry[] = [];
      parsedData.timeEntries.forEach((entry) => {
        if (existingTimeEntryIds.has(entry.id)) {
          timeEntriesToUpdate.push(entry);
          stats.updated.timeEntries++;
        } else {
          timeEntriesToAdd.push(entry);
          stats.added.timeEntries++;
        }
      });
      if (timeEntriesToAdd.length > 0) {
        await db.timeEntries.bulkAdd(timeEntriesToAdd);
      }
      for (const entry of timeEntriesToUpdate) {
        await db.timeEntries.put(entry);
      }

      // Merge settings: replace (settings is singleton)
      await db.settings.put(parsedData.settings);
    });

    return stats;
  }
}
