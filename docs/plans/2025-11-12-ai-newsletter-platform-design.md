# AI Newsletter Platform - Design Document

**Date:** 2025-11-12
**Status:** Approved
**Target:** Transform Vue.js newsletter into generic, configurable newsletter platform

---

## 1. Overview & Architecture

### Core Concept
Transform the current Vue.js newsletter into a generic "newsletter-as-a-template" platform. Users click "Use this template" on GitHub, configure their topic/sources, and deploy a fully automated newsletter site to any static host.

### Key Design Principles
- **Static-first:** Everything is static files - no database, no server, no complexity
- **Configuration over code:** Users configure JSON/markdown files, not write code
- **Generic adapters:** Source adapters (RSS, Reddit, GitHub, etc.) work for any topic
- **Automated pipeline:** GitHub Actions generate → commit → deploy weekly
- **One template = One newsletter:** Each deployment is an independent newsletter site

### Technical Stack
- **Generation:** TypeScript scripts + Claude API (existing architecture)
- **Frontend:** Nuxt 4 + Nuxt Content 3 + Nuxt UI (static generation)
- **Automation:** GitHub Actions (scheduled workflow)
- **Deployment:** `nuxt generate` output → any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages, S3)

### Target User
Technical developers who can edit JSON config files, manage GitHub secrets, and understand basic CI/CD. No prompt engineering required - ship with great examples.

---

## 2. Configuration System

### Core Configuration Files

#### 1. `config/newsletter.json` (Main newsletter config)
```json
{
  "title": "Vue.js Weekly",
  "description": "Weekly Vue.js news and community updates",
  "author": "Your Name",
  "siteUrl": "https://your-newsletter.com",
  "topic": "Vue.js",
  "slug": "vue-weekly",
  "language": "en"
}
```

#### 2. `config/sources.json` (Content sources)
```json
[
  {
    "id": "reddit-vuejs",
    "kind": "atom",
    "url": "https://www.reddit.com/r/vuejs.rss",
    "tag": "Reddit r/vuejs",
    "limit": 10,
    "priority": 3
  },
  {
    "id": "dev-blog",
    "kind": "rss",
    "url": "https://blog.example.com/feed.rss",
    "tag": "Official Blog",
    "limit": 5,
    "priority": 5
  }
]
```

#### 3. `config/prompts/system.md` (Claude system prompt)
Users write their own complete system prompt. Ship with 3-4 example templates:
- `system-tech-newsletter.md` (technical newsletters)
- `system-community-digest.md` (community-focused)
- `system-curated-links.md` (minimal curation style)

#### 4. `.env` (Secrets)
```env
ANTHROPIC_API_KEY=your_key_here
```

### Modular Design
Current version ships with these 4 config points. Future extensions (branding, filtering, email) add new config files without breaking existing setups. Each config file has a specific responsibility and can be validated with Zod schemas.

---

## 3. Resource Adapters (Generic System)

### Current State vs Target
- **Current:** Vue.js-specific source URLs hardcoded in `sources.json`
- **Target:** Generic adapters that work for any topic via configuration

### Adapter Types (Already Generic)
The existing adapters are already topic-agnostic:
- **RSS/Atom adapter:** Fetches any RSS/Atom feed URL
- **Reddit adapter:** Fetches any subreddit RSS (just change URL)
- **GitHub adapter:** Searches any query (configurable via URL params)
- **Dev.to adapter:** Fetches any tag (configurable via URL)
- **Hacker News adapter:** Searches any keywords (configurable)

### Key Insight
We don't need to rewrite adapters! Just remove Vue.js-specific URLs from the example `sources.json` and document how to configure for different topics.

### Example Transformation
```json
// Before (Vue.js specific)
{"id": "reddit-vuejs", "url": "https://www.reddit.com/r/vuejs.rss"}

// After (generic, user configures)
{"id": "reddit-react", "url": "https://www.reddit.com/r/reactjs.rss"}
{"id": "reddit-python", "url": "https://www.reddit.com/r/Python.rss"}
```

### Ship With
- Clean, empty `sources.json` template
- `sources.example-vue.json` (Vue.js example)
- `sources.example-react.json` (React example)
- `sources.example-python.json` (Python example)
- Docs explaining how to find RSS feeds, subreddits, GitHub queries, etc.

