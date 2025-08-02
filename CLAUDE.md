# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

10xCards is an AI-powered Spanish learning flashcard application that automatically generates high-quality flashcards from web articles using artificial intelligence. The application supports students learning Spanish through the spaced repetition method.

**Target Users**: Spanish language students at various proficiency levels (A1-C2)
**Core Problem**: Manual flashcard creation is time-consuming, discouraging use of effective spaced repetition learning

## Technical Architecture

### Tech Stack
- **Frontend**: React with functional components and hooks
- **Backend**: FastAPI (Python) with async endpoints
- **Database**: PostgreSQL
- **Deployment**: Docker Compose
- **Language Processing**: spaCy (es_core_news_sm model)

### Key Components
- **Content Parser**: Extracts text from web articles using "longest text block" heuristic with `<article>` fallback
- **AI Flashcard Generator**: Filters vocabulary by user proficiency level, deduplicates globally, generates structured flashcards with context and tags
- **Spaced Repetition System**: Simple Leitner algorithm implementation with separate statistics table
- **Authentication**: Single password-based system (local deployment, no GDPR requirements)

## Development Guidelines

### Frontend (React)
- Use functional components with hooks (no class components)
- Implement React.memo() for components that render frequently with same props
- Use useCallback for event handlers to prevent unnecessary re-renders
- Prefer useMemo for expensive calculations
- Utilize React.lazy() and Suspense for code-splitting

### Backend (FastAPI)
- Use Pydantic models for request/response validation with strict type checking
- Implement dependency injection for services and database sessions
- Use async endpoints for I/O-bound operations
- Implement proper exception handling with HTTPException
- Use appropriate HTTP methods consistently

## Core Features (MVP Scope)

### Included in MVP
- AI flashcard generation from web articles (Spanish text)
- Manual flashcard CRUD operations
- Simple Leitner algorithm for spaced repetition
- User proficiency level configuration (A1-C2)
- Single-user authentication system
- Flashcard review sessions with progress tracking

### Explicitly NOT in MVP
- Advanced spaced repetition algorithms (SuperMemo, Anki-style)
- Multi-format import (PDF, DOCX)
- Multi-user support or flashcard sharing
- Mobile applications (web-only)
- Export functionality
- Database reset functionality

## Success Metrics

- **AI Acceptance Rate**: 75%+ of AI-generated flashcards should be accepted by users
- **AI Usage Rate**: 75%+ of new flashcards should be created via AI (vs manual)
- **Performance**: Backend response time < 400ms average
- **Capacity**: Support up to 100,000 flashcards without performance degradation

## User Stories Summary

The application supports 18 core user stories (US-001 to US-018) covering:
- Authentication and session management
- Article import and content parsing
- AI flashcard generation and review
- Manual flashcard management (create, edit, delete)
- Spaced repetition sessions with Leitner algorithm
- Basic progress statistics and proficiency configuration

## Development Constraints

- Single user system (no multi-tenancy)
- Spanish language only in MVP
- Local deployment via Docker Compose
- No encryption required (local storage)
- Maximum 100,000 flashcards capacity
- Target response time: < 400ms for backend operations

## CODING_PRACTICES

### Guidelines for SUPPORT_LEVEL

#### SUPPORT_EXPERT

- Favor elegant, maintainable solutions over verbose code. Assume understanding of language idioms and design patterns.
- Highlight potential performance implications and optimization opportunities in suggested code.
- Frame solutions within broader architectural contexts and suggest design alternatives when appropriate.
- Focus comments on 'why' not 'what' - assume code readability through well-named functions and variables.
- Proactively address edge cases, race conditions, and security considerations without being prompted.
- When debugging, provide targeted diagnostic approaches rather than shotgun solutions.
- Suggest comprehensive testing strategies rather than just example tests, including considerations for mocking, test organization, and coverage.


### Guidelines for DOCUMENTATION

#### TYPEDOC

- Use JSDoc-style comments with TypeScript-specific annotations for all public APIs
- Configure custom themes to match {{project_branding}} for consistent documentation
- Group related functionality using @module and @category tags for better organization
- Document edge cases and error handling for {{critical_functions}}
- Generate and publish documentation as part of the CI/CD pipeline to keep it current
- Include usage examples for complex interfaces and abstract classes


### Guidelines for VERSION_CONTROL

#### GIT

- Use conventional commits to create meaningful commit messages
- Use feature branches with descriptive names following {{branch_naming_convention}}
- Write meaningful commit messages that explain why changes were made, not just what
- Keep commits focused on single logical changes to facilitate code review and bisection
- Use interactive rebase to clean up history before merging feature branches
- Leverage git hooks to enforce code quality checks before commits and pushes


### Guidelines for ARCHITECTURE

#### ADR

- Create ADRs in /docs/adr/{name}.md for:
- 1) Major dependency changes
- 2) Architectural pattern changes
- 3) New integration patterns
- 4) Database schema changes

#### CLEAN_ARCHITECTURE

- Strictly separate code into layers: entities, use cases, interfaces, and frameworks
- Ensure dependencies point inward, with inner layers having no knowledge of outer layers
- Implement domain entities that encapsulate {{business_rules}} without framework dependencies
- Use interfaces (ports) and implementations (adapters) to isolate external dependencies
- Create use cases that orchestrate entity interactions for specific business operations
- Implement mappers to transform data between layers to maintain separation of concerns

#### MONOREPO

