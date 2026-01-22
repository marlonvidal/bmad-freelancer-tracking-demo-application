# Coding Standards

## Critical Frontend Rules

- **Type Safety:** Always use TypeScript types/interfaces, avoid `any`
- **Component Organization:** One component per file, co-locate related components
- **State Management:** Use Context API, avoid prop drilling beyond 2 levels
- **Data Access:** Always use repository pattern, never access IndexedDB directly from components
- **Error Handling:** All async operations must have try/catch, use Error Boundaries for component errors
- **Performance:** Use React.memo, useMemo, useCallback appropriately, avoid unnecessary re-renders
- **Accessibility:** All interactive elements must have ARIA labels, keyboard navigation support
- **Testing:** Write tests for business logic and user interactions, aim for 80%+ coverage

## Common Pitfalls and Solutions

**1. Direct IndexedDB Access from Components**
- ❌ **Pitfall:** Accessing `db.tasks.get()` directly in components
- ✅ **Solution:** Always use repository pattern: `taskRepository.getById(id)`
- **Why:** Enables testing, maintains separation of concerns, allows future storage changes

**2. Missing Error Boundaries**
- ❌ **Pitfall:** Component crashes break entire app
- ✅ **Solution:** Wrap major sections in Error Boundaries, provide fallback UI
- **Why:** Prevents total app failure, improves user experience

**3. Timer State Not Persisted**
- ❌ **Pitfall:** Timer state only in React state, lost on refresh
- ✅ **Solution:** Always persist timer state to IndexedDB immediately
- **Why:** Ensures timer survives browser refresh, enables background operation

**4. Over-fetching Data**
- ❌ **Pitfall:** Loading all tasks/clients/projects on app start
- ✅ **Solution:** Load data on-demand, use pagination or virtual scrolling
- **Why:** Improves initial load time, reduces memory usage

**5. Not Handling IndexedDB Quota**
- ❌ **Pitfall:** Assuming unlimited storage
- ✅ **Solution:** Catch `QuotaExceededError`, provide user feedback, offer export option
- **Why:** Prevents silent failures, gives users control

**6. Service Worker Not Updated**
- ❌ **Pitfall:** Users see old version after deployment
- ✅ **Solution:** Implement Service Worker update strategy, notify users of updates
- **Why:** Ensures users get latest features and bug fixes

**7. Missing Loading States**
- ❌ **Pitfall:** UI appears frozen during async operations
- ✅ **Solution:** Show loading indicators for all async operations
- **Why:** Improves perceived performance, provides user feedback

**8. Inconsistent Error Handling**
- ❌ **Pitfall:** Different error handling patterns across components
- ✅ **Solution:** Use consistent error handling pattern (Error Boundary + try/catch + user notification)
- **Why:** Maintains consistency, easier debugging

**9. Not Testing Timer Accuracy**
- ❌ **Pitfall:** Assuming timer is always accurate
- ✅ **Solution:** Test timer accuracy, especially background operation, handle browser throttling
- **Why:** Timer accuracy is critical for billable hours

**10. Ignoring Accessibility**
- ❌ **Pitfall:** Building UI without accessibility considerations
- ✅ **Solution:** Use semantic HTML, ARIA labels, keyboard navigation from start
- **Why:** Required for WCAG compliance, improves UX for all users

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `TaskCard.tsx` |
| Hooks | camelCase with 'use' | `useTimer.ts` |
| Services | PascalCase classes | `TimerService.ts` |
| Utilities | camelCase | `timeUtils.ts` |
| Types/Interfaces | PascalCase | `Task`, `TimeEntry` |
| Constants | UPPER_SNAKE_CASE | `MAX_TASKS_PER_COLUMN` |
| Test files | `.test.ts` or `.spec.ts` | `TaskCard.test.tsx` |
