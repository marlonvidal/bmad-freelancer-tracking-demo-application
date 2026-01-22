# Time-Tracking Kanban App for Solo Freelancers Product Requirements Document (PRD)

## Goals and Background Context

### Goals

- Enable solo freelancers to accurately track billable hours and increase revenue through integrated time tracking
- Reduce context switching and administrative overhead by combining task management with time tracking in a single workflow
- Provide freelancer-specific features (billable hours, client context, revenue tracking) without requiring paid customization tiers
- Deliver a desktop-first kanban experience optimized for solo freelancer workflows
- Increase productivity through streamlined task and time management

### Background Context

Solo freelancers currently struggle with fragmented workflows, using generic tools like Asana and Trello that weren't designed for their specific needs. These tools require paid tiers for customization and keep time tracking separate from task management, creating friction that reduces productivity and leads to lost billable hours. The current landscape lacks an affordable, freelancer-focused solution that combines kanban task visualization with integrated time tracking.

This PRD addresses the core problem: freelancers need a single tool that understands their workflow—managing multiple clients and projects simultaneously, distinguishing billable from non-billable work, and providing visibility into revenue potential. By combining kanban task management with built-in time tracking, we eliminate context switching and administrative overhead while ensuring accurate capture of billable hours.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| TBD | v1.0 | Initial PRD creation | PM |

## Requirements

### Functional

1. FR1: The system shall provide a kanban board interface with customizable columns (e.g., Backlog, In Progress, Review, Done) for task visualization
2. FR2: The system shall support drag-and-drop functionality to move tasks between columns seamlessly
3. FR3: The system shall display task cards with key information at a glance (title, client/project, timer status, time spent, billable indicator)
4. FR4: The system shall allow users to start and stop a timer directly on task cards
5. FR5: The system shall display a clear visual indicator when a timer is actively running
6. FR6: The system shall allow users to manually add and edit time entries for tasks
7. FR7: The system shall display estimated vs actual time on task cards
8. FR8: The system shall continue running timers in the background when the application is minimized
9. FR9: The system shall provide easy access to timer controls (play/pause/stop) on task cards
10. FR10: The system shall allow users to mark tasks as billable or non-billable
11. FR11: The system shall allow users to set hourly rates per task, client, or project
12. FR12: The system shall calculate and display real-time revenue potential (billable hours × rate)
13. FR13: The system shall provide revenue dashboard views showing daily, weekly, and monthly revenue summaries
14. FR14: (Post-MVP) The system shall provide time analytics showing time distribution by client, project, and task type
15. FR15: (Post-MVP) The system shall provide productivity metrics (tasks completed, time efficiency, etc.)
16. FR16: The system shall support quick-add functionality for task creation
17. FR17: The system shall allow users to create tasks with title, description, due date, priority, and tags
18. FR18: The system shall allow users to assign tasks to clients and projects
19. FR19: The system shall allow users to set time estimates for tasks
20. FR20: The system shall support subtasks for breaking down larger tasks
21. FR21: The system shall provide search and filter functionality to find tasks quickly
22. FR22: The system shall allow users to create and manage clients (name, hourly rate, contact info)
23. FR23: The system shall allow users to organize tasks under projects
24. FR24: The system shall provide filtering to view tasks by client or project
25. FR25: The system shall support creating client-specific boards
26. FR26: The system shall allow users to export time tracking data in CSV and JSON formats
27. FR27: The system shall allow users to export revenue summaries
28. FR28: The system shall provide backup and restore functionality for user data
29. FR29: The system shall store all data locally (privacy-first approach)
30. FR30: The system shall provide a quick setup wizard for onboarding new users
31. FR31: The system shall provide a dark mode option to reduce eye strain

### Non Functional

