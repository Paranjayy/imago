# Imago — Design Spec
**Date:** 2026-08-21
**Tagline:** One API. Every image.

---

## Overview

Imago is an OpenRouter-style aggregator for image search and generation. It exposes a single unified API and a web playground (Imago Studio) that routes queries across stock photo providers, search engine results, and AI generation backends. Developers get one API key and one endpoint; users get one search interface across all image sources.

---

## Project Identity

- **Product name:** Imago
- **Repo name:** `imago`
- **API product:** Imago API
- **Web product:** Imago Studio
- **Tagline:** One API. Every image.

---

## Architecture

### Monorepo Layout

```
imago/
├── apps/
│   ├── web/          # Next.js 14 App Router — Imago Studio
│   └── api/          # Hono.js — Imago API (Vercel Edge Functions)
├── packages/
│   ├── providers/    # All provider integrations
│   ├── core/         # Router, normalizer, rate limiter
│   └── types/        # Shared TypeScript types
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| API server | Hono.js (edge-compatible) |
| Web app | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| UI | Tailwind CSS + shadcn/ui |
| Deployment | Vercel (both apps) |
| Database | Vercel KV (Redis) — API keys, usage stats |

---

## Providers (V1)

### Stock Photos
- **Unsplash** — `@imago/providers/unsplash` — free tier: 50 req/hr
- **Pexels** — `@imago/providers/pexels` — free, 200 req/hr
- **Pixabay** — `@imago/providers/pixabay` — free, 100 req/min

### Search Engine Results
- **SerpAPI** — `@imago/providers/serpapi` — Google Images + Bing Images via one integration

### AI Generation
- **OpenAI DALL-E 3** — `@imago/providers/dalle` — generates on prompt
- **Stability AI** — `@imago/providers/stability` — Stable Diffusion XL

---

## Core Data Types (`packages/types`)

```ts
interface SearchParams {
  query: string
  providers?: string[]       // defaults to all search providers
  limit?: number             // default 20, max 100
  page?: number
  orientation?: 'landscape' | 'portrait' | 'square'
  color?: string
}

interface GenerateParams {
  prompt: string
  providers?: string[]       // defaults to ['dalle']
  count?: number             // default 1, max 4
  size?: '256x256' | '512x512' | '1024x1024'
}

interface ImageResult {
  id: string
  url: string                // full resolution
  thumb: string              // thumbnail URL
  width: number
  height: number
  source: string             // provider id e.g. 'unsplash'
  author?: string
  authorUrl?: string
  license: 'free' | 'creative-commons' | 'commercial' | 'ai-generated'
  description?: string
  tags?: string[]
  metadata: Record<string, unknown>  // provider-specific extras
}

interface Provider {
  id: string
  name: string
  category: 'stock' | 'search' | 'generation'
  capabilities: ('search' | 'generate')[]
  rateLimit: { requests: number; window: string }
  status: 'healthy' | 'degraded' | 'down'
}
```

---

## Provider Interface (`packages/providers`)

Every provider implements:

```ts
interface ImageProvider {
  readonly id: string
  readonly name: string
  readonly category: 'stock' | 'search' | 'generation'
  readonly capabilities: ('search' | 'generate')[]

  search(params: SearchParams): Promise<ImageResult[]>
  generate?(params: GenerateParams): Promise<ImageResult[]>
  healthCheck(): Promise<boolean>
}
```

Provider registry maps `id -> ImageProvider`. Core router selects providers, fans out in parallel, merges + deduplicates results.

---

## API Design (`apps/api`)

### Base URL
`https://api.imago.dev/v1` (production)
`http://localhost:3001/v1` (local)

### Authentication
All endpoints require `Authorization: Bearer <api_key>` header.
API keys are prefixed: `imago_sk_...`

### Endpoints

```
GET  /v1/search
     ?q=string (required)
     &providers=unsplash,pexels (optional, comma-separated)
     &limit=20
     &page=1
     &orientation=landscape|portrait|square
     &color=hex

GET  /v1/search/all
     ?q=string
     &limit=20
     # fans out to ALL search providers in parallel

POST /v1/generate
     { prompt: string, providers?: string[], count?: number, size?: string }

GET  /v1/providers
     # returns list of all providers with status

GET  /v1/providers/:id
     # single provider info + live health status

GET  /v1/usage
     # current API key usage stats
```

### Response Shape

```json
{
  "results": [ImageResult],
  "total": 847,
  "page": 1,
  "providers": ["unsplash", "pexels"],
  "took_ms": 312
}
```

### Error Shape

```json
{
  "error": {
    "code": "PROVIDER_ERROR",
    "message": "Unsplash returned 429",
    "provider": "unsplash"
  }
}
```

---

## Core Router (`packages/core`)

Responsibilities:
1. **Provider selection** — parse requested providers, fall back to defaults
2. **Fan-out** — call providers in parallel using `Promise.allSettled`
3. **Result normalization** — each provider adapter normalizes to `ImageResult`
4. **Deduplication** — deduplicate by URL across providers
5. **Merge + sort** — interleave results (round-robin by provider or by relevance score)
6. **Rate limiting** — per-API-key limits tracked in Vercel KV
7. **Error isolation** — one provider failing doesn't kill the entire request

---

## Web App — Imago Studio (`apps/web`)

### Pages

| Route | Description |
|---|---|
| `/` | Landing page — hero, provider logos, code example |
| `/studio` | Search playground — main product UI |
| `/generate` | AI generation playground |
| `/providers` | Provider status dashboard |
| `/keys` | API key management |
| `/docs` | API reference + guides |

### Studio (Search Playground)

- Search bar with query input
- Provider filter pills (toggle individual providers on/off)
- Masonry image grid — lazy loaded, infinite scroll
- Click image: modal with full res, copy URL, copy embed, download, open source
- Provider badge on each image showing source
- Result metadata (dimensions, license, author)

### Design Language

- Dark-first theme (like OpenRouter)
- Monospace accents for code/API elements
- Clean, minimal — lets images be the hero
- Subtle provider color coding

---

## Deployment

### Vercel Projects

| App | Vercel Project | Domain |
|---|---|---|
| `apps/web` | `imago-web` | `imago.vercel.app` |
| `apps/api` | `imago-api` | `imago-api.vercel.app` |

Both apps deploy automatically on push to `main`.

### Environment Variables

**API app:**
- `UNSPLASH_ACCESS_KEY`
- `PEXELS_API_KEY`
- `PIXABAY_API_KEY`
- `SERPAPI_KEY`
- `OPENAI_API_KEY`
- `STABILITY_API_KEY`
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` (Vercel KV)

**Web app:**
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL`

---

## V1 Milestones

1. Monorepo scaffold + CI
2. `packages/types` — all shared types
3. `packages/providers` — Unsplash + Pexels adapters
4. `packages/core` — router, normalizer
5. `apps/api` — Hono server, `/v1/search`, `/v1/providers`
6. `apps/web` — landing + Studio playground
7. Add remaining providers (Pixabay, SerpAPI, DALL-E, Stability)
8. API key auth + usage tracking (Vercel KV)
9. Deploy both apps to Vercel
10. GitHub repo public

---

## Future Verticals (Post-V1)

- **Webhooks** — subscribe to image events
- **Collections** — save + curate image sets
- **Image analysis** — tag, describe, classify via vision models
- **Smart routing** — route to cheapest/fastest provider based on query type
- **SDK packages** — `@imago/js`, `@imago/python`
- **Usage billing** — credits system like OpenRouter
- **Batch API** — async bulk search jobs
