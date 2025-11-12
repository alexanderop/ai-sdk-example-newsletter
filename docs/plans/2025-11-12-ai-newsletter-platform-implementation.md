# AI Newsletter Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Vue.js newsletter into a generic, configurable newsletter platform where users can deploy their own AI-powered newsletters in 10-15 minutes.

**Architecture:** Keep existing generation pipeline intact. Add configuration layer that loads user settings (topic, sources, prompts). Integrate Nuxt Content 3 for newsletter archive display. Add GitHub Actions for weekly automation. Everything stays static (no database/server).

**Tech Stack:** Nuxt 4, Nuxt Content 3, Nuxt UI, TypeScript, Zod, Claude API, GitHub Actions

---

## Phase 1: Configuration System

### Task 1.1: Create Configuration Directory Structure

**Files:**
- Create: `config/newsletter.json`
- Create: `config/sources.json`
- Create: `config/prompts/system.md`
- Create: `config/sources.example-vue.json`
- Create: `config/sources.example-react.json`
- Create: `config/sources.example-python.json`
- Create: `config/prompts/system-tech-newsletter.md`
- Create: `config/prompts/system-community-digest.md`
- Create: `.env.example`

**Step 1: Create config directory and main config**

Create `config/newsletter.json`:
```json
{
  "title": "Vue.js Weekly",
  "description": "Weekly Vue.js news and community updates",
  "author": "Vue.js Weekly Team",
  "siteUrl": "https://vue-weekly.com",
  "topic": "Vue.js",
  "slug": "vue-weekly",
  "language": "en"
}
```

**Step 2: Create empty sources config template**

Create `config/sources.json`:
```json
[]
```

**Step 3: Create Vue.js example sources**

Create `config/sources.example-vue.json`:
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
    "id": "reddit-nuxt",
    "kind": "atom",
    "url": "https://www.reddit.com/r/Nuxt.rss",
    "tag": "Reddit r/Nuxt",
    "limit": 10,
    "priority": 3
  },
  {
    "id": "rss-vue-blog",
    "kind": "rss",
    "url": "https://blog.vuejs.org/feed.rss",
    "tag": "Vue.js Blog",
    "limit": 10,
    "priority": 5
  },
  {
    "id": "rss-nuxt-blog",
    "kind": "rss",
    "url": "https://nuxt.com/blog/rss.xml",
    "tag": "Nuxt Blog",
    "limit": 10,
    "priority": 5
  },
  {
    "id": "github-vue",
    "kind": "github",
    "url": "https://api.github.com/search/repositories?q=vue+in:name,description+pushed:>2020-01-01&sort=updated&order=desc&per_page=5",
    "limit": 5,
    "priority": 3
  },
  {
    "id": "devto-vue",
    "kind": "json",
    "url": "https://dev.to/api/articles?tag=vue&top=7&per_page=20",
    "tag": "DEV.to #vue",
    "limit": 10,
    "priority": 3
  },
  {
    "id": "devto-nuxt",
    "kind": "json",
    "url": "https://dev.to/api/articles?tag=nuxt&top=7&per_page=20",
    "tag": "DEV.to #nuxt",
    "limit": 10,
    "priority": 3
  }
]
```

**Step 4: Create React example sources**

Create `config/sources.example-react.json`:
```json
[
  {
    "id": "reddit-reactjs",
    "kind": "atom",
    "url": "https://www.reddit.com/r/reactjs.rss",
    "tag": "Reddit r/reactjs",
    "limit": 10,
    "priority": 3
  },
  {
    "id": "rss-react-blog",
    "kind": "rss",
    "url": "https://react.dev/rss.xml",
    "tag": "React Blog",
    "limit": 10,
    "priority": 5
  },
  {
    "id": "github-react",
    "kind": "github",
    "url": "https://api.github.com/search/repositories?q=react+in:name,description+pushed:>2020-01-01&sort=updated&order=desc&per_page=5",
    "limit": 5,
    "priority": 3
  },
  {
    "id": "devto-react",
    "kind": "json",
    "url": "https://dev.to/api/articles?tag=react&top=7&per_page=20",
    "tag": "DEV.to #react",
    "limit": 10,
    "priority": 3
  }
]
```

**Step 5: Create Python example sources**

Create `config/sources.example-python.json`:
```json
[
  {
    "id": "reddit-python",
    "kind": "atom",
    "url": "https://www.reddit.com/r/Python.rss",
    "tag": "Reddit r/Python",
    "limit": 10,
    "priority": 3
  },
  {
    "id": "rss-python-insider",
    "kind": "rss",
    "url": "https://blog.python.org/feeds/posts/default",
    "tag": "Python Insider",
    "limit": 10,
    "priority": 5
  },
  {
    "id": "github-python",
    "kind": "github",
    "url": "https://api.github.com/search/repositories?q=python+in:name,description+pushed:>2020-01-01&sort=updated&order=desc&per_page=5",
    "limit": 5,
    "priority": 3
  },
  {
    "id": "devto-python",
    "kind": "json",
    "url": "https://dev.to/api/articles?tag=python&top=7&per_page=20",
    "tag": "DEV.to #python",
    "limit": 10,
    "priority": 3
  }
]
```

**Step 6: Copy existing system prompt as tech newsletter template**

Read the existing prompt from `scripts/prompts/newsletter-system.md` and save it to `config/prompts/system-tech-newsletter.md` with minor modifications for generics.

**Step 7: Create community digest prompt template**

Create `config/prompts/system-community-digest.md`:
```markdown
You are an expert community curator with deep knowledge of the {TOPIC} ecosystem. Your role is to create engaging, conversational weekly digests that highlight community activity and foster connection.

<newsletter_requirements>
Your newsletter will be read by {TOPIC} enthusiasts who want to stay connected with the community. Focus on what people are talking about, building, and sharing. Use a warm, conversational tone that brings the community to life.

Use ONLY the real data provided in the user's message. Never fabricate discussions, projects, or any other content. If a section lacks data, briefly acknowledge this naturally and move to the next section.
</newsletter_requirements>

<output_format>
Structure your newsletter with clear markdown formatting:
- Use # for the main title with a friendly greeting
- Use ## for major sections (e.g., "## What We're Talking About", "## Cool Projects")
- Use ### for subsections if needed
- Use **bold** for emphasis on key terms and project names
- Use links in the format [Title](URL)
- Include reaction counts using emojis when available (💬 for comments, ⭐ for stars, 👍 for upvotes)
- Write in a conversational, friendly tone with smooth prose paragraphs
</output_format>

