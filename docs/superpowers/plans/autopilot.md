# Imago — Autopilot Phase 2 Plan

This document outlines the roadmap and steps for extending Imago into a full-scale image aggregation platform (like OpenRouter but for images). 

---

## Core Focus Areas

### 1. Expanded Provider Integrations
We currently have Unsplash and Pexels. We will add:
- **Pixabay** (`@imago/providers/pixabay`) — Free stock images (requires `PIXABAY_API_KEY`).
- **SerpAPI (Google & Bing Images)** (`@imago/providers/serpapi`) — Real-time web crawled images.
- **AI Generators (DALL-E 3 & Stability AI)** (`@imago/providers/generate`) — AI image generation.

### 2. Live API Key Management (Vercel KV)
- Introduce API key storage and lookup in the API middleware.
- Allow users to generate, view, and revoke API keys from the **Imago Studio** dashboard.
- Key prefix: `imago_sk_...`

### 3. Usage & Rate Limiting (Vercel KV / Redis)
- Keep count of requests per API key.
- Track usage window (daily, monthly) and block calls exceeding constraints.
- Expose usage metrics via `/v1/usage` endpoint.

---

## Execution Checklist

### Task 1: Pixabay Integration
- [ ] Create `packages/providers/src/pixabay.ts`.
- [ ] Implement `ImageProvider` adapter mapping Pixabay's response shape.
- [ ] Register `PixabayProvider` in `apps/api/src/bootstrap.ts`.
- [ ] Verify `dist/` builds with zero errors.

### Task 2: AI Generation Router
- [ ] Create `packages/providers/src/dalle.ts` using OpenAI's DALL-E 3 API.
- [ ] Create `packages/providers/src/stability.ts` using Stable Diffusion XL.
- [ ] Support `generate()` method on the Router.
- [ ] Update `/v1/generate` Hono POST endpoint.

### Task 3: Key Management & Storage (Vercel KV)
- [ ] Connect Vercel KV env vars (`KV_REST_API_URL`, `KV_REST_API_TOKEN`).
- [ ] Implement database client to create/validate API keys.
- [ ] Update `authMiddleware` to lookup keys against Vercel KV instead of static verification.
- [ ] Implement key generator UI in `apps/web/src/app/keys/page.tsx`.

### Task 4: AI Generation Playground UI
- [ ] Create `apps/web/src/app/generate/page.tsx`.
- [ ] Add prompt input, size selector, and number of images choice.
- [ ] Display AI generated images in a grid with download and save options.

---

## Future Enhancements
- **Smart Routing:** Route to providers based on latency or cost.
- **Image Metrics:** Expose performance latency per provider.
- **SDK Release:** Package `@imago/js` SDK.
