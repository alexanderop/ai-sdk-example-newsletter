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
