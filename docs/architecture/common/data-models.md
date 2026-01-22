# Data Models

The core data models represent the business entities that will be stored in IndexedDB. These models define the structure of tasks, clients, projects, time entries, and application configuration. All models use TypeScript interfaces for type safety and can be shared between the data layer and React components.

## Task

**Purpose:** Represents a single work item on the kanban board. Tasks are the primary entity that users interact with, containing all task-related information including time tracking, client/project assignment, and status.

**Key Attributes:**
- `id`: string - Unique identifier (UUID)
- `title`: string - Task title (required)
- `description`: string - Detailed task description (optional)
- `columnId`: string - ID of the kanban column this task belongs to
- `position`: number - Position/order within the column (for drag-and-drop ordering)
- `clientId`: string | null - Reference to assigned client (optional)
- `projectId`: string | null - Reference to assigned project (optional, requires clientId)
- `isBillable`: boolean - Whether this task is billable (default: false)
- `hourlyRate`: number | null - Task-specific hourly rate (overrides client/project rate if set)
- `timeEstimate`: number | null - Estimated time in minutes (optional)
- `dueDate`: Date | null - Task due date (optional)
- `priority`: 'low' | 'medium' | 'high' | null - Task priority level (optional)
- `tags`: string[] - Array of tag strings for categorization
- `createdAt`: Date - Timestamp when task was created
- `updatedAt`: Date - Timestamp when task was last updated

**TypeScript Interface:**
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  position: number;
  clientId: string | null;
  projectId: string | null;
  isBillable: boolean;
  hourlyRate: number | null;
  timeEstimate: number | null; // in minutes
  dueDate: Date | null;
  priority: 'low' | 'medium' | 'high' | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- Belongs to one Column (via `columnId`)
- Belongs to zero or one Client (via `clientId`)
- Belongs to zero or one Project (via `projectId`, requires `clientId`)
- Has many TimeEntry records (one-to-many)
- Has many Subtasks (one-to-many, separate table)

## Client

**Purpose:** Represents a client that tasks can be assigned to. Clients have default hourly rates that can be overridden at the project or task level.

**Key Attributes:**
- `id`: string - Unique identifier (UUID)
- `name`: string - Client name (required)
- `defaultHourlyRate`: number | null - Default hourly rate for this client (optional)
- `contactInfo`: string | null - Contact information (email, phone, etc.) (optional)
- `createdAt`: Date - Timestamp when client was created
- `updatedAt`: Date - Timestamp when client was last updated

**TypeScript Interface:**
```typescript
interface Client {
  id: string;
  name: string;
  defaultHourlyRate: number | null;
  contactInfo: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- Has many Projects (one-to-many)
- Has many Tasks (one-to-many via `clientId`)

## Project

**Purpose:** Represents a project within a client. Projects allow organizing tasks hierarchically (Client → Project → Task).

**Key Attributes:**
- `id`: string - Unique identifier (UUID)
- `clientId`: string - Reference to parent client (required)
- `name`: string - Project name (required)
- `description`: string | null - Project description (optional)
- `defaultHourlyRate`: number | null - Default hourly rate for this project (overrides client rate)
- `createdAt`: Date - Timestamp when project was created
- `updatedAt`: Date - Timestamp when project was last updated

**TypeScript Interface:**
```typescript
interface Project {
  id: string;
  clientId: string;
  name: string;
  description?: string;
  defaultHourlyRate: number | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- Belongs to one Client (via `clientId`)
- Has many Tasks (one-to-many via `projectId`)

## TimeEntry

**Purpose:** Represents a time tracking session for a task. Time entries can be created automatically by the timer or manually added by the user.

**Key Attributes:**
- `id`: string - Unique identifier (UUID)
- `taskId`: string - Reference to the task this time entry belongs to
- `startTime`: Date - Start timestamp of the time entry
- `endTime`: Date | null - End timestamp (null if timer is still running)
- `duration`: number - Duration in minutes (calculated or manually entered)
- `isManual`: boolean - Whether this entry was manually added (vs. tracked by timer)
- `description`: string | null - Optional notes/description for this time entry
- `createdAt`: Date - Timestamp when entry was created
- `updatedAt`: Date - Timestamp when entry was last updated

**TypeScript Interface:**
```typescript
interface TimeEntry {
  id: string;
  taskId: string;
  startTime: Date;
  endTime: Date | null;
  duration: number; // in minutes
  isManual: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- Belongs to one Task (via `taskId`)

## Column

**Purpose:** Represents a kanban board column. Columns define the workflow stages (e.g., Backlog, In Progress, Review, Done).

**Key Attributes:**
- `id`: string - Unique identifier (UUID)
- `name`: string - Column name (e.g., "In Progress")
- `position`: number - Order/position of column on the board
- `color`: string | null - Color code for visual distinction (hex color)
- `createdAt`: Date - Timestamp when column was created
- `updatedAt`: Date - Timestamp when column was last updated

**TypeScript Interface:**
```typescript
interface Column {
  id: string;
  name: string;
  position: number;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- Has many Tasks (one-to-many via `columnId`)

## TimerState

**Purpose:** Represents the current state of an active timer. This model is used for background timer operation and cross-tab synchronization.

**Key Attributes:**
- `taskId`: string - ID of the task with active timer
- `startTime`: Date - Timestamp when timer started
- `lastUpdateTime`: Date - Last time timer state was updated (for background sync)
- `status`: 'active' | 'paused' | 'stopped' - Current timer status

**TypeScript Interface:**
```typescript
interface TimerState {
  taskId: string;
  startTime: Date;
  lastUpdateTime: Date;
  status: 'active' | 'paused' | 'stopped';
}
```

**Relationships:**
- References one Task (via `taskId`)

## Settings

**Purpose:** Stores application-wide settings and user preferences.

**Key Attributes:**
- `id`: string - Always 'default' (single settings record)
- `darkMode`: boolean - Dark mode enabled/disabled
- `defaultBillableStatus`: boolean - Default billable status for new tasks
- `defaultHourlyRate`: number | null - Global default hourly rate
- `keyboardShortcuts`: Record<string, string> - Custom keyboard shortcut mappings
- `onboardingCompleted`: boolean - Whether user completed onboarding wizard
- `updatedAt`: Date - Timestamp when settings were last updated

**TypeScript Interface:**
```typescript
interface Settings {
  id: 'default';
  darkMode: boolean;
  defaultBillableStatus: boolean;
  defaultHourlyRate: number | null;
  keyboardShortcuts: Record<string, string>;
  onboardingCompleted: boolean;
  updatedAt: Date;
}
```

**Relationships:**
- No relationships (singleton configuration object)

## Subtask

**Purpose:** Represents a subtask within a parent task. Subtasks allow breaking down larger tasks into smaller, manageable pieces.

**Key Attributes:**
- `id`: string - Unique identifier (UUID)
- `taskId`: string - Reference to parent task (required)
- `title`: string - Subtask title (required)
- `completed`: boolean - Whether subtask is completed
- `position`: number - Order/position within parent task
- `createdAt`: Date - Timestamp when subtask was created
- `updatedAt`: Date - Timestamp when subtask was last updated

**TypeScript Interface:**
```typescript
interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- Belongs to one Task (via `taskId`)
