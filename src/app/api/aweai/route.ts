// AWEAI — AI Agent API for AWECode
// Provides REST API endpoints that AI agents can call to:
// - Analyze code (lint + vulnerabilities + refactoring opportunities in one call)
// - Lint code
// - Scan vulnerabilities
// - Get refactoring suggestions
// - Apply corrections
// - Search function library
// - Get supported languages
// - Get editor capabilities

import { lintCode, LINT_RULE_COUNT } from '@/lib/awecode/linter'
import { scanVulnerabilities, VULN_RULE_COUNT } from '@/lib/awecode/vulnerabilities'
import { refactorCode, correctCode } from '@/lib/awecode/refactor'
import { LANGUAGES, LANGUAGE_COUNT } from '@/lib/awecode/languages'
import { getAllFunctions, searchFunctions, getFunctionById, getFunctionStats } from '@/lib/awecode/functions'
import {
  createRequestContext,
  parseJsonBody,
  apiSuccess,
  apiError,
  resolveLanguage,
} from '@/lib/awecode/api-helpers'

export const runtime = 'nodejs'

export type { AWEAIResponse } from '@/lib/awecode/api-helpers'

// GET /api/aweai — Capabilities / status
export async function GET(req: Request): Promise<Response> {
  const ctx = createRequestContext()

  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'capabilities'

  if (action === 'capabilities') {
    return apiSuccess({
      name: 'AWEAI',
      version: '1.0.0',
      description: 'AI Agent API for AWECode — provides code analysis, linting, vulnerability scanning, refactoring, and a function library.',
      endpoints: [
        { method: 'GET', path: '/api/aweai', action: 'capabilities', description: 'List API capabilities' },
        { method: 'GET', path: '/api/aweai?action=languages', description: 'List supported programming languages' },
        { method: 'GET', path: '/api/aweai?action=functions', description: 'List all available utility functions' },
        { method: 'GET', path: '/api/aweai?action=function&id=<id>', description: 'Get a specific function by ID' },
        { method: 'POST', path: '/api/aweai/analyze', description: 'Full analysis: lint + vulnerabilities + refactor opportunities' },
        { method: 'POST', path: '/api/aweai/lint', description: 'Lint code (offline)' },
        { method: 'POST', path: '/api/aweai/scan', description: 'Scan vulnerabilities (offline)' },
        { method: 'POST', path: '/api/aweai/refactor', description: 'Get refactoring suggestions or auto-apply' },
      ],
      stats: {
        languagesSupported: LANGUAGE_COUNT,
        lintRules: LINT_RULE_COUNT,
        vulnerabilityRules: VULN_RULE_COUNT,
        functions: getFunctionStats().total,
        implementedFunctions: getFunctionStats().implemented,
      },
      features: [
        'offline-lint',
        'offline-vulnerability-scan',
        'offline-refactor-suggestions',
        'auto-correction',
        'function-library',
        '150+-languages',
        'cwe-mapping',
        'owasp-mapping',
        'security-score',
      ],
    }, ctx)
  }

  if (action === 'languages') {
    return apiSuccess({
      count: LANGUAGE_COUNT,
      categories: [...new Set(LANGUAGES.map(l => l.category))],
      languages: LANGUAGES.map(l => ({
        id: l.id,
        label: l.label,
        extensions: l.extensions,
        category: l.category,
        hasLinter: l.hasLinter,
        hasVulnScan: l.hasVulnScan,
      })),
    }, ctx)
  }

  if (action === 'functions') {
    const q = url.searchParams.get('q')
    if (q) {
      return apiSuccess({
        query: q,
        results: searchFunctions(q).slice(0, 50),
      }, ctx)
    }
    return apiSuccess({
      count: getFunctionStats().total,
      stats: getFunctionStats(),
      functions: getAllFunctions().slice(0, 100),
    }, ctx)
  }

  if (action === 'function') {
    const id = url.searchParams.get('id')
    if (!id) return apiError('Missing "id" parameter', 400, ctx)
    const fn = getFunctionById(id)
    if (!fn) return apiError(`Function with id "${id}" not found`, 404, ctx)
    return apiSuccess(fn, ctx)
  }

  return apiError(`Unknown action: ${action}`, 400, ctx)
}

// POST /api/aweai — Combined analysis
export async function POST(req: Request): Promise<Response> {
  const ctx = createRequestContext()

  const parsed = await parseJsonBody(req, ctx)
  if ('error' in parsed) return parsed.error
  const body = parsed.body

  const { code, language, filename, action = 'analyze' } = body

  if (!code || typeof code !== 'string') {
    return apiError('Missing "code" field', 400, ctx)
  }

  const lang = resolveLanguage(language, filename)

  if (action === 'analyze') {
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

  if (action === 'lint') {
    return apiSuccess(lintCode(code, lang), ctx)
  }

  if (action === 'scan') {
    return apiSuccess(scanVulnerabilities(code, lang), ctx)
  }

  if (action === 'refactor') {
    const apply = body.apply === true
    return apiSuccess(refactorCode(code, lang, apply), ctx)
  }

  if (action === 'correct') {
    return apiSuccess(correctCode(code, lang), ctx)
  }

  return apiError(`Unknown action: ${action}`, 400, ctx)
}
