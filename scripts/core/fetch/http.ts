export async function getText(url: string, headers?: Record<string, string>, timeout = 10000): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout((): void => {
    controller.abort()
  }, timeout)
  try {
    const res = await fetch(url, { headers, signal: controller.signal })
    clearTimeout(timeoutId)
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
    return await res.text()
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Timeout after ${timeout}ms for ${url}`)
    }
    throw err
  }
}

export async function getJson<T>(url: string, headers?: Record<string, string>, timeout = 10000): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout((): void => {
    controller.abort()
  }, timeout)
  try {
    const res = await fetch(url, { headers, signal: controller.signal })
    clearTimeout(timeoutId)
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
    return await res.json() as T
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Timeout after ${timeout}ms for ${url}`)
    }
    throw err
  }
}
