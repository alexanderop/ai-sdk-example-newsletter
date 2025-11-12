import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { NewsletterConfigSchema, SourcesConfigSchema } from '../../schemas/config';
import type { NewsletterConfig, SourcesConfig } from '../../schemas/config';

/**
 * Load and validate newsletter configuration
 */
export async function loadNewsletterConfig(configDir: string = 'config'): Promise<NewsletterConfig> {
  const baseDir = configDir.startsWith('/') ? configDir : join(process.cwd(), configDir);
  const configPath = join(baseDir, 'newsletter.json');

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
  const baseDir = configDir.startsWith('/') ? configDir : join(process.cwd(), configDir);
  const sourcesPath = join(baseDir, 'sources.json');

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
  const baseDir = configDir.startsWith('/') ? configDir : join(process.cwd(), configDir);
  const promptPath = join(baseDir, 'prompts', 'system.md');

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
