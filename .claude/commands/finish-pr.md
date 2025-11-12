---
description: Complete and merge a PR after fixing any CI failures
argument-hint: [pr-number]
---

# /finish-pr

## Purpose
Complete a pull request by verifying tests, fixing any CI failures, waiting for checks to pass, and merging to the base branch.

## Contract
**Inputs:** `pr-number` (optional) — PR number to finish. If not provided, uses PR for current branch.
**Outputs:** `STATUS=<MERGED|FAIL> PR=<number> FIXES=<n>`

## Instructions

1. **Get PR number:**
   - If PR number provided, use it
   - Otherwise, run `gh pr view --json number -q .number` to get current branch's PR
   - If no PR found, exit with `STATUS=FAIL ERROR="No PR found"`

2. **Verify tests locally:**
   - Run project test command (e.g., `pnpm test`)
   - If tests fail, proceed to step 3
   - If tests pass, skip to step 4

3. **Fix failing tests:**
   - Analyze test failures from output
   - Identify root cause of each failure
   - Fix issues using Read/Edit tools
   - Re-run tests to verify fixes
   - If fixes made:
     - Stage changes with `git add`
     - Commit with descriptive message explaining fixes
     - Push to remote branch

4. **Check PR CI status:**
   - Run `gh pr checks <pr-number>` to get all check statuses
   - Run `gh pr view <pr-number> --json mergeable,mergeStateStatus` to check merge status
   - If all checks passing, skip to step 6

5. **Wait for CI checks:**
   - If checks are pending, wait and poll status every 20-30 seconds
   - Continue until all checks complete
   - If any checks fail, show failure details and exit with `STATUS=FAIL`

6. **Verify PR is mergeable:**
   - Confirm `mergeable: MERGEABLE` and `mergeStateStatus: CLEAN`
   - If not mergeable, exit with `STATUS=FAIL ERROR="PR not mergeable"`

7. **Merge PR:**
   - Run `gh pr merge <pr-number> --merge --delete-branch`
   - Verify merge succeeded
   - Check if worktrees need cleanup

8. **Cleanup worktrees (if applicable):**
   - Run `git worktree list` to check for worktrees
   - If feature branch worktree exists and is marked as prunable, remove it
   - Run `git worktree remove <path>` if needed

9. **Report status:**
   - Print summary of fixes made (if any)
   - Print `STATUS=MERGED PR=<number> FIXES=<n>`

## Constraints
- Must use `gh` CLI for all GitHub operations
- Must verify tests locally before checking CI
- Must wait for CI checks to complete before merging
- Must handle graceful degradation (fix what can be fixed)
- Uses TodoWrite to track progress through workflow
- Idempotent: safe to run multiple times

## Example Usage
```bash
/finish-pr 8        # Complete and merge PR #8
/finish-pr          # Complete and merge current branch's PR
```

## Notes
- This command combines local test verification, CI monitoring, and merge operations
- Automatically commits and pushes fixes if tests fail locally
- Waits for CI checks to pass before attempting merge
- Cleans up remote branch and worktrees after successful merge
