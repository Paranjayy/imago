# Imago Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Imago — a unified image search and generation API aggregator (OpenRouter-style) with a Next.js Studio UI and a Hono.js API backend, deployed on Vercel.

**Architecture:** Turborepo monorepo with `apps/web` (Next.js 14), `apps/api` (Hono.js on Vercel Edge), and `packages/` (providers, core, types). All provider integrations normalize to a single `ImageResult` shape. The core router fans out to providers in parallel.

**Tech Stack:** pnpm workspaces, Turborepo, TypeScript (strict), Hono.js, Next.js 14 App Router, Tailwind CSS, shadcn/ui, Vercel KV, Vercel deployment.

## Global Constraints

- Node.js >= 20
- pnpm >= 9 (no npm/yarn)
- TypeScript strict mode in all packages (`"strict": true`)
- All packages scoped as `@imago/*`
- API key prefix: `imago_sk_`
- API base path: `/v1`
- Default search limit: 20, max: 100
- All provider adapters MUST implement the `ImageProvider` interface from `packages/types`
- No `any` types — use `unknown` + type guards
- Commit after every task using conventional commits (`feat:`, `fix:`, `chore:`)

---

## Task 1: Monorepo Scaffold

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `apps/web/.gitkeep`
- Create: `apps/api/.gitkeep`
- Create: `packages/types/.gitkeep`
- Create: `packages/providers/.gitkeep`
- Create: `packages/core/.gitkeep`

**Interfaces:**
- Produces: working monorepo where `pnpm install` succeeds and `turbo build` can be configured

- [ ] **Step 1: Initialize git repo**

```bash
cd /Users/paranjay/Developer/Image-search2
git init
```

- [ ] **Step 2: Create root package.json**

```json
{
  "name": "imago",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "clean": "turbo clean"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  },
  "engines": {
    "node": ">=20",
    "pnpm": ">=9"
  },
  "packageManager": "pnpm@9.0.0"
}
```

- [ ] **Step 3: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 4: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

- [ ] **Step 5: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

- [ ] **Step 6: Create .gitignore**

```
node_modules/
.next/
dist/
.turbo/
.env
.env.local
*.tsbuildinfo
.vercel/
```

- [ ] **Step 7: Create .env.example**

```bash
# Stock Photo Providers
UNSPLASH_ACCESS_KEY=
PEXELS_API_KEY=
PIXABAY_API_KEY=

# Search Engine Providers
SERPAPI_KEY=

# AI Generation Providers
OPENAI_API_KEY=
STABILITY_API_KEY=

# Vercel KV (for API keys + usage tracking)
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Web app
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 8: Create directory stubs**

```bash
mkdir -p apps/web apps/api packages/types/src packages/providers/src packages/core/src
touch apps/web/.gitkeep apps/api/.gitkeep
```

- [ ] **Step 9: Install turbo and run pnpm install**

```bash
pnpm install
```

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "chore: initialize imago monorepo scaffold"
```

---

## Task 2: Shared Types Package (`packages/types`)

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`
- Create: `packages/types/src/image.ts`
- Create: `packages/types/src/provider.ts`
- Create: `packages/types/src/api.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `ImageResult` — normalized image shape
  - `SearchParams` — search request parameters
  - `GenerateParams` — generation request parameters
  - `ImageProvider` — interface all providers implement
  - `ProviderInfo` — static provider metadata
  - `SearchResponse` — API response shape
  - `ErrorResponse` — API error shape

- [ ] **Step 1: Create packages/types/package.json**

```json
{
  "name": "@imago/types",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create packages/types/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create packages/types/src/image.ts**

```typescript
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
```

- [ ] **Step 4: Create packages/types/src/provider.ts**

```typescript
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
```

- [ ] **Step 5: Create packages/types/src/api.ts**

```typescript
import type { ImageResult, ProviderInfo } from './index.js'

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
```

- [ ] **Step 6: Create packages/types/src/index.ts**

```typescript
export * from './image.js'
export * from './provider.js'
export * from './api.js'
```

- [ ] **Step 7: Build and verify**

```bash
cd packages/types && pnpm build
```

Expected: `dist/` created with `.js` and `.d.ts` files, no TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add packages/types/
git commit -m "feat: add @imago/types shared type definitions"
```

---

## Task 3: Unsplash Provider (`packages/providers`)

**Files:**
- Create: `packages/providers/package.json`
- Create: `packages/providers/tsconfig.json`
- Create: `packages/providers/src/unsplash.ts`
- Create: `packages/providers/src/index.ts`