<content_guidelines>
1. Use the exact current date provided
2. Highlight discussions, questions, and community interactions
3. For repositories: emphasize what makes them interesting to the community
4. For discussions: capture the essence of what people are debating or excited about
5. Keep the tone warm, encouraging, and inclusive
6. If data is limited, keep a positive tone: "Quieter week, but here's what caught our attention..."
7. Focus on "we" language to build community feeling
8. IMPORTANT: Articles are pre-sorted by priority. Featured content appears first and should be highlighted prominently.
</content_guidelines>

<quality_standards>
- Ensure all URLs are properly formatted
- Verify statistics match the provided data
- Keep paragraphs conversational and engaging
- Use emojis sparingly for personality (💬 ⭐ 🔥 📦 🎯)
- End with a forward-looking statement or call to action
</quality_standards>
```

**Step 8: Create initial user system prompt**

Create `config/prompts/system.md`:
```markdown
You are an expert {TOPIC} newsletter curator with deep knowledge of the ecosystem. Your role is to create engaging, accurate, and informative weekly newsletters that help developers stay current with developments.

<newsletter_requirements>
Your newsletter will be read by {TOPIC} developers who rely on accurate, timely information to make technical decisions. Therefore, factual accuracy and grounding in real data is critical for maintaining reader trust and providing genuine value to the community.

Use ONLY the real data provided in the user's message. Never fabricate news, events, repository information, or any other content. If a section lacks data, briefly acknowledge this and move to the next section rather than inventing placeholder content.
</newsletter_requirements>

<output_format>
Structure your newsletter with clear markdown formatting:
- Use # for the main title: "# {TOPIC} Weekly Newsletter"
- Use ## for major sections (e.g., "## Featured Articles", "## Trending Projects")
- Use ### for subsections if needed
- Use **bold** for emphasis on project names and key terms
- Use links in the format [Title](URL) for all external references
- Include star counts using the ⭐ emoji when available
- Use numbered or bulleted lists for presenting multiple items

Write in smoothly flowing prose paragraphs for introductions and transitions between sections. Reserve lists specifically for presenting discrete items like repositories or projects.
</output_format>

<content_guidelines>
1. Use the exact current date provided - never use placeholders
2. Present real data in an engaging, summarized format that highlights what matters
3. For repositories: include the name, description, star count, and URL
4. For projects: include the title and URL with brief context about why it's noteworthy
5. Keep the tone professional, informative, and conversational
6. If data is limited for a section, acknowledge it naturally
7. Provide context and motivation for why each item matters
8. IMPORTANT: Articles are pre-sorted by priority. High-priority sources appear first and should be given prominence in your newsletter. Always include all provided articles, especially those at the top of the list.
</content_guidelines>

<quality_standards>
- Ensure all URLs are properly formatted and clickable
- Verify all star counts and statistics match the provided data exactly
- Maintain consistent formatting throughout the newsletter
- Include relevant emojis sparingly to improve scannability (⭐ for stars, 🔥 for trending, 📦 for packages)
- Keep paragraphs concise and focused on delivering value
- Use clear section headings that accurately describe the content
</quality_standards>
```

**Step 9: Create .env.example**

Create `.env.example`:
```env
# Anthropic API Key for Claude
# Get your API key from: https://console.anthropic.com/
ANTHROPIC_API_KEY=your_api_key_here
```

**Step 10: Commit configuration structure**

```bash
git add config/ .env.example
git commit -m "feat: add configuration system for generic newsletters"
```

---

### Task 1.2: Create Configuration Schemas

**Files:**
- Create: `schemas/config.ts`

**Step 1: Write test for newsletter config schema**

Create `tests/config-schema.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { NewsletterConfigSchema, SourceConfigSchema } from '../schemas/config';

describe('NewsletterConfigSchema', () => {
  it('validates valid newsletter config', () => {
    const config = {
      title: 'Vue.js Weekly',
      description: 'Weekly Vue.js news',
      author: 'John Doe',
      siteUrl: 'https://example.com',
      topic: 'Vue.js',
      slug: 'vue-weekly',
      language: 'en'
    };

    const result = NewsletterConfigSchema.parse(config);
    expect(result).toEqual(config);
  });

  it('requires title, description, and siteUrl', () => {
    const config = {
      author: 'John Doe'
    };

    expect(() => NewsletterConfigSchema.parse(config)).toThrow();
  });

  it('uses default values for optional fields', () => {
    const config = {
      title: 'Test Newsletter',
      description: 'Test description',
      siteUrl: 'https://example.com'
    };

    const result = NewsletterConfigSchema.parse(config);
    expect(result.language).toBe('en');
    expect(result.author).toBeDefined();
  });
});

