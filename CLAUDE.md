# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

This is a Nuxt 4 application with an integrated Vue.js newsletter generator powered by the Anthropic Claude API. The project has two distinct parts:

1. **Nuxt Web Application** (`/app`) - See `/app/CLAUDE.md` for specific guidance
2. **Newsletter Generator** (`/scripts`) - See `/scripts/CLAUDE.md` for specific guidance
3. **Test Infrastructure** (`/tests`) - See `/tests/CLAUDE.md` for testing guidelines

## Coding Standards

### TypeScript

- **Use strict TypeScript** - No `any` types without justification
- **Prefer interfaces over types** for object shapes
- **Use semicolons** at the end of statements (ASI can cause issues)
- **Member delimiter**: Use semicolons in interfaces and type literals
- **Return types**: Always specify return types on exported functions

### Code Style

- **Brace style**: Use 1tbs (opening brace on same line)
- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Single quotes for strings (except to avoid escaping)
- **Trailing commas**: No trailing commas in objects/arrays
- **Line length**: Prefer 100 characters max

### Naming Conventions

- **Files**: kebab-case (`user-profile.ts`, not `UserProfile.ts`)
- **Components**: PascalCase (`UserProfile.vue`)
- **Functions**: camelCase (`fetchUserData`)
- **Constants**: UPPER_SNAKE_CASE for true constants (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`UserProfile`, `ApiResponse`)

### Error Handling

- **Use neverthrow** for expected errors (Result<T, E> pattern)
- **Throw exceptions** only for unexpected/unrecoverable errors
- **Validate at boundaries** - Use Zod schemas at API boundaries
- **Log validation errors** with resource prefix: `[resource-id] error message`
- **Fail fast** - Don't propagate invalid data deeper into the system

## Development Workflows

### Before Writing Code

1. **Understand the requirement** - Ask clarifying questions if needed
2. **Check existing patterns** - Look for similar implementations
3. **Plan the approach** - Consider edge cases and error handling

### Writing Code

1. **Write tests first** when implementing new features (TDD)
2. **Run tests frequently** - Use `pnpm test:watch` during development
3. **Validate schemas** - Use Zod at API boundaries
4. **Check types** - Run `pnpm typecheck` before committing

### Before Committing

1. **Run linting** - Execute `pnpm lint`
2. **Run all tests** - Execute `pnpm test` to ensure nothing broke
3. **Review your changes** - Use `git diff` to check what you're committing
4. **Write clear commit messages** - Follow conventional commits format

### Creating Pull Requests

1. **Verify all tests pass** - Run `pnpm test`
2. **Check build succeeds** - Run `pnpm build`
3. **Review the diff** - Use `git diff main...HEAD` to see all changes
4. **Write descriptive PR description** - Explain what, why, and how
5. **Include test plan** - List verification steps as checkboxes

## Commands

### Development
```bash
pnpm dev              # Start development server on localhost:3000
pnpm build            # Build for production
pnpm preview          # Preview production build locally
pnpm typecheck        # Run TypeScript type checking
```

### Code Quality
```bash
pnpm lint             # Run ESLint with oxlint
pnpm lint:type-aware  # Run oxlint with type checking
```

### Testing
```bash
pnpm test             # Run Vitest tests once
pnpm test:watch       # Run tests in watch mode (use during dev)
pnpm test:ui          # Open Vitest UI for debugging
```

### Newsletter Generator
```bash
pnpm newsletter       # Generate weekly Vue.js newsletter
```

## Pull Request Review Criteria

When reviewing PRs (or when you complete work), verify:

### Code Quality
- [ ] Follows TypeScript and style conventions
- [ ] No `any` types without justification
- [ ] Return types specified on exported functions
- [ ] Proper error handling (neverthrow for expected errors)

### Testing
- [ ] New features have tests
- [ ] Bug fixes have regression tests
- [ ] Tests are deterministic (no flaky tests)
- [ ] All tests pass (`pnpm test`)

### Architecture
- [ ] Code is in the right directory (`/app`, `/scripts`, or `/tests`)
- [ ] Follows existing patterns
- [ ] Zod schemas at API boundaries
- [ ] Shared schemas in `/schemas` (not duplicated)

### Documentation
- [ ] CLAUDE.md updated if architecture changed
- [ ] Complex logic has inline comments
- [ ] Public APIs have JSDoc comments

## Architecture

### Directory Structure

```
/app                  # Nuxt 4 web application (see /app/CLAUDE.md)
/scripts              # Newsletter generator (see /scripts/CLAUDE.md)
/tests                # Test infrastructure (see /tests/CLAUDE.md)
/schemas              # Shared Zod schemas (used by both app and tests)
/newsletters          # Generated newsletter output
```

### Key Architectural Patterns

**Shared Schemas (`/schemas`)**
- All Zod schemas live in `/schemas`, not in `/tests/schemas`
- Application code uses schemas for runtime validation (`.parse()`)
- Test code uses schemas for type-safe test data
- Single source of truth prevents drift

**Resource Adapters**
- Each external API has an adapter in `/scripts/core/resources/adapters`
- Adapters validate responses using shared Zod schemas
- Validation errors are logged with `[resource-id]` prefix
- Adapters fail fast on validation errors (throw, don't return empty arrays)

**Testing with Collections**
- Use `@msw/data` collections instead of factory functions
- Tests explicitly seed collections before running
- MSW handlers query collections (thin layer)
- Collections are cleared after each test for isolation
- See `/tests/CLAUDE.md` for detailed testing patterns

## Key Technical Decisions

**Package Manager**: Use `pnpm` only (locked to v10.19.0)

**TypeScript**: Project uses Nuxt's generated TypeScript config (`.nuxt/tsconfig.*.json`)

**Error Handling**: Use `neverthrow` Result pattern for expected errors, throw for unexpected

**Environment Variables**: Required `.env` with `ANTHROPIC_API_KEY` for newsletter generation
