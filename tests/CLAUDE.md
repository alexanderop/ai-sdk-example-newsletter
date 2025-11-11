# Testing Guidelines

This file provides guidance specific to testing practices in `/tests`.

## Testing Philosophy

We use **collection-based testing** with MSW (Mock Service Worker) and `@msw/data` for:
- **Explicit test data** - See exactly what each test uses
- **Deterministic assertions** - Control data size and content
- **Better debugging** - Query collections to inspect state
- **Type safety** - Zod schemas validate at runtime

## Architecture

### Directory Structure

```
/tests
├── collections/         # @msw/data collections (queryable data stores)
├── fixtures/           # Seed functions for test scenarios
├── mocks/
│   └── handlers.ts     # MSW request handlers (thin query layer)
├── utils/              # Test utilities (XML formatters, helpers)
├── setup.ts            # Test setup (MSW server, collection lifecycle)
├── newsletter.test.ts  # Integration tests
└── validation-errors.test.ts  # Schema validation tests
```

### Core Concepts

**Collections** (`tests/collections/`)
- In-memory data stores powered by `@msw/data`
- Queryable like a database
- Used by MSW handlers to return responses
- Cleared after each test for isolation

**Fixtures** (`tests/fixtures/`)
- Functions that seed collections with specific scenarios
- Explicit - you see all test data
- Reusable across multiple tests

**MSW Handlers** (`tests/mocks/handlers.ts`)
- Intercept HTTP requests during tests
- Query collections to return responses
- Thin layer - no data generation logic

**Shared Schemas** (`/schemas`)
- Zod schemas used by BOTH tests AND production code
- Single source of truth prevents drift
- Runtime validation in tests matches production

## Collection-Based Testing Pattern

### The Old Way (Factory-Based) ❌

```typescript
// Factories generated data on-the-fly
server.use(...happyPathScenario)  // What data? Who knows!

// Tests couldn't inspect or query data
expect(result.items).toHaveLength(???)  // How many?
```

### The New Way (Collection-Based) ✅

```typescript
// Explicitly seed collections
await articles.createMany(10, (i) => ({
  id: i + 1,
  title: `Article ${i + 1}`,
  published_at: '2025-01-01'
}))

// Tests are explicit and deterministic
const result = await resource.fetch()
expect(result.items).toHaveLength(10)  // We know exactly: 10!

// Can query collections to inspect state
const allArticles = articles.findMany((q) => q.where(() => true))
expect(allArticles).toHaveLength(10)
```

## Writing Tests

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { articles, clearAllCollections } from './collections'

describe('Feature Name', () => {
  // Clear collections before each test for isolation
  beforeEach(async () => {
    await clearAllCollections()
  })

  it('should do something specific', async () => {
    // 1. ARRANGE: Seed collections with test data
    await articles.createMany(5, (i) => ({
      id: i + 1,
      title: `Article ${i + 1}`
    }))

    // 2. ACT: Perform the action
    const result = await fetchArticles()

    // 3. ASSERT: Verify the result
    expect(result).toHaveLength(5)
    expect(result[0].title).toBe('Article 1')
  })
})
```

### Seeding Collections

**Simple seed:**
```typescript
await articles.create({
  id: 1,
  title: 'Test Article',
  published_at: '2025-01-01'
})
```

**Bulk seed with iteration:**
```typescript
await articles.createMany(10, (i) => ({
  id: i + 1,
  title: `Article ${i + 1}`,
  published_at: `2025-01-${String(i + 1).padStart(2, '0')}`
}))
```

**Using fixtures:**
```typescript
import { seedHappyPath } from './fixtures/happy-path-seed'

await seedHappyPath()  // Seeds all collections for happy path scenario
```

### Querying Collections

**Find all:**
```typescript
const all = articles.findMany((q) => q.where(() => true))
```

**Find by ID:**
```typescript
const article = articles.findFirst((q) => q.where({ id: { equals: 1 } }))
```

**Find with condition:**
```typescript
const recent = articles.findMany((q) =>
  q.where({ published_at: { gte: '2025-01-01' } })
)
```

## Creating New Collections

### Step 1: Define Collection

Create a new file in `tests/collections/`:

```typescript
// tests/collections/my-resource.ts
import { primaryKey } from '@msw/data'
import { MyResourceSchema } from '~/schemas/my-resource'

