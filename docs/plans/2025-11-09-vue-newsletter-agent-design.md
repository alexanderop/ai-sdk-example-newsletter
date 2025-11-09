# Vue.js Newsletter Agent Design

**Date:** 2025-11-09
**Purpose:** Demonstrate Claude Agent SDK capabilities by building an automated Vue.js newsletter generator

## Overview

Build a standalone Node.js script that uses the Claude Agent SDK to generate a comprehensive weekly Vue.js newsletter. The agent will gather content from multiple sources (RSS feeds, Reddit, Hacker News) using parallel subagents, then synthesize the information into a well-structured Markdown newsletter.

## Architecture

### File Structure

```
scripts/
  generate-newsletter.ts          # Main orchestrator agent
  agents/
    rss-fetcher.md               # Subagent for RSS feeds
    reddit-researcher.md         # Subagent for Reddit
    hn-researcher.md             # Subagent for Hacker News
newsletters/
  YYYY-MM-DD-vue-weekly.md       # Generated newsletters
tests/
  newsletter.test.ts             # Integration tests
  mocks/
    handlers.ts                  # MSW request handlers
    fixtures/
      vue-blog-rss.xml           # Mock RSS feed data
      reddit-response.json       # Mock Reddit data
      hn-response.json           # Mock HN data
  setup.ts                       # MSW server setup
package.json                     # Add scripts + dependencies
.env.example                     # Environment variable template
```

### Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "latest",
    "tsx": "latest"
  },
  "devDependencies": {
    "vitest": "latest",
    "msw": "latest"
  },
  "scripts": {
    "newsletter": "tsx scripts/generate-newsletter.ts",
    "test": "vitest",
    "test:watch": "vitest --watch"
  }
}
```

## Main Orchestrator Agent

### Configuration
- **Model:** Claude Haiku (most cost-effective for testing)
- **Tools:** File system access (Read, Write), subagent spawning
- **Role:** Vue.js Newsletter Curator

### System Prompt
The main agent acts as a Vue.js community newsletter curator responsible for:
- Gathering content from multiple sources
- Filtering and deduplicating content
- Organizing into clear sections (Official Updates, Ecosystem News, Community Highlights)
- Prioritizing quality over quantity
- Maintaining professional but friendly tone

### Orchestration Flow

1. Initialize main agent with Claude Haiku model
2. Calculate date range (last 7 days from current date)
3. Spawn 3 subagents in parallel:
   - RSS Fetcher subagent
   - Reddit Researcher subagent
   - HN Researcher subagent
4. Wait for all subagents to complete (2 minute timeout per subagent)
5. Collect and consolidate results from all subagents
6. Synthesize content into structured newsletter
7. Write Markdown file to `newsletters/YYYY-MM-DD-vue-weekly.md`

## Subagent Specifications

### Subagent 1: RSS Fetcher

**Purpose:** Fetch and parse RSS feeds from Vue.js ecosystem blogs

**Input:**
- List of RSS feed URLs:
  - https://blog.vuejs.org/feed.rss
  - https://nuxt.com/blog/rss.xml
  - https://vuetelescope.com/rss.xml
- Date range (7 days)

**Process:**
1. Use WebFetch tool to retrieve each RSS feed
2. Parse XML/RSS content
3. Filter for posts published in last 7 days
4. Extract: title, link, publication date, summary

**Output:**
```markdown
## RSS Feed Results
### Vue.js Official Blog
- [Title](link) - Date - Brief summary

### Nuxt Blog
- [Title](link) - Date - Brief summary
```

### Subagent 2: Reddit Researcher

**Purpose:** Find top Vue.js discussions from Reddit

**Input:**
- Subreddit: /r/vuejs
- Date range (7 days)
- Minimum upvotes: 10

**Process:**
1. Use WebFetch to access Reddit RSS: https://www.reddit.com/r/vuejs.rss
2. Filter posts from last 7 days
3. Filter by minimum upvote threshold
4. Extract: title, link, upvotes, comment count, author
5. Return top 5-10 discussions

**Output:**
Structured list of Reddit posts with metadata

### Subagent 3: Hacker News Researcher

**Purpose:** Find Vue-related stories from Hacker News

**Input:**
- Search query: "vue" OR "vuejs" OR "nuxt"
- Date range (7 days)
- Minimum points: 20

**Process:**
1. Use WebFetch to access HN Algolia API: http://hn.algolia.com/api/v1/search?query=vue&tags=story
2. Filter stories from last 7 days
3. Filter by minimum points threshold
4. Extract: title, link, points, comment count
5. Return top 5-10 stories

**Output:**
Structured list of HN stories with metadata

## Newsletter Output Format

### Template Structure

```markdown
# Vue.js Weekly Newsletter
## Week of [Start Date] - [End Date]

