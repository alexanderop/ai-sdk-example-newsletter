# Newsletter Script Refactoring Design

**Date:** November 9, 2025
**Author:** Refactoring based on Martin Fowler principles
**Status:** Design - Ready for Implementation

## Executive Summary

This document outlines a comprehensive refactoring of the newsletter generation script (`scripts/generate-newsletter.ts`) applying Martin Fowler's refactoring patterns. The goal is to improve testability, create a clear domain model, separate concerns, and make the codebase more maintainable without breaking existing functionality.

## Current Problems

### 1. God Object (Long Method, Feature Envy)
The `generate-newsletter.ts` file contains 552 lines doing everything: fetching data, validating environment, generating content, writing files, logging, and orchestration. This violates the Single Responsibility Principle.

### 2. Primitive Obsession
Data flows as raw objects and arrays (`NewsItem[]`, `RepoItem[]`, `RedditPost[]`). These should be first-class domain objects with behavior, not just data containers.

### 3. Shotgun Surgery
Adding a new content source (e.g., Twitter/X posts) requires modifying multiple locations:
- Add fetch function
- Update parallel fetch call in `generateNewsletterWithRealData`
- Modify context building logic
- Update tests

### 4. Hidden Dependencies
The script creates an `anthropic` client at module level (line 78), making it impossible to test without hitting the real API or using complex HTTP mocking (MSW).

### 5. Missing Abstractions
There's no clear domain model. The business logic is buried in implementation details. What IS a newsletter? What does generation mean?

## Proposed Architecture

### Domain Model

We'll extract clear domain concepts with single responsibilities:

**Core Entities:**
- `Newsletter` - The newsletter domain entity with validation rules
- `ContentSource` - Abstract interface for fetching content (Strategy pattern)
- `NewsletterContent` - Value object holding all fetched data
- `NewsletterGenerator` - Orchestrates newsletter generation using Claude API
- `NewsletterWriter` - Handles file system operations

**Directory Structure:**
```
scripts/
  domain/
    Newsletter.ts              # Domain entity with validation
    NewsletterContent.ts       # Value object bundling all content
  services/
    content/
      ContentSource.ts         # Interface
      GitHubSource.ts          # GitHub API integration
      RedditSource.ts          # Reddit RSS integration
      ContentAggregator.ts     # Combines multiple sources
    NewsletterGenerator.ts     # Claude API integration
    NewsletterWriter.ts        # File operations
  infrastructure/
    AnthropicClient.ts         # API client wrapper
    RetryPolicy.ts             # Exponential backoff logic
    PromptLoader.ts            # Prompt loading (existing)
  application/
    GenerateNewsletterUseCase.ts  # Orchestrates the workflow
  generate-newsletter.ts       # CLI entry point (simplified)
```

### Key Refactorings Applied

1. **Extract Class** - Pull out `GitHubContentSource`, `RedditContentSource`, etc.
2. **Replace Conditional with Polymorphism** - Each source implements `ContentSource` interface
3. **Introduce Parameter Object** - `NewsletterContent` bundles all fetched data
4. **Extract Method** - Break down massive functions into focused methods
5. **Dependency Injection** - Pass dependencies rather than create them at module level

## Detailed Design

### 1. Domain Layer

#### Newsletter Entity
```typescript
// scripts/domain/Newsletter.ts
export class Newsletter {
  private constructor(
    public readonly content: string,
    public readonly generatedAt: Date,
    public readonly metadata: NewsletterMetadata
  ) {}

  static fromText(text: string): Newsletter {
    const validation = this.validate(text)
    if (!validation.isValid) {
      throw new NewsletterValidationError(validation.errors)
    }

    return new Newsletter(
      text,
      new Date(),
      this.extractMetadata(text)
    )
  }

  private static validate(content: string): ValidationResult {
    const errors: string[] = []

    if (!content.includes('# Vue.js Weekly Newsletter')) {
      errors.push('Missing newsletter title')
    }

    if (!/^##\s+/m.test(content)) {
      errors.push('Newsletter must have at least one section (## heading)')
    }

    if (/\[[A-Z][^\]]*\]/.test(content)) {
      errors.push('Newsletter contains placeholder content in brackets')
    }

    return { isValid: errors.length === 0, errors }
  }

  toMarkdown(): string {
    return this.content
  }

  getWordCount(): number {
    return this.content.split(/\s+/).length
  }
}
```

