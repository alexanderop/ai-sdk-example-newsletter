import { loadNewsletterConfig } from '../../scripts/utils/config-loader'
import type { NewsletterConfig } from '../../schemas/config'

// Cache the config at module level to avoid repeated file reads
let cachedConfig: NewsletterConfig | null = null

export default defineEventHandler(async () => {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig
  }

  try {
    // Load and cache the config
    cachedConfig = await loadNewsletterConfig()
    return cachedConfig
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: `Failed to load newsletter configuration: ${error instanceof Error ? error.message : String(error)}`
    })
  }
})
