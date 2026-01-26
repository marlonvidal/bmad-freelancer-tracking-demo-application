import Papa from 'papaparse';
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
  ExportFilters,
  ExportedTask,
  ExportedTimeEntry,
  ExportedData,
  TimeEntriesExportData,
  TasksExportData,
} from '@/types/export';
import { downloadFile, formatDateForFilename, formatDateTimeForFilename } from '@/utils/fileUtils';

/**
 * ExportService - Service for exporting data to CSV and JSON formats
 * 
 * Provides methods for exporting time tracking data, tasks, and all data
 * in CSV or JSON formats. Handles data relationships, date formatting,
 * and large dataset performance.
 */
export class ExportService {
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
   * Export time entries to CSV or JSON format
   * 
   * @param format - Export format ('csv' or 'json')
   * @param filters - Optional filters for date range
   */
  async exportTimeEntries(
    format: 'csv' | 'json',
    filters?: ExportFilters
  ): Promise<void> {
    try {
      // Fetch all time entries
      let timeEntries = await this.timeEntryRepository.getAll();

      // Apply date range filter if provided
      if (filters?.dateRange) {
        const { start, end } = filters.dateRange;
        timeEntries = timeEntries.filter((entry) => {
          const entryDate = entry.startTime;
          return entryDate >= start && entryDate <= end;
        });
      }

      // Check for empty dataset
      if (timeEntries.length === 0) {
        throw new Error('No time entries found to export');
      }

      // Resolve task information for each time entry
      const exportedEntries = await this.resolveTimeEntryRelationships(timeEntries);

      if (format === 'csv') {
        await this.exportTimeEntriesToCSV(exportedEntries, filters);
      } else {
        await this.exportTimeEntriesToJSON(exportedEntries);
      }
    } catch (error) {
      console.error('Error exporting time entries:', error);
      throw error;
    }
  }

  /**
   * Export tasks to CSV or JSON format
   * 
   * @param format - Export format ('csv' or 'json')
   * @param filters - Optional filters for date range
   */
  async exportTasks(
    format: 'csv' | 'json',
    filters?: ExportFilters
  ): Promise<void> {
    try {
      // Fetch all tasks
      let tasks = await this.taskRepository.getAll();

      // Apply date range filter if provided
      if (filters?.dateRange) {
        const { start, end } = filters.dateRange;
        tasks = tasks.filter((task) => {
          // Filter by createdAt, updatedAt, or dueDate
          const createdInRange = task.createdAt >= start && task.createdAt <= end;
          const updatedInRange = task.updatedAt >= start && task.updatedAt <= end;
          const dueInRange = task.dueDate
            ? task.dueDate >= start && task.dueDate <= end
            : false;
          return createdInRange || updatedInRange || dueInRange;
        });
      }

      // Check for empty dataset
      if (tasks.length === 0) {
        throw new Error('No tasks found to export');
      }

      // Resolve client and project names for each task
      const exportedTasks = await this.resolveTaskRelationships(tasks);

      if (format === 'csv') {
        await this.exportTasksToCSV(exportedTasks, filters);
      } else {
        await this.exportTasksToJSON(exportedTasks);
      }
    } catch (error) {
      console.error('Error exporting tasks:', error);
      throw error;
    }
  }