#### NewsletterContent Value Object
```typescript
// scripts/domain/NewsletterContent.ts
export class NewsletterContent {
  constructor(
    public readonly vueNews: VueNewsItem[],
    public readonly trendingRepos: TrendingRepo[],
    public readonly redditPosts: RedditPost[],
    public readonly generatedAt: Date = new Date()
  ) {}

  isEmpty(): boolean {
    return this.vueNews.length === 0
      && this.trendingRepos.length === 0
      && this.redditPosts.length === 0
  }

  toContextString(): string {
    const currentDate = this.generatedAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const newsSection = this.formatVueNews()
    const reposSection = this.formatTrendingRepos()
    const redditSection = this.formatRedditPosts()

    return `
Current Date: ${currentDate}

Recent Vue.js Projects:
${newsSection}

Trending Vue.js Repositories:
${reposSection}

Community Discussions from Reddit:
${redditSection}
`.trim()
  }

  private formatVueNews(): string {
    return this.vueNews.length > 0
      ? this.vueNews.map(item => `- [${item.title}](${item.url})`).join('\n')
      : '- No recent Vue.js news available'
  }

  private formatTrendingRepos(): string {
    return this.trendingRepos.length > 0
      ? this.trendingRepos.map((repo, i) =>
          `${i + 1}. **[${repo.name}](${repo.url})** - ${repo.description}${
            repo.stars ? ` (⭐ ${repo.stars.toLocaleString()})` : ''
          }`
        ).join('\n')
      : '- No trending repositories available'
  }

  private formatRedditPosts(): string {
    return this.redditPosts.length > 0
      ? this.redditPosts.map((post, i) => {
          const dateStr = post.pubDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })
          return `${i + 1}. **[${post.title}](${post.link})** - r/${post.subreddit} (${dateStr})`
        }).join('\n')
      : '- No significant community discussions this week'
  }
}
```

### 2. Services Layer

#### ContentSource Interface
```typescript
// scripts/services/content/ContentSource.ts
export type FetchResult<T> =
  | { success: true; data: T }
  | { success: false; error: Error; fallback: T }

export interface ContentSource<T = unknown> {
  readonly name: string
  fetch(): Promise<FetchResult<T>>
}
```

#### GitHubContentSource Implementation
```typescript
// scripts/services/content/GitHubSource.ts
export class GitHubVueNewsSource implements ContentSource<VueNewsItem[]> {
  readonly name = 'GitHub Vue News'

  constructor(
    private readonly logger: Logger = console,
    private readonly daysBack: number = 7
  ) {}

  async fetch(): Promise<FetchResult<VueNewsItem[]>> {
    try {
      const lastWeek = new Date()
      lastWeek.setDate(lastWeek.getDate() - this.daysBack)
      const dateStr = lastWeek.toISOString().split('T')[0]

      const url = `https://api.github.com/search/repositories?q=vue+in:name,description+pushed:>${dateStr}&sort=updated&order=desc&per_page=5`

      this.logger.log(`\n🔍 Fetching Vue.js news...`)
      this.logger.log(`   📅 Date range: ${dateStr} to today`)

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json() as GitHubSearchResponse

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid response format from GitHub API')
      }

      this.logger.log(`   ✅ Found ${data.items.length} recent Vue.js projects`)

      const items = data.items.map(item => ({
        title: item.name,
        url: item.html_url,
        stars: item.stargazers_count
      }))

      return { success: true, data: items }
    } catch (error) {
      this.logger.error(`   ❌ Failed to fetch Vue.js news:`, error)
      return {
        success: false,
        error: error as Error,
        fallback: []
      }
    }
  }
}
```

#### ContentAggregator
```typescript
// scripts/services/content/ContentAggregator.ts
export class ContentAggregator {
  constructor(
    private readonly sources: ContentSource[],
    private readonly logger: Logger = console
  ) {}

