# Freelancer Tracking Demo Application

A modern React-based application for tracking freelancer work, built with Vite, TypeScript, and Tailwind CSS.

## Project Overview

This application provides a foundation for tracking freelancer tasks, time entries, and project organization. It's built as a single-page application (SPA) with a local-first architecture using IndexedDB for data persistence.

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher (or yarn/pnpm)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bmad-freelancer-tracking-demo-application
```

2. Install dependencies:
```bash
npm install
```

## Development Commands

- `npm run dev` - Start development server (default port: 5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm test` - Run unit and integration tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e` - Run E2E tests with Playwright

## Project Structure

```
bmad-freelancer-tracking-demo-application/
├── public/                     # Static assets
│   └── icons/                  # PWA icons
├── src/                        # Application source code
│   ├── components/             # React components
│   ├── contexts/               # React Context providers
│   ├── services/               # Business logic services
│   ├── hooks/                  # Custom React hooks
│   ├── utils/                  # Utility functions
│   ├── types/                  # TypeScript type definitions
│   ├── styles/                 # Global styles
│   │   └── globals.css         # Tailwind imports and custom CSS
│   ├── App.tsx                 # Root component
│   └── main.tsx                # Application entry point
├── tests/                      # Test files
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── e2e/                    # E2E tests (Playwright)
├── docs/                       # Documentation
├── .gitignore                  # Git ignore patterns
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── playwright.config.ts        # Playwright configuration
├── jest.config.js              # Jest configuration
└── README.md                   # Project documentation
```

## Technology Stack

- **React** ^18.2.0 - UI library
- **TypeScript** ^5.3.0 - Type safety
- **Vite** ^5.0.0 - Build tool and dev server
- **Tailwind CSS** ^3.4.0 - Utility-first CSS framework
- **Jest** ^29.7.0 - Unit and integration testing
- **React Testing Library** ^14.0.0 - Component testing
- **Playwright** ^1.40.0 - E2E testing
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Documentation

- [Product Requirements Document (PRD)](docs/prd/)
- [Architecture Documentation](docs/architecture/)
- [Frontend Specifications](docs/front-end-spec/)

## Development Workflow

1. Start the development server: `npm run dev`
2. Make changes to source files in `src/`
3. Hot Module Replacement (HMR) will automatically update the browser
4. Run tests: `npm test` or `npm run test:watch`
5. Run linter: `npm run lint`
6. Build for production: `npm run build`

## Health Check

The application includes a health check page that displays "Application is running" when accessed at the root URL. This verifies that the setup is working correctly.

## License

[Add license information here]