The adapters remain unchanged - they're already generic. We're just making the configuration examples clear.

---

## 4. Generation Pipeline

### Current Pipeline (Keep This)
1. Fetch content from all sources in parallel (existing `registry.ts`)
2. Transform to common format with Zod validation (existing adapters)
3. Sort by priority + score (existing logic)
4. Send to Claude API with system prompt + content data
5. Generate markdown newsletter
6. Write to output file

### Key Changes for Generic Platform

#### 1. Dynamic Output Path
```typescript
// Current: Hardcoded path
const outputPath = 'newsletters/2025-11-12-vue-weekly.md';

// New: Use config
const config = await loadConfig('config/newsletter.json');
const date = new Date().toISOString().split('T')[0];
const filename = `${date}-${config.slug || 'newsletter'}.md`;
const outputPath = `content/newsletters/${filename}`;
```

#### 2. Dynamic Prompt Loading
```typescript
// Load user's custom system prompt
const systemPrompt = await fs.readFile('config/prompts/system.md', 'utf-8');
```

#### 3. Add Frontmatter Generation
```typescript
const frontmatter = `---
title: ${config.title}
date: ${date}
description: ${config.description}
author: ${config.author}
---

`;
const fullContent = frontmatter + generatedNewsletter;
```

#### 4. Configuration Validation
Add startup validation that checks all required config files exist and are valid before fetching content.

Pipeline remains fast and parallel - just adds configuration loading at the start and frontmatter injection at the end.

---

## 5. GitHub Actions Workflow

### Workflow File
`.github/workflows/generate-newsletter.yml`

### Trigger
Cron schedule (user edits directly)
```yaml
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9am UTC
  workflow_dispatch:      # Manual trigger for testing
```

### Job Steps
1. **Checkout repository**
2. **Setup Node.js** (v20+)
3. **Install dependencies** (`pnpm install`)
4. **Generate newsletter** (`pnpm newsletter`)
5. **Commit to main branch**
   - Add generated file: `content/newsletters/*.md`
   - Commit message: `chore: generate newsletter for YYYY-MM-DD`
   - Push to main
6. **Deployment triggers automatically** (Vercel/Netlify/etc. detect push)

### Required GitHub Secret
- `ANTHROPIC_API_KEY` (user adds via GitHub Settings → Secrets)

### Error Handling
- Workflow fails if API key missing
- Workflow fails if generation errors
- User receives GitHub notification on failure
- Can manually re-run via `workflow_dispatch`

### Permissions Required
```yaml
permissions:
  contents: write  # Allow pushing commits
```

Simple, reliable, fully automated. User sets cron schedule, adds API key secret, and forgets about it. Newsletter generates and deploys weekly without intervention.

---

## 6. Nuxt Frontend (Newsletter Archive)

### Site Structure (Minimal & Focused)

#### 1. Homepage (`/`)
- Clean landing page
- Brief description of newsletter
- "View Archive" CTA button
- Link to RSS feed
- Redirect option: Can redirect directly to `/newsletters` if preferred

#### 2. Archive Page (`/newsletters`)
- List all newsletters chronologically (newest first)
- Each item shows: title, date, excerpt
- Click to read full newsletter
- Pagination if >50 newsletters (future enhancement)

#### 3. Individual Newsletter (`/newsletters/YYYY-MM-DD-slug`)
- Auto-generated from markdown via Nuxt Content
- Full newsletter content rendered
- Previous/Next navigation (optional)
- Share buttons (optional)

#### 4. RSS Feed (`/rss.xml`)
- Static XML file pre-generated during build
- Manual server route implementation (using `feed` package)
- Last 20 newsletters

### Styling
- Use Nuxt UI for components and design system
- Clean, minimal default theme
- Mobile-responsive by default
- Easy to customize via Nuxt UI theming

### No Complex Features
- No search (can add later)
- No tags/categories (can add later)
- No comments
- No analytics (user adds if wanted)

### Static Generation
- All pages pre-rendered via `nuxt generate`
- Content queries use WASM SQLite client-side
- Deploy to any static host

Clean, fast, focused on reading newsletters. Users can extend with custom pages if needed.

---

## 7. Setup Process (User Journey)

### Step 1: Create from Template
- User clicks "Use this template" on GitHub
- Gets fresh copy (no fork relationship)
- Repository name becomes their newsletter name

