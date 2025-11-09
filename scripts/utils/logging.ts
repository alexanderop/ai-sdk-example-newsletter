export interface UsageMetrics {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
}

export interface TokenCost {
  inputCost: number
  outputCost: number
  cacheCost: number
  cacheReadCost: number
  totalCost: number
}

export function calculateTokenCost(usage: UsageMetrics): TokenCost {
  const inputCost = (usage.input_tokens / 1_000_000) * 1.0 // $1 per million input tokens for Haiku 4.5
  const outputCost = (usage.output_tokens / 1_000_000) * 5.0 // $5 per million output tokens
  const cacheCost = ((usage.cache_creation_input_tokens || 0) / 1_000_000) * 1.25 // $1.25 per million for cache writes
  const cacheReadCost = ((usage.cache_read_input_tokens || 0) / 1_000_000) * 0.10 // $0.10 per million for cache reads

  const totalCost = inputCost + outputCost + cacheCost + cacheReadCost

  return {
    inputCost,
    outputCost,
    cacheCost,
    cacheReadCost,
    totalCost
  }
}

export function logUsageMetrics(usage: UsageMetrics): void {
  const costs = calculateTokenCost(usage)

  console.log('\n📊 Token Usage:')
  console.log(`  Input tokens: ${usage.input_tokens.toLocaleString()}`)
  console.log(`  Output tokens: ${usage.output_tokens.toLocaleString()}`)
  if (usage.cache_creation_input_tokens) {
    console.log(`  Cache creation tokens: ${usage.cache_creation_input_tokens.toLocaleString()}`)
  }
  if (usage.cache_read_input_tokens) {
    console.log(`  Cache read tokens: ${usage.cache_read_input_tokens.toLocaleString()}`)
  }
  console.log(`\n💰 Estimated cost: $${costs.totalCost.toFixed(4)}`)
}