  async fetchAll(): Promise<NewsletterContent> {
    this.logger.log('\n📥 Fetching data from external sources...')

    const results = await Promise.all(
      this.sources.map(source => source.fetch())
    )

    // Log failures
    const failures = results.filter(r => !r.success)
    failures.forEach(f => {
      if (!f.success) {
        this.logger.warn(`   ⚠️  Source failed: ${f.error.message}`)
      }
    })

    // Extract data (use fallback for failures)
    const [vueNews, trendingRepos, redditPosts] = results.map(r =>
      r.success ? r.data : r.fallback
    )

    return new NewsletterContent(
      vueNews as VueNewsItem[],
      trendingRepos as TrendingRepo[],
      redditPosts as RedditPost[]
    )
  }
}
```

#### NewsletterGenerator Service
```typescript
// scripts/services/NewsletterGenerator.ts
export class NewsletterGenerator {
  constructor(
    private readonly client: AnthropicClient,
    private readonly promptLoader: PromptLoader,
    private readonly logger: Logger = console
  ) {}

  async generate(content: NewsletterContent): Promise<Newsletter> {
    this.logger.log('\n🤖 Calling Claude AI API...')
    this.logger.log(`   📏 Max tokens: 4096`)
    this.logger.log(`   💾 Prompt caching: enabled`)

    const systemPrompt = this.promptLoader.load('newsletter-system.md')
    const userPrompt = this.promptLoader.getWithVars('newsletter-user.md', {
      CONTEXT_DATA: content.toContextString()
    })

    const message = await this.client.createMessage({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: [{ role: 'user', content: userPrompt }]
    })

    this.logger.log('   ✅ Claude AI response received')
    this.logUsageMetrics(message.usage)

    const text = this.extractTextContent(message)
    return Newsletter.fromText(text)
  }

  private extractTextContent(message: Message): string {
    const textContent = message.content.find(c => c.type === 'text')
    return textContent?.type === 'text' ? textContent.text : ''
  }

  private logUsageMetrics(usage: UsageMetrics): void {
    // Same logic as current implementation
  }
}
```

### 3. Infrastructure Layer

#### AnthropicClient Wrapper
```typescript
// scripts/infrastructure/AnthropicClient.ts
export interface AnthropicClient {
  createMessage(params: MessageCreateParams): Promise<Message>
}

export class RealAnthropicClient implements AnthropicClient {
  private readonly client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async createMessage(params: MessageCreateParams): Promise<Message> {
    return this.client.messages.create(params)
  }
}

// For testing
export class MockAnthropicClient implements AnthropicClient {
  constructor(private readonly mockResponse: Message) {}

