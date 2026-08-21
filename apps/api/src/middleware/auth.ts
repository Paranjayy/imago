import type { Context, Next } from 'hono'

// For V1: accept any non-empty Bearer token (full key management in Task 9)
export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' } }, 401)
  }
  const token = authHeader.slice(7)
  if (!token || token.length < 10) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } }, 401)
  }
  await next()
}
