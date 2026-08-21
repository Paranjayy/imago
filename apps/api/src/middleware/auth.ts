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
