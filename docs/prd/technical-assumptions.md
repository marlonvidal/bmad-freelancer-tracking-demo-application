# Technical Assumptions

## Repository Structure: Monorepo

Single repository containing all application code, build configuration, and documentation. This structure supports the web application's unified codebase and simplifies deployment processes. No separate frontend/backend repositories needed for this local-first web application.

## Service Architecture

**Web Application Architecture**: This is a single-page web application (SPA) optimized for desktop browser use. The application uses a local-first architecture where all data processing and storage happens in the user's browser. No backend services, APIs, or cloud infrastructure required for MVP. The application should work as a Progressive Web App (PWA) to support offline functionality.

**Component Architecture**: The application follows a component-based architecture using React with clear separation between:
- UI Layer (kanban board, task cards, side panels, views)
- Business Logic Layer (task management, time tracking, revenue calculations)
- Data Layer (local database access, data persistence)

**State Management**: Application state managed locally using React Context API. No external state synchronization needed since all data is local. React Context provides sufficient state management for the application's scope without requiring additional state management libraries.

## Testing Requirements

**Full Testing Pyramid**: The application requires comprehensive testing across all levels:

- **Unit Tests**: Test individual components, business logic functions, time tracking calculations, revenue calculations, data model operations
- **Integration Tests**: Test interactions between UI components, data layer operations, timer functionality with background operation, drag-and-drop interactions
- **End-to-End Tests**: Test complete user workflows (create task, start timer, move task, view revenue dashboard, export data)
- **Manual Testing Convenience Methods**: Provide CLI tools or test utilities for quickly setting up test data, verifying data integrity, and testing edge cases

**Rationale**: Given the critical nature of time tracking (billable hours = revenue), comprehensive testing is essential. Users must trust the application to accurately track time and calculate revenue. Integration tests ensure timer functionality works correctly when app is minimized. E2E tests validate complete workflows. Manual testing methods support QA verification and debugging.

## Additional Technical Assumptions and Requests

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
