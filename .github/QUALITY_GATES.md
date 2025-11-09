# Quality Gates Quick Reference

## ✅ Required Checks

All PRs must pass these checks before merging:

| Check | What It Does | Typical Duration | How to Fix Locally |
|-------|-------------|------------------|-------------------|
| 🔍 **Fast Linting** | Quick oxlint scan | <5s | `pnpm lint:fast` |
| 🔍 **Full Linting** | ESLint with rules | ~30s | `pnpm lint --fix` |
| 📝 **Type Checking** | TypeScript validation | ~15s | `pnpm typecheck` |
| 🧪 **Tests** | Unit tests + coverage | ~30s | `pnpm test --run` |
| 🏗️ **Build** | Production build | ~45s | `pnpm build` |
| 📧 **Script Check** | Newsletter syntax | ~5s | `npx tsx --check scripts/generate-newsletter.ts` |

## 🎯 Coverage Thresholds

Minimum required coverage: **60%** for all metrics
- Lines: 60%
- Functions: 60%
- Branches: 60%
- Statements: 60%

## 🚀 Pre-Push Checklist

Run these commands before pushing:

```bash
# 1. Fast check (runs in < 1 minute)
pnpm lint:fast && pnpm typecheck

# 2. Full validation (runs in ~2 minutes)
pnpm lint && pnpm test --run

# 3. Build verification (optional, runs in ~1 minute)
pnpm build
```

## 📊 Quality Metrics

### PR Size Guidelines

| Metric | ✅ Good | ⚠️ Review | 🛑 Too Large |
|--------|--------|----------|-------------|
| Files Changed | <20 | 20-50 | >50 |
| Lines Changed | <300 | 300-1000 | >1000 |

Large PRs are harder to review and more likely to introduce bugs.

### Test Coverage

| Coverage | Status | Action |
|----------|--------|--------|
| ≥80% | 🟢 Excellent | Maintain this standard |
| 60-79% | 🟡 Good | Consider adding more tests |
| <60% | 🔴 Insufficient | CI will fail - add tests |

## 🔧 Common Fixes

### Linting Errors

```bash
# Auto-fix most linting issues
pnpm lint --fix

# Check what will be fixed
pnpm lint --fix --dry-run
```

### Type Errors

```bash
# Show detailed type errors
pnpm typecheck

# Regenerate Nuxt types
rm -rf .nuxt && pnpm dev
```

### Test Failures

```bash
# Run tests with detailed output
pnpm test --run --reporter=verbose

# Run single test file
pnpm test tests/generate-newsletter.test.ts

# Update snapshots (if needed)
pnpm test --run -u
```

### Build Errors

```bash
# Clean build
rm -rf .nuxt .output
pnpm build

# Check for missing dependencies
pnpm install
```

## 🎪 Workflow Status

Check workflow status at: `https://github.com/USER/REPO/actions`

### Status Badges

Current build status:
```markdown
[![Quality Gate](https://github.com/USER/REPO/workflows/Quality%20Gate/badge.svg)](https://github.com/USER/REPO/actions/workflows/ci.yml)
```

## 🚨 Emergency Bypass

**When CI is broken and you need to merge urgently:**

1. **DO NOT** bypass branch protection for regular work
2. Contact repository administrator
3. Document the reason for bypass
4. Create follow-up issue to fix CI
5. Re-enable protection immediately after merge

## 📚 Additional Resources

- [Contributing Guide](.github/CONTRIBUTING.md) - Full contribution guidelines
- [Workflows Guide](.github/workflows-guide.md) - Detailed workflow documentation
- [Main README](../README.md) - Project documentation

## 🆘 Getting Help

**CI is failing and you don't know why?**

1. Check the workflow logs in GitHub Actions
2. Run the failing command locally
3. Check this guide for common fixes
4. Ask in team chat or create an issue

**Need to add a new check?**

1. Add the command to `package.json` scripts
2. Add corresponding step to `.github/workflows/ci.yml`
3. Test locally first
4. Update this documentation
