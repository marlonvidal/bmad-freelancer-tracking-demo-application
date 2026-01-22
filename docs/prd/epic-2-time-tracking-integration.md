# Epic 2: Time Tracking Integration

This epic integrates time tracking functionality directly into the kanban board workflow, enabling users to track time spent on tasks without leaving the board interface. It adds timer controls to task cards, implements start/stop/pause functionality, displays time spent on cards, supports manual time entry and editing, and ensures timers continue running in the background. This epic delivers the core value proposition of combining task management with time tracking, eliminating the need to switch between separate tools.

## Story 2.1: Timer Controls on Task Cards

As a user,
I want to start and stop a timer directly on task cards,
so that I can track time spent on tasks without leaving the kanban board.

### Acceptance Criteria

1. Timer control button/icon displays on each task card
2. Timer button shows "Start" state when no timer is active for the task
3. Clicking start button initiates timer and button changes to "Stop" state
4. Clicking stop button stops timer and saves time entry to IndexedDB
5. Only one timer can be active at a time across all tasks (starting new timer stops previous)
6. Visual indicator (e.g., pulsing animation, color change) shows which task has active timer
7. Timer control is accessible via keyboard navigation
8. Timer state persists across browser refresh (if timer was active, it resumes or shows last state)
9. Timer control is clearly visible and doesn't clutter task card design
10. Timer button provides clear visual feedback on hover and click states

## Story 2.2: Timer Display and Time Tracking

As a user,
I want to see elapsed time displayed on task cards,
so that I know how much time I've spent on each task.

### Acceptance Criteria

1. Active timer displays elapsed time on task card (updates every second)
2. Time format is human-readable (e.g., "1h 23m" or "83m")
3. Elapsed time updates in real-time while timer is running
4. Total time spent displays on task card when timer is stopped
5. Time display persists across browser sessions (loaded from IndexedDB)
6. Time entries are stored with task ID, start time, end time, and duration
7. Multiple time entries per task are supported (can track time in multiple sessions)
8. Time display is clearly visible but doesn't dominate task card
9. Time format is consistent across all task cards
10. Time calculations are accurate (no drift or rounding errors)

## Story 2.3: Manual Time Entry and Editing

As a user,
I want to manually add or edit time entries,
so that I can correct mistakes or add time I forgot to track.

### Acceptance Criteria

1. Task card or detail view provides option to "Add Time" manually
2. Manual time entry form accepts hours and minutes (or decimal hours)
3. User can add time entry with optional description/notes
4. User can edit existing time entries (modify duration, delete entry)
5. Manual time entries are saved to IndexedDB with timestamp
6. Manual entries are visually distinguished from tracked entries (if applicable)
7. Time entry form validates input (positive numbers, reasonable ranges)
8. Editing time entries updates total time displayed on task card
9. User can view list of all time entries for a task (with timestamps)
10. Manual time entry doesn't interfere with active timer functionality

## Story 2.4: Background Timer Operation

As a user,
I want the timer to continue running when I switch browser tabs or minimize the window,
so that I can track time accurately even when working in other applications.

### Acceptance Criteria

1. Timer continues running when browser tab is not active (using Web Workers or Service Workers)
2. Timer state persists and resumes correctly when returning to application
3. Elapsed time calculation accounts for time when tab was inactive
4. Background timer operation works across browser tab switches
5. Timer accuracy is maintained within acceptable limits (handles browser throttling)
6. Visual indicator shows timer is running even when tab is inactive (browser tab title or badge)
7. Timer stops gracefully if browser is closed (saves current session time)
8. Background operation doesn't significantly impact browser performance
9. Timer state is recoverable if application crashes (saves progress periodically)
10. User receives notification/indicator when returning to tab with active timer

## Story 2.5: Timer State Management and React Context Integration

As a developer,
I want timer state managed through React Context,
so that timer functionality is accessible throughout the application and state updates trigger UI updates.

### Acceptance Criteria

1. Timer Context Provider manages active timer state (current task ID, start time, elapsed time)
2. Timer Context provides functions: startTimer, stopTimer, pauseTimer (if implemented)
3. Timer state updates trigger re-renders of affected task cards
4. Only one timer can be active at a time (enforced by Context)
5. Timer state persists to IndexedDB on start/stop operations
6. Timer Context integrates with existing task/board Context
7. Timer state is testable via unit tests with mock Context
8. Timer operations are debounced/throttled appropriately to prevent excessive updates
9. Timer Context handles edge cases (multiple rapid start/stop, browser refresh during timer)
10. Timer state management doesn't cause unnecessary re-renders of unrelated components

## Story 2.6: Time Estimates and Estimated vs Actual Display

As a user,
I want to set time estimates for tasks and see estimated vs actual time,
so that I can plan my work and track accuracy.

### Acceptance Criteria

1. Task creation/edit allows setting time estimate (hours/minutes)
2. Time estimate displays on task card alongside actual time spent
3. Visual indicator shows if task is over/under estimate (color coding or icon)
4. Estimated vs actual comparison is clearly visible on task card
5. Time estimate is editable after task creation
6. Estimate is stored in IndexedDB with task data
7. Estimate format matches actual time format for consistency
8. Tasks without estimates don't show comparison (graceful handling)
9. Estimate comparison helps identify tasks that took longer/shorter than expected
10. Estimate data can be used for future planning (future enhancement consideration)
