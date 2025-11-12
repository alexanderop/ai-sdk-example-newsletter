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
