// POST /api/aweai/lint — Lint code

import { lintCode } from '@/lib/awecode/linter'
import {
  createRequestContext,
  parseJsonBody,
  apiSuccess,
  apiError,
  resolveLanguage,
} from '@/lib/awecode/api-helpers'

export const runtime = 'nodejs'

export async function POST(req: Request): Promise<Response> {
  const ctx = createRequestContext()

  const parsed = await parseJsonBody(req, ctx)
  if ('error' in parsed) return parsed.error
  const { code, language, filename } = parsed.body

  if (!code || typeof code !== 'string') {
    return apiError('Missing "code" field', 400, ctx)
  }

  const lang = resolveLanguage(language, filename)

  return apiSuccess(lintCode(code, lang), ctx)
}
