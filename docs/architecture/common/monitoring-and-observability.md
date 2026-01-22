# Monitoring and Observability

## Monitoring Stack

- **Frontend Monitoring:** Browser DevTools, React DevTools
- **Backend Monitoring:** N/A
- **Error Tracking:** Console logging (no external service per privacy-first approach)
- **Performance Monitoring:** Browser Performance API, React Profiler

## Key Metrics

**Frontend Metrics:**
- Core Web Vitals (LCP, FID, CLS)
- JavaScript errors (console errors)
- IndexedDB operation performance
- Component render times (React Profiler)
- Timer accuracy

**Backend Metrics:**
- **N/A** - No backend

**User Experience Metrics:**
- Task creation time
- Timer start/stop latency
- Board load time
- Export operation duration

## Logging Strategy

- **Development:** Console.log for debugging
- **Production:** Minimal logging, errors only
- **No External Logging:** Privacy-first approach, no telemetry sent to external services
