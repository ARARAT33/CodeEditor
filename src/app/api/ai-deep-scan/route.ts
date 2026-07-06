// AI Deep Vulnerability Scan — uses AI to find subtle security issues
// that the regex-based scanner can't catch (logic bugs, auth flaws, race conditions)
// POST /api/ai-deep-scan

import { scanVulnerabilities } from '@/lib/awecode/vulnerabilities'
import { createRequestContext, apiSuccess, apiError, resolveLanguage } from '@/lib/awecode/api-helpers'
import { chatCompletion, type AIProvider } from '@/lib/awecode/ai-providers'

export const runtime = 'nodejs'
export const maxDuration = 120

function buildScanMessages(code: string, lang: string, filename?: string) {
  return [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: `Analyze this ${lang} code from ${filename} for security vulnerabilities:\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\nReturn ONLY a JSON array of findings.`,
    },
  ]
}

const SYSTEM_PROMPT = `You are a world-class security auditor. The user provides code and you must find ALL security vulnerabilities — including subtle ones that simple regex scanners miss.

Focus on:
1. Business logic flaws (e.g., password reset token reuse, IDOR, race conditions)
2. Authentication/authorization issues (e.g., missing checks, JWT validation flaws)
3. Cryptographic misuse (e.g., IV reuse, weak key derivation, timing attacks)
4. Injection beyond simple SQL (e.g., NoSQL, LDAP, OS command, template, log)
5. Memory safety (use-after-free, buffer overflows in C/C++)
6. Race conditions and TOCTOU bugs
7. SSRF, XXE, deserialization in less-obvious patterns
8. Information disclosure (error messages, headers, comments)
9. Session management flaws
10. CSRF, XSS in less-obvious sinks (e.g., DOM-based, stored)

For EACH finding, return JSON:
{
  "title": "Short name",
  "severity": "critical|high|medium|low",
  "confidence": "high|medium|low",
  "cwe": "CWE-XXX",
  "line": <number>,
  "description": "What's wrong",
  "impact": "What an attacker can do",
  "fix": "Specific code-level fix",
  "evidence": "The suspicious code snippet"
}

Return a JSON array of findings. If no issues found, return [].
Only return real issues — do not invent false positives. If unsure, mark confidence as "low".

Output ONLY a JSON array, no other text. No markdown fences.`

export async function POST(req: Request): Promise<Response> {
  const ctx = createRequestContext()
  try {
    const body = await req.json()
    const { code, language, filename, provider = 'z-ai', apiKey, model } = body

    if (!code) return apiError('Missing code', 400, ctx)

    // First, run the offline regex scan
    const lang = resolveLanguage(language, filename)
    const offlineScan = scanVulnerabilities(code, lang)

    // Then, run the AI deep scan
    let aiFindings: any[] = []
    let aiError: string | null = null

    try {
      const aiResponse = await chatCompletion(provider as AIProvider, buildScanMessages(code, lang, filename), { apiKey, model })

      // Parse JSON from response (handle markdown fences)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        aiFindings = JSON.parse(jsonMatch[0])
      }
    } catch (e: any) {
      aiError = e.message
    }

    // Combine offline + AI findings
    const combined = [
      ...offlineScan.vulnerabilities.map(v => ({
        source: 'offline' as const,
        title: v.name,
        severity: v.severity,
        confidence: v.confidence,
        cwe: v.cwe,
        line: v.line,
        description: v.description,
        impact: v.impact,
        fix: v.recommendation,
        evidence: v.evidence,
      })),
      ...aiFindings.map((f: any) => ({
        source: 'ai' as const,
        ...f,
      })),
    ]

    // Sort by severity
    const sevOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
    combined.sort((a: any, b: any) => (sevOrder[a.severity as keyof typeof sevOrder] ?? 5) - (sevOrder[b.severity as keyof typeof sevOrder] ?? 5) || (a.line || 0) - (b.line || 0))

    return apiSuccess({
      offlineStats: offlineScan.stats,
      aiFindingsCount: aiFindings.length,
      aiError,
      combined,
      summary: {
        totalFindings: combined.length,
        critical: combined.filter((f: any) => f.severity === 'critical').length,
        high: combined.filter((f: any) => f.severity === 'high').length,
        medium: combined.filter((f: any) => f.severity === 'medium').length,
        low: combined.filter((f: any) => f.severity === 'low').length,
        offlineOnly: offlineScan.stats.total,
        aiOnly: aiFindings.length,
      },
    }, ctx, { provider })
  } catch (e: any) {
    return apiError(e?.message || 'Deep scan failed', 500, ctx)
  }
}
