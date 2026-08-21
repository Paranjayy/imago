export interface ImageResult {
  id: string
  url: string
  thumb: string
  width: number
  height: number
  source: string
  author?: string
  authorUrl?: string
  license: 'free' | 'creative-commons' | 'commercial' | 'ai-generated'
  description?: string
  tags?: string[]
  metadata: Record<string, unknown>
}

export interface SearchParams {
  query: string
  providers?: string[]
  limit?: number
  page?: number
  orientation?: 'landscape' | 'portrait' | 'square'
  color?: string
}

export interface GenerateParams {
  prompt: string
  providers?: string[]
  count?: number
  size?: '256x256' | '512x512' | '1024x1024'
}
