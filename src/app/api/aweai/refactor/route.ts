// POST /api/aweai/refactor — Refactor code (suggestions or apply)

import { refactorCode, correctCode } from '@/lib/awecode/refactor'
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
  const { code, language, filename, apply = false, mode = 'refactor' } = parsed.body

  if (!code || typeof code !== 'string') {
    return apiError('Missing "code" field', 400, ctx)
  }

  const lang = resolveLanguage(language, filename)

  const result = mode === 'correct' ? correctCode(code, lang) : refactorCode(code, lang, apply)

  return apiSuccess(result, ctx)
}
