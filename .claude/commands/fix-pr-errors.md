---
description: Get all errors from an open PR and fix them
argument-hint: [pr-number]
---

# /fix-pr-errors

## Purpose
Fetch all CI/CD errors from an open pull request using GitHub CLI and automatically fix all identified issues.

## Contract
**Inputs:** `pr-number` (optional) — PR number to analyze. If not provided, uses PR for current branch.
**Outputs:** `STATUS=<FIXED|PARTIAL|FAIL> ERRORS_FOUND=<n> ERRORS_FIXED=<n>`

## Instructions

1. **Get PR number:**
   - If PR number provided, use it
   - Otherwise, run `gh pr view --json number -q .number` to get current branch's PR
   - If no PR found, exit with `STATUS=FAIL ERROR="No PR found"`

2. **Check CI status:**
   - Run `gh pr checks <pr-number>` to get all check statuses
   - Identify all failed checks
   - If no failures, exit with `STATUS=OK MESSAGE="All checks passing"`

3. **Get detailed failure logs:**
   - For each failed check, extract the run ID
   - Run `gh run view <run-id> --log` to get full logs
   - Parse logs to identify:
     - Linting errors
     - Test failures
     - Type errors
     - Build failures
     - Any other errors

4. **Analyze and categorize errors:**
   - Group errors by type (lint, test, type, build, etc.)
   - Identify root causes
   - Determine if errors are related or independent

5. **Fix all identified issues:**
   - For linting errors: Run `pnpm lint` locally to see errors, then fix them
   - For type errors: Run `pnpm typecheck` locally, then fix them
   - For test failures: Run `pnpm test` locally, analyze failures, then fix them
   - For build errors: Run `pnpm build` locally, analyze failures, then fix them
   - Use Read/Edit tools to fix files
   - Verify each fix locally before moving to next

6. **Verify fixes:**
   - Run all relevant commands locally to confirm fixes:
     - `pnpm lint` (no errors)
     - `pnpm typecheck` (no errors)
     - `pnpm test` (all passing)
     - `pnpm build` (successful)
   - If any verification fails, continue fixing

7. **Commit changes:**
   - Stage all fixed files with `git add`
   - Create commit with message: `fix: resolve CI failures from PR #<pr-number>`
   - Push changes

8. **Report status:**
   - Print summary of errors found and fixed
   - Print `STATUS=FIXED ERRORS_FOUND=<n> ERRORS_FIXED=<n>`
   - If some errors couldn't be fixed: `STATUS=PARTIAL ERRORS_FOUND=<n> ERRORS_FIXED=<n>`

## Constraints
- Must use `gh` CLI for all GitHub operations
- Must verify all fixes locally before committing
- Must handle multiple error types in single run
- Must be idempotent (safe to run multiple times)
- Uses TodoWrite to track progress through error fixes

## Example Usage
```bash
/fix-pr-errors 5        # Fix errors in PR #5
/fix-pr-errors          # Fix errors in current branch's PR
```
