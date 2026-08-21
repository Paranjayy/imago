import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authMiddleware } from './middleware/auth.js'
import { searchRoutes } from './routes/search.js'
import { providerRoutes } from './routes/providers.js'
import { getRouter } from './bootstrap.js'
import type { GenerateParams } from '@imago/types'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({ origin: '*' }))

// Public routes (no auth)
app.get('/', (c) => c.json({ name: 'Imago API', version: '0.1.0', docs: '/v1' }))
app.get('/health', (c) => c.json({ status: 'ok' }))

// V1 routes — all require auth
const v1 = new Hono()
v1.use('*', authMiddleware)

v1.route('/search', searchRoutes)
v1.route('/providers', providerRoutes)

v1.post('/generate', async (c) => {
  let body: GenerateParams
  try {
    body = await c.req.json<GenerateParams>()
  } catch {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } }, 400)
  }

  if (!body.prompt) {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'prompt is required' } }, 400)
  }

  try {
    const router = getRouter()
    const { results, providers, took_ms } = await router.generate(body)
    return c.json({ results, prompt: body.prompt, providers, took_ms })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return c.json({ error: { code: 'GENERATE_ERROR', message } }, 500)
  }
})

app.route('/v1', v1)

const port = Number(process.env['PORT'] ?? 3001)
serve({ fetch: app.fetch, port }, () => {
  console.log(`Imago API running at http://localhost:${port}`)
})

export default app
