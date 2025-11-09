import { z } from 'zod'

export const ClaudeContentBlockSchema = z.object({
  type: z.literal('text'),
  text: z.string()
})

export const ClaudeUsageSchema = z.object({
  input_tokens: z.number(),
  output_tokens: z.number()
})

export const ClaudeMessageSchema = z.object({
  id: z.string(),
  type: z.literal('message'),
  role: z.enum(['assistant']),
  content: z.array(ClaudeContentBlockSchema),
  model: z.string(),
  stop_reason: z.enum(['end_turn', 'max_tokens', 'stop_sequence']).nullable(),
  usage: ClaudeUsageSchema
})

export type ClaudeMessage = z.infer<typeof ClaudeMessageSchema>
export type ClaudeContentBlock = z.infer<typeof ClaudeContentBlockSchema>
export type ClaudeUsage = z.infer<typeof ClaudeUsageSchema>
