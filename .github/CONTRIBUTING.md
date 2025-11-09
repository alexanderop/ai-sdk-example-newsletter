# Contributing Guide

Thank you for contributing to this project! This guide explains our quality standards and CI/CD workflows.

## Quality Gates

All pull requests must pass the following quality gates before merging:

### 1. Code Quality & Tests
- **Fast Linting**: Quick oxlint check for common issues
- **Comprehensive Linting**: Full ESLint analysis with TypeScript-aware rules
- **Type Checking**: TypeScript type validation
- **Unit Tests**: All tests must pass with minimum 60% coverage
- **Coverage Reporting**: Automatic upload to Codecov (if configured)

### 2. Build Verification
- Production build must complete successfully
- Build artifacts are preserved for 7 days

### 3. Newsletter Script Validation
- TypeScript syntax validation for newsletter generator script
- Ensures scripts are valid before merge

## GitHub Actions Workflows

### Main CI Workflow (`.github/workflows/ci.yml`)
**Triggers:**
- Push to `main`, `develop`, or feature branches
- Pull requests to `main` or `develop`

**Features:**
- Parallel job execution for faster feedback
- Dependency caching for faster runs
- Automatic cancellation of outdated workflow runs
- Coverage reporting integration

### PR Checks (`.github/workflows/pr-checks.yml`)
**Triggers:**
- Pull request opened, synchronized, or reopened

**Features:**
- PR size analysis (warns on large PRs)
- Dependency security review
- Automated quality metrics

## Local Development

Before pushing changes, run these commands locally:

```bash
# Fast linting
pnpm lint:fast

# Full linting
pnpm lint

# Type checking
pnpm typecheck

# Run tests with coverage
pnpm test --run --coverage

# Build verification
pnpm build
```

## Setting Up Required Status Checks

To enforce quality gates on GitHub:

1. Go to repository **Settings** → **Branches**
2. Add branch protection rule for `main`
3. Enable "Require status checks to pass before merging"
4. Select these required checks:
   - ✅ All Quality Gates Passed
   - ✅ Code Quality & Tests
   - ✅ Build Verification
   - ✅ Newsletter Script Validation

## Code Coverage

We maintain minimum coverage thresholds:
- **Lines**: 60%
- **Functions**: 60%
- **Branches**: 60%
- **Statements**: 60%

Coverage reports are generated in:
- `coverage/index.html` - HTML report
- `coverage/coverage-final.json` - JSON report
- `coverage/lcov.info` - LCOV format for CI tools

### Optional: Codecov Integration

To enable coverage tracking with Codecov:

1. Sign up at [codecov.io](https://codecov.io)
2. Add repository to Codecov
3. Add `CODECOV_TOKEN` secret in GitHub repository settings
4. Coverage reports will automatically upload on each CI run

## Pull Request Best Practices

- **Keep PRs small**: Aim for <500 lines changed
- **Write descriptive titles**: Use conventional commit format
- **Update tests**: Add tests for new features
- **Check CI status**: Ensure all checks pass before requesting review
- **Respond to feedback**: Address review comments promptly

## Troubleshooting CI Failures

### Linting Failures
```bash
# Auto-fix linting issues
pnpm lint --fix
```

### Type Errors
```bash
# Check types locally
pnpm typecheck
```

### Test Failures
```bash
# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test tests/generate-newsletter.test.ts
```

### Build Failures
```bash
# Clean build
rm -rf .nuxt .output
pnpm build
```

## Getting Help

- **CI Issues**: Check workflow logs in GitHub Actions tab
- **Questions**: Open a GitHub Discussion
- **Bugs**: Create an issue with reproduction steps
