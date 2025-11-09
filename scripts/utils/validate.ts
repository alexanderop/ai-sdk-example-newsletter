export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function hasPlaceholderContent(content: string): boolean {
  const placeholderRegex = /\[[A-Z][^\]]*\]/
  return placeholderRegex.test(content)
}

export function validateNewsletterContent(content: string): ValidationResult {
  const errors: string[] = []

  // Check for title
  if (!content.includes('# Vue.js Weekly Newsletter')) {
    errors.push('Missing newsletter title')
  }

  // Check for sections (at least one ## heading)
  const sectionRegex = /^##\s+/m
  if (!sectionRegex.test(content)) {
    errors.push('Newsletter must have at least one section (## heading)')
  }

  // Check for placeholder content in brackets
  if (hasPlaceholderContent(content)) {
    errors.push('Newsletter contains placeholder content in brackets')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function isValidApiKey(apiKey: string): boolean {
  const trimmed = apiKey.trim()
  return trimmed !== '' && trimmed !== 'your_api_key_here' && trimmed !== 'test-key'
}