  async createMessage(): Promise<Message> {
    return this.mockResponse
  }
}
```

#### RetryPolicy
```typescript
// scripts/infrastructure/RetryPolicy.ts
export class RetryPolicy {
  constructor(
    private readonly maxRetries: number = 3,
    private readonly initialDelay: number = 1000,
    private readonly logger: Logger = console
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          this.logger.log(`   🔄 Retry attempt ${attempt}/${this.maxRetries}`)
        }
        return await operation()
      } catch (error) {
        lastError = error as Error
        if (attempt === this.maxRetries) {
          this.logger.error(`   ❌ All ${this.maxRetries} attempts failed`)
          throw lastError
        }
        const delay = this.initialDelay * Math.pow(2, attempt - 1)
        this.logger.log(`   ⏱️  Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }
}

// Decorator pattern for wrapping content sources
export class RetryableContentSource<T> implements ContentSource<T> {
  constructor(
    private readonly source: ContentSource<T>,
    private readonly policy: RetryPolicy
  ) {}

  get name(): string {
    return this.source.name
  }

  async fetch(): Promise<FetchResult<T>> {
    return this.policy.execute(() => this.source.fetch())
  }
}
```

### 4. Application Layer

#### GenerateNewsletterUseCase
```typescript
// scripts/application/GenerateNewsletterUseCase.ts
export class GenerateNewsletterUseCase {
  constructor(
    private readonly aggregator: ContentAggregator,
    private readonly generator: NewsletterGenerator,
    private readonly writer: NewsletterWriter,
    private readonly logger: Logger = console
  ) {}

  async execute(filename?: string): Promise<string> {
    const startTime = Date.now()

    this.logger.log('\n🚀 Starting newsletter generation...')
    this.logger.log('='.repeat(60))

    try {
      // Fetch content from all sources
      const content = await this.aggregator.fetchAll()

      if (content.isEmpty()) {
        this.logger.warn('⚠️  No content fetched from any source')
      }

      // Generate newsletter with Claude
      const newsletter = await this.generator.generate(content)

      // Write to file
      const filePath = await this.writer.write(newsletter, filename)

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      this.logger.log('\n' + '='.repeat(60))
      this.logger.log(`✅ Newsletter generated successfully!`)
      this.logger.log(`   📁 Location: ${filePath}`)
      this.logger.log(`   ⏱️  Total time: ${duration}s`)
      this.logger.log('='.repeat(60) + '\n')

      return filePath
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      this.logger.error('\n' + '='.repeat(60))
      this.logger.error('❌ Error generating newsletter:')
      this.logger.error(`   ${(error as Error).message}`)
      this.logger.error(`   ⏱️  Failed after: ${duration}s`)
      this.logger.error('='.repeat(60) + '\n')
      throw error
    }
  }
}
```

## Error Handling Strategy

### Explicit Result Types

Instead of returning empty arrays on failure (hiding errors), we use explicit result types:

```typescript
type FetchResult<T> =
  | { success: true; data: T }
  | { success: false; error: Error; fallback: T }
```

This makes failures visible while allowing graceful degradation.

### Partial Failure Handling

The `ContentAggregator` collects results from all sources, logs failures, but continues with successful data:

```typescript
const failures = results.filter(r => !r.success)
failures.forEach(f => logger.warn(`Source failed: ${f.error}`))

// Continue with whatever data we got
const content = new NewsletterContent(...)
```

### Validation at Boundaries

- Input validation: Environment variables checked at startup
- Domain validation: `Newsletter.fromText()` validates structure
- Output validation: File write confirms success

## Testing Strategy

### Unit Tests

With dependency injection, we can unit test each class in isolation:

```typescript
describe('NewsletterGenerator', () => {
  it('should generate newsletter from content', async () => {
    const mockClient = {
      createMessage: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '# Vue.js Weekly Newsletter\n\n## Section' }],
        usage: { input_tokens: 100, output_tokens: 200 }
      })
    }

    const generator = new NewsletterGenerator(
      mockClient,
      new MockPromptLoader(),
      new MockLogger()
    )

    const content = new NewsletterContent([], [], [])
    const newsletter = await generator.generate(content)

    expect(newsletter.content).toContain('# Vue.js Weekly Newsletter')
    expect(mockClient.createMessage).toHaveBeenCalledOnce()
  })
})
```

### Integration Tests

Keep MSW-based integration tests for end-to-end validation:

```typescript
describe('Newsletter Generation E2E', () => {
  it('should generate complete newsletter when all sources work', async () => {
    server.use(...happyPathScenario)

    const useCase = createNewsletterUseCase() // Real implementations
    const filePath = await useCase.execute('test-output.md')

    expect(existsSync(filePath)).toBe(true)
  })
})
```

### Test Doubles

- `MockAnthropicClient` - Returns predefined responses
- `MockContentSource` - Returns test data
- `MockFileSystem` - In-memory file operations
- Real implementations with MSW for integration tests

## Migration Strategy - Strangler Fig Pattern

We can't rewrite everything at once. The Strangler Fig pattern allows gradual migration while keeping tests green.

### Phase 1: Extract Infrastructure (Week 1)

Extract pure utilities with no business logic:

1. Create `RetryPolicy` class
2. Create `AnthropicClient` interface and `RealAnthropicClient`
3. Keep existing `retryWithBackoff` function, make it delegate to `RetryPolicy`
4. All existing tests still pass

### Phase 2: Extract Content Sources (Week 2)

Extract each content fetcher:

1. Create `ContentSource` interface
2. Create `GitHubVueNewsSource` class
3. Make `fetchVueNews()` delegate to `GitHubVueNewsSource`
4. Repeat for `GitHubTrendingSource` and `RedditContentSource`
5. Add unit tests for each class
6. All existing integration tests still pass

### Phase 3: Extract Domain Model (Week 2)

1. Create `Newsletter` class with validation
2. Create `NewsletterContent` value object
3. Update `generateNewsletterWithRealData()` to use new types internally
4. Tests still pass (same behavior, better structure)

### Phase 4: Extract Generator & Writer (Week 3)

1. Create `NewsletterGenerator` service
2. Create `NewsletterWriter` service
3. Update existing functions to delegate
4. Tests still pass

### Phase 5: Create Use Case (Week 3)

1. Create `GenerateNewsletterUseCase` that composes everything
2. Add new CLI flag: `--use-new-architecture`
3. Tests can run against both old and new implementations
4. Validate identical behavior

### Phase 6: Switch & Cleanup (Week 4)

1. Switch CLI to new architecture by default
2. Remove old functions (they're just thin wrappers now)
3. Update tests to use new architecture directly
4. Delete delegation code

### Rollback Plan

At each phase:
- Keep old code working
- Tests validate both paths
- Can rollback by reverting commits
- Feature flag allows A/B testing

## Benefits of This Refactoring

### Testability
- Unit test individual classes without HTTP mocking
- Mock dependencies easily via constructor injection
- Test business logic separate from infrastructure

### Maintainability
- Clear responsibilities (SRP)
- Easy to find where logic lives
- Self-documenting through class/method names

### Extensibility
- Add new content source: implement `ContentSource` interface
- Change retry strategy: swap `RetryPolicy` implementation
- Switch AI provider: implement `AnthropicClient` interface

### Reliability
- Explicit error handling
- Type-safe domain model
- Validation at boundaries

### Developer Experience
- Clear mental model (domain → services → infrastructure)
- Easy onboarding (read use case, follow dependencies)
- Better IDE support (navigation, refactoring)

## Non-Goals

This refactoring does NOT:
- Change the CLI interface
- Modify prompt templates
- Alter newsletter format/content
- Change test coverage expectations
- Add new features (pure refactoring)

## Success Criteria

1. All existing tests pass
2. No change in CLI behavior (same input → same output)
3. Code coverage maintained or improved
4. Each class has <200 lines
5. Each class has single, clear responsibility
6. Dependencies injected via constructors
7. Can unit test without HTTP mocking

## Open Questions

1. Should we add a configuration object for all the hardcoded values (model name, max tokens, retry counts)?
2. Should the `Logger` interface be formalized or keep using `console`?
3. Should we extract a `FileSystem` interface to make `NewsletterWriter` fully testable without touching disk?
4. Do we want to add observability (metrics, traces) during this refactoring?

## Next Steps

1. Review and approve this design
2. Create feature branch for refactoring
3. Implement Phase 1 (Infrastructure extraction)
4. Review and merge Phase 1
5. Continue with subsequent phases
6. Each phase is a separate PR for easier review

---

**Ready for implementation when approved.**
