// POST /api/aweai/refactor — Refactor code (suggestions or apply)

import { refactorCode, correctCode } from '@/lib/awecode/refactor'
import { detectLanguageByFilename } from '@/lib/awecode/languages'

export const runtime = 'nodejs'

export async function POST(req: Request): Promise<Response> {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  let body: any
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { code, language, filename, apply = false, mode = 'refactor' } = body
  if (!code || typeof code !== 'string') {
    return Response.json({ ok: false, error: 'Missing "code" field' }, { status: 400 })
  }

  let lang = language
  if (!lang && filename) lang = detectLanguageByFilename(filename).id
  if (!lang) lang = 'javascript'

  try {
    const result = mode === 'correct' ? correctCode(code, lang) : refactorCode(code, lang, apply)

    return Response.json({
      ok: true,
      data: result,
      meta: { version: '1.0.0', durationMs: Date.now() - startTime, requestId },
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Refactor failed'
    return Response.json(
      { ok: false, error: message, meta: { version: '1.0.0', durationMs: Date.now() - startTime, requestId } },
      { status: 500 },
    )
  }
}
