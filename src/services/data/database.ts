import Dexie, { Table } from 'dexie';
import { Task } from '@/types/task';
import { Client } from '@/types/client';
import { Project } from '@/types/project';
import { Column } from '@/types/column';

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
 */
class TimeTrackingDB extends Dexie {
  tasks!: Table<Task>;
  clients!: Table<Client>;
  projects!: Table<Project>;
  columns!: Table<Column>;

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
  }
}

export const db = new TimeTrackingDB();
