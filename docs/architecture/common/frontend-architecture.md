# Frontend Architecture

## Component Architecture

### Component Organization

```
src/
├── components/
│   ├── kanban/
│   │   ├── KanbanBoard.tsx
│   │   ├── Column.tsx
│   │   └── TaskCard.tsx
│   ├── task/
│   │   ├── TaskDetailPanel.tsx
│   │   ├── TaskForm.tsx
│   │   └── SubtaskList.tsx
│   ├── timer/
│   │   ├── TimerControl.tsx
│   │   └── TimerDisplay.tsx
│   ├── client/
│   │   ├── ClientSelector.tsx
│   │   └── ClientForm.tsx
│   ├── project/
│   │   ├── ProjectSelector.tsx
│   │   └── ProjectForm.tsx
│   ├── revenue/
│   │   └── RevenueDashboard.tsx
│   ├── settings/
│   │   └── SettingsPanel.tsx
│   └── onboarding/
│       └── OnboardingWizard.tsx
├── contexts/
│   ├── TaskContext.tsx
│   ├── TimerContext.tsx
│   ├── ClientContext.tsx
│   ├── ProjectContext.tsx
│   ├── ColumnContext.tsx
│   ├── SettingsContext.tsx
│   └── FilterContext.tsx
├── services/
│   ├── data/
│   │   ├── database.ts
│   │   ├── repositories/
│   │   │   ├── TaskRepository.ts
│   │   │   ├── ClientRepository.ts
│   │   │   ├── ProjectRepository.ts
│   │   │   ├── TimeEntryRepository.ts
│   │   │   ├── ColumnRepository.ts
│   │   │   ├── SubtaskRepository.ts
│   │   │   └── SettingsRepository.ts
│   ├── TimerService.ts
│   ├── RevenueService.ts
│   └── ExportService.ts
├── hooks/
│   ├── useTimer.ts
│   ├── useTask.ts
│   ├── useRevenue.ts
│   └── useDragAndDrop.ts
├── utils/
│   ├── dateUtils.ts
│   ├── timeUtils.ts
│   ├── currencyUtils.ts
│   └── validation.ts
└── types/
    ├── task.ts
    ├── client.ts
    ├── project.ts
    ├── timeEntry.ts
    ├── column.ts
    ├── subtask.ts
    └── settings.ts
```

### Component Template

```typescript
import React from 'react';
import { useTaskContext } from '@/contexts/TaskContext';

interface ComponentProps {
  // Props definition
}

export const Component: React.FC<ComponentProps> = ({ ...props }) => {
  const { tasks, updateTask } = useTaskContext();
  
  // Component logic
  
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
};
```

## State Management Architecture

### State Structure

```typescript
// TaskContext state structure
interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: Error | null;
}

// TimerContext state structure
interface TimerState {
  activeTaskId: string | null;
  startTime: Date | null;
  elapsedTime: number; // in seconds
  status: 'idle' | 'active' | 'paused';
}
```

### State Management Patterns

- **Context Providers:** Each domain (tasks, timer, clients, etc.) has its own Context Provider
- **Custom Hooks:** Business logic encapsulated in custom hooks (e.g., `useTimer`, `useTask`)
- **Optimistic Updates:** UI updates immediately, then syncs with IndexedDB
- **Error Boundaries:** React Error Boundaries catch and handle component errors gracefully
- **Memoization:** Use `React.memo`, `useMemo`, and `useCallback` to prevent unnecessary re-renders

## Routing Architecture

**N/A - Single Page Application**

This is a single-page application with no routing. All views are managed through:
- Side panels (task details, settings)
- Modal overlays (onboarding wizard, forms)
- View state in Context (current view: 'board' | 'dashboard' | 'settings')

## Frontend Services Layer

### API Client Setup

**N/A - No API Client**

Since there's no backend API, the frontend communicates directly with IndexedDB through the Data Access Layer (repositories).

### Service Example

```typescript
// TimerService.ts
import { db } from '@/services/data/database';
import { TimerContext } from '@/contexts/TimerContext';

export class TimerService {
  async startTimer(taskId: string): Promise<void> {
    // Stop any active timer first
    await this.stopActiveTimer();
    
    // Save timer state to IndexedDB
    await db.timerState.put({
      taskId,
      startTime: new Date(),
      lastUpdateTime: new Date(),
      status: 'active'
    });
    
    // Notify Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'TIMER_START',
        taskId,
        startTime: new Date().toISOString()
      });
    }
  }
  
  async stopTimer(): Promise<TimeEntry> {
    const timerState = await db.timerState.get({ status: 'active' });
    if (!timerState) throw new Error('No active timer');
    
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - timerState.startTime.getTime()) / 1000 / 60);
    
    // Create time entry
    const timeEntry: TimeEntry = {
      id: crypto.randomUUID(),
      taskId: timerState.taskId,
      startTime: timerState.startTime,
      endTime,
      duration,
      isManual: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.timeEntries.add(timeEntry);
    await db.timerState.delete(timerState.taskId);
    
    return timeEntry;
  }
}
```
