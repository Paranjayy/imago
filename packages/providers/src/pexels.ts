import type { ImageProvider, ImageResult, SearchParams } from '@imago/types'

interface PexelsPhoto {
  id: number
  src: { original: string; medium: string }
  width: number
  height: number
  photographer: string
  photographer_url: string
  alt: string
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[]
  total_results: number
  page: number
}

export class PexelsProvider implements ImageProvider {
  readonly id = 'pexels'
  readonly name = 'Pexels'
  readonly category = 'stock' as const
  readonly capabilities = ['search'] as const
  readonly rateLimit = { requests: 200, window: '1h' }

  constructor(private readonly apiKey: string) {}

  async search(params: SearchParams): Promise<ImageResult[]> {
    const limit = Math.min(params.limit ?? 20, 80) // Pexels max per_page is 80
    const page = params.page ?? 1

    const url = new URL('https://api.pexels.com/v1/search')
    url.searchParams.set('query', params.query)
    url.searchParams.set('per_page', String(limit))
    url.searchParams.set('page', String(page))
    if (params.orientation) {
      url.searchParams.set('orientation', params.orientation)
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: this.apiKey },
    })

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as PexelsSearchResponse
    return data.photos.map((photo) => this.normalize(photo))
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch('https://api.pexels.com/v1/search?query=nature&per_page=1', {
        headers: { Authorization: this.apiKey },
      })
      return response.ok
    } catch {
      return false
    }
  }

  private normalize(photo: PexelsPhoto): ImageResult {
    return {
      id: `pexels-${photo.id}`,
      url: photo.src.original,
      thumb: photo.src.medium,
      width: photo.width,
      height: photo.height,
      source: 'pexels',
      author: photo.photographer,
      authorUrl: photo.photographer_url,
      license: 'free',
      description: photo.alt || undefined,
      tags: [],
      metadata: { originalId: photo.id },
    }
  }
}

export function createPexelsProvider(apiKey: string): PexelsProvider {
  return new PexelsProvider(apiKey)
}

// Singleton instance — uses PEXELS_API_KEY env var, falls back to empty string
export const pexelsProvider = new PexelsProvider(
  (typeof process !== 'undefined' ? process.env['PEXELS_API_KEY'] : undefined) ?? ''
)
