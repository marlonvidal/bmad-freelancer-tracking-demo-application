# Database Schema

The database schema is defined using Dexie.js schema syntax. IndexedDB is a NoSQL database, but we use Dexie.js to define structured tables with indexes for efficient querying.

## Dexie.js Schema Definition

```typescript
import Dexie, { Table } from 'dexie';

class TimeTrackingDB extends Dexie {
  tasks!: Table<Task>;
  clients!: Table<Client>;
  projects!: Table<Project>;
  timeEntries!: Table<TimeEntry>;
  columns!: Table<Column>;
  subtasks!: Table<Subtask>;
  timerState!: Table<TimerState>;
  settings!: Table<Settings>;

  constructor() {
    super('TimeTrackingDB');
    
    this.version(1).stores({
      tasks: 'id, columnId, clientId, projectId, createdAt, updatedAt, [clientId+projectId]',
      clients: 'id, name, createdAt',
      projects: 'id, clientId, name, [clientId+name]',
      timeEntries: 'id, taskId, startTime, endTime, [taskId+startTime]',
      columns: 'id, position',
      subtasks: 'id, taskId, position, [taskId+position]',
      timerState: 'taskId',
      settings: 'id'
    });
  }
}

export const db = new TimeTrackingDB();
```

## Index Strategy

**Tasks Table:**
- Primary key: `id`
- Indexes:
  - `columnId` - Fast filtering by column
  - `clientId` - Fast filtering by client
  - `projectId` - Fast filtering by project
  - `createdAt` - Sorting by creation date
  - `updatedAt` - Sorting by update date
  - `[clientId+projectId]` - Compound index for client/project queries

**Time Entries Table:**
- Primary key: `id`
- Indexes:
  - `taskId` - Fast lookup of all entries for a task
  - `startTime` - Sorting and date range queries
  - `[taskId+startTime]` - Compound index for task time entry queries

**Projects Table:**
- Primary key: `id`
- Indexes:
  - `clientId` - Fast lookup of projects by client
  - `[clientId+name]` - Compound index for unique project names per client

**Subtasks Table:**
- Primary key: `id`
- Indexes:
  - `taskId` - Fast lookup of subtasks for a task
  - `[taskId+position]` - Compound index for ordered subtask queries

**Other Tables:**
- `columns`: Indexed by `position` for ordered display
- `timerState`: Indexed by `taskId` (unique, only one active timer)
- `settings`: Single record with `id: 'default'`

## Data Relationships

Relationships are maintained through foreign key references (string IDs):
- Tasks → Columns (via `columnId`)
- Tasks → Clients (via `clientId`, nullable)
- Tasks → Projects (via `projectId`, nullable, requires `clientId`)
- Time Entries → Tasks (via `taskId`)
- Subtasks → Tasks (via `taskId`)
- Projects → Clients (via `clientId`)
- Timer State → Tasks (via `taskId`)

## Migration Strategy

Dexie.js handles schema migrations automatically through version increments. The migration strategy ensures data integrity and smooth upgrades:

**Migration Process:**
1. **Version Increment:** When schema changes are needed, increment the version number in the Dexie schema definition
2. **Migration Callbacks:** Define migration functions that transform existing data to match the new schema
3. **Automatic Index Updates:** Dexie.js automatically creates/updates indexes based on the new schema
4. **Data Transformation:** Use migration callbacks to transform data structure, add default values, or clean up deprecated fields

**Example Migration:**
```typescript
class TimeTrackingDB extends Dexie {
  // ... table definitions

  constructor() {
    super('TimeTrackingDB');
    
    // Version 1: Initial schema
    this.version(1).stores({
      tasks: 'id, columnId, clientId, projectId, createdAt, updatedAt',
      // ... other tables
    });
    
    // Version 2: Add compound index for tasks
    this.version(2).stores({
      tasks: 'id, columnId, clientId, projectId, createdAt, updatedAt, [clientId+projectId]',
      // ... other tables
    }).upgrade(async (tx) => {
      // Migration logic if needed (e.g., data transformation)
      // Indexes are automatically created, but data transformations go here
    });
    
    // Version 3: Add new field to tasks (example)
    this.version(3).stores({
      tasks: 'id, columnId, clientId, projectId, createdAt, updatedAt, [clientId+projectId], tags',
      // ... other tables
    }).upgrade(async (tx) => {
      // Add default empty array for tags to existing tasks
      await tx.table('tasks').toCollection().modify(task => {
        if (!task.tags) {
          task.tags = [];
        }
      });
    });
  }
}
```

**Migration Best Practices:**
- **Always test migrations** with production-like data before deploying
- **Keep migrations reversible** when possible (document rollback procedures)
- **Use transactions** for atomic migrations (Dexie handles this automatically)
- **Handle edge cases** (null values, missing fields, corrupted data)
- **Version incrementally** - don't skip versions
- **Document breaking changes** in migration comments

**Data Seeding:**
- Initial data (default columns, settings) can be seeded in the first migration
- Use `tx.table('columns').bulkAdd()` for initial column setup
- Settings record can be created with default values

**Rollback Strategy:**
- Dexie.js doesn't support automatic rollback
- If migration fails, the database remains in the previous version
- Manual rollback requires:
  1. Revert code to previous version
  2. Clear IndexedDB or restore from backup
  3. User can export data before migration for safety
