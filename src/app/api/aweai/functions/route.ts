// GET /api/aweai/functions — Browse the function library

import { getAllFunctions, searchFunctions, getFunctionById, getFunctionStats, getFunctionCategories } from '@/lib/awecode/functions'
import { createRequestContext, apiSuccess, apiError } from '@/lib/awecode/api-helpers'

export const runtime = 'nodejs'

export async function GET(req: Request): Promise<Response> {
  const ctx = createRequestContext()
  const url = new URL(req.url)

  const id = url.searchParams.get('id')
  const q = url.searchParams.get('q')
  const category = url.searchParams.get('category')
  const limit = parseInt(url.searchParams.get('limit') || '100')

  if (id) {
    const fn = getFunctionById(id)
    if (!fn) return apiError('Function not found', 404, ctx)
    return apiSuccess(fn, ctx)
  }

  if (q) {
    return apiSuccess({ query: q, results: searchFunctions(q) }, ctx)
  }

  if (url.searchParams.get('categories')) {
    return apiSuccess({ categories: getFunctionCategories() }, ctx)
  }

  if (url.searchParams.get('stats')) {
    return apiSuccess(getFunctionStats(), ctx)
  }

  let fns = getAllFunctions()
  if (category) fns = fns.filter(f => f.category === category)

  return apiSuccess({
    count: fns.length,
    stats: getFunctionStats(),
    functions: fns.slice(0, limit),
  }, ctx)
}
