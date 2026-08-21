import type { ImageResult, SearchParams, GenerateParams } from './image.js'

export interface ImageProvider {
  readonly id: string
  readonly name: string
  readonly category: 'stock' | 'search' | 'generation'
  readonly capabilities: ReadonlyArray<'search' | 'generate'>
  readonly rateLimit: { requests: number; window: string }

  search(params: SearchParams): Promise<ImageResult[]>
  generate?(params: GenerateParams): Promise<ImageResult[]>
  healthCheck(): Promise<boolean>
}

export interface ProviderInfo {
  id: string
  name: string
  category: 'stock' | 'search' | 'generation'
  capabilities: ReadonlyArray<'search' | 'generate'>
  rateLimit: { requests: number; window: string }
  status: 'healthy' | 'degraded' | 'down'
}
