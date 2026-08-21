'use client'
import { useState, useCallback } from 'react'
import type { ImageResult } from '@imago/types'
import { apiClient } from '@/lib/api'

interface UseSearchState {
  results: ImageResult[]
  loading: boolean
  error: string | null
  providers: string[]
  took_ms: number | null
}

export function useSearch() {
  const [state, setState] = useState<UseSearchState>({
    results: [],
    loading: false,
    error: null,
    providers: [],
    took_ms: null,
  })

  const search = useCallback(async (query: string, providerIds?: string[]) => {
    if (!query.trim()) return
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const response = await apiClient.search({ query, providers: providerIds, limit: 40 })
      setState({
        results: response.results,
        loading: false,
        error: null,
        providers: response.providers,
        took_ms: response.took_ms,
      })
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Search failed',
      }))
    }
  }, [])

  return { ...state, search }
}
