# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt 4 application using the Nuxt UI component library. It's a starter template designed to be production-ready with TypeScript, ESLint, and Tailwind CSS pre-configured.

## Key Technologies

- **Nuxt 4**: Vue.js meta-framework with SSR/SSG support
- **Nuxt UI**: Component library built on Tailwind CSS
- **TypeScript**: Full type safety throughout
- **pnpm**: Package manager (v10.19.0)

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Preview production build locally
pnpm preview

# Run linter
pnpm lint

# Type checking
pnpm typecheck
```

## Project Structure

- `app/` - Main application directory (Nuxt 4 convention)
  - `app.vue` - Root application component with layout (header, main, footer)
  - `app.config.ts` - Nuxt UI theme configuration (primary/neutral colors)
  - `pages/` - File-based routing pages
  - `components/` - Vue components (auto-imported)
  - `assets/css/` - Global stylesheets
- `nuxt.config.ts` - Nuxt configuration and module setup
- `eslint.config.mjs` - ESLint configuration extending Nuxt defaults

## Architecture Notes

### Application Layout
The app uses Nuxt UI's `UApp` wrapper component in `app.vue` which provides:
- `UHeader` with left slot (logo + template menu) and right slot (color mode toggle + GitHub link)
- `UMain` containing the router view (`<NuxtPage />`)
- `UFooter` with branding and links

### Styling System
- Nuxt UI components use a design token system configurable via `app.config.ts`
- Primary color: green, Neutral color: slate
- ESLint configured with stylistic rules: no trailing commas, 1tbs brace style
- Global CSS in `app/assets/css/main.css`

### SEO Configuration
- Meta tags and SEO handled in `app.vue` using `useHead()` and `useSeoMeta()`
- Route rules in `nuxt.config.ts` define prerendering strategy
- Homepage (`/`) is prerendered

### Nuxt Modules
- `@nuxt/eslint` - ESLint integration with stylistic rules
- `@nuxt/ui` - UI component library

### Icons
Uses Iconify icon collections:
- `@iconify-json/lucide` - Lucide icons (primary icon set)
- `@iconify-json/simple-icons` - Brand icons (GitHub, etc.)
- Icons referenced with `i-{collection}-{name}` pattern (e.g., `i-lucide-rocket`)
