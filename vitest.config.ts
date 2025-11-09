import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['scripts/**/*.ts'],
      exclude: [
        'tests/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/node_modules/**',
        '**/.nuxt/**',
        '**/dist/**',
        '**/.output/**',
        'scripts/generate-newsletter.ts',
        'scripts/generate-newsletter-new.ts',
        'scripts/core/llm/LLMClient.ts',
        'scripts/prompts/loader.ts'
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 58,
        statements: 60
      }
    }
  }
})
