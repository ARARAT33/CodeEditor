// Folder scan API — scan all files in a folder at once
// POST /api/folder-scan — scan multiple files for lint + vulnerabilities

import { lintCode } from '@/lib/awecode/linter'
import { scanVulnerabilities } from '@/lib/awecode/vulnerabilities'
import { detectLanguageByFilename } from '@/lib/awecode/languages'
import { createRequestContext, apiSuccess, apiError } from '@/lib/awecode/api-helpers'

export const runtime = 'nodejs'
export const maxDuration = 60

interface FolderScanRequest {
  files: Array<{ path: string; content: string }>
  mode: 'lint' | 'scan' | 'analyze'
}

export async function POST(req: Request): Promise<Response> {
  const ctx = createRequestContext()
  try {
    const body: FolderScanRequest = await req.json()
    const { files, mode } = body

    if (!files || !Array.isArray(files)) {
      return apiError('Missing files array', 400, ctx)
    }

    const results = files.map(file => {
      const language = detectLanguageByFilename(file.path).id
      const lint = lintCode(file.content, language)
      const vulns = scanVulnerabilities(file.content, language)
      return {
        path: file.path,
        language,
        lines: file.content.split('\n').length,
        lint: mode === 'lint' || mode === 'analyze' ? {
          stats: lint.stats,
          problems: lint.problems,
        } : undefined,
        vulnerabilities: mode === 'scan' || mode === 'analyze' ? {
          stats: vulns.stats,
          vulnerabilities: vulns.vulnerabilities,
        } : undefined,
      }
    })

    // Aggregate stats
    const totalErrors = results.reduce((s, r) => s + (r.lint?.stats.errors || 0), 0)
    const totalWarnings = results.reduce((s, r) => s + (r.lint?.stats.warnings || 0), 0)
    const totalCritical = results.reduce((s, r) => s + (r.vulnerabilities?.stats.critical || 0), 0)
    const totalHigh = results.reduce((s, r) => s + (r.vulnerabilities?.stats.high || 0), 0)
    const totalMedium = results.reduce((s, r) => s + (r.vulnerabilities?.stats.medium || 0), 0)
    const totalLow = results.reduce((s, r) => s + (r.vulnerabilities?.stats.low || 0), 0)
    const allVulns = results.reduce((s, r) => s + (r.vulnerabilities?.stats.total || 0), 0)

    // Overall security score
    let score = 100
    score -= totalCritical * 25
    score -= totalHigh * 10
    score -= totalMedium * 4
    score -= totalLow * 1
    score = Math.max(0, Math.min(100, score))

    return apiSuccess({
      filesScanned: files.length,
      results,
      summary: {
        totalErrors,
        totalWarnings,
        totalCritical,
        totalHigh,
        totalMedium,
        totalLow,
        totalVulnerabilities: allVulns,
        securityScore: Math.round(score * 10) / 10,
      },
    }, ctx)
  } catch (e: any) {
    return apiError(e?.message || 'Folder scan failed', 500, ctx)
  }
}
