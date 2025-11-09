# GitHub Actions Workflows Guide

## Overview

This project uses GitHub Actions for automated quality gates and continuous integration. All code changes must pass these checks before merging.

## Workflows

### 1. Quality Gate (`ci.yml`)

**Purpose**: Main quality assurance pipeline

**Triggers**:
- Push to `main`, `develop`, or `add-script-ai-sdk` branches
- Pull requests to `main` or `develop`

**Jobs**:

#### 🔍 Code Quality & Tests
- Fast linting with oxlint
- Comprehensive linting with ESLint
- TypeScript type checking
- Unit tests with coverage (minimum 60%)
- Coverage upload to Codecov (optional)

#### 🏗️ Build Verification
- Production build validation
- Build artifact archiving (7 days retention)

#### 📧 Newsletter Script Validation
- TypeScript syntax validation for newsletter generator

#### ✅ All Quality Gates Passed
- Final status check that all jobs succeeded
- This is the job to use as a required status check

**Estimated Runtime**: 5-8 minutes

**Features**:
- ⚡ Parallel job execution for speed
- 💾 Dependency caching (pnpm)
- 🔄 Auto-cancellation of outdated runs
- ⏱️ 10-minute timeout per job

---

### 2. PR Quality Checks (`pr-checks.yml`)

**Purpose**: Additional PR-specific validations

**Triggers**:
- Pull request opened/synchronized/reopened

**Jobs**:

#### 📋 PR Information
- Displays PR metadata in workflow log

#### 📊 PR Size Check
- Analyzes files and lines changed
- Warns on large PRs (>50 files or >1000 lines)
- Helps maintain reviewable PR sizes

#### 🔒 Dependency Security
- **Dependency Review**: GitHub Advanced Security feature (public repos only or private with GHAS)
- **Dependency Audit**: Uses `pnpm audit` for security scanning
- Checks for moderate+ severity vulnerabilities
- Only runs for PRs to `main` branch

**Estimated Runtime**: 1-2 minutes

---

## Setting Up Required Status Checks

### Step 1: Enable Branch Protection

1. Go to **Settings** → **Branches**
2. Click **Add branch protection rule**
3. Set branch name pattern: `main`

### Step 2: Configure Required Checks

Enable these options:
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**

Add required status checks:
- `All Quality Gates Passed` (from Quality Gate workflow)
- `Code Quality & Tests` (from Quality Gate workflow)
- `Build Verification` (from Quality Gate workflow)
- `Newsletter Script Validation` (from Quality Gate workflow)

### Step 3: Additional Protections (Recommended)

- ✅ **Require a pull request before merging**
  - Required approvals: 1
- ✅ **Require conversation resolution before merging**
- ✅ **Do not allow bypassing the above settings**

---

## Running Checks Locally

Before pushing, run these commands to catch issues early:

```bash
# Quick validation (< 30 seconds)
pnpm lint:fast

# Full quality check (2-3 minutes)
pnpm lint
pnpm typecheck
pnpm test --run

# Build verification (1-2 minutes)
pnpm build
```

---

## Troubleshooting

### ❌ Linting Failures

**Problem**: ESLint or oxlint errors

**Solution**:
```bash
# Auto-fix most issues
pnpm lint --fix

# Check what changed
git diff
```

### ❌ Type Errors

**Problem**: TypeScript compilation errors

**Solution**:
```bash
# Run type check locally
pnpm typecheck

# Common fixes:
# - Add missing type imports
# - Fix incorrect type annotations
# - Update .nuxt/tsconfig.*.json (auto-generated)
```

### ❌ Test Failures

**Problem**: Tests fail in CI but pass locally

**Solution**:
```bash
# Ensure API key is set
echo "ANTHROPIC_API_KEY=test-api-key-for-testing" > .env

# Run tests exactly as CI does
pnpm test --run --coverage

# Debug specific test
pnpm test tests/generate-newsletter.test.ts
```

### ❌ Build Failures

**Problem**: Build fails in CI

**Solution**:
```bash
# Clean and rebuild
rm -rf .nuxt .output node_modules/.cache
pnpm install
pnpm build

# Check for environment-specific issues
NODE_ENV=production pnpm build
```

### ❌ Coverage Below Threshold

**Problem**: Test coverage is below 60%

**Solution**:
```bash
# See uncovered lines
pnpm test --run --coverage
open coverage/index.html

# Add tests for uncovered code
# Focus on scripts/**/*.ts files
```

### ❌ PR Too Large

**Warning**: PR size check warns about large changes

**Solution**:
- Break PR into smaller, logical chunks
- Separate refactoring from feature additions
- Split unrelated changes into separate PRs

### ❌ Dependency Security Issues

**Problem**: Dependency audit finds vulnerabilities

**Solution**:
```bash
# Check for security issues
pnpm audit

# View detailed report
pnpm audit --json

# Update vulnerable dependencies
pnpm update

# Note: pnpm doesn't have 'audit fix' - update packages manually
```

**For private repositories**: The GitHub Dependency Review action requires GitHub Advanced Security (paid feature). We use `pnpm audit` as an alternative for security scanning on all repositories.

---

## Workflow Badges

Add these badges to your README or documentation:

```markdown
[![Quality Gate](https://github.com/USER/REPO/workflows/Quality%20Gate/badge.svg)](https://github.com/USER/REPO/actions/workflows/ci.yml)
[![PR Checks](https://github.com/USER/REPO/workflows/PR%20Quality%20Checks/badge.svg)](https://github.com/USER/REPO/actions/workflows/pr-checks.yml)
```

---

## Advanced Configuration

### Optional: Codecov Integration

1. Sign up at [codecov.io](https://codecov.io)
2. Install Codecov GitHub App
3. Add repository to Codecov
4. Add `CODECOV_TOKEN` secret:
   - Go to **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `CODECOV_TOKEN`
   - Value: (from Codecov dashboard)

Coverage will automatically upload on every CI run.

### Optional: Slack Notifications

Add workflow notifications to Slack:

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## Performance Tips

### Faster CI Runs

1. **Use `--frozen-lockfile`**: Prevents dependency resolution
2. **Enable caching**: Already configured for pnpm
3. **Run jobs in parallel**: Already configured
4. **Use `oxlint` first**: Catches issues faster than ESLint

### Cost Optimization

- GitHub Actions includes 2,000 free minutes/month for private repos
- Public repos get unlimited free minutes
- Average workflow cost: ~5-8 minutes per run
- Branch protection prevents unnecessary runs on untested code

---

## Monitoring

### View Workflow Status

1. Go to **Actions** tab in GitHub
2. Select workflow name
3. View run history and logs

### Download Artifacts

1. Go to workflow run
2. Scroll to **Artifacts** section
3. Download `nuxt-build` (available for 7 days)

### Check Coverage

- Coverage reports upload to Codecov (if configured)
- Local HTML report: `coverage/index.html`

---

## Common Questions

**Q: Can I skip CI checks?**
A: No, when branch protection is enabled. This ensures code quality.

**Q: Why are there two lint steps?**
A: `oxlint` is fast (<1s), `eslint` is comprehensive (~30s). Fail fast strategy.

**Q: Can I run workflows on my fork?**
A: Yes, workflows run automatically on forks. Add your `ANTHROPIC_API_KEY` secret.

**Q: How do I update workflow files?**
A: Edit `.github/workflows/*.yml` files. Changes apply on next push.

**Q: Can I test workflows locally?**
A: Use [act](https://github.com/nektos/act) to run GitHub Actions locally:
```bash
brew install act
act push
```
