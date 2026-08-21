import type {
  ImageProvider,
  ImageResult,
  SearchParams,
} from '@imago/types'

interface UnsplashPhoto {
  id: string
  urls: { full: string; thumb: string }
  width: number
  height: number
  user: { name: string; links: { html: string } }
  description: string | null
  alt_description: string | null
  tags?: Array<{ title: string }>
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[]
  total: number
}

export class UnsplashProvider implements ImageProvider {
  readonly id = 'unsplash'
  readonly name = 'Unsplash'
  readonly category = 'stock' as const
  readonly capabilities = ['search'] as const
  readonly rateLimit = { requests: 50, window: '1h' }

  constructor(private readonly accessKey: string) {}

  async search(params: SearchParams): Promise<ImageResult[]> {
    const limit = Math.min(params.limit ?? 20, 30) // Unsplash max per_page is 30
    const page = params.page ?? 1

    const url = new URL('https://api.unsplash.com/search/photos')
    url.searchParams.set('query', params.query)
    url.searchParams.set('per_page', String(limit))
    url.searchParams.set('page', String(page))
    if (params.orientation) {
      url.searchParams.set('orientation', params.orientation)
    }
    if (params.color) {
      url.searchParams.set('color', params.color)
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${this.accessKey}`,
        'Accept-Version': 'v1',
      },
    })

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as UnsplashSearchResponse

    return data.results.map((photo) => this.normalize(photo))
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch('https://api.unsplash.com/photos?per_page=1', {
        headers: { Authorization: `Client-ID ${this.accessKey}` },
      })
      return response.ok
    } catch {
      return false
    }
  }

  private normalize(photo: UnsplashPhoto): ImageResult {
    return {
      id: `unsplash-${photo.id}`,
      url: photo.urls.full,
      thumb: photo.urls.thumb,
      width: photo.width,
      height: photo.height,
      source: 'unsplash',
      author: photo.user.name,
      authorUrl: photo.user.links.html,
      license: 'free',
      description: photo.description ?? photo.alt_description ?? undefined,
      tags: photo.tags?.map((t) => t.title) ?? [],
      metadata: { originalId: photo.id },
    }
  }
}

export function createUnsplashProvider(accessKey: string): UnsplashProvider {
  return new UnsplashProvider(accessKey)
}

// Singleton instance — uses UNSPLASH_ACCESS_KEY env var, falls back to empty string
export const unsplashProvider = new UnsplashProvider(
  (typeof process !== 'undefined' ? process.env['UNSPLASH_ACCESS_KEY'] : undefined) ?? ''
)
