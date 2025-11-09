export async function getText(url: string, headers?: Record<string, string>) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  return res.text()
}

export async function getJson<T>(url: string, headers?: Record<string, string>) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  return res.json() as Promise<T>
}