1. NFR1: The application shall launch in under 3 seconds on target platforms
2. NFR2: The application shall maintain 60fps for all animations and interactions
3. NFR3: The application shall handle 1000+ tasks without performance degradation
4. NFR4: The application shall work offline without internet connection (offline-first architecture via PWA)
5. NFR5: The application shall support Windows, macOS, and Linux platforms through modern web browsers
6. NFR6: The application shall use local-first architecture with all data stored locally in the browser
7. NFR7: The application shall use IndexedDB or similar browser-based local database for data storage
8. NFR8: The application shall provide optimized memory usage for efficient operation
9. NFR9: The application shall implement auto-save functionality with no manual save required
10. NFR10: The application shall provide graceful error handling and crash recovery
11. NFR11: The application shall ensure no data loss through persistent storage
12. NFR12: The application shall comply with WCAG 2.1 AA accessibility standards
13. NFR13: The application shall provide keyboard shortcuts for power users
14. NFR14: The application shall provide tooltips and help documentation
15. NFR15: The application shall not send telemetry data (privacy-first approach)
16. NFR16: The application shall provide optional encryption for sensitive data
17. NFR17: The application shall have an intuitive interface requiring no training
18. NFR18: The application shall provide clear visual hierarchy and intuitive interactions

## User Interface Design Goals

### Overall UX Vision

The application prioritizes minimal cognitive load and streamlined workflows for solo freelancers. The primary interface centers around a clean, uncluttered kanban board that serves as the command center for both task management and time tracking. Every interaction is designed to reduce friction—users can start tracking time, move tasks, and mark work as billable with single actions. The visual design emphasizes clarity and efficiency, using color coding and visual hierarchy to help users quickly understand task status, client context, and billable vs non-billable work at a glance.

The experience is optimized for desktop workflows where users spend extended periods managing multiple clients and projects. The interface supports deep focus work by minimizing distractions while providing immediate access to critical information (active timer, revenue potential, time spent). Dark mode reduces eye strain during long work sessions, and the design maintains consistency across Windows, macOS, and Linux platforms.

### Key Interaction Paradigms

**Kanban-First Navigation**: The kanban board is the primary interface—all core actions (task creation, time tracking, task movement) happen directly on the board without requiring navigation to separate screens.

**One-Tap Actions**: Critical actions (start timer, move task, toggle billable) are accessible with single clicks/taps directly on task cards. No multi-step workflows for common operations.

**Drag-and-Drop**: Task movement between columns uses intuitive drag-and-drop with visual feedback. The interaction feels fluid and responsive, supporting rapid task organization.

**Contextual Information Display**: Task cards show essential information (title, client/project, timer status, time spent, billable indicator) without requiring expansion. Details are available on-demand but don't clutter the primary view.

**Visual Status Indicators**: Color coding and visual indicators communicate status instantly—active timers, billable tasks, client assignments, and task priority are immediately recognizable through consistent visual language.

**Board Customization**: UI controls for adding, removing, and reordering kanban columns with drag-and-drop column management.

**Keyboard Shortcuts**: Power users can navigate and perform actions via keyboard shortcuts, reducing reliance on mouse/trackpad for common operations.

### Core Screens and Views

1. **Main Kanban Board**: The primary workspace displaying tasks organized in customizable columns (Backlog, In Progress, Review, Done). Task cards show key information and timer controls.

2. **Task Detail/Edit View**: Side panel for viewing/editing task details (title, description, due date, priority, tags, client/project assignment, time estimates, billable toggle).

3. **Client Management**: Inline creation and management directly from the kanban board (dropdown/quick-add for creating clients with name, default hourly rate, contact info). No separate screen required.

4. **Project Management**: Inline creation and organization of tasks under projects directly from the kanban board. No separate screen required.

5. **Revenue Dashboard**: View showing daily, weekly, and monthly revenue summaries with breakdowns by client/project. Accessible from main board.

6. **Settings/Preferences**: Application settings including dark mode toggle, keyboard shortcuts configuration, export options, and backup/restore functionality.