  /**
   * Create a backup of all application data
   * 
   * Exports all data (tasks, time entries, clients, projects, columns, settings)
   * to a JSON backup file with timestamp in filename. This is specifically designed
   * for backup/restore functionality.
   * 
   * @throws Error if no data found or export fails
   */
  async backupAllData(): Promise<void> {
    try {
      // Fetch all data
      const [tasks, timeEntries, clients, projects, columns, settings] = await Promise.all([
        this.taskRepository.getAll(),
        this.timeEntryRepository.getAll(),
        this.clientRepository.getAll(),
        this.projectRepository.getAll(),
        this.columnRepository.getAll(),
        this.settingsRepository.getSettings(),
      ]);

      // Check for empty dataset
      if (
        tasks.length === 0 &&
        timeEntries.length === 0 &&
        clients.length === 0 &&
        projects.length === 0 &&
        columns.length === 0
      ) {
        throw new Error('No data found to backup');
      }

      // Use existing JSON export logic
      await this.exportAllDataToJSON(
        tasks,
        timeEntries,
        clients,
        projects,
        columns,
        settings
      );
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  /**
   * Export all data (tasks, time entries, clients, projects) to CSV or JSON format
   * 
   * @param format - Export format ('csv' or 'json')
   */
  async exportAllData(format: 'csv' | 'json'): Promise<void> {
    try {
      // Fetch all data
      const [tasks, timeEntries, clients, projects, columns, settings] = await Promise.all([
        this.taskRepository.getAll(),
        this.timeEntryRepository.getAll(),
        this.clientRepository.getAll(),
        this.projectRepository.getAll(),
        this.columnRepository.getAll(),
        this.settingsRepository.getSettings(),
      ]);

      // Check for empty dataset
      if (
        tasks.length === 0 &&
        timeEntries.length === 0 &&
        clients.length === 0 &&
        projects.length === 0
      ) {
        throw new Error('No data found to export');
      }

      if (format === 'csv') {
        await this.exportAllDataToCSV(tasks, timeEntries, clients, projects);
      } else {
        await this.exportAllDataToJSON(
          tasks,
          timeEntries,
          clients,
          projects,
          columns,
          settings
        );
      }
    } catch (error) {
      console.error('Error exporting all data:', error);
      throw error;
    }
  }

  /**
   * Resolve task information for time entries
   */
  private async resolveTimeEntryRelationships(
    timeEntries: TimeEntry[]
  ): Promise<ExportedTimeEntry[]> {
    const tasks = await this.taskRepository.getAll();
    const clients = await this.clientRepository.getAll();
    const projects = await this.projectRepository.getAll();

    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const clientMap = new Map(clients.map((c) => [c.id, c]));
    const projectMap = new Map(projects.map((p) => [p.id, p]));

    return timeEntries.map((entry) => {
      const task = taskMap.get(entry.taskId);
      const exportedEntry: ExportedTimeEntry = {
        ...entry,
        taskTitle: task?.title || 'Unknown Task',
        clientName: null,
        projectName: null,
        isBillable: task?.isBillable || false,
      };

      if (task) {
        if (task.clientId) {
          const client = clientMap.get(task.clientId);
          exportedEntry.clientName = client?.name || null;
        }
        if (task.projectId) {
          const project = projectMap.get(task.projectId);
          exportedEntry.projectName = project?.name || null;
        }
      }

      return exportedEntry;
    });
  }

  /**
   * Resolve client and project names for tasks
   */
  private async resolveTaskRelationships(tasks: Task[]): Promise<ExportedTask[]> {
    const clients = await this.clientRepository.getAll();
    const projects = await this.projectRepository.getAll();
    const columns = await this.columnRepository.getAll();

    const clientMap = new Map(clients.map((c) => [c.id, c]));
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    const columnMap = new Map(columns.map((c) => [c.id, c]));

    return tasks.map((task) => {
      const exportedTask: ExportedTask = {
        ...task,
        clientName: task.clientId ? clientMap.get(task.clientId)?.name || null : null,
        projectName: task.projectId ? projectMap.get(task.projectId)?.name || null : null,
        columnName: columnMap.get(task.columnId)?.name || null,
      };
      return exportedTask;
    });
  }

  /**
   * Format date as readable string for CSV
   */
  private formatDateForCSV(date: Date | null): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Export time entries to CSV
   */
  private async exportTimeEntriesToCSV(
    entries: ExportedTimeEntry[],
    filters?: ExportFilters
  ): Promise<void> {
    // Prepare CSV data
    const csvData = entries.map((entry) => ({
      'Task Title': entry.taskTitle || '',
      Client: entry.clientName || '',
      Project: entry.projectName || '',
      'Start Time': this.formatDateForCSV(entry.startTime),
      'End Time': this.formatDateForCSV(entry.endTime),
      'Duration (minutes)': entry.duration,
      Description: entry.description || '',
      Billable: entry.isBillable ? 'Yes' : 'No',
      'Manual Entry': entry.isManual ? 'Yes' : 'No',
    }));

    // Generate CSV using PapaParse
    const csv = Papa.unparse(csvData, {
      header: true,
      delimiter: ',',
    });

    // Generate filename
    let filename = `time-entries-${formatDateForFilename(new Date())}.csv`;
    if (filters?.dateRange) {
      const startStr = formatDateForFilename(filters.dateRange.start);
      const endStr = formatDateForFilename(filters.dateRange.end);
      filename = `time-entries-${startStr}-to-${endStr}.csv`;
    }

    // Download file
    downloadFile(csv, filename, 'text/csv');
  }

  /**
   * Export time entries to JSON
   */
  private async exportTimeEntriesToJSON(entries: ExportedTimeEntry[]): Promise<void> {
    const exportData: TimeEntriesExportData = {
      timeEntries: entries.map((entry) => ({
        ...entry,
        startTime: entry.startTime.toISOString(),
        endTime: entry.endTime ? entry.endTime.toISOString() : null,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any,
      metadata: {
        exportDate: new Date().toISOString(),
        count: entries.length,
      },
    };

    const json = JSON.stringify(exportData, null, 2);
    const filename = `time-entries-${formatDateForFilename(new Date())}.json`;
    downloadFile(json, filename, 'application/json');
  }

  /**
   * Export tasks to CSV
   */
  private async exportTasksToCSV(
    tasks: ExportedTask[],
    filters?: ExportFilters
  ): Promise<void> {
    // Prepare CSV data
    const csvData = tasks.map((task) => ({
      Title: task.title,
      Description: task.description || '',
      Client: task.clientName || '',
      Project: task.projectName || '',
      Column: task.columnName || '',
      Priority: task.priority || '',
      'Due Date': this.formatDateForCSV(task.dueDate),
      Billable: task.isBillable ? 'Yes' : 'No',
      'Hourly Rate': task.hourlyRate || '',
      'Time Estimate': task.timeEstimate || '',
      Tags: task.tags.join('; '),
      'Created At': this.formatDateForCSV(task.createdAt),
      'Updated At': this.formatDateForCSV(task.updatedAt),
    }));

    // Generate CSV using PapaParse
    const csv = Papa.unparse(csvData, {
      header: true,
      delimiter: ',',
    });

    // Generate filename
    let filename = `tasks-${formatDateForFilename(new Date())}.csv`;
    if (filters?.dateRange) {
      const startStr = formatDateForFilename(filters.dateRange.start);
      const endStr = formatDateForFilename(filters.dateRange.end);
      filename = `tasks-${startStr}-to-${endStr}.csv`;
    }

    // Download file
    downloadFile(csv, filename, 'text/csv');
  }

  /**
   * Export tasks to JSON
   */
  private async exportTasksToJSON(tasks: ExportedTask[]): Promise<void> {
    const clients = await this.clientRepository.getAll();
    const projects = await this.projectRepository.getAll();

    const exportData: TasksExportData = {
      tasks: tasks.map((task) => ({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any,
      clients: clients.map((client) => ({
        ...client,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any,
      projects: projects.map((project) => ({
        ...project,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any,
      metadata: {
        exportDate: new Date().toISOString(),
        taskCount: tasks.length,
        clientCount: clients.length,
        projectCount: projects.length,
      },
    };

    const json = JSON.stringify(exportData, null, 2);
    const filename = `tasks-${formatDateForFilename(new Date())}.json`;
    downloadFile(json, filename, 'application/json');
  }

  /**
   * Export all data to CSV (separate files for each entity type)
   */
  private async exportAllDataToCSV(
    tasks: Task[],
    timeEntries: TimeEntry[],
    clients: Client[],
    projects: Project[]
  ): Promise<void> {
    const dateStr = formatDateForFilename(new Date());

    // Export clients
    if (clients.length > 0) {
      const clientsData = clients.map((client) => ({
        ID: client.id,
        Name: client.name,
        'Default Hourly Rate': client.defaultHourlyRate || '',
        'Contact Info': client.contactInfo || '',
        'Created At': this.formatDateForCSV(client.createdAt),
        'Updated At': this.formatDateForCSV(client.updatedAt),
      }));
      const clientsCSV = Papa.unparse(clientsData, { header: true });
      downloadFile(clientsCSV, `clients-${dateStr}.csv`, 'text/csv');
    }

    // Export projects
    if (projects.length > 0) {
      const clientMap = new Map(clients.map((c) => [c.id, c]));
      const projectsData = projects.map((project) => ({
        ID: project.id,
        'Client ID': project.clientId,
        'Client Name': clientMap.get(project.clientId)?.name || '',
        Name: project.name,
        Description: project.description || '',
        'Default Hourly Rate': project.defaultHourlyRate || '',
        'Created At': this.formatDateForCSV(project.createdAt),
        'Updated At': this.formatDateForCSV(project.updatedAt),
      }));
      const projectsCSV = Papa.unparse(projectsData, { header: true });
      downloadFile(projectsCSV, `projects-${dateStr}.csv`, 'text/csv');
    }

    // Export tasks
    if (tasks.length > 0) {
      const exportedTasks = await this.resolveTaskRelationships(tasks);
      await this.exportTasksToCSV(exportedTasks);
    }

    // Export time entries
    if (timeEntries.length > 0) {
      const exportedEntries = await this.resolveTimeEntryRelationships(timeEntries);
      await this.exportTimeEntriesToCSV(exportedEntries);
    }
  }

  /**
   * Export all data to JSON
   */
  private async exportAllDataToJSON(
    tasks: Task[],
    timeEntries: TimeEntry[],
    clients: Client[],
    projects: Project[],
    columns: Column[],
    settings: Settings
  ): Promise<void> {
    const exportData: ExportedData = {
      tasks: tasks.map((task) => ({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any,
      timeEntries: timeEntries.map((entry) => ({
        ...entry,
        startTime: entry.startTime.toISOString(),
        endTime: entry.endTime ? entry.endTime.toISOString() : null,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any,
      clients: clients.map((client) => ({
        ...client,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any,
      projects: projects.map((project) => ({
        ...project,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any,
      columns: columns.map((column) => ({
        ...column,
        createdAt: column.createdAt.toISOString(),
        updatedAt: column.updatedAt.toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any,
      settings: {
        ...settings,
        updatedAt: settings.updatedAt.toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      metadata: {
        exportDate: new Date().toISOString(),
        version: '0.0.0', // App version from package.json
        counts: {
          tasks: tasks.length,
          timeEntries: timeEntries.length,
          clients: clients.length,
          projects: projects.length,
          columns: columns.length,
        },
      },
    };

    const json = JSON.stringify(exportData, null, 2);
    const filename = `freelanceflow-backup-${formatDateTimeForFilename(new Date())}.json`;
    downloadFile(json, filename, 'application/json');
  }
}