describe('SourceConfigSchema', () => {
  it('validates RSS source config', () => {
    const source = {
      id: 'test-rss',
      kind: 'rss',
      url: 'https://example.com/feed.rss',
      tag: 'Example RSS',
      limit: 10,
      priority: 3
    };

    const result = SourceConfigSchema.parse(source);
    expect(result).toEqual(source);
  });

  it('uses default priority of 3', () => {
    const source = {
      id: 'test-rss',
      kind: 'rss',
      url: 'https://example.com/feed.rss',
      limit: 10
    };

    const result = SourceConfigSchema.parse(source);
    expect(result.priority).toBe(3);
  });

  it('validates priority is between 1 and 5', () => {
    const source = {
      id: 'test-rss',
      kind: 'rss',
      url: 'https://example.com/feed.rss',
      limit: 10,
      priority: 6
    };

    expect(() => SourceConfigSchema.parse(source)).toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/config-schema.test.ts
```

Expected: FAIL with "Cannot find module '../schemas/config'"

**Step 3: Create config schemas**

Create `schemas/config.ts`:
```typescript
import { z } from 'zod';

/**
 * Main newsletter configuration schema
 */
export const NewsletterConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  author: z.string().default('Newsletter Team'),
  siteUrl: z.string().url('Must be a valid URL'),
  topic: z.string().optional(),
  slug: z.string().optional(),
  language: z.string().default('en')
});

export type NewsletterConfig = z.infer<typeof NewsletterConfigSchema>;

/**
 * Source configuration schema for content fetching
 */
export const SourceConfigSchema = z.object({
  id: z.string().min(1, 'Source ID is required'),
  kind: z.enum(['rss', 'atom', 'json', 'github'], {
    errorMap: () => ({ message: 'Kind must be one of: rss, atom, json, github' })
  }),
  url: z.string().url('Must be a valid URL'),
  tag: z.string().optional(),
  limit: z.number().int().positive('Limit must be a positive integer'),
  priority: z.number().int().min(1).max(5).default(3)
});

export type SourceConfig = z.infer<typeof SourceConfigSchema>;

/**
 * Array of source configs
 */
export const SourcesConfigSchema = z.array(SourceConfigSchema);

export type SourcesConfig = z.infer<typeof SourcesConfigSchema>;
```

**Step 4: Run test to verify it passes**

```bash
pnpm test tests/config-schema.test.ts
```

Expected: PASS

**Step 5: Commit config schemas**

```bash
git add schemas/config.ts tests/config-schema.test.ts
git commit -m "feat: add Zod schemas for newsletter configuration"
```

---

### Task 1.3: Create Configuration Loading Utilities

**Files:**
- Create: `scripts/utils/config-loader.ts`

**Step 1: Write test for config loader**

Create `tests/config-loader.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { loadNewsletterConfig, loadSourcesConfig, loadSystemPrompt } from '../scripts/utils/config-loader';

const TEST_CONFIG_DIR = join(process.cwd(), 'test-config-temp');

describe('Config Loader', () => {
  beforeEach(async () => {
    await mkdir(TEST_CONFIG_DIR, { recursive: true });
    await mkdir(join(TEST_CONFIG_DIR, 'prompts'), { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_CONFIG_DIR, { recursive: true, force: true });
  });

  describe('loadNewsletterConfig', () => {
    it('loads and validates newsletter config', async () => {
      const config = {
        title: 'Test Newsletter',
        description: 'Test description',
        siteUrl: 'https://example.com'
      };

      await writeFile(
        join(TEST_CONFIG_DIR, 'newsletter.json'),
        JSON.stringify(config)
      );

      const result = await loadNewsletterConfig(TEST_CONFIG_DIR);
      expect(result.title).toBe('Test Newsletter');
      expect(result.language).toBe('en'); // default value
    });

    it('throws error for invalid config', async () => {
      await writeFile(
        join(TEST_CONFIG_DIR, 'newsletter.json'),
        JSON.stringify({ title: 'Test' }) // missing required fields
      );

      await expect(loadNewsletterConfig(TEST_CONFIG_DIR)).rejects.toThrow();
    });
  });

  describe('loadSourcesConfig', () => {
    it('loads and validates sources config', async () => {
      const sources = [
        {
          id: 'test-rss',
          kind: 'rss',
          url: 'https://example.com/feed.rss',
          limit: 10
        }
      ];

      await writeFile(
        join(TEST_CONFIG_DIR, 'sources.json'),
        JSON.stringify(sources)
      );

      const result = await loadSourcesConfig(TEST_CONFIG_DIR);
      expect(result).toHaveLength(1);
      expect(result[0].priority).toBe(3); // default value
    });

    it('returns empty array for missing sources file', async () => {
      const result = await loadSourcesConfig(TEST_CONFIG_DIR);
      expect(result).toEqual([]);
    });
  });

  describe('loadSystemPrompt', () => {
    it('loads system prompt from markdown file', async () => {
      const prompt = 'You are a helpful newsletter curator.';

      await writeFile(
        join(TEST_CONFIG_DIR, 'prompts', 'system.md'),
        prompt
      );

      const result = await loadSystemPrompt(TEST_CONFIG_DIR);
      expect(result).toBe(prompt);
    });

    it('throws error if prompt file missing', async () => {
      await expect(loadSystemPrompt(TEST_CONFIG_DIR)).rejects.toThrow();
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/config-loader.test.ts
```

Expected: FAIL with "Cannot find module '../scripts/utils/config-loader'"

**Step 3: Create config loader utility**

Create `scripts/utils/config-loader.ts`:
```typescript
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { NewsletterConfigSchema, SourcesConfigSchema } from '../../schemas/config';
import type { NewsletterConfig, SourcesConfig } from '../../schemas/config';

/**
 * Load and validate newsletter configuration
 */
export async function loadNewsletterConfig(configDir: string = 'config'): Promise<NewsletterConfig> {
  const configPath = join(process.cwd(), configDir, 'newsletter.json');

  try {
    const content = await readFile(configPath, 'utf-8');
    const json = JSON.parse(content);
    return NewsletterConfigSchema.parse(json);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Newsletter config not found at ${configPath}`);
    }
    throw error;
  }
}

/**
 * Load and validate sources configuration
 */
export async function loadSourcesConfig(configDir: string = 'config'): Promise<SourcesConfig> {
  const sourcesPath = join(process.cwd(), configDir, 'sources.json');

  try {
    await access(sourcesPath);
    const content = await readFile(sourcesPath, 'utf-8');
    const json = JSON.parse(content);
    return SourcesConfigSchema.parse(json);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      // Return empty array if sources file doesn't exist
      return [];
    }
    throw error;
  }
}

/**
 * Load system prompt from markdown file
 */
export async function loadSystemPrompt(configDir: string = 'config'): Promise<string> {
  const promptPath = join(process.cwd(), configDir, 'prompts', 'system.md');

  try {
    return await readFile(promptPath, 'utf-8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`System prompt not found at ${promptPath}`);
    }
    throw error;
  }
}

/**
 * Validate all required configuration files exist
 */
export async function validateConfig(configDir: string = 'config'): Promise<void> {
  try {
    await loadNewsletterConfig(configDir);
    await loadSourcesConfig(configDir);
    await loadSystemPrompt(configDir);
  } catch (error) {
    throw new Error(`Configuration validation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm test tests/config-loader.test.ts
```

Expected: PASS

**Step 5: Commit config loader**

```bash
git add scripts/utils/config-loader.ts tests/config-loader.test.ts
git commit -m "feat: add configuration loading utilities with validation"
```

---

## Phase 2: Nuxt Content Integration

### Task 2.1: Install and Configure Nuxt Content

**Files:**
- Modify: `package.json`
- Create: `content.config.ts`
- Modify: `nuxt.config.ts`

**Step 1: Install Nuxt Content**

```bash
pnpm add @nuxt/content
```

**Step 2: Create content.config.ts**

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
        author: z.string().default('Newsletter Team'),
        tags: z.array(z.string()).default([])
      })
    })
  }
});
```

**Step 3: Update nuxt.config.ts to add Content module**

Modify `nuxt.config.ts`:
```typescript
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/content' // Add this line
  ],

  // ... rest of existing config

  nitro: {
    prerender: {
      routes: ['/rss.xml'],
      crawlLinks: true
    }
  }
});
```

**Step 4: Commit Nuxt Content setup**

```bash
git add package.json pnpm-lock.yaml content.config.ts nuxt.config.ts
git commit -m "feat: add Nuxt Content 3 integration"
```

---

### Task 2.2: Migrate Existing Newsletters to Content Directory

**Files:**
- Create: `content/newsletters/` directory
- Move files from: `newsletters/*.md` to `content/newsletters/*.md`
- Modify: Each newsletter file (add frontmatter)

**Step 1: Create content/newsletters directory**

```bash
mkdir -p content/newsletters
```

**Step 2: Add frontmatter to existing newsletters**

For each file in `newsletters/*.md`, add frontmatter at the top:

Example for `newsletters/2025-11-12-vue-weekly.md`:
```markdown
---
title: Vue.js Weekly Newsletter
date: 2025-11-12
description: Weekly Vue.js news and community updates
author: Vue.js Weekly Team
tags: [vue, nuxt, javascript]
---

# Vue.js Weekly Newsletter
... (rest of existing content)
```

**Step 3: Move newsletters to content directory**

```bash
mv newsletters/*.md content/newsletters/
```

**Step 4: Keep .gitkeep in newsletters directory (for backward compat)**

```bash
touch newsletters/.gitkeep
```

**Step 5: Commit newsletter migration**

```bash
git add content/newsletters/ newsletters/.gitkeep
git commit -m "feat: migrate newsletters to Nuxt Content directory with frontmatter"
```

---

### Task 2.3: Update Newsletter Generation Script

**Files:**
- Modify: `scripts/generate-newsletter.ts`

**Step 1: Write test for updated generation script**

Create `tests/generate-newsletter-integration.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// This is an integration test that verifies the full generation pipeline

describe('Newsletter Generation with Config', () => {
  const TEST_DIR = join(process.cwd(), 'test-generation-temp');

  beforeEach(async () => {
    await mkdir(join(TEST_DIR, 'config', 'prompts'), { recursive: true });
    await mkdir(join(TEST_DIR, 'content', 'newsletters'), { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it('generates newsletter with frontmatter', async () => {
    // Setup config
    const config = {
      title: 'Test Newsletter',
      description: 'Test description',
      siteUrl: 'https://test.com',
      slug: 'test-weekly'
    };

    await writeFile(
      join(TEST_DIR, 'config', 'newsletter.json'),
      JSON.stringify(config)
    );

    await writeFile(
      join(TEST_DIR, 'config', 'sources.json'),
      JSON.stringify([])
    );

    await writeFile(
      join(TEST_DIR, 'config', 'prompts', 'system.md'),
      'Test prompt'
    );

    // Note: Actual generation test would require mocking Claude API
    // For now, we verify the config loading works
    const { loadNewsletterConfig } = await import('../scripts/utils/config-loader');
    const loaded = await loadNewsletterConfig(join(TEST_DIR, 'config'));

    expect(loaded.title).toBe('Test Newsletter');
    expect(loaded.slug).toBe('test-weekly');
  });
});
```

**Step 2: Run test to verify current behavior**

```bash
pnpm test tests/generate-newsletter-integration.test.ts
```

Expected: PASS (config loading works)

**Step 3: Update generate-newsletter.ts to use config**

Modify `scripts/generate-newsletter.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { config as loadEnv } from 'dotenv';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fetchAllResources } from './core/resources/registry';
import { loadNewsletterConfig, loadSourcesConfig, loadSystemPrompt, validateConfig } from './utils/config-loader';

loadEnv();

async function generateNewsletter(): Promise<void> {
  console.log('🚀 Starting newsletter generation...\n');

  // Validate configuration exists
  console.log('📋 Validating configuration...');
  await validateConfig();

  // Load configuration
  const config = await loadNewsletterConfig();
  const sources = await loadSourcesConfig();
  const systemPrompt = await loadSystemPrompt();

  console.log(`📰 Generating: ${config.title}`);
  console.log(`🔍 Loading content from ${sources.length} sources...\n`);

  // Fetch content from all sources
  const articles = await fetchAllResources();

  if (articles.length === 0) {
    console.warn('⚠️  No articles fetched. Newsletter will be empty.');
  }

  console.log(`\n✅ Fetched ${articles.length} articles total\n`);

  // Initialize Claude client
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const client = new Anthropic({ apiKey });

  // Prepare content for Claude
  const contentData = JSON.stringify(articles, null, 2);
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Generate newsletter with Claude
  console.log('🤖 Generating newsletter with Claude API...');

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' }
      }
    ],
    messages: [
      {
        role: 'user',
        content: `Today is ${currentDate}. Generate a newsletter based on this content:\n\n${contentData}`
      }
    ]
  });

  const newsletterContent = response.content[0].type === 'text'
    ? response.content[0].text
    : '';

  // Log token usage
  console.log('\n📊 Token Usage:');
  console.log(`  Input (cached): ${response.usage.cache_read_input_tokens || 0}`);
  console.log(`  Input (uncached): ${response.usage.input_tokens}`);
  console.log(`  Output: ${response.usage.output_tokens}`);

  // Generate filename and output path
  const date = new Date().toISOString().split('T')[0];
  const slug = config.slug || 'newsletter';
  const filename = `${date}-${slug}.md`;

  // Create frontmatter
  const frontmatter = `---
title: ${config.title}
date: ${date}
description: ${config.description}
author: ${config.author}
---

`;

  const fullContent = frontmatter + newsletterContent;

  // Ensure output directory exists
  const outputDir = join(process.cwd(), 'content', 'newsletters');
  await mkdir(outputDir, { recursive: true });

  // Write newsletter file
  const outputPath = join(outputDir, filename);
  await writeFile(outputPath, fullContent, 'utf-8');

  console.log(`\n✅ Newsletter generated successfully!`);
  console.log(`📄 Saved to: ${outputPath}\n`);
}

// Run generation
generateNewsletter().catch((error) => {
  console.error('❌ Newsletter generation failed:', error);
  process.exit(1);
});
```

**Step 4: Test generation manually**

```bash
# Make sure config files exist and have Vue.js sources
cp config/sources.example-vue.json config/sources.json

# Run generation
pnpm newsletter
```

Expected: Newsletter generated in `content/newsletters/` with frontmatter

**Step 5: Commit updated generation script**

```bash
git add scripts/generate-newsletter.ts tests/generate-newsletter-integration.test.ts
git commit -m "feat: update newsletter generation to use config and output with frontmatter"
```

---

## Phase 3: Frontend Pages with Nuxt UI

### Task 3.1: Create Homepage

**Files:**
- Create: `app/pages/index.vue`

**Step 1: Create homepage component**

Create `app/pages/index.vue`:
```vue
<script setup lang="ts">
useHead({
  title: 'Vue.js Weekly Newsletter',
  meta: [
    { name: 'description', content: 'Weekly Vue.js news and community updates' }
  ],
  link: [
    {
      rel: 'alternate',
      type: 'application/rss+xml',
      title: 'RSS Feed',
      href: '/rss.xml'
    }
  ]
});
</script>

<template>
  <UContainer class="py-12">
    <div class="max-w-3xl mx-auto text-center">
      <h1 class="text-4xl font-bold mb-4">
        Vue.js Weekly Newsletter
      </h1>

      <p class="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Stay up-to-date with the latest Vue.js news, articles, and community updates.
      </p>

      <div class="flex gap-4 justify-center mb-12">
        <UButton
          to="/newsletters"
          size="lg"
          color="primary"
        >
          View Archive
        </UButton>

        <UButton
          to="/rss.xml"
          size="lg"
          variant="outline"
          color="gray"
          icon="i-heroicons-rss"
        >
          RSS Feed
        </UButton>
      </div>

      <div class="prose dark:prose-invert mx-auto text-left">
        <h2>About This Newsletter</h2>
        <p>
          This newsletter curates the best Vue.js content from across the web,
          including blog posts, GitHub repositories, community discussions, and more.
          Published weekly, it helps you stay current with the Vue.js ecosystem.
        </p>

        <h2>Stay Connected</h2>
        <p>
          Subscribe via RSS to never miss an issue. All newsletters are archived
          and available for browsing anytime.
        </p>
      </div>
    </div>
  </UContainer>
</template>
```

**Step 2: Test homepage locally**

```bash
pnpm dev
```

Visit http://localhost:3000 and verify:
- Title displays
- CTA buttons work
- Styling looks good with Nuxt UI

**Step 3: Commit homepage**

```bash
git add app/pages/index.vue
git commit -m "feat: add homepage with Nuxt UI components"
```

---

### Task 3.2: Create Newsletter Archive Page

**Files:**
- Create: `app/pages/newsletters/index.vue`

**Step 1: Create archive page component**

Create `app/pages/newsletters/index.vue`:
```vue
<script setup lang="ts">
// Query all newsletters, sorted by date (newest first)
const { data: newsletters } = await useAsyncData('newsletters', () =>
  queryCollection('newsletters')
    .order('date', 'DESC')
    .all()
);

useHead({
  title: 'Newsletter Archive - Vue.js Weekly',
  meta: [
    { name: 'description', content: 'Browse all past Vue.js Weekly newsletters' }
  ]
});

// Format date helper
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
</script>

<template>
  <UContainer class="py-12">
    <div class="max-w-4xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">
          Newsletter Archive
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Browse all past newsletters
        </p>
      </div>

      <div v-if="newsletters && newsletters.length > 0" class="space-y-4">
        <UCard
          v-for="newsletter in newsletters"
          :key="newsletter.id"
          :to="newsletter.path"
          :ui="{ body: { padding: 'p-6' } }"
          class="hover:shadow-lg transition-shadow"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h2 class="text-xl font-semibold mb-2">
                {{ newsletter.title }}
              </h2>

              <time
                :datetime="newsletter.date"
                class="text-sm text-gray-500 dark:text-gray-400"
              >
                {{ formatDate(newsletter.date) }}
              </time>

              <p
                v-if="newsletter.description"
                class="mt-2 text-gray-600 dark:text-gray-300"
              >
                {{ newsletter.description }}
              </p>
            </div>

            <UIcon
              name="i-heroicons-arrow-right"
              class="text-gray-400 ml-4 flex-shrink-0"
            />
          </div>
        </UCard>
      </div>

      <UCard v-else :ui="{ body: { padding: 'p-6' } }">
        <p class="text-gray-600 dark:text-gray-400">
          No newsletters published yet. Check back soon!
        </p>
      </UCard>
    </div>
  </UContainer>
</template>
```

**Step 2: Test archive page locally**

```bash
pnpm dev
```

Visit http://localhost:3000/newsletters and verify:
- Lists all newsletters
- Dates formatted correctly
- Cards are clickable
- Responsive design works

**Step 3: Commit archive page**

```bash
git add app/pages/newsletters/index.vue
git commit -m "feat: add newsletter archive page with Nuxt UI cards"
```

---

### Task 3.3: Create Individual Newsletter Page

**Files:**
- Create: `app/pages/newsletters/[...slug].vue`

**Step 1: Create newsletter detail page**

Create `app/pages/newsletters/[...slug].vue`:
```vue
<script setup lang="ts">
const route = useRoute();

// Query single newsletter by route path
const { data: newsletter } = await useAsyncData(route.path, () =>
  queryCollection('newsletters')
    .path(route.path)
    .first()
);

// Handle 404
if (!newsletter.value) {
  throw createError({
    statusCode: 404,
    message: 'Newsletter not found'
  });
}

// SEO meta tags
useHead({
  title: `${newsletter.value.title} - Vue.js Weekly`,
  meta: [
    { name: 'description', content: newsletter.value.description || newsletter.value.title },
    { property: 'og:title', content: newsletter.value.title },
    { property: 'og:type', content: 'article' },
    { property: 'article:published_time', content: newsletter.value.date }
  ]
});

// Format date helper
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
</script>

<template>
  <UContainer v-if="newsletter" class="py-12">
    <article class="max-w-4xl mx-auto">
      <!-- Back button -->
      <UButton
        to="/newsletters"
        variant="ghost"
        color="gray"
        icon="i-heroicons-arrow-left"
        class="mb-6"
      >
        Back to Archive
      </UButton>

      <!-- Newsletter header -->
      <header class="mb-8">
        <h1 class="text-3xl font-bold mb-3">
          {{ newsletter.title }}
        </h1>

        <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <time :datetime="newsletter.date">
            {{ formatDate(newsletter.date) }}
          </time>

          <span v-if="newsletter.author">
            by {{ newsletter.author }}
          </span>
        </div>
      </header>

      <!-- Newsletter content -->
      <div class="prose dark:prose-invert max-w-none">
        <ContentRenderer :value="newsletter" />
      </div>

      <!-- Footer navigation -->
      <div class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
        <UButton
          to="/newsletters"
          variant="soft"
          color="primary"
        >
          View All Newsletters
        </UButton>
      </div>
    </article>
  </UContainer>
</template>
```

**Step 2: Test individual newsletter page**

```bash
pnpm dev
```

Visit http://localhost:3000/newsletters/2025-11-12-vue-weekly and verify:
- Content renders correctly
- Back button works
- Markdown formatting looks good
- Meta tags are correct

**Step 3: Commit newsletter detail page**

```bash
git add app/pages/newsletters/[...slug].vue
git commit -m "feat: add individual newsletter page with content rendering"
```

---

## Phase 4: RSS Feed Generation

### Task 4.1: Add RSS Feed Server Route

**Files:**
- Create: `server/routes/rss.xml.ts`
- Modify: `package.json` (add feed package)

**Step 1: Install feed package**

```bash
pnpm add feed
```

**Step 2: Create RSS server route**

Create `server/routes/rss.xml.ts`:
```typescript
import { serverQueryContent } from '#content/server';
import { Feed } from 'feed';

export default defineEventHandler(async (event) => {
  // TODO: Load from config instead of hardcoding
  const siteUrl = 'https://vue-weekly.com';
  const title = 'Vue.js Weekly Newsletter';
  const description = 'Weekly Vue.js news and community updates';

  const feed = new Feed({
    title,
    description,
    id: siteUrl,
    link: siteUrl,
    language: 'en',
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `© ${new Date().getFullYear()} Vue.js Weekly`,
    feedLinks: {
      rss: `${siteUrl}/rss.xml`
    }
  });

  // Query newsletters
  const newsletters = await serverQueryContent(event, 'newsletters')
    .sort({ date: -1 })
    .limit(20)
    .find();

  // Add items to feed
  for (const newsletter of newsletters) {
    feed.addItem({
      title: newsletter.title ?? 'Newsletter',
      id: `${siteUrl}${newsletter._path}`,
      link: `${siteUrl}${newsletter._path}`,
      description: newsletter.description || newsletter.title,
      date: new Date(newsletter.date),
      author: newsletter.author ? [{ name: newsletter.author }] : undefined
    });
  }

  // Set headers
  event.node.res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  event.node.res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

  return feed.rss2();
});
```

**Step 3: Test RSS feed locally**

```bash
pnpm dev
```

Visit http://localhost:3000/rss.xml and verify:
- Valid XML returned
- Contains recent newsletters
- Links are correct

**Step 4: Commit RSS feed**

```bash
git add server/routes/rss.xml.ts package.json pnpm-lock.yaml
git commit -m "feat: add RSS feed generation with last 20 newsletters"
```

---

### Task 4.2: Make RSS Feed Use Config

**Files:**
- Modify: `server/routes/rss.xml.ts`

**Step 1: Update RSS route to load config**

Modify `server/routes/rss.xml.ts`:
```typescript
import { serverQueryContent } from '#content/server';
import { Feed } from 'feed';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NewsletterConfigSchema } from '../../schemas/config';

export default defineEventHandler(async (event) => {
  // Load newsletter config
  const configPath = join(process.cwd(), 'config', 'newsletter.json');
  const configContent = await readFile(configPath, 'utf-8');
  const config = NewsletterConfigSchema.parse(JSON.parse(configContent));

  const feed = new Feed({
    title: config.title,
    description: config.description,
    id: config.siteUrl,
    link: config.siteUrl,
    language: config.language,
    favicon: `${config.siteUrl}/favicon.ico`,
    copyright: `© ${new Date().getFullYear()} ${config.author}`,
    feedLinks: {
      rss: `${config.siteUrl}/rss.xml`
    },
    author: {
      name: config.author
    }
  });

  // Query newsletters
  const newsletters = await serverQueryContent(event, 'newsletters')
    .sort({ date: -1 })
    .limit(20)
    .find();

  // Add items to feed
  for (const newsletter of newsletters) {
    feed.addItem({
      title: newsletter.title ?? config.title,
      id: `${config.siteUrl}${newsletter._path}`,
      link: `${config.siteUrl}${newsletter._path}`,
      description: newsletter.description || newsletter.title,
      date: new Date(newsletter.date),
      author: [{
        name: newsletter.author || config.author
      }]
    });
  }

  // Set headers
  event.node.res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  event.node.res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

  return feed.rss2();
});
```

**Step 2: Test RSS feed with config**

```bash
pnpm dev
```

Visit http://localhost:3000/rss.xml and verify config values appear in feed metadata

**Step 3: Commit RSS config integration**

```bash
git add server/routes/rss.xml.ts
git commit -m "feat: RSS feed now loads from newsletter config"
```

---

## Phase 5: GitHub Actions Workflow

### Task 5.1: Create GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/generate-newsletter.yml`

**Step 1: Create workflow file**

Create `.github/workflows/generate-newsletter.yml`:
```yaml
name: Generate Newsletter

on:
  schedule:
    # Runs every Monday at 9:00 AM UTC
    # Edit this cron expression to change the schedule
    - cron: '0 9 * * 1'

  # Allow manual triggering from Actions tab
  workflow_dispatch:

permissions:
  contents: write

jobs:
  generate:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate newsletter
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: pnpm newsletter

      - name: Commit and push newsletter
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"

          # Add generated newsletter
          git add content/newsletters/

          # Check if there are changes to commit
          if git diff --staged --quiet; then
            echo "No changes to commit"
            exit 0
          fi

          # Commit with date in message
          DATE=$(date +%Y-%m-%d)
          git commit -m "chore: generate newsletter for $DATE"

          # Push to main branch
          git push
```

**Step 2: Commit workflow file**

```bash
git add .github/workflows/generate-newsletter.yml
git commit -m "feat: add GitHub Actions workflow for weekly newsletter generation"
```

**Step 3: Document API key setup**

This will be covered in the README, but the user needs to:
1. Go to GitHub repo Settings → Secrets and variables → Actions
2. Add secret: `ANTHROPIC_API_KEY`

---

## Phase 6: Documentation

### Task 6.1: Update README with Setup Instructions

**Files:**
- Modify: `README.md`

**Step 1: Write comprehensive README**

Replace content in `README.md`:
```markdown
# AI Newsletter Platform

A configurable, automated newsletter platform powered by Claude AI. Deploy your own AI-curated newsletter in 10-15 minutes.

## ✨ Features

- 🤖 **AI-Powered Curation:** Uses Claude to generate engaging newsletters from multiple sources
- ⚡ **Fully Automated:** GitHub Actions generate and deploy newsletters weekly
- 🎨 **Beautiful UI:** Built with Nuxt 4 and Nuxt UI
- 📰 **Static Site:** Deploy anywhere (Vercel, Netlify, Cloudflare Pages, GitHub Pages)
- 🔧 **Highly Configurable:** Customize sources, prompts, and schedule via simple config files
- 📡 **RSS Feed:** Built-in RSS feed for subscribers

## 🚀 Quick Start

### 1. Create Your Newsletter

Click "Use this template" to create your own repository.

### 2. Configure Your Newsletter

Edit three configuration files:

#### `config/newsletter.json`
```json
{
  "title": "Your Newsletter Name",
  "description": "Your newsletter description",
  "author": "Your Name",
  "siteUrl": "https://your-domain.com",
  "topic": "Your Topic",
  "slug": "your-slug",
  "language": "en"
}
```

#### `config/sources.json`

Add your content sources (RSS feeds, subreddits, GitHub, Dev.to):

```json
[
  {
    "id": "reddit-topic",
    "kind": "atom",
    "url": "https://www.reddit.com/r/YourSubreddit.rss",
    "tag": "Reddit",
    "limit": 10,
    "priority": 3
  },
  {
    "id": "blog-rss",
    "kind": "rss",
    "url": "https://blog.example.com/feed.rss",
    "tag": "Official Blog",
    "limit": 10,
    "priority": 5
  }
]
```

**Example configurations included:**
- `sources.example-vue.json` (Vue.js ecosystem)
- `sources.example-react.json` (React ecosystem)
- `sources.example-python.json` (Python ecosystem)

#### `config/prompts/system.md`

Customize your Claude system prompt or use one of the templates:
- `system-tech-newsletter.md` (technical focus)
- `system-community-digest.md` (community focus)

### 3. Add Your API Key

1. Get an Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)
2. Go to your GitHub repository Settings → Secrets and variables → Actions
3. Add a new secret:
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your API key

### 4. Configure Schedule (Optional)

Edit `.github/workflows/generate-newsletter.yml` to change the schedule:

```yaml
schedule:
  - cron: '0 9 * * 1'  # Monday 9am UTC
```

Common schedules:
- Daily: `'0 9 * * *'`
- Weekly (Wednesday): `'0 9 * * 3'`
- Bi-weekly: `'0 9 */14 * *'`
- Monthly: `'0 9 1 * *'`

### 5. Deploy Your Site

#### Vercel
1. Import your repository in Vercel
2. Build command: `pnpm build`
3. Output directory: `dist`

#### Netlify
1. Connect your repository in Netlify
2. Build command: `pnpm build`
3. Publish directory: `dist`

#### Cloudflare Pages
1. Connect your repository
2. Build command: `pnpm build`
3. Build output directory: `dist`

### 6. Test Newsletter Generation

1. Go to your repository's Actions tab
2. Click "Generate Newsletter" workflow
3. Click "Run workflow" → "Run workflow"
4. Wait 1-2 minutes
5. Check `content/newsletters/` for the generated newsletter
6. Your site will auto-deploy with the new content

## 📚 Documentation

### Finding Content Sources

**RSS Feeds:**
- Most blogs have `/feed`, `/rss`, or `/feed.xml` endpoints
- Look for RSS icons on websites
- Use tools like [RSS.app](https://rss.app) to find feeds

**Reddit:**
- Add `.rss` to any subreddit: `https://www.reddit.com/r/SubredditName.rss`
- Filter by hot/new/top: `https://www.reddit.com/r/SubredditName/hot.rss`

**GitHub:**
- Use GitHub API search: `https://api.github.com/search/repositories?q=TOPIC`
- Customize with filters (stars, language, date range)

**Dev.to:**
- Tag-based feeds: `https://dev.to/api/articles?tag=TOPIC`
- Top posts: Add `&top=7` for weekly top posts

### Priority System

Sources can have priority levels (1-5):
- **5 (Critical):** Always included first
- **4 (High):** Strong preference
- **3 (Normal):** Default behavior
- **2 (Low):** Included if space available
- **1 (Minimal):** Only if very few other items

Within each priority level, items are sorted by engagement (stars, reactions, upvotes).

### Customizing Prompts

The system prompt defines how Claude generates your newsletter. Key sections:

1. **Newsletter Requirements:** Accuracy, tone, guidelines
2. **Output Format:** Markdown structure, sections, formatting
3. **Content Guidelines:** What to include/exclude
4. **Quality Standards:** URLs, statistics, consistency

Use `{TOPIC}` placeholder in templates - it will be replaced with your configured topic.

## 🧪 Development

### Local Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Generate a newsletter locally
pnpm newsletter

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint
```

### Project Structure

```
├── app/                     # Nuxt 4 application
│   └── pages/              # Routes (homepage, archive, newsletter)
├── config/                 # User configuration
│   ├── newsletter.json     # Main config
│   ├── sources.json        # Content sources
│   └── prompts/            # Claude system prompts
├── content/
│   └── newsletters/        # Generated newsletters
├── scripts/                # Newsletter generator
│   ├── core/
│   │   └── resources/      # Source adapters
│   └── generate-newsletter.ts
├── server/
│   └── routes/
│       └── rss.xml.ts      # RSS feed
└── .github/
    └── workflows/          # GitHub Actions
```

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## 📄 License

MIT

## 🙏 Credits

Built with:
- [Nuxt 4](https://nuxt.com)
- [Nuxt Content](https://content.nuxt.com)
- [Nuxt UI](https://ui.nuxt.com)
- [Anthropic Claude API](https://anthropic.com)
```

**Step 2: Commit README**

```bash
git add README.md
git commit -m "docs: update README with setup instructions and documentation"
```

---

### Task 6.2: Create CONTRIBUTING.md

**Files:**
- Create: `CONTRIBUTING.md`

**Step 1: Create contributing guide**

Create `CONTRIBUTING.md`:
```markdown
# Contributing to AI Newsletter Platform

Thank you for considering contributing! This guide will help you get started.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `pnpm install`
3. Copy example config: `cp config/sources.example-vue.json config/sources.json`
4. Create `.env` file with `ANTHROPIC_API_KEY`
5. Run dev server: `pnpm dev`

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run type checking
pnpm typecheck

# Run linting
pnpm lint
```

## Coding Standards

This project follows strict TypeScript and coding standards. See [CLAUDE.md](CLAUDE.md) for details:

- Use TypeScript strict mode
- No `any` types without justification
- Specify return types on exported functions
- Use Zod for validation at API boundaries
- Use neverthrow for expected errors
- Write tests for new features (TDD preferred)

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following coding standards
3. Add tests for new features
4. Run `pnpm test` and `pnpm typecheck`
5. Update documentation if needed
6. Submit PR with clear description

## Adding New Resource Adapters

If you want to add support for a new content source:

1. Create adapter in `scripts/core/resources/adapters/`
2. Implement `Resource` interface
3. Add Zod schema in `schemas/`
4. Create example config in `config/sources.example-*.json`
5. Add tests in `tests/`
6. Update documentation

See existing adapters (RSS, Reddit, GitHub, Dev.to) as examples.

## Questions?

Open an issue for discussion before starting work on major features.
```

**Step 2: Commit contributing guide**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add contributing guidelines"
```

---

### Task 6.3: Update CLAUDE.md for New Architecture

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update CLAUDE.md to reflect new architecture**

Add to `CLAUDE.md` (near the top, after Project Overview):

```markdown
## Configuration-Driven Architecture

This project is designed as a **template for deploying custom AI newsletters**. Users fork/clone and configure via JSON/Markdown files - no code changes required.

### Configuration Files

- `config/newsletter.json` - Main newsletter metadata (title, description, URL, etc.)
- `config/sources.json` - Content sources (RSS feeds, Reddit, GitHub, Dev.to)
- `config/prompts/system.md` - Claude system prompt for newsletter generation
- `.env` - Secrets (ANTHROPIC_API_KEY)

### Configuration Loading

Configuration is loaded at runtime via `scripts/utils/config-loader.ts`:
- Validates all config with Zod schemas
- Fails fast on invalid configuration
- Provides clear error messages

When modifying generation pipeline, always load from config - never hardcode values.

### Example Configurations

Ship example configs for common use cases:
- `sources.example-vue.json` (Vue.js ecosystem)
- `sources.example-react.json` (React ecosystem)
- `sources.example-python.json` (Python ecosystem)

These serve as templates users can copy and customize.
```

**Step 2: Commit CLAUDE.md update**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with configuration-driven architecture"
```

---

## Phase 7: Testing and Validation

### Task 7.1: End-to-End Manual Testing

**Step 1: Test full pipeline locally**

```bash
# 1. Ensure config is set up
cat config/newsletter.json
cat config/sources.json
cat config/prompts/system.md

# 2. Verify API key
cat .env

# 3. Generate newsletter
pnpm newsletter

# 4. Verify output
ls -la content/newsletters/
cat content/newsletters/$(ls -t content/newsletters/ | head -1)

# 5. Start dev server
pnpm dev

# 6. Test all pages
# - http://localhost:3000/ (homepage)
# - http://localhost:3000/newsletters (archive)
# - http://localhost:3000/newsletters/2025-11-12-vue-weekly (individual)
# - http://localhost:3000/rss.xml (RSS feed)

# 7. Build for production
pnpm build

# 8. Verify dist output
ls -la dist/
```

**Step 2: Test GitHub Actions workflow**

```bash
# Push to GitHub
git push origin main

# Go to GitHub Actions tab
# Click "Generate Newsletter"
# Click "Run workflow"
# Wait for completion
# Verify new commit appears with newsletter
```

**Step 3: Test deployment**

Deploy to Vercel/Netlify and verify:
- Site loads
- All pages work
- RSS feed accessible
- No console errors

---

### Task 7.2: Run All Tests

**Step 1: Run test suite**

```bash
pnpm test
```

Expected: All tests pass

**Step 2: Run type checking**

```bash
pnpm typecheck
```

Expected: No type errors

**Step 3: Run linting**

```bash
pnpm lint
```

Expected: No lint errors

**Step 4: If all pass, commit any final fixes**

```bash
git add .
git commit -m "test: verify all tests pass and fix any issues"
```

---

## Phase 8: Final Polish

### Task 8.1: Create Release PR

**Step 1: Review all changes**

```bash
git log --oneline origin/main..HEAD
```

**Step 2: Create PR**

```bash
# Use GitHub CLI or web interface
gh pr create --title "feat: transform into configurable AI newsletter platform" --body "$(cat <<'EOF'
## Summary

Transforms the Vue.js-specific newsletter into a generic, configurable platform where anyone can deploy their own AI-powered newsletter in 10-15 minutes.

## Key Changes

- ✅ Configuration system (newsletter.json, sources.json, prompts)
- ✅ Nuxt Content 3 integration for newsletter archive
- ✅ Nuxt UI frontend (homepage, archive, individual pages)
- ✅ RSS feed generation
- ✅ GitHub Actions workflow for weekly automation
- ✅ Configuration-driven generation pipeline
- ✅ Example configs for Vue, React, Python
- ✅ Comprehensive documentation

## Test Plan

- [x] Generate newsletter with config
- [x] Verify frontmatter in output
- [x] Test all frontend pages
- [x] Validate RSS feed
- [x] Test GitHub Actions workflow
- [x] Deploy to production
- [x] All tests pass
- [x] Type checking passes
- [x] Linting passes

## Documentation

- [x] Updated README with setup guide
- [x] Added CONTRIBUTING.md
- [x] Updated CLAUDE.md
- [x] Created design document in docs/plans/

## Breaking Changes

- Newsletters now output to `content/newsletters/` instead of `newsletters/`
- Configuration required in `config/` directory
- System prompt loaded from file instead of hardcoded

## Migration Path

For existing Vue.js newsletter:
1. Copy `config/sources.example-vue.json` to `config/sources.json`
2. Move newsletters from `/newsletters` to `/content/newsletters`
3. Add frontmatter to existing newsletters
4. Update deploy config if needed
EOF
)"
```

---

## Completion Checklist

### Configuration System
- [x] Create config directory structure
- [x] Add Zod schemas for validation
- [x] Create config loading utilities
- [x] Add example configurations (Vue, React, Python)
- [x] Create prompt templates

### Nuxt Content Integration
- [x] Install and configure Nuxt Content 3
- [x] Create content.config.ts
- [x] Migrate newsletters to /content
- [x] Update generation script

### Frontend
- [x] Create homepage with Nuxt UI
- [x] Create archive page
- [x] Create individual newsletter page
- [x] Add RSS feed route

### Automation
- [x] Create GitHub Actions workflow
- [x] Document API key setup

### Documentation
- [x] Update README
- [x] Create CONTRIBUTING.md
- [x] Update CLAUDE.md
- [x] Create design document

### Testing
- [x] Config schema tests
- [x] Config loader tests
- [x] Manual end-to-end testing
- [x] GitHub Actions testing
- [x] Production deployment testing

---

## Success Criteria

✅ User can configure newsletter without code changes
✅ GitHub Actions generates and commits newsletters weekly
✅ Static site deploys to any platform
✅ RSS feed validates
✅ All tests pass
✅ TypeScript strict mode with no errors
✅ Setup time: 10-15 minutes for technical user
✅ Clear error messages for misconfigurations
✅ Example configurations work out-of-the-box
✅ Mobile-responsive and accessible