**Interfaces:**
- Consumes: `ImageProvider`, `ImageResult`, `SearchParams` from `@imago/types`
- Produces:
  - `UnsplashProvider` class implementing `ImageProvider`
  - `unsplashProvider` singleton export
  - `createUnsplashProvider(accessKey: string): UnsplashProvider`

- [ ] **Step 1: Create packages/providers/package.json**

```json
{
  "name": "@imago/providers",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@imago/types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create packages/providers/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create packages/providers/src/unsplash.ts**

```typescript
import type {
  ImageProvider,
  ImageResult,
  SearchParams,
  GenerateParams,
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
```

- [ ] **Step 4: Create packages/providers/src/index.ts (stub — more providers added in Task 6)**

```typescript
export { UnsplashProvider, createUnsplashProvider } from './unsplash.js'
```

- [ ] **Step 5: Install deps and build**

```bash
pnpm install && cd packages/providers && pnpm build
```

Expected: no TypeScript errors, `dist/` created.

- [ ] **Step 6: Commit**

```bash
git add packages/providers/
git commit -m "feat: add @imago/providers with Unsplash adapter"
```

---

## Task 4: Pexels Provider

**Files:**
- Create: `packages/providers/src/pexels.ts`
- Modify: `packages/providers/src/index.ts`

**Interfaces:**
- Consumes: `ImageProvider`, `ImageResult`, `SearchParams` from `@imago/types`
- Produces:
  - `PexelsProvider` class implementing `ImageProvider`
  - `createPexelsProvider(apiKey: string): PexelsProvider`

- [ ] **Step 1: Create packages/providers/src/pexels.ts**

```typescript
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
```

- [ ] **Step 2: Update packages/providers/src/index.ts**

```typescript
export { UnsplashProvider, createUnsplashProvider } from './unsplash.js'
export { PexelsProvider, createPexelsProvider } from './pexels.js'
```

- [ ] **Step 3: Build and verify**

```bash
cd packages/providers && pnpm build
```

Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add packages/providers/src/pexels.ts packages/providers/src/index.ts
git commit -m "feat: add Pexels provider adapter"
```

---

## Task 5: Core Router (`packages/core`)

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/registry.ts`
- Create: `packages/core/src/router.ts`
- Create: `packages/core/src/index.ts`

**Interfaces:**
- Consumes:
  - `ImageProvider`, `ImageResult`, `SearchParams`, `GenerateParams`, `ProviderInfo` from `@imago/types`
- Produces:
  - `ProviderRegistry` class with `register(provider: ImageProvider)`, `get(id: string): ImageProvider | undefined`, `all(): ImageProvider[]`, `searchProviders(): ImageProvider[]`, `generateProviders(): ImageProvider[]`
  - `Router` class with `search(params: SearchParams): Promise<{ results: ImageResult[]; providers: string[]; took_ms: number }>`, `generate(params: GenerateParams): Promise<{ results: ImageResult[]; providers: string[]; took_ms: number }>`, `providerInfos(): ProviderInfo[]`
  - `createRegistry(): ProviderRegistry`
  - `createRouter(registry: ProviderRegistry): Router`

- [ ] **Step 1: Create packages/core/package.json**

```json
{
  "name": "@imago/core",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@imago/types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create packages/core/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create packages/core/src/registry.ts**

```typescript
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
```

- [ ] **Step 4: Create packages/core/src/router.ts**

```typescript
import type { ImageResult, SearchParams, GenerateParams } from '@imago/types'
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
```

- [ ] **Step 5: Create packages/core/src/index.ts**

```typescript
export { ProviderRegistry, createRegistry } from './registry.js'
export { Router, createRouter } from './router.js'
export type { SearchResult, GenerateResult } from './router.js'
```

- [ ] **Step 6: Build and verify**

```bash
pnpm install && cd packages/core && pnpm build
```

Expected: no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add packages/core/
git commit -m "feat: add @imago/core router and provider registry"
```

---

## Task 6: Hono API App (`apps/api`)

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/middleware/auth.ts`
- Create: `apps/api/src/routes/search.ts`
- Create: `apps/api/src/routes/providers.ts`
- Create: `apps/api/src/bootstrap.ts`
- Create: `apps/api/vercel.json`

**Interfaces:**
- Consumes:
  - `createRegistry`, `createRouter` from `@imago/core`
  - `createUnsplashProvider`, `createPexelsProvider` from `@imago/providers`
  - All types from `@imago/types`
- Produces:
  - Running Hono API at `localhost:3001`
  - `GET /v1/search`, `GET /v1/search/all`, `POST /v1/generate`, `GET /v1/providers`, `GET /v1/providers/:id`

- [ ] **Step 1: Create apps/api/package.json**

```json
{
  "name": "@imago/api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch dist/index.js",
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@hono/node-server": "^1.11.0",
    "@imago/core": "workspace:*",
    "@imago/providers": "workspace:*",
    "@imago/types": "workspace:*",
    "hono": "^4.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create apps/api/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "lib": ["ES2022"]
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create apps/api/src/bootstrap.ts — wires providers into registry**

```typescript
import { createRegistry, createRouter, type Router, type ProviderRegistry } from '@imago/core'
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
```

- [ ] **Step 4: Create apps/api/src/middleware/auth.ts**

```typescript
import type { Context, Next } from 'hono'

// For V1: accept any non-empty Bearer token (full key management in Task 9)
export async function authMiddleware(c: Context, next: Next): Promise<void> {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    c.res = c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' } }, 401)
    return
  }
  const token = authHeader.slice(7)
  if (!token || token.length < 10) {
    c.res = c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } }, 401)
    return
  }
  await next()
}
```

- [ ] **Step 5: Create apps/api/src/routes/search.ts**

```typescript
import { Hono } from 'hono'
import { getRouter } from '../bootstrap.js'
import type { SearchParams } from '@imago/types'

