/**
 * Type-safe environment variable access
 */
export function getEnvVar(key: string): string | undefined {
  // Type guard to ensure we're working with the correct type
  const env: NodeJS.ProcessEnv = process.env
  const value: string | undefined = env[key]
  return value
}
