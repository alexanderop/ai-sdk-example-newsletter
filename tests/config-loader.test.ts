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
