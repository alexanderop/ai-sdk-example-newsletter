---
description: Run all linters and fix issues
argument-hint: ""
---

# /lint-fix

## Purpose
Run all linters and fix issues automatically

## Contract
**Inputs:** None
**Outputs:** `STATUS=<OK|FAIL> FIXED=<count>`

## Instructions
Execute the following bash commands in sequence:

```bash
# 1. Run ESLint with auto-fix
pnpm lint --fix

# 4. Run TypeScript type checking (verification only)
pnpm typecheck
```

After all commands complete, print a STATUS line:
- `STATUS=OK FIXED=<count>` if all linters passed
- `STATUS=FAIL FIXED=<count>` if type errors remain

## Constraints
- Idempotent and deterministic
- No network tools by default
- Execute commands directly using run_in_terminal tool
