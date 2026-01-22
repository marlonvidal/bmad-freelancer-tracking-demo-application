import Dexie, { Table } from 'dexie';
import { Task } from '@/types/task';
import { Client } from '@/types/client';
import { Project } from '@/types/project';

/**
 * TimeTrackingDB - IndexedDB database wrapper using Dexie.js
 * 
 * Database schema version 1:
 * - tasks: id, columnId, clientId, projectId, createdAt, updatedAt, [clientId+projectId]
 * - clients: id, name, createdAt
 * - projects: id, clientId, name, [clientId+name]
 */
class TimeTrackingDB extends Dexie {
  tasks!: Table<Task>;
  clients!: Table<Client>;
  projects!: Table<Project>;

  constructor() {
    super('TimeTrackingDB');
    
    this.version(1).stores({
      tasks: 'id, columnId, clientId, projectId, createdAt, updatedAt, [clientId+projectId]',
      clients: 'id, name, createdAt',
      projects: 'id, clientId, name, [clientId+name]'
    });
  }
}

export const db = new TimeTrackingDB();