- Configure workspace-aware tooling to optimize build and test processes
- Implement clear package boundaries with explicit dependencies between packages
- Use consistent versioning strategy across all packages (independent or lockstep)
- Configure CI/CD to build and test only affected packages for efficiency
- Implement shared configurations for linting, testing, and {{development_tooling}}
- Use code generators to maintain consistency across similar packages or modules


### Guidelines for STATIC_ANALYSIS

#### ESLINT

- Configure project-specific rules in eslint.config.js to enforce consistent coding standards
- Use shareable configs like eslint-config-airbnb or eslint-config-standard as a foundation
- Implement custom rules for {{project_specific_patterns}} to maintain codebase consistency
- Configure integration with Prettier to avoid rule conflicts for code formatting
- Use the --fix flag in CI/CD pipelines to automatically correct fixable issues
- Implement staged linting with husky and lint-staged to prevent committing non-compliant code


## FRONTEND

### Guidelines for REACT

#### REACT_CODING_STANDARDS

- Use functional components with hooks instead of class components
- Implement React.memo() for expensive components that render often with the same props
- Utilize React.lazy() and Suspense for code-splitting and performance optimization
- Use the useCallback hook for event handlers passed to child components to prevent unnecessary re-renders
- Prefer useMemo for expensive calculations to avoid recomputation on every render
- Implement useId() for generating unique IDs for accessibility attributes
- Use the new use hook for data fetching in React 19+ projects
- Leverage Server Components for {{data_fetching_heavy_components}} when using React with Next.js or similar frameworks
- Consider using the new useOptimistic hook for optimistic UI updates in forms
- Use useTransition for non-urgent state updates to keep the UI responsive

#### REACT_ROUTER

- Use createBrowserRouter instead of BrowserRouter for better data loading and error handling
- Implement lazy loading with React.lazy() for route components to improve initial load time
- Use the useNavigate hook instead of the navigate component prop for programmatic navigation
- Leverage loader and action functions to handle data fetching and mutations at the route level
- Implement error boundaries with errorElement to gracefully handle routing and data errors
- Use relative paths with dot notation (e.g., "../parent") to maintain route hierarchy flexibility
- Utilize the useRouteLoaderData hook to access data from parent routes
- Implement fetchers for non-navigation data mutations
- Use route.lazy() for route-level code splitting with automatic loading states
- Implement shouldRevalidate functions to control when data revalidation happens after navigation


## DATABASE

### Guidelines for SQL

#### POSTGRES

- Use connection pooling to manage database connections efficiently
- Implement JSONB columns for semi-structured data instead of creating many tables for {{flexible_data}}
- Use materialized views for complex, frequently accessed read-only data


## BACKEND

### Guidelines for PYTHON

#### FASTAPI

- Use Pydantic models for request and response validation with strict type checking and custom validators
- Implement dependency injection for services and database sessions to improve testability and resource management
- Use async endpoints for I/O-bound operations to improve throughput for {{high_load_endpoints}}
- Leverage FastAPI's background tasks for non-critical operations that don't need to block the response
- Implement proper exception handling with HTTPException and custom exception handlers for {{error_scenarios}}
- Use path operation decorators consistently with appropriate HTTP methods (GET for retrieval, POST for creation, etc.)


## TESTING

### Guidelines for UNIT

#### VITEST

- Leverage the `vi` object for test doubles - Use `vi.fn()` for function mocks, `vi.spyOn()` to monitor existing functions, and `vi.stubGlobal()` for global mocks. Prefer spies over mocks when you only need to verify interactions without changing behavior.
- Master `vi.mock()` factory patterns - Place mock factory functions at the top level of your test file, return typed mock implementations, and use `mockImplementation()` or `mockReturnValue()` for dynamic control during tests. Remember the factory runs before imports are processed.
- Create setup files for reusable configuration - Define global mocks, custom matchers, and environment setup in dedicated files referenced in your `vitest.config.ts`. This keeps your test files clean while ensuring consistent test environments.
- Use inline snapshots for readable assertions - Replace complex equality checks with `expect(value).toMatchInlineSnapshot()` to capture expected output directly in your test file, making changes more visible in code reviews.
- Monitor coverage with purpose and only when asked - Configure coverage thresholds in `vitest.config.ts` to ensure critical code paths are tested, but focus on meaningful tests rather than arbitrary coverage percentages.
- Make watch mode part of your workflow - Run `vitest --watch` during development for instant feedback as you modify code, filtering tests with `-t` to focus on specific areas under development.
- Explore UI mode for complex test suites - Use `vitest --ui` to visually navigate large test suites, inspect test results, and debug failures more efficiently during development.
- Handle optional dependencies with smart mocking - Use conditional mocking to test code with optional dependencies by implementing `vi.mock()` with the factory pattern for modules that might not be available in all environments.
- Configure jsdom for DOM testing - Set `environment: 'jsdom'` in your configuration for frontend component tests and combine with testing-library utilities for realistic user interaction simulation.
- Structure tests for maintainability - Group related tests with descriptive `describe` blocks, use explicit assertion messages, and follow the Arrange-Act-Assert pattern to make tests self-documenting.
- Leverage TypeScript type checking in tests - Enable strict typing in your tests to catch type errors early, use `expectTypeOf()` for type-level assertions, and ensure mocks preserve the original type signatures.

#### PYTEST

- Use fixtures for test setup and dependency injection
- Implement parameterized tests for testing multiple inputs for {{function_types}}
- Use monkeypatch for mocking dependencies