7. **Onboarding/Setup Wizard**: Multi-step wizard for first-time users to set up initial client, project, board columns, and sample task with timer demo.

### Accessibility: WCAG AA

The application complies with WCAG 2.1 AA standards, ensuring:
- Keyboard navigation for all interactive elements
- Sufficient color contrast ratios for text and UI elements
- Screen reader compatibility for task information and status
- Focus indicators for keyboard navigation
- Alternative text for icons and visual indicators
- Logical reading order and semantic HTML structure

### Branding

No specific branding requirements identified. The design should prioritize clarity, professionalism, and minimalism suitable for freelancer workflows. Visual style should be clean and modern without distracting decorative elements. Color palette uses a neutral, professional palette that supports clear visual distinction between clients, priorities, and statuses while maintaining accessibility standards.

### Target Device and Platforms: Cross-Platform

Web-based application optimized for desktop browsers, supporting Windows, macOS, and Linux platforms through modern web browsers (Chrome, Firefox, Safari, Edge). The interface is designed for desktop browser use with responsive layout that adapts to different window sizes, supporting both full-screen and windowed browser modes. Primary interaction model assumes mouse/trackpad and keyboard input. Application works as a Progressive Web App (PWA) for offline functionality. MVP supports a single kanban board per user (multiple boards deferred to post-MVP).

## Technical Assumptions

### Repository Structure: Monorepo

Single repository containing all application code, build configuration, and documentation. This structure supports the web application's unified codebase and simplifies deployment processes. No separate frontend/backend repositories needed for this local-first web application.

### Service Architecture

**Web Application Architecture**: This is a single-page web application (SPA) optimized for desktop browser use. The application uses a local-first architecture where all data processing and storage happens in the user's browser. No backend services, APIs, or cloud infrastructure required for MVP. The application should work as a Progressive Web App (PWA) to support offline functionality.

**Component Architecture**: The application follows a component-based architecture using React with clear separation between:
- UI Layer (kanban board, task cards, side panels, views)
- Business Logic Layer (task management, time tracking, revenue calculations)
- Data Layer (local database access, data persistence)

**State Management**: Application state managed locally using React Context API. No external state synchronization needed since all data is local. React Context provides sufficient state management for the application's scope without requiring additional state management libraries.

### Testing Requirements

**Full Testing Pyramid**: The application requires comprehensive testing across all levels:

- **Unit Tests**: Test individual components, business logic functions, time tracking calculations, revenue calculations, data model operations
- **Integration Tests**: Test interactions between UI components, data layer operations, timer functionality with background operation, drag-and-drop interactions
- **End-to-End Tests**: Test complete user workflows (create task, start timer, move task, view revenue dashboard, export data)
- **Manual Testing Convenience Methods**: Provide CLI tools or test utilities for quickly setting up test data, verifying data integrity, and testing edge cases

**Rationale**: Given the critical nature of time tracking (billable hours = revenue), comprehensive testing is essential. Users must trust the application to accurately track time and calculate revenue. Integration tests ensure timer functionality works correctly when app is minimized. E2E tests validate complete workflows. Manual testing methods support QA verification and debugging.

### Additional Technical Assumptions and Requests

**Frontend Framework**: Use React for UI development, leveraging component-based architecture for kanban board, task cards, and views. React provides:
- Smooth drag-and-drop interactions (60fps requirement) via libraries like react-beautiful-dnd or @dnd-kit
- Efficient rendering of 1000+ tasks with React's virtual DOM and optimization techniques
- Dark mode theming via CSS variables and context
- Responsive layout for different browser window sizes

**State Management**: Use React Context API for application state management. React Context provides sufficient state management for the application's scope without requiring additional state management libraries like Redux. Context providers will manage: task state, timer state, client/project data, UI preferences (dark mode), and revenue calculations.