export const myResourceCollection = {
  myResource: {
    id: primaryKey(Number),
    name: String,
    createdAt: String
    // Match fields from shared schema
  }
}
```

### Step 2: Register in Index

Add to `tests/collections/index.ts`:

```typescript
import { factory } from '@msw/data'
import { myResourceCollection } from './my-resource'

const db = factory({
  ...articleCollection,
  ...myResourceCollection  // Add here
})

export const myResource = db.myResource  // Export here

// Add to clearAllCollections
export function clearAllCollections() {
  // ... existing collections
  const allMyResources = myResource.findMany((q): unknown => q.where((): boolean => true))
  allMyResources.forEach((item): void => { myResource.delete(item) })
}
```

### Step 3: Add MSW Handler

Add handler in `tests/mocks/handlers.ts`:

```typescript
http.get('https://api.example.com/my-resources', (): Response => {
  const items = myResource.findMany((q): unknown => q.where((): boolean => true))
  return HttpResponse.json(items)
})
```

### Step 4: Create Fixture

Add to fixtures (e.g., `tests/fixtures/happy-path-seed.ts`):

```typescript
export async function seedHappyPath(): Promise<void> {
  // ... existing seeds

  // Seed my resource
  await myResource.createMany(5, (i) => ({
    id: i + 1,
    name: `Resource ${i + 1}`,
    createdAt: '2025-01-01'
  }))
}
```

## Testing Patterns

### Happy Path Testing

```typescript
it('should fetch all resources successfully', async () => {
  // Seed with valid data
  await seedHappyPath()

  // Perform action
  const result = await fetchAllResources()

  // Verify success
  expect(result.isOk()).toBe(true)
  expect(result.value).toHaveLength(expectedCount)
})
```

### Error Scenario Testing

```typescript
it('should handle partial failures gracefully', async () => {
  // Seed with some invalid data
  await seedPartialFailure()

  // Perform action
  const result = await fetchAllResources()

  // Verify graceful degradation
  expect(result.isOk()).toBe(true)
  expect(result.value.length).toBeLessThan(totalSeeded)
})
```

### Validation Testing

```typescript
it('should reject invalid API responses', async () => {
  // Seed with invalid data that violates schema
  await articles.create({
    id: 1,
    title: 123,  // Invalid: should be string
    published_at: 'not-a-date'
  })

  // Expect validation to fail
  await expect(adapter.fetch()).rejects.toThrow('Resource validation failed')
})
```

### Integration Testing

```typescript
it('should generate newsletter with all resources', async () => {
  // Seed all collections
  await seedHappyPath()

  // Run full pipeline
  const newsletter = await generateNewsletter()

  // Verify integration
  expect(newsletter).toContain('Article 1')
  expect(newsletter).toContain('Repository 1')
  expect(newsletter.length).toBeGreaterThan(100)
})
```

## MSW Handlers

### Handler Patterns

**Query all:**
```typescript
http.get('https://api.example.com/items', (): Response => {
  const items = collection.findMany((q): unknown => q.where((): boolean => true))
  return HttpResponse.json(items)
})
```

**Query with filter:**
```typescript
http.get('https://api.example.com/items', ({ request }): Response => {
  const url = new URL(request.url)
  const filter = url.searchParams.get('filter')

  const items = collection.findMany((q): unknown =>
    q.where({ category: { equals: filter } })
  )

  return HttpResponse.json(items)
})
```

**Error response:**
```typescript
http.get('https://api.example.com/failing', (): Response => {
  return HttpResponse.json(
    { error: 'Internal Server Error' },
    { status: 500 }
  )
})
```

### XML/RSS Handlers

Use utilities from `tests/utils/format-xml.ts`:

```typescript
import { formatRssXml, formatAtomXml } from '../utils/format-xml'

