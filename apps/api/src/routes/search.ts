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
