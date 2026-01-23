import Dexie, { Table } from 'dexie';
import { Task } from '@/types/task';
import { Client } from '@/types/client';
import { Project } from '@/types/project';
import { Column } from '@/types/column';
import { TimerState } from '@/types/timerState';
import { TimeEntry } from '@/types/timeEntry';
import { Settings } from '@/types/settings';

/**
 * TimeTrackingDB - IndexedDB database wrapper using Dexie.js
 * 
 * Database schema version 1:
 * - tasks: id, columnId, clientId, projectId, createdAt, updatedAt, [clientId+projectId]
 * - clients: id, name, createdAt
 * - projects: id, clientId, name, [clientId+name]
 * 
 * Database schema version 2:
 * - Added columns table: id, position
 * 
 * Database schema version 3:
 * - Added timerState table: taskId (primary key, unique)
 * - Added timeEntries table: id, taskId, startTime, endTime, [taskId+startTime]
 * 
 * Database schema version 4:
 * - Added settings table: id (primary key, singleton with id='default')
 */
class TimeTrackingDB extends Dexie {
  tasks!: Table<Task>;
  clients!: Table<Client>;
  projects!: Table<Project>;
  columns!: Table<Column>;
  timerState!: Table<TimerState>;
  timeEntries!: Table<TimeEntry>;
  settings!: Table<Settings>;

  constructor() {
    super('TimeTrackingDB');
    
    this.version(1).stores({
      tasks: 'id, columnId, clientId, projectId, createdAt, updatedAt, [clientId+projectId]',
      clients: 'id, name, createdAt',
      projects: 'id, clientId, name, [clientId+name]'
    });

    this.version(2).stores({
      tasks: 'id, columnId, clientId, projectId, createdAt, updatedAt, [clientId+projectId]',
      clients: 'id, name, createdAt',
      projects: 'id, clientId, name, [clientId+name]',
      columns: 'id, position'
    });

    this.version(3).stores({
      tasks: 'id, columnId, clientId, projectId, createdAt, updatedAt, [clientId+projectId]',
      clients: 'id, name, createdAt',
      projects: 'id, clientId, name, [clientId+name]',
      columns: 'id, position',
      timerState: 'taskId',
      timeEntries: 'id, taskId, startTime, endTime, [taskId+startTime]'
    });

    this.version(4).stores({
      tasks: 'id, columnId, clientId, projectId, createdAt, updatedAt, [clientId+projectId]',
      clients: 'id, name, createdAt',
      projects: 'id, clientId, name, [clientId+name]',
      columns: 'id, position',
      timerState: 'taskId',
      timeEntries: 'id, taskId, startTime, endTime, [taskId+startTime]',
      settings: 'id'
    });
  }
}

export const db = new TimeTrackingDB();
