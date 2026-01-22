# Deployment Architecture

## Deployment Strategy

**Frontend Deployment:**
- **Platform:** Vercel
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **CDN/Edge:** Vercel's global CDN (automatic)

**Backend Deployment:**
- **N/A** - No backend services

**Rollback Procedures:**

Vercel provides automatic rollback capabilities:

1. **Automatic Rollback:**
   - Vercel automatically keeps previous deployments
   - If a deployment fails health checks, Vercel can auto-rollback
   - Configure in Vercel dashboard: Settings → Deployment Protection

2. **Manual Rollback:**
   - Go to Vercel dashboard → Deployments
   - Find the previous working deployment
   - Click "..." menu → "Promote to Production"
   - Previous deployment becomes active immediately

3. **Rollback via CLI:**
   ```bash
   # List deployments
   vercel ls
   
   # Promote specific deployment to production
   vercel promote <deployment-url>
   ```

4. **Emergency Rollback:**
   - If dashboard is unavailable, use Vercel API
   - Or revert Git commit and push (triggers new deployment)

5. **Post-Rollback Verification:**
   - Verify application loads correctly
   - Test critical workflows (timer, task creation)
   - Check IndexedDB compatibility (if schema changed)
   - Monitor error logs for issues

**Deployment Best Practices:**
- Always test in Preview environment before production
- Keep at least 3 previous deployments available
- Document breaking changes that require user action
- Consider feature flags for gradual rollouts

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
      - run: npm run build

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e
```

```yaml
# .github/workflows/deploy.yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org: ${{ secrets.VERCEL_ORG }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Environments

| Environment | Frontend URL | Backend URL | Purpose |
|------------|-------------|-------------|---------|
| Development | `http://localhost:5173` | N/A | Local development |
| Preview | Vercel Preview URL | N/A | PR preview deployments |
| Production | `https://app.example.com` | N/A | Live environment |
