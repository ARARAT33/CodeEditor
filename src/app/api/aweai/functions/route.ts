// GET /api/aweai/functions — Browse the function library

import { getAllFunctions, searchFunctions, getFunctionById, getFunctionStats, getFunctionCategories } from '@/lib/awecode/functions'

export const runtime = 'nodejs'

export async function GET(req: Request): Promise<Response> {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    const url = new URL(req.url)

    const id = url.searchParams.get('id')
    const q = url.searchParams.get('q')
    const category = url.searchParams.get('category')
    const limit = parseInt(url.searchParams.get('limit') || '100')

    if (id) {
      const fn = getFunctionById(id)
      if (!fn) return Response.json({ ok: false, error: 'Function not found' }, { status: 404 })
      return Response.json({ ok: true, data: fn, meta: { version: '1.0.0', durationMs: Date.now() - startTime, requestId } })
    }

    if (q) {
      return Response.json({
        ok: true,
        data: { query: q, results: searchFunctions(q) },
        meta: { version: '1.0.0', durationMs: Date.now() - startTime, requestId },
      })
    }

    if (url.searchParams.get('categories')) {
      return Response.json({
        ok: true,
        data: { categories: getFunctionCategories() },
        meta: { version: '1.0.0', durationMs: Date.now() - startTime, requestId },
      })
    }

    if (url.searchParams.get('stats')) {
      return Response.json({
        ok: true,
        data: getFunctionStats(),
        meta: { version: '1.0.0', durationMs: Date.now() - startTime, requestId },
      })
    }

    let fns = getAllFunctions()
    if (category) fns = fns.filter(f => f.category === category)

    return Response.json({
      ok: true,
      data: {
        count: fns.length,
        stats: getFunctionStats(),
        functions: fns.slice(0, limit),
      },
      meta: { version: '1.0.0', durationMs: Date.now() - startTime, requestId },
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to fetch functions'
    return Response.json(
      { ok: false, error: message, meta: { version: '1.0.0', durationMs: Date.now() - startTime, requestId } },
      { status: 500 },
    )
  }
}
