import type { ImageResult } from './image.js'
import type { ProviderInfo } from './provider.js'

export interface SearchResponse {
  results: ImageResult[]
  total: number
  page: number
  providers: string[]
  took_ms: number
}

export interface GenerateResponse {
  results: ImageResult[]
  prompt: string
  providers: string[]
  took_ms: number
}

export interface ProvidersResponse {
  providers: ProviderInfo[]
}

export interface UsageResponse {
  key: string
  requests_today: number
  requests_month: number
  limit_per_day: number
}

export interface ErrorResponse {
  error: {
    code: string
    message: string
    provider?: string
  }
}
