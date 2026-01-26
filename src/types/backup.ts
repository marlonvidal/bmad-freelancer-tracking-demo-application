import { Task } from './task';
import { TimeEntry } from './timeEntry';
import { Client } from './client';
import { Project } from './project';
import { Column } from './column';
import { Settings } from './settings';

/**
 * Backup data format matching export format from Story 4.3
 * This format is used for both backup and restore operations
 */
export interface BackupData {
  tasks: Task[];
  timeEntries: TimeEntry[];
  clients: Client[];
  projects: Project[];
  columns: Column[];
  settings: Settings;
  metadata: {
    exportDate: string; // ISO 8601
    version: string; // App version
    counts: {
      tasks: number;
      timeEntries: number;
      clients: number;
      projects: number;
      columns: number;
    };
  };
}

/**
 * Backup validation result
 * Returned after validating a backup file before import
 */
export interface BackupValidationResult {
  isValid: boolean;
  errors: string[]; // Critical errors that prevent import
  warnings: string[]; // Non-critical issues (orphaned references, etc.)
}

/**
 * Backup preview information
 * Displayed to user before confirming restore operation
 */
export interface BackupPreview {
  taskCount: number;
  timeEntryCount: number;
  clientCount: number;
  projectCount: number;
  columnCount: number;
  dateRange: {
    earliest: Date;
    latest: Date;
  };
  exportDate: Date;
  version: string;
  warnings?: string[]; // Validation warnings
}

/**
 * Restore mode: replace all data or merge with existing
 */
export type RestoreMode = 'replace' | 'merge';

/**
 * Merge statistics returned after merge restore
 */
export interface MergeStatistics {
  added: {
    tasks: number;
    timeEntries: number;
    clients: number;
    projects: number;
    columns: number;
  };
  updated: {
    tasks: number;
    timeEntries: number;
    clients: number;
    projects: number;
    columns: number;
  };
  skipped: {
    tasks: number;
    timeEntries: number;
    clients: number;
    projects: number;
    columns: number;
  };
}
