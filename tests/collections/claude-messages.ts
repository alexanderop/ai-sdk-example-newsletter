import { Collection } from '@msw/data'
import { z } from 'zod'

/**
 * Collection for Claude API messages used in tests.
 * Extends the standard Claude message format with a contextRole field
 * for matching messages based on system prompts.
 *
 * Schema fields:
 * - id: Message ID
 * - type: Always "message"
 * - role: Always "assistant"
 * - content: Array of content blocks (text)
 * - model: Model name
 * - stop_reason: Why generation stopped
 * - usage: Token usage stats
 * - contextRole: Custom field to match against system prompts (e.g., "RSS Fetcher", "Reddit Researcher")
 */
const ClaudeMessageDataSchema = z.object({
  id: z.string(),
  type: z.literal('message'),
  role: z.enum(['assistant']),
  content: z.array(z.object({
    type: z.literal('text'),
    text: z.string()
  })),
  model: z.string(),
  stop_reason: z.enum(['end_turn', 'max_tokens', 'stop_sequence']).nullable(),
  usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number()
  }),
  contextRole: z.string().optional() // Used to match against system prompts
})

export const claudeMessages = new Collection({
  schema: ClaudeMessageDataSchema
})
