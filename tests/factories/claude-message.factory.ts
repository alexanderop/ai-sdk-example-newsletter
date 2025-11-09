import { faker } from '@faker-js/faker'
import { ClaudeMessageSchema, type ClaudeMessage } from '../schemas/claude-api.schema'

export function createClaudeMessage(overrides?: Partial<ClaudeMessage>): ClaudeMessage {
  const message = {
    id: overrides?.id ?? `msg_${faker.string.alphanumeric(29)}`,
    type: 'message' as const,
    role: 'assistant' as const,
    content: overrides?.content ?? [{
      type: 'text' as const,
      text: faker.lorem.paragraphs(2)
    }],
    model: overrides?.model ?? 'claude-3-5-haiku-20241022',
    stop_reason: overrides?.stop_reason ?? 'end_turn' as const,
    usage: {
      input_tokens: overrides?.usage?.input_tokens ?? faker.number.int({ min: 50, max: 500 }),
      output_tokens: overrides?.usage?.output_tokens ?? faker.number.int({ min: 100, max: 1000 })
    }
  }

  // Validate against schema
  return ClaudeMessageSchema.parse(message)
}