export const searchRoutes = new Hono()

searchRoutes.get('/', async (c) => {
  const q = c.req.query('q')
  if (!q) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'q parameter is required' } }, 400)
  }

  const providersParam = c.req.query('providers')
  const params: SearchParams = {
    query: q,
    providers: providersParam ? providersParam.split(',').map((s) => s.trim()) : undefined,
    limit: Math.min(Number(c.req.query('limit') ?? 20), 100),
    page: Number(c.req.query('page') ?? 1),
    orientation: c.req.query('orientation') as SearchParams['orientation'],
    color: c.req.query('color'),
  }

  try {
    const router = getRouter()
    const { results, providers, took_ms } = await router.search(params)
    return c.json({ results, total: results.length, page: params.page, providers, took_ms })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return c.json({ error: { code: 'SEARCH_ERROR', message } }, 500)
  }
})

searchRoutes.get('/all', async (c) => {
  const q = c.req.query('q')
  if (!q) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'q parameter is required' } }, 400)
  }

  const params: SearchParams = {
    query: q,
    limit: Math.min(Number(c.req.query('limit') ?? 20), 100),
    page: Number(c.req.query('page') ?? 1),
  }

  try {
    const router = getRouter()
    const { results, providers, took_ms } = await router.search(params)
    return c.json({ results, total: results.length, page: params.page, providers, took_ms })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return c.json({ error: { code: 'SEARCH_ERROR', message } }, 500)
  }
})
```

- [ ] **Step 6: Create apps/api/src/routes/providers.ts**

```typescript
import { Hono } from 'hono'
import { getRegistry } from '../bootstrap.js'

export const providerRoutes = new Hono()

providerRoutes.get('/', async (c) => {
  const registry = getRegistry()
  const providers = await registry.providerInfos()
  return c.json({ providers })
})

providerRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const registry = getRegistry()
  const provider = registry.get(id)
  if (!provider) {
    return c.json({ error: { code: 'NOT_FOUND', message: `Provider '${id}' not found` } }, 404)
  }
  let status: 'healthy' | 'degraded' | 'down' = 'healthy'
  try {
    const healthy = await provider.healthCheck()
    status = healthy ? 'healthy' : 'down'
  } catch {
    status = 'down'
  }
  return c.json({
    id: provider.id,
    name: provider.name,
    category: provider.category,
    capabilities: provider.capabilities,
    rateLimit: provider.rateLimit,
    status,
  })
})
```

- [ ] **Step 7: Create apps/api/src/index.ts — main Hono app**

```typescript
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { searchRoutes } from './routes/search.js'
import { providerRoutes } from './routes/providers.js'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({ origin: '*' }))

app.get('/', (c) => c.json({ name: 'Imago API', version: '0.1.0', docs: '/v1' }))
app.get('/health', (c) => c.json({ status: 'ok' }))

app.route('/v1/search', searchRoutes)
app.route('/v1/providers', providerRoutes)

