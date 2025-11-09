import { describe, it, expect } from 'vitest'
import { server } from './setup'
import { happyPathScenario } from './mocks/scenarios/happy-path'

describe('Newsletter Generation', () => {
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
})
