# Contributing to AI Newsletter Platform

Thank you for considering contributing! This guide will help you get started.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `pnpm install`
3. Copy example config: `cp config/sources.example-vue.json config/sources.json`
4. Create `.env` file with `ANTHROPIC_API_KEY`
5. Run dev server: `pnpm dev`

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run type checking
pnpm typecheck

# Run linting
pnpm lint
```

## Coding Standards

This project follows strict TypeScript and coding standards. See [CLAUDE.md](CLAUDE.md) for details:

- Use TypeScript strict mode
- No `any` types without justification
- Specify return types on exported functions
- Use Zod for validation at API boundaries
- Use neverthrow for expected errors
- Write tests for new features (TDD preferred)

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following coding standards
3. Add tests for new features
4. Run `pnpm test` and `pnpm typecheck`
5. Update documentation if needed
6. Submit PR with clear description

## Adding New Resource Adapters

If you want to add support for a new content source:

1. Create adapter in `scripts/core/resources/adapters/`
2. Implement `Resource` interface
3. Add Zod schema in `schemas/`
4. Create example config in `config/sources.example-*.json`
5. Add tests in `tests/`
6. Update documentation

See existing adapters (RSS, Reddit, GitHub, Dev.to) as examples.

## Questions?

Open an issue for discussion before starting work on major features.
