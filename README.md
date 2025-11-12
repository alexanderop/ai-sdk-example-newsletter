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