### Step 2: Configure Newsletter
Edit 3 files locally:

```bash
# 1. Main config
config/newsletter.json
  - Change title, description, author, siteUrl, topic

# 2. Content sources
config/sources.json
  - Add RSS feeds, subreddits, etc. for your topic
  - Or copy from examples: sources.example-vue.json

# 3. System prompt
config/prompts/system.md
  - Customize or copy from examples:
    - system-tech-newsletter.md
    - system-community-digest.md
```

### Step 3: Add API Key
- GitHub Settings → Secrets and variables → Actions
- Add secret: `ANTHROPIC_API_KEY` with your Claude API key

### Step 4: Configure Schedule (Optional)
- Edit `.github/workflows/generate-newsletter.yml`
- Change cron expression for different timing
- Default: Monday 9am UTC

### Step 5: Deploy Site
- Connect repository to Vercel/Netlify/Cloudflare Pages
- Set build command: `pnpm build`
- Set output directory: `dist`
- Deploy completes in ~2 minutes

### Step 6: Test Generation
- Go to Actions tab → "Generate Newsletter" workflow
- Click "Run workflow" button (manual trigger)
- Wait 1-2 minutes → newsletter appears in `content/newsletters/`
- Site auto-deploys with new content

### README Provides
- Quick start checklist
- Configuration examples for popular topics (React, Python, DevOps, AI/ML)
- Troubleshooting guide
- Links to find RSS feeds, subreddits, etc.

**Total setup time: 10-15 minutes** for technical users.

---

## 8. File Structure (Final Project Organization)

```
ai-newsletter-template/
├── .github/
│   └── workflows/
│       └── generate-newsletter.yml    # Weekly automation
│
├── app/                                # Nuxt 4 application
│   ├── pages/
│   │   ├── index.vue                  # Landing page
│   │   └── newsletters/
│   │       ├── index.vue              # Archive list
│   │       └── [...slug].vue          # Individual newsletter
│   ├── components/                     # Nuxt UI components
│   └── app.vue
│
├── content/
│   └── newsletters/                    # Generated newsletters
│       ├── 2025-11-12-vue-weekly.md
│       └── 2025-11-09-vue-weekly.md
│
├── config/                             # User configuration
│   ├── newsletter.json                 # Main config
│   ├── sources.json                    # Content sources
│   ├── sources.example-vue.json        # Examples
│   ├── sources.example-react.json
│   └── prompts/
│       ├── system.md                   # User's custom prompt
│       ├── system-tech-newsletter.md   # Example templates
│       └── system-community-digest.md
│
├── scripts/                            # Newsletter generator (existing)
│   ├── core/
│   │   ├── resources/
│   │   │   ├── adapters/              # Generic adapters
│   │   │   └── registry.ts
│   │   └── newsletter/
│   └── generate-newsletter.ts          # Main entry point
│
├── server/
│   └── routes/
│       └── rss.xml.ts                  # RSS feed generation
│
├── schemas/                            # Zod schemas (existing)
├── tests/                              # Tests (existing)
│
├── content.config.ts                   # Nuxt Content config
├── nuxt.config.ts                      # Nuxt config
├── package.json
├── README.md                           # Setup guide
└── .env.example                        # API key template
```

### Key Changes from Current Project
1. Move newsletters from `/newsletters` → `/content/newsletters`
2. Add `/config` directory for user configuration
3. Add Nuxt pages for archive display
4. Add `content.config.ts` for Nuxt Content
5. Add `server/routes/rss.xml.ts` for RSS feed
6. Update README for generic setup instructions

### Stays the Same
- `/scripts` architecture (adapters, registry, generation logic)
- `/schemas` validation system
- `/tests` testing infrastructure
- TypeScript strict mode, coding standards

Clean separation: **configuration** (`/config`), **generation** (`/scripts`), **display** (`/app`), **output** (`/content`).

---

## 9. Technical Research Summary

### Nuxt Content 3 Integration

#### Installation
```bash
pnpm add @nuxt/content
```

#### Content Configuration
Create `content.config.ts`:
```typescript
import { defineContentConfig, defineCollection } from '@nuxt/content';
import { z } from 'zod';

export default defineContentConfig({
  collections: {
    newsletters: defineCollection({
      type: 'page',
      source: 'newsletters/*.md',
      schema: z.object({
        title: z.string(),
        date: z.string(),
        description: z.string().optional(),
        author: z.string().default('Newsletter'),
        tags: z.array(z.string()).default([])
      })
    })
  }
});
```

