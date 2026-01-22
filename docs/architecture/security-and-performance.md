# Security and Performance

## Security Requirements

**Frontend Security:**
- **CSP Headers:** Content Security Policy configured in Vercel headers (see CSP Configuration below)
- **XSS Prevention:** React's built-in XSS protection, input sanitization for user-generated content
- **Secure Storage:** IndexedDB is sandboxed per origin, no sensitive data exposure

**CSP (Content Security Policy) Configuration:**

Create `vercel.json` in project root with CSP headers:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

**CSP Policy Breakdown:**
- `default-src 'self'`: Only allow resources from same origin
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'`: Required for Vite HMR and React (consider removing unsafe-* in production if possible)
- `style-src 'self' 'unsafe-inline'`: Required for Tailwind CSS and inline styles
- `img-src 'self' data: https:`: Allow images from same origin, data URIs, and HTTPS
- `worker-src 'self' blob:`: Required for Service Worker
- `frame-ancestors 'none'`: Prevent embedding in iframes
- Other headers provide additional security layers

**Backend Security:**
- **N/A** - No backend

**Authentication Security:**
- **N/A** - Single-user local application, no authentication

## Performance Optimization

**Frontend Performance:**
- **Bundle Size Target:** < 500KB initial bundle (gzipped)
- **Loading Strategy:** Code splitting for routes/views, lazy loading for heavy components
- **Caching Strategy:** Service Worker caches assets, IndexedDB for data persistence

**Backend Performance:**
- **N/A** - No backend

**Optimization Techniques:**
- React.memo for expensive components
- useMemo/useCallback for expensive computations
- Virtual scrolling for kanban board (if 1000+ tasks)
- Debounced search/filter inputs
- Lazy loading for task detail panel
- Optimistic UI updates

**Virtual Scrolling Implementation:**

For handling 1000+ tasks efficiently, implement virtual scrolling using `@tanstack/react-virtual`:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

// In Column component
const parentRef = useRef<HTMLDivElement>(null);
const virtualizer = useVirtualizer({
  count: tasks.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 120, // Estimated task card height
  overscan: 5, // Render 5 extra items for smooth scrolling
});

// Render only visible items
{virtualizer.getVirtualItems().map((virtualItem) => (
  <div
    key={virtualItem.key}
    style={{
      height: `${virtualItem.size}px`,
      transform: `translateY(${virtualItem.start}px)`,
    }}
  >
    <TaskCard task={tasks[virtualItem.index]} />
  </div>
))}
```

**Performance Testing Guidance:**

1. **Load Testing with 1000+ Tasks:**
   - Create test data generator to populate IndexedDB with 1000+ tasks
   - Measure: initial load time, render performance, scroll performance, filter/search performance
   - Use React Profiler to identify performance bottlenecks
   - Target: < 3s initial load, 60fps scrolling, < 100ms filter operations

2. **IndexedDB Performance Testing:**
   - Test query performance with large datasets
   - Measure: CRUD operation times, compound query performance
   - Use browser Performance API to measure IndexedDB operations
   - Target: < 50ms for single queries, < 200ms for complex queries

3. **Memory Usage Testing:**
   - Monitor memory usage with Chrome DevTools Memory Profiler
   - Test with 1000+ tasks over extended period
   - Check for memory leaks (growing memory over time)
   - Target: < 100MB memory usage with 1000 tasks loaded

4. **Timer Accuracy Testing:**
   - Test background timer accuracy over extended periods (1+ hours)
   - Measure drift between actual time and tracked time
   - Test across different browsers (Chrome, Firefox, Safari)
   - Target: < 1% accuracy loss over 8-hour period
