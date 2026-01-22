# Testing Strategy

## Testing Pyramid

```
        E2E Tests (Playwright)
       /                    \
   Integration Tests      Integration Tests
   (React Testing Lib)    (Service Layer)
   /                            \
Unit Tests (Jest)        Unit Tests (Jest)
(Components, Utils)      (Services, Utils)
```

## Test Organization

**Frontend Tests:**
```
tests/
├── unit/
│   ├── components/
│   │   ├── TaskCard.test.tsx
│   │   └── TimerControl.test.tsx
│   ├── services/
│   │   ├── TimerService.test.ts
│   │   └── RevenueService.test.ts
│   └── utils/
│       ├── timeUtils.test.ts
│       └── currencyUtils.test.ts
├── integration/
│   ├── TaskManagement.test.tsx
│   ├── TimerIntegration.test.tsx
│   └── RevenueCalculation.test.tsx
└── e2e/
    ├── task-workflow.spec.ts
    ├── timer-workflow.spec.ts
    └── revenue-dashboard.spec.ts
```

**Backend Tests:**
- **N/A** - No backend

**E2E Tests:**
```
tests/e2e/
├── task-workflow.spec.ts      # Create, edit, move task
├── timer-workflow.spec.ts     # Start/stop timer, background operation
├── revenue-workflow.spec.ts   # Revenue calculation and dashboard
└── export-workflow.spec.ts    # Data export functionality
```

## Test Examples

**Frontend Component Test:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '@/components/kanban/TaskCard';
import { TaskContextProvider } from '@/contexts/TaskContext';

describe('TaskCard', () => {
  it('displays task title', () => {
    const task = { id: '1', title: 'Test Task', ... };
    render(
      <TaskContextProvider>
        <TaskCard task={task} />
      </TaskContextProvider>
    );
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
  
  it('starts timer when timer button clicked', async () => {
    // Test implementation
  });
});
```

**Service Test:**
```typescript
import { TimerService } from '@/services/TimerService';
import { db } from '@/services/data/database';

describe('TimerService', () => {
  beforeEach(async () => {
    await db.timerState.clear();
  });
  
  it('starts timer and saves state', async () => {
    const service = new TimerService();
    await service.startTimer('task-1');
    
    const timerState = await db.timerState.get('task-1');
    expect(timerState).toBeDefined();
    expect(timerState.status).toBe('active');
  });
});
```

**E2E Test:**
```typescript
import { test, expect } from '@playwright/test';

test('complete task workflow', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Create task
  await page.click('[data-testid="add-task-button"]');
  await page.fill('[data-testid="task-title-input"]', 'New Task');
  await page.click('[data-testid="save-task-button"]');
  
  // Start timer
  await page.click('[data-testid="timer-button"]');
  await expect(page.locator('[data-testid="timer-active"]')).toBeVisible();
  
  // Move task
  const taskCard = page.locator('[data-testid="task-card"]').first();
  const targetColumn = page.locator('[data-testid="column"]').nth(1);
  await taskCard.dragTo(targetColumn);
  
  // Verify task moved
  await expect(targetColumn.locator('[data-testid="task-card"]')).toContainText('New Task');
});
```
