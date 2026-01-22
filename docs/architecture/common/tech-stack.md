# Tech Stack

This is the DEFINITIVE technology selection for the entire project. All development must use these exact versions.

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| Frontend Language | TypeScript | ^5.3.0 | Type-safe JavaScript development | Provides type safety, better IDE support, and catches errors at compile time. Essential for maintaining code quality in a complex application. Version 5.3.0 provides latest features while maintaining stability. |
| Frontend Framework | React | ^18.2.0 | UI component library | Industry standard, excellent ecosystem, virtual DOM for efficient rendering of 1000+ tasks, strong drag-and-drop library support. |
| UI Component Library | None (Custom) | - | UI components | PRD emphasizes custom design optimized for freelancer workflows. No external component library needed for MVP. |
| State Management | React Context API | Built-in | Application state management | Sufficient for local-only application without external synchronization. Avoids Redux complexity while maintaining reactive updates. |
| Backend Language | N/A | - | No backend services | Application is frontend-only with local-first architecture. |
| Backend Framework | N/A | - | No backend services | Application is frontend-only with local-first architecture. |
| API Style | N/A | - | No API endpoints | All data processing happens client-side. |
| Database | IndexedDB (via Dexie.js) | ^3.2.4 | Local browser database | Browser-native storage for structured data. Dexie.js provides simpler API than raw IndexedDB, better TypeScript support, and efficient querying for 1000+ tasks. |
| Cache | Browser Cache API | Built-in | Asset caching for PWA | Native browser API used by Service Worker for offline asset caching. No external cache needed. |
| File Storage | Browser Download API | Built-in | Data export (CSV/JSON) | Native browser APIs for file downloads. No external storage needed for local-first architecture. |
| Authentication | N/A | - | No authentication | Single-user local application, no authentication required. |
| Frontend Testing | Jest + React Testing Library | ^29.7.0 / ^14.0.0 | Unit and integration testing | Industry standard for React testing. Jest provides comprehensive testing utilities, mocking capabilities, and code coverage. React Testing Library focuses on testing user behavior. |
| Backend Testing | N/A | - | No backend to test | Application is frontend-only. |
| E2E Testing | Playwright | ^1.40.0 | End-to-end workflow testing | Modern E2E testing framework with excellent browser support, reliable auto-waiting, and cross-browser testing. Better than Cypress for desktop browser testing. |
| Build Tool | Vite | ^5.0.0 | Development server and build | Fast HMR, optimized production builds, excellent React/TypeScript support, modern ES modules. Meets PRD requirement for fast development iteration. |
| Bundler | Vite (Rollup) | Built-in | Production bundling | Vite uses Rollup for production builds, providing tree-shaking and code splitting automatically. |
| IaC Tool | N/A | - | No infrastructure | Static site deployment via Vercel, no infrastructure as code needed. |
| CI/CD | GitHub Actions | - | Automated testing and deployment | Integrated with GitHub, free for public repos, supports automated testing and Vercel deployment. |
| Monitoring | N/A | - | No telemetry | PRD explicitly states no telemetry data (privacy-first approach). |
| Logging | Console API | Built-in | Development logging | Browser console sufficient for development. No external logging service needed for local-first app. |
| CSS Framework | Tailwind CSS | ^3.4.0 | Styling and theming | Utility-first CSS framework providing rapid UI development, built-in dark mode support, and excellent developer experience. Meets PRD dark mode requirement and enables fast iteration. |
| Drag and Drop | @dnd-kit/core | ^6.0.0 | Kanban drag-and-drop | Modern, accessible drag-and-drop library. Better TypeScript support and accessibility than react-beautiful-dnd. Supports 60fps requirement. |
| CSV Export | PapaParse | ^5.4.1 | CSV generation for exports | Reliable CSV generation library with streaming support for large datasets. Meets PRD export requirements. |
| PWA Support | Workbox | ^7.0.0 | Service Worker management | Google's library for Service Worker management, caching strategies, and PWA features. Simplifies offline functionality implementation. |
| Virtual Scrolling | @tanstack/react-virtual | ^3.0.0 | Efficient rendering of large lists | Enables rendering of 1000+ tasks efficiently by only rendering visible items. Reduces DOM nodes and improves performance. |