const port = Number(process.env['PORT'] ?? 3001)
serve({ fetch: app.fetch, port }, () => {
  console.log(`Imago API running at http://localhost:${port}`)
})

export default app
```

- [ ] **Step 8: Create apps/api/vercel.json**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/api/index" }]
}
```

- [ ] **Step 9: Install deps and build**

```bash
pnpm install && cd apps/api && pnpm build
```

Expected: `dist/` created, no TypeScript errors.

- [ ] **Step 10: Smoke test the API locally**

```bash
# In one terminal:
cd apps/api && node dist/index.js
# In another (with a real UNSPLASH_ACCESS_KEY set):
curl "http://localhost:3001/health"
curl -H "Authorization: Bearer test_key_12345" "http://localhost:3001/v1/providers"
```

Expected: `{"status":"ok"}` and list of registered providers.

- [ ] **Step 11: Commit**

```bash
git add apps/api/
git commit -m "feat: add Imago API with Hono.js - search and providers routes"
```

---

## Task 7: Next.js Web App Scaffold (`apps/web`)

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/src/lib/api.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_API_URL` env var pointing to the API
- Produces:
  - Running Next.js app at `localhost:3000`
  - `apiClient` with `search(params): Promise<SearchResponse>` and `getProviders(): Promise<ProvidersResponse>`

- [ ] **Step 1: Create apps/web/package.json**

```json
{
  "name": "@imago/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf .next"
  },
  "dependencies": {
    "@imago/types": "workspace:*",
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create apps/web/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "jsx": "preserve",
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create apps/web/next.config.ts**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'pixabay.com' },
      { protocol: 'https', hostname: '*.openai.com' },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 4: Create apps/web/tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f4ff',
          500: '#6366f1',
          600: '#4f46e5',
          900: '#1e1b4b',
        },
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 5: Create apps/web/postcss.config.js**

```javascript
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

- [ ] **Step 6: Create apps/web/src/app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #09090b;
  --foreground: #fafafa;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: 'Inter', system-ui, sans-serif;
}
```

- [ ] **Step 7: Create apps/web/src/lib/api.ts — typed API client**

```typescript
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
```

- [ ] **Step 8: Create apps/web/src/app/layout.tsx**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Imago — One API. Every image.',
  description: 'Unified image search and generation API across Unsplash, Pexels, DALL-E, and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 9: Create apps/web/src/app/page.tsx — landing page**

```tsx
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <div className="mb-4 inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
          Open beta
        </div>
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-white">
          One API.{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Every image.
          </span>
        </h1>
        <p className="mb-8 text-lg text-zinc-400">
          Imago aggregates Unsplash, Pexels, DALL-E, and more behind a single unified API.
          Search, generate, and route across all providers with one key.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/studio"
            className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-500"
          >
            Open Studio
          </Link>
          <Link
            href="/docs"
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-6 py-3 font-medium text-zinc-300 transition hover:bg-zinc-800"
          >
            View API Docs
          </Link>
        </div>
        <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left font-mono text-sm">
          <p className="text-zinc-500"># Search across all providers</p>
          <p className="text-zinc-300">
            <span className="text-indigo-400">GET</span>{' '}
            <span className="text-green-400">/v1/search/all?q=mountains</span>
          </p>
          <p className="mt-2 text-zinc-500"># Generate with DALL-E</p>
          <p className="text-zinc-300">
            <span className="text-yellow-400">POST</span>{' '}
            <span className="text-green-400">/v1/generate</span>
          </p>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 10: Install deps and verify**

```bash
pnpm install && cd apps/web && pnpm typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 11: Run dev server**

```bash
cd apps/web && pnpm dev
```

Expected: Next.js starts at `localhost:3000`, landing page renders.

- [ ] **Step 12: Commit**

```bash
git add apps/web/
git commit -m "feat: add Imago Studio Next.js app with landing page"
```

---

## Task 8: Studio Search Playground

**Files:**
- Create: `apps/web/src/app/studio/page.tsx`
- Create: `apps/web/src/components/search-bar.tsx`
- Create: `apps/web/src/components/provider-pills.tsx`
- Create: `apps/web/src/components/image-grid.tsx`
- Create: `apps/web/src/components/image-card.tsx`
- Create: `apps/web/src/components/image-modal.tsx`
- Create: `apps/web/src/hooks/use-search.ts`

**Interfaces:**
- Consumes: `apiClient.search()`, `apiClient.getProviders()` from `@/lib/api`
- Produces: Full search playground UI at `/studio`

