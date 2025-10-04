# Testing Documentation

This document outlines the testing framework implemented for the Sacred Madness research website.

## Testing Stack

- **Vitest**: Fast, modern testing framework with excellent TypeScript support
- **@testing-library/react**: Testing utilities for React components
- **@testing-library/jest-dom**: Custom matchers for DOM testing
- **jsdom**: Browser environment simulation for tests

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI (if @vitest/ui is installed)
npm run test:ui
```

## Test Structure

```
__tests__/
├── components/           # React component tests
├── lib/                 # Utility function tests
├── pages/               # Page component tests (future)
└── api/                 # API endpoint tests
```

## Current Test Coverage

### Core Functionality
- ✅ **Graph Builder** (`lib/graph-builder.ts`): Tests for critical knowledge graph functions
  - `getBacklinks()`: Link relationship queries
  - `getRelatedPages()`: Related content discovery
  - `getCategoryPages()`: Category-based content organization

- ✅ **Utility Functions** (`lib/utils.ts`, `lib/toc.ts`): Comprehensive coverage
  - `cn()`: Class name utility with Tailwind merging
  - `extractTOC()`: Table of contents extraction from markdown
  - `addIdsToHeadings()`: Heading ID generation for navigation

### React Components
- ✅ **WikiLayout**: Layout component with navigation and TOC
  - Breadcrumb rendering
  - Sidebar navigation
  - Table of contents integration
  - Responsive design elements

- ✅ **AIChat**: Interactive chat component
  - Component rendering and state management
  - Quick action button interactions
  - Input handling and validation
  - Basic UI interaction testing

### API Endpoints
- ✅ **Graph API** (`/api/graph`): Knowledge graph data serialization
  - Graph building and JSON conversion
  - Error handling
  - Node and edge data structure validation

## Test Configuration

### Vitest Configuration (`vitest.config.ts`)
- React plugin for JSX support
- jsdom environment for browser APIs
- TypeScript path mapping (`@/*` aliases)
- Coverage reporting with v8 provider
- Proper test file patterns and exclusions

### Test Setup (`test-setup.ts`)
- Global test utilities (@testing-library/jest-dom)
- Next.js mocking (router, navigation, Link, Image)
- Browser API mocks (IntersectionObserver, ResizeObserver)
- Window/DOM mocking for headless testing

## Testing Patterns

### Component Testing
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Basic rendering test
it('should render component', () => {
  render(<Component />)
  expect(screen.getByText('Expected Text')).toBeInTheDocument()
})

// User interaction test
it('should handle user input', async () => {
  const user = userEvent.setup()
  render(<Component />)
  await user.click(screen.getByRole('button'))
  // assertions...
})
```

### Utility Function Testing
```typescript
import { utilityFunction } from '@/lib/utils'

it('should process input correctly', () => {
  const result = utilityFunction('input')
  expect(result).toBe('expected-output')
})
```

### API Testing
```typescript
import { GET } from '@/app/api/endpoint/route'

it('should return expected response', async () => {
  const response = await GET()
  const data = await response.json()
  expect(response.status).toBe(200)
  expect(data).toMatchObject({ expected: 'structure' })
})
```

## Coverage Goals

Current coverage statistics:
- **Utils/TOC**: 100% coverage (complete)
- **Graph Builder**: ~31% coverage (public API tested)
- **WikiLayout**: ~94% coverage (core functionality)
- **AIChat**: ~53% coverage (essential features)
- **Graph API**: 100% coverage (complete)

## Future Expansion

The testing foundation is established for adding:

1. **Additional API endpoint tests** (with proper mocking strategies)
2. **Integration tests** for complex user workflows
3. **E2E tests** for critical user journeys
4. **Performance tests** for graph operations
5. **Accessibility tests** for component compliance

## Notes

- Tests focus on public API and user-facing functionality
- Complex mocking scenarios are avoided in favor of reliability
- Component tests prioritize essential behavior over exhaustive UI testing
- API tests use simplified mocking for consistent results

The framework provides a solid foundation for test-driven development and regression prevention.