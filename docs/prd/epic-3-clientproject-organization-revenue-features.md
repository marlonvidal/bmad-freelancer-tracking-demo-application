# Epic 3: Client/Project Organization & Revenue Features

This epic adds freelancer-specific features for organizing work by clients and projects, and enables revenue tracking through billable hour calculations. It implements inline client and project creation, billable/non-billable task classification, hourly rate configuration at multiple levels, real-time revenue calculations, and a comprehensive revenue dashboard. This epic delivers the core business value of helping freelancers track and maximize their billable hours and revenue potential.

## Story 3.1: Client Management with Inline Creation

As a user,
I want to create and manage clients directly from the kanban board,
so that I can organize my tasks by client without navigating to separate screens.

### Acceptance Criteria

1. Task creation/edit provides dropdown/selector for client assignment
2. Dropdown includes "Create New Client" option that opens inline form
3. Inline client creation form collects: name (required), default hourly rate (optional), contact info (optional)
4. New client is saved to IndexedDB immediately upon creation
5. Client appears in dropdown immediately after creation (no refresh needed)
6. Client list is accessible from task creation/edit interface
7. User can edit existing clients (name, rate, contact info) via inline edit or settings
8. Clients are displayed in alphabetical order in dropdowns
9. Client data persists across browser sessions
10. Client deletion is prevented if tasks are assigned to that client (with warning message)

## Story 3.2: Project Management with Inline Creation

As a user,
I want to create and manage projects and assign tasks to projects,
so that I can organize tasks within client work.

### Acceptance Criteria

1. Task creation/edit provides dropdown/selector for project assignment
2. Projects are scoped to clients (select client first, then project)
3. Dropdown includes "Create New Project" option that opens inline form
4. Inline project creation form collects: name (required), optional description
5. New project is saved to IndexedDB immediately upon creation
6. Project appears in dropdown immediately after creation
7. User can edit existing projects (name, description) via inline edit
8. Projects are displayed in alphabetical order within client grouping
9. Project data persists across browser sessions
10. Project deletion is prevented if tasks are assigned to that project (with warning message)

## Story 3.3: Billable/Non-Billable Task Toggle

As a user,
I want to mark tasks as billable or non-billable,
so that I can distinguish work that generates revenue from administrative tasks.

### Acceptance Criteria

1. Task card displays billable indicator (icon/badge) when task is marked billable
2. Task creation/edit provides toggle/checkbox to mark task as billable or non-billable
3. Billable toggle is easily accessible (one-click action)
4. Billable status is saved to IndexedDB with task data
5. Visual distinction between billable and non-billable tasks is clear (color coding or icon)
6. Billable status can be changed after task creation
7. Default billable status can be configured (per client/project or global default)
8. Billable indicator is visible on task card without requiring expansion
9. Billable status is included in task filtering/search (future enhancement consideration)
10. Billable toggle is accessible via keyboard navigation

## Story 3.4: Hourly Rate Configuration

As a user,
I want to set hourly rates at task, client, or project level,
so that revenue calculations reflect my actual billing rates.

### Acceptance Criteria

1. Hourly rate can be set at task level (overrides client/project rate)
2. Hourly rate can be set at client level (default for all client tasks)
3. Hourly rate can be set at project level (default for project tasks, overrides client rate)
4. Rate hierarchy: Task rate > Project rate > Client rate
5. Rate configuration is accessible from task edit, client management, and project management
6. Rate input accepts decimal values (e.g., $75.50/hour)
7. Rate is displayed with currency symbol and formatted appropriately
8. Rate configuration persists to IndexedDB
9. Rate changes update revenue calculations immediately
10. Default rate can be set globally (fallback if no client/project/task rate specified)

## Story 3.5: Real-Time Revenue Calculation

As a user,
I want to see real-time revenue potential for my billable tasks,
so that I can track my earnings as I work.

### Acceptance Criteria

1. Revenue calculation: billable hours × hourly rate (respecting rate hierarchy)
2. Task card displays revenue potential for that task (if billable and rate is set)
3. Revenue calculation updates in real-time as time is tracked
4. Revenue calculation includes all time entries for a task (not just active timer)
5. Revenue is displayed with currency formatting (e.g., "$1,250.00")
6. Revenue calculation handles missing rates gracefully (shows "Rate not set" or $0.00)
7. Revenue calculation is accurate (no rounding errors in currency display)
8. Revenue updates immediately when rate changes or time is added/edited
9. Revenue calculation is performant (doesn't slow down board rendering)
10. Revenue data is stored/calculated efficiently (cached or computed on demand)

## Story 3.6: Revenue Dashboard View

As a user,
I want to view a revenue dashboard with daily, weekly, and monthly summaries,
so that I can understand my earnings trends and billable hour distribution.

### Acceptance Criteria

1. Revenue dashboard is accessible from main navigation/menu
2. Dashboard displays daily revenue summary (today's billable hours × rates)
3. Dashboard displays weekly revenue summary (current week's totals)
4. Dashboard displays monthly revenue summary (current month's totals)
5. Revenue breakdown by client is shown (which clients generated most revenue)
6. Revenue breakdown by project is shown (which projects generated most revenue)
7. Total billable hours are displayed alongside revenue amounts
8. Dashboard data is calculated from IndexedDB time entries and rates
9. Dashboard updates reflect latest time entries and rate changes
10. Dashboard is visually clear with charts or tables showing revenue distribution
11. Dashboard can filter by date range (future enhancement: basic date selection)
12. Dashboard loads efficiently even with large amounts of historical data

## Story 3.7: Task Filtering by Client and Project

As a user,
I want to filter the kanban board by client or project,
so that I can focus on specific work contexts.

### Acceptance Criteria

1. Filter controls are accessible from kanban board (dropdown or filter bar)
2. User can filter tasks by client (shows only tasks for selected client)
3. User can filter tasks by project (shows only tasks for selected project)
4. Multiple filters can be combined (client AND project)
5. Filter state is visually indicated (active filters shown, clear filters button)
6. Filtering updates board display immediately (no page refresh)
7. Filter state can be cleared to show all tasks
8. Filter works with drag-and-drop (filtered tasks can still be moved)
9. Filter state doesn't persist across sessions (resets on app load)
10. Filter is accessible via keyboard navigation
