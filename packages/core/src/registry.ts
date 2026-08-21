import type { ImageProvider, ProviderInfo } from '@imago/types'

export class ProviderRegistry {
  private readonly providers = new Map<string, ImageProvider>()

  register(provider: ImageProvider): void {
    this.providers.set(provider.id, provider)
  }

  get(id: string): ImageProvider | undefined {
    return this.providers.get(id)
  }

  all(): ImageProvider[] {
    return Array.from(this.providers.values())
  }

  searchProviders(): ImageProvider[] {
    return this.all().filter((p) => p.capabilities.includes('search'))
  }

  generateProviders(): ImageProvider[] {
    return this.all().filter((p) => p.capabilities.includes('generate'))
  }

  async providerInfos(): Promise<ProviderInfo[]> {
    return Promise.all(
      this.all().map(async (provider) => {
        let status: ProviderInfo['status'] = 'healthy'
        try {
          const healthy = await provider.healthCheck()
          status = healthy ? 'healthy' : 'down'
        } catch {
          status = 'down'
        }
        return {
          id: provider.id,
          name: provider.name,
          category: provider.category,
          capabilities: provider.capabilities,
          rateLimit: provider.rateLimit,
          status,
        }
      }),
    )
  }
}

export function createRegistry(): ProviderRegistry {
  return new ProviderRegistry()
}
