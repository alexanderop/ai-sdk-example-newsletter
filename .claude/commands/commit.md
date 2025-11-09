---
description: Create a conventional commit message from git changes
argument-hint: [scope]
---

# /commit

## Purpose
Analyze git changes and generate a conventional commit message following the Conventional Commits specification. Does not push changes - user must push manually.

## Contract
**Inputs:** `[scope]` — optional scope for the commit (e.g., "ui", "api", "docs")
**Outputs:** `STATUS=<OK|FAIL> MESSAGE=<commit-message>`

## Instructions

1. **Check git status:**
   - Run `git status --porcelain` to check for changes
   - If no changes, print `STATUS=FAIL MESSAGE="No changes to commit"` and exit

2. **Analyze changes:**
   - Run `git diff --cached` for staged changes
   - Run `git diff` for unstaged changes
   - Run `git status` to see overall state

3. **Determine commit type:**
   - `feat`: New feature
   - `fix`: Bug fix
   - `docs`: Documentation only
   - `style`: Code style changes (formatting, no logic change)
   - `refactor`: Code refactoring
   - `perf`: Performance improvements
   - `test`: Adding or updating tests
   - `build`: Build system or dependencies
   - `ci`: CI/CD changes
   - `chore`: Other changes (tooling, config)

4. **Generate commit message:**
   - Format: `<type>([scope]): <description>`
   - Description: lowercase, imperative mood, no period
   - Add body if needed for complex changes
   - Include breaking changes with `BREAKING CHANGE:` footer if applicable

5. **Stage all changes and commit:**
   - Run `git add -A` to stage all changes
   - Run `git commit -m "<message>"` with generated message
   - Print `STATUS=OK MESSAGE="<commit-message>"`

## Constraints
- Follow Conventional Commits specification strictly
- Commits must be atomic and focused
- No automatic push - user controls when to push
- Must have changes to proceed

## Example Usage
```bash
# Commit all changes with auto-detected type
/commit

# Commit with specific scope
/commit ui

# Output:
# STATUS=OK MESSAGE="feat(ui): add dark mode toggle"
```
