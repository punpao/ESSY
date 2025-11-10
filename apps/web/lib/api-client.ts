import { cache } from 'react'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1'

type FetchOptions = RequestInit & {
  token?: string | null
}

export const apiFetch = async <T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> => {
  const headers = new Headers(options.headers ?? {})
  headers.set('Content-Type', 'application/json')
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: options.cache ?? 'no-store'
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'API error')
  }

  return response.json() as Promise<T>
}

export const getDealPublic = cache(async (token: string) => {
  return apiFetch(`/paylinks/${token}`, { cache: 'no-store' })
})