#### Querying Content
Nuxt Content v3 uses `queryCollection()` (SQL-backed):
```typescript
// List all newsletters
const newsletters = await queryCollection('newsletters')
  .order('date', 'DESC')
  .all();

// Single newsletter
const newsletter = await queryCollection('newsletters')
  .path(route.path)
  .first();
```

#### Static Generation
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/content'],
  nitro: {
    prerender: {
      routes: ['/rss.xml'],
      crawlLinks: true
    }
  }
});
```

### RSS Feed Generation

#### Recommended Approach
Manual server route using `feed` package:

```bash
pnpm add feed
```

```typescript
// server/routes/rss.xml.ts
import { serverQueryContent } from '#content/server';
import { Feed } from 'feed';

export default defineEventHandler(async (event) => {
  const feed = new Feed({
    title: 'Newsletter Title',
    description: 'Newsletter description',
    id: 'https://your-site.com',
    link: 'https://your-site.com',
    language: 'en'
  });

  const newsletters = await serverQueryContent(event, 'newsletters')
    .sort({ date: -1 })
    .limit(20)
    .find();

  for (const newsletter of newsletters) {
    feed.addItem({
      title: newsletter.title,
      id: `https://your-site.com${newsletter._path}`,
      link: `https://your-site.com${newsletter._path}`,
      description: newsletter.description,
      date: new Date(newsletter.date)
    });
  }

  event.node.res.setHeader('Content-Type', 'application/rss+xml');
  return feed.rss2();
});
```

---

## 10. Implementation Strategy

### Phase 1: Core Platform (MVP)
1. Add Nuxt Content 3 integration
2. Create configuration system (`/config` directory)
3. Update generation pipeline to use config
4. Build Nuxt UI frontend (homepage, archive, newsletter pages)
5. Add RSS feed generation
6. Create GitHub Actions workflow
7. Write comprehensive README

### Phase 2: Polish & Examples
1. Create example configurations (Vue, React, Python, DevOps)
2. Create prompt templates
3. Add example newsletters to demonstrate
4. Write troubleshooting guide
5. Add deployment guides for different platforms

### Phase 3: Future Enhancements (Post-MVP)
- Email subscription integration (external service)
- Search functionality
- Tags/categories
- Custom branding configuration
- Advanced filtering rules
- Analytics integration
- Custom adapter plugins

---

## 11. Success Criteria

### Technical
- [ ] User can configure newsletter without touching code
- [ ] GitHub Actions successfully generates and commits newsletters
- [ ] Static site deploys to any platform
- [ ] RSS feed validates with feed readers
- [ ] All tests pass
- [ ] TypeScript strict mode with no errors

### User Experience
- [ ] Setup time: 10-15 minutes for technical user
- [ ] Clear error messages for misconfigurations
- [ ] Example configurations work out-of-the-box
- [ ] README provides all necessary information
- [ ] Site is mobile-responsive and accessible

### Performance
- [ ] Newsletter generation: <2 minutes
- [ ] Static build: <2 minutes
- [ ] Lighthouse scores: 90+ for all metrics

---

## 12. Open Questions & Decisions

### Resolved
- ✅ Target audience: Technical developers
- ✅ Deployment model: GitHub template repository
- ✅ Content management: Nuxt Content 3 as static archive
- ✅ Configuration: Manual file editing with examples
- ✅ Workflow: Simple generate-commit-deploy
- ✅ Distribution: RSS only (no email in v1)
- ✅ Scheduling: Direct cron expression editing
- ✅ Hosting: Static generation (deploy anywhere)
- ✅ Frontend: Nuxt UI for design system

### Future Considerations
- Email integration approach (if requested)
- Custom adapter plugin system
- Multi-language support
- Newsletter analytics/metrics
- A/B testing for prompts

---

## Conclusion

This design transforms the current Vue.js newsletter into a generic, configurable platform while maintaining:
- **Simplicity:** Configuration over code
- **Performance:** Static generation, parallel fetching
- **Reliability:** Automated workflows, error handling
- **Flexibility:** Modular design for future extensions

The platform enables technical users to spin up custom AI-powered newsletters in 10-15 minutes with minimal configuration and zero code changes.
