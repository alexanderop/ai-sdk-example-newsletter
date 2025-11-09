import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { server } from './setup'
import { happyPathScenario } from './mocks/scenarios/happy-path'
import { partialFailureScenario } from './mocks/scenarios/partial-failure'
import { existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

describe('Newsletter Generation', () => {
  const testOutputPath = join(process.cwd(), 'newsletters', 'test-output.md')

  beforeEach(() => {
    // Clean up test file if it exists
    if (existsSync(testOutputPath)) {
      unlinkSync(testOutputPath)
    }
  })

  afterEach(() => {
    // Clean up test file after test
    if (existsSync(testOutputPath)) {
      unlinkSync(testOutputPath)
    }
  })

  it('should generate a newsletter', async () => {
    const { generateNewsletter } = await import('../scripts/generate-newsletter')

    const result = await generateNewsletter()

    expect(result).toContain('# Vue.js Weekly Newsletter')
  })

  it('should generate complete newsletter when all sources work', async () => {
    server.use(...happyPathScenario)

    const { generateNewsletter } = await import('../scripts/generate-newsletter')
    const result = await generateNewsletter()

    expect(result).toContain('# Vue.js Weekly Newsletter')
    expect(result).toContain('## 🎯 Official Updates')
    expect(result).toContain('## 💬 Community Highlights')
  })

  it('should write newsletter to file', async () => {
    server.use(...happyPathScenario)

    const { generateNewsletterToFile } = await import('../scripts/generate-newsletter')
    const filePath = await generateNewsletterToFile('test-output.md')

    expect(existsSync(filePath)).toBe(true)
    expect(filePath).toContain('newsletters/test-output.md')
  })

  it('should handle partial failures gracefully', async () => {
    server.use(...partialFailureScenario)

    const { generateNewsletter } = await import('../scripts/generate-newsletter')
    const result = await generateNewsletter()

    expect(result).toContain('# Vue.js Weekly Newsletter')
    // Should still generate newsletter even if one source fails
    expect(result.length).toBeGreaterThan(100)
  })
})
