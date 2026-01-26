import { Task } from './task';
import { TimeEntry } from './timeEntry';
import { Client } from './client';
import { Project } from './project';
import { Column } from './column';
import { Settings } from './settings';

/**
 * Export filters for filtering export data
 */
export interface ExportFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Export metadata included in exports
 */
export interface ExportMetadata {
  exportDate: string; // ISO 8601
  version: string; // App version
  counts: {
    tasks?: number;
    timeEntries?: number;
    clients?: number;
    projects?: number;
    columns?: number;
  };
}

/**
 * Exported task with resolved names for CSV readability
 */
export interface ExportedTask extends Task {
  clientName?: string | null;
  projectName?: string | null;
  columnName?: string | null;
}

/**
 * Exported time entry with resolved task information
 */
export interface ExportedTimeEntry extends TimeEntry {
  taskTitle?: string;
  clientName?: string | null;
  projectName?: string | null;
  isBillable?: boolean; // From task
}

/**
 * Exported client
 */
export interface ExportedClient extends Client {}

/**
 * Exported project with resolved client name
 */
export interface ExportedProject extends Project {
  clientName?: string;
}

/**
 * Complete export data structure for all-data exports
 */
export interface ExportedData {
  tasks?: Task[];
  timeEntries?: TimeEntry[];
  clients?: Client[];
  projects?: Project[];
  columns?: Column[];
  settings?: Settings;
  metadata: ExportMetadata;
}

/**
 * Export data structure for time entries export
 */
export interface TimeEntriesExportData {
  timeEntries: ExportedTimeEntry[];
  metadata: {
    exportDate: string;
    count: number;
  };
}

/**
 * Export data structure for tasks export
 */
export interface TasksExportData {
  tasks: ExportedTask[];
  clients: Client[];
  projects: Project[];
  metadata: {
    exportDate: string;
    taskCount: number;
    clientCount: number;
    projectCount: number;
  };
}
