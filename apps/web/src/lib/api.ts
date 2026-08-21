import type { SearchResponse, ProvidersResponse, SearchParams } from '@imago/types'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      // In V1 we use a demo key; Task 9 adds real key management
      Authorization: `Bearer ${process.env['NEXT_PUBLIC_DEMO_API_KEY'] ?? 'imago_sk_demo'}`,
      ...init?.headers,
    },
    ...init,
  })
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export const apiClient = {
  async search(params: SearchParams): Promise<SearchResponse> {
    const qs = new URLSearchParams()
    qs.set('q', params.query)
    if (params.providers) qs.set('providers', params.providers.join(','))
    if (params.limit) qs.set('limit', String(params.limit))
    if (params.page) qs.set('page', String(params.page))
    if (params.orientation) qs.set('orientation', params.orientation)
    return request<SearchResponse>(`/v1/search?${qs.toString()}`)
  },

  async searchAll(query: string, limit = 20): Promise<SearchResponse> {
    return request<SearchResponse>(`/v1/search/all?q=${encodeURIComponent(query)}&limit=${limit}`)
  },

  async getProviders(): Promise<ProvidersResponse> {
    return request<ProvidersResponse>('/v1/providers')
  },
}
