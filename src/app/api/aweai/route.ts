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
import { refactorCode, correctCode, findRefactorOpportunities } from '@/lib/awecode/refactor'
import { LANGUAGES, LANGUAGE_COUNT, detectLanguageByFilename, getFunctionStats } from '@/lib/awecode/languages'
import { getAllFunctions, searchFunctions, getFunctionById } from '@/lib/awecode/functions'

export const runtime = 'nodejs'

export interface AWEAIResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
  meta?: {
    version: string
    durationMs: number
    requestId: string
  }
}

function makeResponse<T>(data: T, requestId: string, startTime: number): Response {
  const body: AWEAIResponse<T> = {
    ok: true,
    data,
    meta: {
      version: '1.0.0',
      durationMs: Date.now() - startTime,
      requestId,
    },
  }
  return Response.json(body)
}

function makeError(message: string, status = 400, requestId: string, startTime: number): Response {
  const body: AWEAIResponse = {
    ok: false,
    error: message,
    meta: {
      version: '1.0.0',
      durationMs: Date.now() - startTime,
      requestId,
    },
  }
  return Response.json(body, { status })
}

// GET /api/aweai — Capabilities / status
export async function GET(req: Request): Promise<Response> {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'capabilities'

  if (action === 'capabilities') {
    return makeResponse({
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
    }, requestId, startTime)
  }

  if (action === 'languages') {
    return makeResponse({
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
    }, requestId, startTime)
  }

  if (action === 'functions') {
    const q = url.searchParams.get('q')
    if (q) {
      return makeResponse({
        query: q,
        results: searchFunctions(q).slice(0, 50),
      }, requestId, startTime)
    }
    return makeResponse({
      count: getFunctionStats().total,
      stats: getFunctionStats(),
      functions: getAllFunctions().slice(0, 100),
    }, requestId, startTime)
  }

  if (action === 'function') {
    const id = url.searchParams.get('id')
    if (!id) return makeError('Missing "id" parameter', 400, requestId, startTime)
    const fn = getFunctionById(id)
    if (!fn) return makeError(`Function with id "${id}" not found`, 404, requestId, startTime)
    return makeResponse(fn, requestId, startTime)
  }

  return makeError(`Unknown action: ${action}`, 400, requestId, startTime)
}

// POST /api/aweai — Combined analysis
export async function POST(req: Request): Promise<Response> {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  let body: any
  try {
    body = await req.json()
  } catch {
    return makeError('Invalid JSON body', 400, requestId, startTime)
  }

  const { code, language, filename, action = 'analyze' } = body

  if (!code || typeof code !== 'string') {
    return makeError('Missing "code" field', 400, requestId, startTime)
  }

  // Determine language
  let lang = language
  if (!lang && filename) {
    lang = detectLanguageByFilename(filename).id
  }
  if (!lang) {
    lang = 'javascript'
  }

  if (action === 'analyze') {
    const lint = lintCode(code, lang)
    const vulns = scanVulnerabilities(code, lang)
    const refactor = refactorCode(code, lang, false)
    const corrections = correctCode(code, lang)

    return makeResponse({
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
    }, requestId, startTime)
  }

  if (action === 'lint') {
    return makeResponse(lintCode(code, lang), requestId, startTime)
  }

  if (action === 'scan') {
    return makeResponse(scanVulnerabilities(code, lang), requestId, startTime)
  }

  if (action === 'refactor') {
    const apply = body.apply === true
    return makeResponse(refactorCode(code, lang, apply), requestId, startTime)
  }

  if (action === 'correct') {
    return makeResponse(correctCode(code, lang), requestId, startTime)
  }

  return makeError(`Unknown action: ${action}`, 400, requestId, startTime)
}