http.get('https://example.com/feed.rss', (): Response => {
  const items = collection.findMany((q): unknown => q.where((): boolean => true))
  const xml = formatRssXml(items)
  return new HttpResponse(xml, {
    headers: { 'Content-Type': 'application/rss+xml' }
  })
})
```

## Schema Validation Testing

### Why Test Validation?

- Ensures schemas catch invalid data
- Verifies error messages are helpful
- Prevents schema drift from production APIs
- Documents expected data shape

### Validation Test Pattern

```typescript
describe('MyResource validation', () => {
  beforeEach(async () => {
    await clearAllCollections()
  })

  it('should reject invalid field type', async () => {
    await myResource.create({
      id: 1,
      name: 123,  // Invalid: should be string
      createdAt: '2025-01-01'
    })

    const adapter = new MyResourceAdapter()
    await expect(adapter.fetch()).rejects.toThrow('Resource validation failed')
  })

  it('should accept valid data', async () => {
    await myResource.create({
      id: 1,
      name: 'Valid Name',
      createdAt: '2025-01-01'
    })

    const adapter = new MyResourceAdapter()
    const result = await adapter.fetch()
    expect(result).toHaveLength(1)
  })
})
```

## Best Practices

### Collection Management

✅ **DO:**
- Clear collections before each test with `clearAllCollections()`
- Explicitly seed data in each test (don't rely on global state)
- Use fixtures for complex scenarios
- Query collections to verify state

❌ **DON'T:**
- Share data between tests (causes flaky tests)
- Seed collections in `beforeAll` (breaks isolation)
- Rely on test execution order
- Forget to clear collections after testing

### Test Data

✅ **DO:**
- Make test data obvious and readable
- Use descriptive names (`Article 1`, not `asdfgh`)
- Seed minimal data needed for the test
- Use realistic data shapes matching production

❌ **DON'T:**
- Generate random data (non-deterministic)
- Reuse the same IDs across different collections
- Seed more data than necessary (slow tests)
- Use magic numbers without explanation

### Assertions

✅ **DO:**
- Assert exact values when possible
- Check array lengths explicitly
- Verify error messages
- Test both success and failure paths

❌ **DON'T:**
- Use `.toBeTruthy()` when you can be specific
- Assert on partial objects without reason
- Skip negative test cases
- Write tests that always pass

### MSW Handlers

✅ **DO:**
- Keep handlers thin (just query collections)
- Return realistic response shapes
- Match production API formats exactly
- Use proper HTTP status codes

❌ **DON'T:**
- Generate data in handlers (use collections)
- Hard-code responses in handlers
- Deviate from production API structure
- Skip error response handlers

## Common Tasks

### Running Tests

```bash
# Run all tests once
pnpm test

# Watch mode (TDD)
pnpm test:watch

# UI mode (debugging)
pnpm test:ui

# Coverage report
pnpm test -- --coverage
```

### Debugging Tests

**1. Inspect collection state:**
```typescript
const items = collection.findMany((q) => q.where(() => true))
console.log('Collection state:', items)
```

**2. Use Vitest UI:**
```bash
pnpm test:ui
```

**3. Add focused test:**
```typescript
it.only('should debug this specific test', async () => {
  // Test code
})
```

**4. Check MSW logs:**
MSW logs all intercepted requests to console.

### Adding a New Test File

1. Create test file in `/tests` (e.g., `my-feature.test.ts`)
2. Import necessary collections and fixtures
3. Set up `beforeEach` to clear collections
4. Write tests using collection-based pattern
5. Run tests with `pnpm test`

### Creating a New Fixture

1. Create file in `tests/fixtures/` (e.g., `my-scenario-seed.ts`)
2. Export async function that seeds collections
3. Document the scenario being tested
4. Import and use in tests

## Integration with Production Code

### Shared Schemas

**Critical:** Use schemas from `/schemas`, not local test schemas.

✅ **DO:**
```typescript
import { ArticleSchema } from '~/schemas/devto'  // Shared schema
```

❌ **DON'T:**
```typescript
const ArticleSchema = z.object({ ... })  // Duplicate schema
```

### Adapter Testing

When testing adapters, verify:
1. Schema validation works (rejects invalid data)
2. Valid data is parsed correctly
3. Error logging includes resource ID
4. Errors are thrown, not swallowed

### Mock vs Real APIs

**Use MSW for all external APIs in tests:**
- GitHub API
- Dev.to API
- Reddit API
- Hacker News API
- RSS feeds
- Claude API

**Never make real API calls in tests:**
- Slow
- Flaky (network issues)
- Requires API keys
- Not deterministic

## Testing Checklist

When adding new features:

- [ ] Write tests BEFORE implementation (TDD)
- [ ] Create collection if testing new resource
- [ ] Add MSW handler for API endpoint
- [ ] Seed test data explicitly in each test
- [ ] Clear collections in `beforeEach`
- [ ] Test happy path
- [ ] Test error cases
- [ ] Test validation failures
- [ ] Verify all tests pass
- [ ] Check test coverage is adequate
