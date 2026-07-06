// POST /api/aweai/analyze — Full code analysis (lint + vulns + refactor + corrections)

import { lintCode } from '@/lib/awecode/linter'
import { scanVulnerabilities } from '@/lib/awecode/vulnerabilities'
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

  const { code, language, filename } = body
  if (!code || typeof code !== 'string') {
    return Response.json({ ok: false, error: 'Missing "code" field' }, { status: 400 })
  }

  let lang = language
  if (!lang && filename) lang = detectLanguageByFilename(filename).id
  if (!lang) lang = 'javascript'

  try {
    const lint = lintCode(code, lang)
    const vulns = scanVulnerabilities(code, lang)
    const refactor = refactorCode(code, lang, false)
    const corrections = correctCode(code, lang)

    return Response.json({
      ok: true,
      data: {
        language: lang,
        lines: code.split('\n').length,
        characters: code.length,
        lint,
        vulnerabilities: vulns,
        refactoring: refactor,
        corrections,
        summary: {
          errors: lint.stats.errors,
          warnings: lint.stats.warnings,
          criticalVulns: vulns.stats.critical,
          securityScore: vulns.stats.score,
          refactorOpportunities: refactor.stats.total,
          autoFixable: corrections.appliedCount,
        },
      },
      meta: {
        version: '1.0.0',
        durationMs: Date.now() - startTime,
        requestId,
      },
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Analysis failed'
    return Response.json(
      { ok: false, error: message, meta: { version: '1.0.0', durationMs: Date.now() - startTime, requestId } },
      { status: 500 },
    )
  }
}
