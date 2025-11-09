import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Loads a prompt template from the prompts directory
 */
export function loadPrompt(filename: string): string {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const promptPath = join(__dirname, filename)
  return readFileSync(promptPath, 'utf-8').trim()
}

/**
 * Interpolates variables in a prompt template
 * Replaces {{VARIABLE_NAME}} with the corresponding value from the data object
 */
export function interpolatePrompt(template: string, data: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
  }
  return result
}

/**
 * Loads and interpolates a prompt template in one step
 */
export function getPrompt(filename: string, data?: Record<string, string>): string {
  const template = loadPrompt(filename)
  return data ? interpolatePrompt(template, data) : template
}
