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
