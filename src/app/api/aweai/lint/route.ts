// POST /api/aweai/lint — Lint code

import { lintCode } from '@/lib/awecode/linter'
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

  const { code, language, filename } = body
  if (!code || typeof code !== 'string') {
    return Response.json({ ok: false, error: 'Missing "code" field' }, { status: 400 })
  }

  let lang = language
  if (!lang && filename) lang = detectLanguageByFilename(filename).id
  if (!lang) lang = 'javascript'

  try {
    const result = lintCode(code, lang)

    return Response.json({
      ok: true,
      data: result,
      meta: { version: '1.0.0', durationMs: Date.now() - startTime, requestId },
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Lint failed'
    return Response.json(
      { ok: false, error: message, meta: { version: '1.0.0', durationMs: Date.now() - startTime, requestId } },
      { status: 500 },
    )
  }
}