- [ ] **Step 1: Create apps/web/src/hooks/use-search.ts**

```typescript
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
```

- [ ] **Step 2: Create apps/web/src/components/search-bar.tsx**

```tsx
'use client'
import { useState, type FormEvent } from 'react'

interface SearchBarProps {
  onSearch: (query: string) => void
  loading?: boolean
}

export function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [value, setValue] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (value.trim()) onSearch(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search images across all providers..."
        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Create apps/web/src/components/provider-pills.tsx**

```tsx
'use client'

const PROVIDERS = [
  { id: 'unsplash', label: 'Unsplash', color: 'bg-black border-zinc-700' },
  { id: 'pexels', label: 'Pexels', color: 'bg-emerald-950 border-emerald-800' },
]

interface ProviderPillsProps {
  selected: string[]
  onChange: (selected: string[]) => void
}

export function ProviderPills({ selected, onChange }: ProviderPillsProps) {
  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id]
    onChange(next.length === 0 ? PROVIDERS.map((p) => p.id) : next)
  }

  const allSelected = selected.length === PROVIDERS.length || selected.length === 0

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange([])}
        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
          allSelected
            ? 'border-indigo-500 bg-indigo-950 text-indigo-300'
            : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
        }`}
      >
        All providers
      </button>
      {PROVIDERS.map((provider) => (
        <button
          key={provider.id}
          onClick={() => toggle(provider.id)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
            !allSelected && selected.includes(provider.id)
              ? 'border-indigo-500 bg-indigo-950 text-indigo-300'
              : `${provider.color} text-zinc-400 hover:text-zinc-200`
          }`}
        >
          {provider.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create apps/web/src/components/image-card.tsx**

```tsx
'use client'
import type { ImageResult } from '@imago/types'
import Image from 'next/image'

const SOURCE_COLORS: Record<string, string> = {
  unsplash: 'bg-zinc-800 text-zinc-300',
  pexels: 'bg-emerald-900 text-emerald-300',
  dalle: 'bg-purple-900 text-purple-300',
}

interface ImageCardProps {
  image: ImageResult
  onClick: (image: ImageResult) => void
}

export function ImageCard({ image, onClick }: ImageCardProps) {
  const badgeClass = SOURCE_COLORS[image.source] ?? 'bg-zinc-800 text-zinc-300'

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-lg bg-zinc-900"
      onClick={() => onClick(image)}
    >
      <div className="relative w-full" style={{ paddingBottom: `${(image.height / image.width) * 100}%` }}>
        <Image
          src={image.thumb}
          alt={image.description ?? image.source}
          fill
          className="object-cover transition-transform duration-200 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 translate-y-full bg-gradient-to-t from-black/80 to-transparent p-3 transition-transform duration-200 group-hover:translate-y-0">
        <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${badgeClass}`}>
          {image.source}
        </span>
        {image.author && (
          <p className="mt-1 text-xs text-zinc-300 truncate">{image.author}</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create apps/web/src/components/image-modal.tsx**

```tsx
'use client'
import type { ImageResult } from '@imago/types'
import Image from 'next/image'

interface ImageModalProps {
  image: ImageResult | null
  onClose: () => void
}

export function ImageModal({ image, onClose }: ImageModalProps) {
  if (!image) return null

  function copyUrl() {
    navigator.clipboard.writeText(image!.url)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] max-w-4xl flex-col overflow-hidden rounded-xl bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="relative overflow-hidden" style={{ maxHeight: '70vh' }}>
          <img
            src={image.thumb}
            alt={image.description ?? ''}
            className="w-full object-contain"
          />
        </div>
        <div className="flex items-center justify-between border-t border-zinc-800 p-4">
          <div>
            <p className="text-sm font-medium text-zinc-200">{image.author ?? 'Unknown'}</p>
            <p className="text-xs text-zinc-500">
              {image.width} × {image.height} · {image.source} · {image.license}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyUrl}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700"
            >
              Copy URL
            </button>
            <a
              href={image.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
            >
              Open full res
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create apps/web/src/components/image-grid.tsx**

```tsx
'use client'
import type { ImageResult } from '@imago/types'
import { ImageCard } from './image-card'

interface ImageGridProps {
  images: ImageResult[]
  onImageClick: (image: ImageResult) => void
  loading?: boolean
}

export function ImageGrid({ images, onImageClick, loading }: ImageGridProps) {
  if (loading) {
    return (
      <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="mb-4 animate-pulse rounded-lg bg-zinc-800" style={{ height: `${160 + (i % 3) * 60}px` }} />
        ))}
      </div>
    )
  }

  if (images.length === 0) return null

  return (
    <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
      {images.map((image) => (
        <div key={image.id} className="mb-4 break-inside-avoid">
          <ImageCard image={image} onClick={onImageClick} />
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 7: Create apps/web/src/app/studio/page.tsx**

```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { ImageResult } from '@imago/types'
import { useSearch } from '@/hooks/use-search'
import { SearchBar } from '@/components/search-bar'
import { ProviderPills } from '@/components/provider-pills'
import { ImageGrid } from '@/components/image-grid'
import { ImageModal } from '@/components/image-modal'

export default function StudioPage() {
  const { results, loading, error, providers, took_ms, search } = useSearch()
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null)

  function handleSearch(query: string) {
    const provs = selectedProviders.length > 0 ? selectedProviders : undefined
    search(query, provs)
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="font-mono text-lg font-bold text-white">
            imago<span className="text-indigo-400">.</span>
          </Link>
          <nav className="flex gap-6 text-sm text-zinc-400">
            <Link href="/providers" className="hover:text-white">Providers</Link>
            <Link href="/docs" className="hover:text-white">API</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 space-y-3">
          <SearchBar onSearch={handleSearch} loading={loading} />
          <ProviderPills selected={selectedProviders} onChange={setSelectedProviders} />
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {took_ms !== null && results.length > 0 && (
          <p className="mb-4 text-xs text-zinc-500">
            {results.length} results from{' '}
            <span className="text-zinc-400">{providers.join(', ')}</span>{' '}
            in {took_ms}ms
          </p>
        )}

        <ImageGrid images={results} onImageClick={setSelectedImage} loading={loading} />

        {results.length === 0 && !loading && took_ms === null && (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
            <p className="text-4xl">&#128444;</p>
            <p className="mt-3 text-sm">Search for images across all providers</p>
          </div>
        )}
      </div>

      <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  )
}
```

- [ ] **Step 8: Verify types and run dev**

```bash
cd apps/web && pnpm typecheck && pnpm dev
```

Expected: no type errors, Studio loads at `localhost:3000/studio`.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/
git commit -m "feat: add Imago Studio search playground UI"
```

---

## Task 9: GitHub Repo + Vercel Deploy

**Files:**
- Create: `apps/web/.env.local` (gitignored)
- Create: `apps/api/.env` (gitignored)

**Interfaces:**
- Produces: public GitHub repo + live Vercel deployments for both apps

- [ ] **Step 1: Create GitHub repo**

```bash
gh repo create imago --public --description "One API. Every image. — Unified image search and generation aggregator." --push --source .
```

- [ ] **Step 2: Set up Vercel for apps/web**

```bash
cd apps/web && npx vercel --yes
```

When prompted: link to new project `imago-web`, set root to `apps/web`.

- [ ] **Step 3: Set up Vercel for apps/api**

```bash
cd apps/api && npx vercel --yes
```

When prompted: link to new project `imago-api`, set root to `apps/api`.

- [ ] **Step 4: Add environment variables via Vercel CLI**

```bash
# For api project:
cd apps/api
vercel env add UNSPLASH_ACCESS_KEY production
vercel env add PEXELS_API_KEY production

# For web project:
cd apps/web
vercel env add NEXT_PUBLIC_API_URL production
# Set to: https://imago-api.vercel.app
```

- [ ] **Step 5: Deploy both apps**

```bash
cd apps/api && vercel --prod
cd apps/web && vercel --prod
```

- [ ] **Step 6: Verify live deployments**

```bash
curl "https://imago-api.vercel.app/health"
# Expected: {"status":"ok"}
```

Open `https://imago-web.vercel.app` in browser — landing page should render.

- [ ] **Step 7: Commit any vercel config files**

```bash
git add . && git commit -m "chore: add vercel deployment config"
git push origin main
```

---

## Post-V1 Tasks (Future)

- Task 10: Pixabay + SerpAPI + DALL-E + Stability AI providers
- Task 11: Vercel KV — API key generation, storage, usage tracking
- Task 12: `/studio/generate` — AI image generation playground
- Task 13: `/providers` — live provider status dashboard page
- Task 14: `/docs` — API reference page
- Task 15: Rate limiting middleware using Vercel KV