**Local Database**: Use IndexedDB (browser's built-in database) for local data storage. IndexedDB provides:
- Reliable storage for structured data (tasks, clients, projects, time entries)
- Efficient querying for filtering and searching tasks
- Browser-native, no external dependencies
- Supports complex queries for revenue calculations and analytics
- Works offline and persists across browser sessions
- Alternative consideration: Use a wrapper library like Dexie.js for easier IndexedDB API

**Timer Implementation**: Browser-based timer using JavaScript's setInterval/requestAnimationFrame APIs. Timer continues running when browser tab is active. For background operation when tab is not active, use Web Workers or Service Workers to maintain timer accuracy. Note: Browser limitations may affect timer accuracy when tab is inactive, but this is acceptable for MVP.

**Build Tool**: Use Vite as the build tool and development server. Vite provides:
- Fast development server with HMR (Hot Module Replacement)
- Optimized production builds
- Modern ES modules support
- Excellent React integration
- Fast build times
- Built-in TypeScript support (if TypeScript is used)

**Testing Framework**: Use Jest for unit and integration testing. Jest provides:
- Comprehensive testing utilities for React components
- Snapshot testing for UI components
- Mocking capabilities for timer functions and browser APIs
- Code coverage reporting
- Fast test execution

**Progressive Web App (PWA)**: Implement PWA capabilities to support offline functionality:
- Service Worker for offline access and background timer operation
- Web App Manifest for installable application experience
- Cache strategies for application assets and data

**Data Export**: CSV and JSON export functionality using browser-based file download APIs. Handle large datasets efficiently using blob URLs and streaming where possible. Consider using libraries like PapaParse for CSV generation.

**Deployment**: Static web application deployment to hosting platforms (Vercel, Netlify, GitHub Pages, or similar). No server-side rendering required. Consider automated deployment via CI/CD (GitHub Actions) for consistent releases.

**Performance Optimization**: Implement virtual scrolling or pagination for kanban board to handle 1000+ tasks efficiently. Use React.memo and useMemo for component optimization. Lazy loading for task details and side panels. Optimize re-renders to maintain 60fps during interactions. Consider libraries like react-window or react-virtualized for virtual scrolling.

**Accessibility Implementation**: Ensure React components and UI libraries support WCAG 2.1 AA requirements including keyboard navigation, screen reader compatibility, and proper ARIA labels. Use semantic HTML and accessible component libraries where possible.

## Epic List

1. **Epic 1: Foundation & Core Kanban Board**: Establish project infrastructure (React app setup with Vite, IndexedDB integration, PWA configuration) and deliver core kanban board functionality with customizable columns, task creation, task display, and drag-and-drop task movement. This epic establishes the foundation while delivering the primary task visualization interface.

2. **Epic 2: Time Tracking Integration**: Integrate time tracking functionality directly into task cards with start/stop timer controls, time entry display, manual time entry/editing, timer state management, and background timer operation. This epic enables the core value proposition of integrated time tracking.

3. **Epic 3: Client/Project Organization & Revenue Features**: Add client and project management with inline creation, billable/non-billable task toggle, hourly rate configuration (per task/client/project), real-time revenue calculation, and revenue dashboard view with daily/weekly/monthly summaries. This epic delivers freelancer-specific value around revenue tracking and organization.

4. **Epic 4: Data Management, Export & UI Polish**: Implement data export (CSV/JSON), backup/restore functionality, dark mode, settings/preferences screen, search and filter, task detail side panel, and onboarding wizard. This epic completes the MVP feature set and enhances user experience.

## Epic 1: Foundation & Core Kanban Board

This epic establishes the foundational infrastructure for the application while delivering the core kanban board interface. It sets up the React application with Vite, integrates IndexedDB for local data storage, configures PWA capabilities for offline functionality, and implements the primary kanban board with customizable columns, task creation, task display, and drag-and-drop functionality. By the end of this epic, users can visualize and manage tasks in a kanban-style interface with full local persistence, establishing the primary workspace for all subsequent features.

### Story 1.1: Project Setup and Infrastructure Foundation

As a developer,
I want a properly configured React application with Vite, TypeScript, and essential tooling,
so that I have a solid foundation for building the application with modern development practices and fast iteration.

#### Acceptance Criteria

1. React application initialized with Vite as the build tool and development server
2. TypeScript configured with appropriate compiler options and type checking
3. ESLint and Prettier configured for code quality and formatting
4. Project structure established with clear separation of components, utilities, and data layers
5. Git repository initialized with appropriate .gitignore
6. README.md created with setup instructions and project overview
7. Basic health check route/page displays "Application is running" to verify setup
8. Development server runs successfully and hot module replacement (HMR) works
9. Production build generates optimized static assets successfully

### Story 1.2: IndexedDB Integration and Data Layer Foundation

As a developer,
I want IndexedDB integrated with a data access layer,
so that the application can persistently store and retrieve tasks, clients, and projects locally in the browser.

#### Acceptance Criteria

1. IndexedDB database schema designed and implemented for tasks, clients, and projects
2. Data access layer created with functions for CRUD operations (create, read, update, delete) for each entity type
3. Database initialization function handles database creation and version migrations
4. Error handling implemented for database operations with user-friendly error messages
5. Database operations are testable via unit tests with mock IndexedDB
6. Data persistence verified: data persists across browser sessions (close and reopen browser)
7. Database can handle at least 1000 tasks without performance degradation
8. All database operations use async/await pattern for proper error handling

### Story 1.3: PWA Configuration and Offline Support

As a user,
I want the application to work offline and be installable as a PWA,
so that I can use the application without internet connection and have a native app-like experience.

#### Acceptance Criteria

1. Service Worker registered and configured for offline functionality
2. Web App Manifest created with appropriate metadata (name, icons, theme colors)
3. Application assets cached for offline access (HTML, CSS, JavaScript)
4. Application loads and functions when offline (after initial online load)
5. Application is installable on desktop browsers (install prompt appears)
6. Installed PWA launches in standalone window mode
7. Service Worker handles cache updates when new version is deployed
8. Offline indicator displays when internet connection is lost
9. Application gracefully handles offline state with appropriate user messaging

### Story 1.4: Kanban Board Layout and Column Management

As a user,
I want a kanban board with customizable columns,
so that I can organize my tasks in a visual workflow that matches my process.

#### Acceptance Criteria

1. Kanban board displays with default columns (Backlog, In Progress, Review, Done)
2. Columns are visually distinct with clear headers and appropriate styling
3. User can add new columns via UI control (button/menu)
4. User can remove columns via UI control (with confirmation if column contains tasks)
5. User can reorder columns via drag-and-drop
6. Column names are editable inline
7. Column configuration persists across browser sessions
8. Board layout is responsive and adapts to different window sizes
9. Empty columns display appropriate placeholder/empty state
10. Column management is accessible via keyboard navigation

### Story 1.5: Task Creation and Basic Task Display

As a user,
I want to create tasks and see them displayed on the kanban board,
so that I can start organizing my work.

#### Acceptance Criteria

1. Quick-add button/keyboard shortcut allows rapid task creation
2. Task creation form/modal collects: title (required), description (optional), due date (optional), priority (optional), tags (optional)
3. New task is added to specified column (default: Backlog)
4. Task card displays on kanban board with title prominently visible
5. Task card shows basic information: title, due date (if set), priority indicator (if set)
6. Task creation persists to IndexedDB immediately
7. Task appears on board immediately after creation (no page refresh needed)
8. Task creation form validates required fields and shows error messages
9. User can cancel task creation without saving
10. Task cards are visually distinct and readable

### Story 1.6: Drag-and-Drop Task Movement

As a user,
I want to drag tasks between columns,
so that I can easily update task status and organize my workflow.

#### Acceptance Criteria

1. Tasks can be dragged from one column to another using mouse/trackpad
2. Visual feedback shows task being dragged (ghost image or visual indicator)
3. Drop zones are clearly indicated when dragging over valid columns
4. Task moves to new column on drop and persists to IndexedDB
5. Drag-and-drop works smoothly at 60fps without lag
6. Task position within column can be reordered via drag-and-drop
7. Drag-and-drop is accessible via keyboard (alternative interaction method)
8. Invalid drop zones are clearly indicated (visual feedback)
9. Drag operation can be cancelled (ESC key or click outside)
10. Multiple rapid drag operations don't cause race conditions or data loss

### Story 1.7: Task List Display and Board State Management

As a user,
I want to see all my tasks organized in columns on the kanban board,
so that I have a clear view of my work status.

#### Acceptance Criteria

1. All tasks load from IndexedDB and display in correct columns on application startup
2. Tasks display in consistent order within columns (configurable: by creation date, due date, priority)
3. Board state (columns, tasks, positions) loads correctly from IndexedDB
4. React Context manages board state (tasks, columns) and provides to components
5. State updates trigger UI updates immediately (reactive updates)
6. Board handles empty state gracefully (no tasks message)
7. Board handles large number of tasks (1000+) efficiently (virtual scrolling or pagination considered)
8. Task count displays per column header
9. Board state persists automatically on any change (auto-save)
10. No data loss occurs during rapid state changes or browser refresh

## Epic 2: Time Tracking Integration

This epic integrates time tracking functionality directly into the kanban board workflow, enabling users to track time spent on tasks without leaving the board interface. It adds timer controls to task cards, implements start/stop/pause functionality, displays time spent on cards, supports manual time entry and editing, and ensures timers continue running in the background. This epic delivers the core value proposition of combining task management with time tracking, eliminating the need to switch between separate tools.

### Story 2.1: Timer Controls on Task Cards

As a user,
I want to start and stop a timer directly on task cards,
so that I can track time spent on tasks without leaving the kanban board.

#### Acceptance Criteria

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

### Story 2.2: Timer Display and Time Tracking

As a user,
I want to see elapsed time displayed on task cards,
so that I know how much time I've spent on each task.

#### Acceptance Criteria

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

### Story 2.3: Manual Time Entry and Editing

As a user,
I want to manually add or edit time entries,
so that I can correct mistakes or add time I forgot to track.

#### Acceptance Criteria

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

### Story 2.4: Background Timer Operation

As a user,
I want the timer to continue running when I switch browser tabs or minimize the window,
so that I can track time accurately even when working in other applications.

#### Acceptance Criteria

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

### Story 2.5: Timer State Management and React Context Integration

As a developer,
I want timer state managed through React Context,
so that timer functionality is accessible throughout the application and state updates trigger UI updates.

#### Acceptance Criteria

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

### Story 2.6: Time Estimates and Estimated vs Actual Display

As a user,
I want to set time estimates for tasks and see estimated vs actual time,
so that I can plan my work and track accuracy.

#### Acceptance Criteria

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

## Epic 3: Client/Project Organization & Revenue Features

This epic adds freelancer-specific features for organizing work by clients and projects, and enables revenue tracking through billable hour calculations. It implements inline client and project creation, billable/non-billable task classification, hourly rate configuration at multiple levels, real-time revenue calculations, and a comprehensive revenue dashboard. This epic delivers the core business value of helping freelancers track and maximize their billable hours and revenue potential.

### Story 3.1: Client Management with Inline Creation

As a user,
I want to create and manage clients directly from the kanban board,
so that I can organize my tasks by client without navigating to separate screens.

#### Acceptance Criteria

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

### Story 3.2: Project Management with Inline Creation

As a user,
I want to create and manage projects and assign tasks to projects,
so that I can organize tasks within client work.

#### Acceptance Criteria

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

### Story 3.3: Billable/Non-Billable Task Toggle

As a user,
I want to mark tasks as billable or non-billable,
so that I can distinguish work that generates revenue from administrative tasks.

#### Acceptance Criteria

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

### Story 3.4: Hourly Rate Configuration

As a user,
I want to set hourly rates at task, client, or project level,
so that revenue calculations reflect my actual billing rates.

#### Acceptance Criteria

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

### Story 3.5: Real-Time Revenue Calculation

As a user,
I want to see real-time revenue potential for my billable tasks,
so that I can track my earnings as I work.

#### Acceptance Criteria

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

### Story 3.6: Revenue Dashboard View

As a user,
I want to view a revenue dashboard with daily, weekly, and monthly summaries,
so that I can understand my earnings trends and billable hour distribution.

#### Acceptance Criteria

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

### Story 3.7: Task Filtering by Client and Project

As a user,
I want to filter the kanban board by client or project,
so that I can focus on specific work contexts.

#### Acceptance Criteria

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

## Epic 4: Data Management, Export & UI Polish

This epic completes the MVP feature set by adding data management capabilities (export, backup/restore), essential UI enhancements (dark mode, settings, search), the task detail side panel, and onboarding experience. It ensures users can manage their data effectively, customize their experience, and easily get started with the application. This epic delivers the final polish and functionality needed for a complete MVP experience.

### Story 4.1: Task Detail Side Panel

As a user,
I want to view and edit detailed task information in a side panel,
so that I can manage task details without cluttering the kanban board view.

#### Acceptance Criteria

1. Clicking task card opens side panel (slides in from right side)
2. Side panel displays all task information: title, description, due date, priority, tags, client, project, billable status, time spent, time estimate
3. Side panel allows editing all task fields inline
4. Changes save automatically or via save button (auto-save preferred)
5. Side panel can be closed via close button, click outside, or ESC key
6. Side panel doesn't obstruct kanban board (board remains visible and functional)
7. Side panel is responsive and adapts to different window sizes
8. Side panel shows time entries list with ability to add/edit/delete entries
9. Side panel is accessible via keyboard navigation
10. Side panel animations are smooth (60fps) and don't cause layout shifts

### Story 4.2: Search and Filter Functionality

As a user,
I want to search for tasks by keywords and filter by various criteria,
so that I can quickly find specific tasks in my board.

#### Acceptance Criteria

1. Search bar is accessible from kanban board (top of board or header)
2. Search searches task titles, descriptions, and tags
3. Search results highlight matching text
4. Search updates results in real-time as user types
5. Search can be cleared to show all tasks
6. Filter options include: client, project, billable status, priority, due date range, tags
7. Multiple filters can be combined (AND logic)
8. Active filters are displayed with clear/remove options
9. Filter state is visually indicated on board
10. Search and filter work together (search within filtered results)
11. Search/filter performance is fast even with 1000+ tasks
12. Search is accessible via keyboard shortcut (Ctrl/Cmd + F)

### Story 4.3: Data Export (CSV and JSON)

As a user,
I want to export my time tracking data and tasks,
so that I can backup my data or use it in other tools.

#### Acceptance Criteria

1. Export functionality is accessible from settings or main menu
2. User can export time tracking data to CSV format
3. User can export time tracking data to JSON format
4. User can export all tasks with their data to CSV/JSON
5. Export includes: tasks, time entries, clients, projects, rates, billable status
6. CSV export is properly formatted with headers and comma-separated values
7. JSON export is well-structured and valid JSON
8. Export handles large datasets efficiently (streaming or chunking if needed)
9. Export file downloads with descriptive filename (includes date)
10. Export can be filtered by date range (future enhancement consideration)
11. Export preserves data relationships (tasks linked to clients/projects)
12. Exported data can be imported back (round-trip capability for backup/restore)

### Story 4.4: Backup and Restore Functionality

As a user,
I want to backup and restore my application data,
so that I can recover from data loss or migrate to a new device.

#### Acceptance Criteria

1. Backup function exports all application data to a single file (JSON format)
2. Backup includes: tasks, time entries, clients, projects, columns, settings
3. Backup file downloads with timestamp in filename
4. Restore function allows importing backup file
5. Restore validates backup file format before importing
6. Restore provides preview of data to be imported (task count, date range)
7. Restore can replace all data or merge with existing data (user choice)
8. Restore includes confirmation dialog to prevent accidental data loss
9. Restore handles errors gracefully (invalid file, corrupted data)
10. Backup/restore maintains data integrity (no data loss or corruption)
11. Restore preserves relationships between entities (tasks to clients/projects)
12. Backup can be scheduled or manual (manual for MVP)

### Story 4.5: Dark Mode

As a user,
I want a dark mode option,
so that I can reduce eye strain during long work sessions.

#### Acceptance Criteria

1. Dark mode toggle is accessible from settings or header/menu
2. Dark mode applies to entire application (kanban board, side panels, modals, settings)
3. Dark mode uses appropriate color contrast (WCAG AA compliance maintained)
4. Dark mode preference persists across browser sessions
5. Dark mode toggle is easily accessible (one-click action)
6. Color scheme is consistent and professional in dark mode
7. All UI elements are visible and readable in dark mode (text, borders, icons)
8. Dark mode doesn't affect functionality (all features work in both modes)
9. Dark mode transition is smooth (no flashing or abrupt changes)
10. System preference detection (respects OS dark mode setting) is considered (future enhancement)

### Story 4.6: Settings and Preferences Screen

As a user,
I want a settings screen to configure application preferences,
so that I can customize my experience.

#### Acceptance Criteria

1. Settings screen is accessible from main navigation/menu
2. Settings screen includes: dark mode toggle, default billable status, default hourly rate, keyboard shortcuts reference, export options, backup/restore
3. Settings are organized into logical sections/categories
4. Settings changes save immediately (auto-save)
5. Settings persist across browser sessions
6. Settings screen is accessible and keyboard navigable
7. Settings include reset to defaults option
8. Settings screen provides clear descriptions for each option
9. Settings validation prevents invalid configurations
10. Settings screen is responsive and works on different window sizes

### Story 4.7: Onboarding Wizard

As a new user,
I want a guided onboarding experience,
so that I can quickly understand how to use the application.

#### Acceptance Criteria

1. Onboarding wizard appears on first application launch
2. Wizard includes welcome screen with value proposition
3. Step 1: Guide user to add first client (with inline creation demo)
4. Step 2: Guide user to create first project (optional, with inline creation demo)
5. Step 3: Guide user to customize board columns (with drag-and-drop demo)
6. Step 4: Guide user to create sample task with timer demo
7. Step 5: Tour of key features (timer, billable toggle, revenue view)
8. Wizard can be skipped (skip button on each step)
9. Wizard can be restarted from settings
10. Wizard progress is saved (if user closes app, resumes from last step)
11. Wizard includes tooltips and highlights key UI elements
12. Wizard provides sample data option (pre-populated board for exploration)
13. User can delete sample data after exploration
14. Wizard is accessible via keyboard navigation

## Checklist Results Report

_(This section will be populated after running the PM checklist)_

## Next Steps

### UX Expert Prompt

Create UX design specifications and wireframes for the Time-Tracking Kanban App for Solo Freelancers based on this PRD. Focus on the kanban board interface, task cards with integrated timer controls, side panel for task details, revenue dashboard, and onboarding flow. Ensure designs support desktop-optimized web experience with WCAG AA accessibility standards.

### Architect Prompt

Create technical architecture documentation for the Time-Tracking Kanban App for Solo Freelancers based on this PRD. The application is a React-based web application optimized for desktop browsers, using Vite, IndexedDB for local storage, and PWA capabilities. Design the component architecture, data layer, state management with React Context, timer implementation, and deployment strategy.
