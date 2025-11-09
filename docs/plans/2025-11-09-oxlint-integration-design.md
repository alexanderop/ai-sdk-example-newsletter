# Oxlint Integration Design

**Date:** 2025-11-09
**Status:** Approved for Implementation

## Overview & Goal

Add oxlint as a fast linting option alongside the existing ESLint setup. Use `eslint-plugin-oxlint` to prevent ESLint from checking rules that oxlint already covers, avoiding conflicts and redundant work.

**The result:**
- `pnpm lint:fast` - Run oxlint for quick correctness checks (seconds)
- `pnpm lint` - Run ESLint for comprehensive checks (Nuxt-specific, stylistic, everything oxlint doesn't cover)

This provides speed during development with comprehensive checks available when needed (pre-commit, CI, etc.).

## Installation & Dependencies

Install two packages:

**1. `oxlint`** - The actual linting tool (from the oxc project)
- Installed as a dev dependency
- Rust-based, extremely fast
- No config file needed initially (smart defaults)

**2. `eslint-plugin-oxlint`** - ESLint plugin that disables overlapping rules
- Installed as a dev dependency
- Automatically disables ESLint rules that oxlint checks
- Uses the `flat/recommended` preset (works with ESLint v9 flat config)

**Installation command:**
```bash
pnpm add -D oxlint eslint-plugin-oxlint
```

**Why both?** Installing just oxlint would leave duplicate checks - both ESLint and oxlint would flag the same issues. The plugin ensures clean separation: oxlint handles what it's good at (fast correctness checks), ESLint handles everything else (Nuxt integration, stylistic rules, etc.).

## ESLint Configuration Changes

Modify `eslint.config.mjs` to integrate the oxlint plugin:

**Current setup:**
```javascript
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Your custom configs here
)
```

**Updated setup:**
```javascript
import withNuxt from './.nuxt/eslint.config.mjs'
import oxlint from 'eslint-plugin-oxlint'

export default withNuxt(
  oxlint.configs['flat/recommended']
)
```

**What this does:** The `flat/recommended` config disables all ESLint rules that oxlint already covers. This prevents conflicts and ensures ESLint only checks rules that oxlint doesn't handle.

**Note:** The existing Nuxt ESLint config (including the stylistic rules in `nuxt.config.ts`) continues to work. The oxlint plugin only disables rules that overlap - comma/brace style rules remain active in ESLint since oxlint doesn't enforce stylistic rules by default.

## Package.json Script Addition

Add a new `lint:fast` script alongside the existing `lint` command:

**Updated scripts section:**
```json
{
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "lint": "eslint .",
    "lint:fast": "oxlint",
    "typecheck": "nuxt typecheck"
  }
}
```

**How oxlint behaves:**
- Automatically scans the current directory (`.`)
- Smart defaults: ignores `node_modules/`, `.nuxt/`, `dist/`, etc.
- Checks `.vue`, `.ts`, `.js`, `.tsx`, `.jsx` files
- No config file needed - it just works

## Workflow & Usage

**Daily development workflow:**

1. **Quick checks during coding:** Run `pnpm lint:fast` to catch errors quickly
   - Fast feedback loop (seconds instead of tens of seconds)
   - Catches common mistakes, potential bugs, correctness issues

2. **Comprehensive checks before commit:** Run `pnpm lint` for full validation
   - Nuxt-specific rules, stylistic preferences, everything oxlint doesn't cover
   - Ensures code quality standards are met

**Testing the integration:**

After installation, verify:
1. Run `pnpm lint:fast` - should complete quickly, check for any errors
2. Run `pnpm lint` - should not report duplicate issues from oxlint
3. Introduce a test error (like `const x = x`) and verify oxlint catches it
4. Check that ESLint still enforces stylistic rules (comma dangle, brace style)

**Future expansion options:**

If more control is needed later, add an `.oxlintrc.json` to:
- Customize which directories to scan
- Enable/disable specific oxlint plugins
- Tune severity levels

With the recommended setup, this won't be necessary initially.

## Implementation Steps

1. Install dependencies: `pnpm add -D oxlint eslint-plugin-oxlint`
2. Update `eslint.config.mjs` to import and use the oxlint plugin
3. Add `lint:fast` script to `package.json`
4. Test both linting commands
5. Verify no duplicate rule violations
6. Commit the changes
