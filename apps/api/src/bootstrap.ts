import { createRegistry, createRouter } from '@imago/core'
import type { Router, ProviderRegistry } from '@imago/core'
import { createUnsplashProvider, createPexelsProvider } from '@imago/providers'

let _registry: ProviderRegistry | null = null
let _router: Router | null = null

export function getRegistry(): ProviderRegistry {
  if (!_registry) {
    _registry = createRegistry()
    const unsplashKey = process.env['UNSPLASH_ACCESS_KEY']
    const pexelsKey = process.env['PEXELS_API_KEY']
    if (unsplashKey) _registry.register(createUnsplashProvider(unsplashKey))
    if (pexelsKey) _registry.register(createPexelsProvider(pexelsKey))
  }
  return _registry
}

export function getRouter(): Router {
  if (!_router) {
    _router = createRouter(getRegistry())
  }
  return _router
}
