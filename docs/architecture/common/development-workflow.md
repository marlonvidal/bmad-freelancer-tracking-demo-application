# Development Workflow

## Local Development Setup

### Prerequisites

```bash
# Required
- Node.js >= 18.0.0
- npm >= 9.0.0 (or yarn/pnpm)

# Optional but recommended
- Git
- VS Code with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
```

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd time-tracking-kanban

# Install dependencies
npm install

# Copy environment template (if needed)
cp .env.example .env.local

# Start development server
npm run dev
```

### Development Commands

```bash
# Start development server (with HMR)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run unit and integration tests
npm test

# Run tests in watch mode
npm test:watch

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## Environment Configuration

**No Environment Variables Required**

Since this is a frontend-only application with no backend services, no environment variables are needed. All configuration is handled through:
- Application settings stored in IndexedDB
- Build-time configuration in `vite.config.ts`
- Tailwind configuration in `tailwind.config.js`
