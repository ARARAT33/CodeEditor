// POST /api/aweai/analyze — Full code analysis (lint + vulns + refactor + corrections)

import { lintCode } from '@/lib/awecode/linter'
import { scanVulnerabilities } from '@/lib/awecode/vulnerabilities'
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
  const { code, language, filename } = parsed.body

  if (!code || typeof code !== 'string') {
    return apiError('Missing "code" field', 400, ctx)
  }

  const lang = resolveLanguage(language, filename)

  const lint = lintCode(code, lang)
  const vulns = scanVulnerabilities(code, lang)
  const refactor = refactorCode(code, lang, false)
  const corrections = correctCode(code, lang)

  return apiSuccess({
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
  }, ctx)
}
