import type { ImageResult, SearchParams, GenerateParams, ProviderInfo } from '@imago/types'
import type { ProviderRegistry } from './registry.js'

export interface SearchResult {
  results: ImageResult[]
  providers: string[]
  took_ms: number
}

export interface GenerateResult {
  results: ImageResult[]
  providers: string[]
  took_ms: number
}

function deduplicateResults(results: ImageResult[]): ImageResult[] {
  const seen = new Set<string>()
  return results.filter((r) => {
    if (seen.has(r.url)) return false
    seen.add(r.url)
    return true
  })
}

function interleaveResults(grouped: ImageResult[][]): ImageResult[] {
  const result: ImageResult[] = []
  const maxLen = Math.max(...grouped.map((g) => g.length), 0)
  for (let i = 0; i < maxLen; i++) {
    for (const group of grouped) {
      if (i < group.length) result.push(group[i]!)
    }
  }
  return result
}

export class Router {
  constructor(private readonly registry: ProviderRegistry) {}

  async search(params: SearchParams): Promise<SearchResult> {
    const start = Date.now()
    const requestedIds = params.providers
    const providers = requestedIds
      ? requestedIds
          .map((id) => this.registry.get(id))
          .filter((p): p is NonNullable<typeof p> => p !== undefined && p.capabilities.includes('search'))
      : this.registry.searchProviders()

    if (providers.length === 0) {
      return { results: [], providers: [], took_ms: Date.now() - start }
    }

    const settled = await Promise.allSettled(
      providers.map((p) => p.search(params)),
    )

    const grouped: ImageResult[][] = []
    const successfulProviders: string[] = []

    for (let i = 0; i < settled.length; i++) {
      const outcome = settled[i]!
      const provider = providers[i]!
      if (outcome.status === 'fulfilled') {
        grouped.push(outcome.value)
        successfulProviders.push(provider.id)
      }
    }

    const interleaved = interleaveResults(grouped)
    const deduped = deduplicateResults(interleaved)

    return {
      results: deduped,
      providers: successfulProviders,
      took_ms: Date.now() - start,
    }
  }

  async providerInfos(): Promise<ProviderInfo[]> {
    return this.registry.providerInfos()
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    const start = Date.now()
    const requestedIds = params.providers ?? ['dalle']
    const providers = requestedIds
      .map((id) => this.registry.get(id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined && p.capabilities.includes('generate') && typeof p.generate === 'function')

    if (providers.length === 0) {
      return { results: [], providers: [], took_ms: Date.now() - start }
    }

    const settled = await Promise.allSettled(
      providers.map((p) => p.generate!(params)),
    )

    const results: ImageResult[] = []
    const successfulProviders: string[] = []

    for (let i = 0; i < settled.length; i++) {
      const outcome = settled[i]!
      const provider = providers[i]!
      if (outcome.status === 'fulfilled') {
        results.push(...outcome.value)
        successfulProviders.push(provider.id)
      }
    }

    return {
      results,
      providers: successfulProviders,
      took_ms: Date.now() - start,
    }
  }
}

export function createRouter(registry: ProviderRegistry): Router {
  return new Router(registry)
}