Generated on: [Timestamp]

---

## 🎯 Official Updates
[Content from RSS feeds - Vue.js official blog, major announcements]

## 📦 Ecosystem News
[Content from RSS feeds - Nuxt, Pinia, VueUse, other major libraries]

## 💬 Community Highlights

### Top Reddit Discussions
[Top posts from /r/vuejs with upvotes and links]

### Hacker News Stories
[Vue-related HN stories with points and links]

## 📚 Articles & Tutorials
[Blog posts and tutorials from RSS feeds]

---

*Generated using Claude Agent SDK | [Date]*
```

### Content Processing Rules

1. **Deduplication:** Remove same article appearing in multiple sources
2. **Prioritization:** Sort by relevance (upvotes, points, recency)
3. **Limits:** Top 5-10 items per section to keep newsletter concise
4. **Summaries:** Include 1-2 sentence summaries for each item
5. **Formatting:** Use emoji section headers for visual appeal

### File Naming

- Format: `YYYY-MM-DD-vue-weekly.md`
- Example: `2025-11-09-vue-weekly.md`
- Location: `newsletters/` directory

### Metadata

Each newsletter includes:
- Date range covered
- Generation timestamp
- Number of sources checked
- Total items found vs. items included

## Error Handling

### Subagent Failures

- Each subagent wraps work in try-catch
- If RSS fetch fails → log warning, continue with other feeds
- If Reddit/HN fails → note in newsletter that source was unavailable
- Main agent waits for all subagents with 2-minute timeout each

### Network Issues

- Agent SDK provides built-in retry logic
- WebFetch tool handles timeouts gracefully
- If all sources fail → generate newsletter with error message

### Data Validation

- Verify dates are within 7-day range
- Validate URLs before including
- Ensure minimum content threshold (at least 3 items total)
- If below threshold, note "quiet week" in newsletter

## Testing Strategy

### Test Framework

- **Runner:** Vitest
- **Mocking:** MSW (Mock Service Worker)
- **Approach:** TDD with integration tests

### Mock Setup

Mock these endpoints:
- `https://blog.vuejs.org/feed.rss` → Return fixture RSS XML
- `https://nuxt.com/blog/rss.xml` → Return fixture RSS XML
- `https://www.reddit.com/r/vuejs.rss` → Return fixture RSS XML
- `http://hn.algolia.com/api/v1/search*` → Return fixture JSON

### Test Cases

**1. Happy Path:**
- All sources return valid data
- Newsletter generated with all sections populated
- File written to newsletters/ directory
- Content properly formatted as Markdown

**2. Partial Failures:**
- RSS feed returns 404 → Newsletter generated with other sources
- Reddit unavailable → Newsletter notes Reddit unavailable
- HN times out → Newsletter continues with RSS + Reddit

**3. Data Validation:**
- Filters out posts older than 7 days
- Removes duplicate entries across sources
- Handles empty responses gracefully

**4. Edge Cases:**
- No content in date range → "quiet week" message
- Malformed RSS XML → Log error, skip that feed
- Invalid URLs → Filter them out

### TDD Workflow

```bash
# 1. Write failing test
pnpm test

# 2. Implement feature
# Edit generate-newsletter.ts or agent files

# 3. Run tests until passing
pnpm test

# 4. Refactor and clean up

# 5. Optional: Validate with real API
pnpm run newsletter
```

## Environment Setup

### Required Environment Variables

```bash
# .env
ANTHROPIC_API_KEY=your_api_key_here
```

### .env.example Template

```bash
# Claude API Key (get from https://console.anthropic.com/)
ANTHROPIC_API_KEY=sk-ant-...
```

## Cost Estimation

Using Claude Haiku model:
- Input: ~$0.25 per million tokens
- Output: ~$1.25 per million tokens
- Estimated cost per newsletter generation: **< $0.10**
- Main agent + 3 subagents should use ~50-100k tokens total

## Success Criteria

The implementation is successful when:

1. ✅ Script runs via `pnpm run newsletter`
2. ✅ Generates Markdown file in newsletters/ directory
3. ✅ Newsletter includes content from all 3 sources
4. ✅ Content is filtered to last 7 days
5. ✅ No duplicate entries
6. ✅ Well-formatted Markdown with sections
7. ✅ All tests pass with MSW mocks
8. ✅ Error handling works for partial failures
9. ✅ Total cost per run < $0.10

## Future Enhancements

- Email delivery via SMTP
- HTML email template generation
- Scheduled runs via GitHub Actions
- Web UI to browse past newsletters
- Customizable content sources
- Multi-language support
