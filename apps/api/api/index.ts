import app from '../dist/index.js'
import { handle } from 'hono/vercel'

app.all('*', (c) => {
  return c.json({
    path: c.req.path,
    url: c.req.url,
    method: c.req.method,
    headers: Object.fromEntries(c.req.raw.headers.entries())
  })
})

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
export const PATCH = handle(app)
export const OPTIONS = handle(app)
export default handle(app)
