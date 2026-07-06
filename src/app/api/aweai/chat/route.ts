// AWEAI Chat API — AI agent with tool-calling capabilities
// Supports z-ai-web-dev-sdk (default), OpenAI, and Anthropic providers
// The agent can call AWEAI tools (analyze, lint, scan, refactor) to do real work

import { lintCode } from '@/lib/awecode/linter'
import { scanVulnerabilities } from '@/lib/awecode/vulnerabilities'
import { refactorCode, correctCode } from '@/lib/awecode/refactor'
import { detectLanguageByFilename } from '@/lib/awecode/languages'
import { searchFunctions } from '@/lib/awecode/functions'
import { createRequestContext, apiSuccess, apiError } from '@/lib/awecode/api-helpers'
import { chatCompletion, type AIProvider } from '@/lib/awecode/ai-providers'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: any[]
  tool_call_id?: string
  name?: string
}

interface ChatRequest {
  messages: ChatMessage[]
  provider?: 'z-ai' | 'openai' | 'anthropic'
  apiKey?: string
  model?: string
  context?: {
    filename?: string
    language?: string
    code?: string
    selection?: string
    cursorLine?: number
    openFiles?: string[]
  }
}

const SYSTEM_PROMPT = `You are AWEAI, the AI assistant built into AWECode — a powerful offline code editor.
You help the user write, understand, and improve their code.

You have access to these tools via the AWEAI API (call them by emitting a JSON tool-call block):

1. analyze — Run lint + vulnerability scan + refactor analysis on the current code
2. lint — Run the offline linter on the current code
3. scan — Scan for security vulnerabilities
4. refactor — Get refactoring suggestions
5. correct — Auto-fix common issues
6. search_functions — Search the 1000+ utility function library

To call a tool, emit a JSON block in your response wrapped in <tool_call> tags:
<tool_call>
{"tool": "analyze", "args": {"code": "...", "language": "..."}}
</tool_call>

When the user asks about issues, call the "analyze" tool first.
When the user asks for utility functions, call "search_functions".
When you suggest code, ask if the user wants you to apply it (just suggest; the UI handles application).
When you've used a tool, summarize the findings concisely with file:line references.

Always be:
- Concise (use bullet points)
- Technical (assume the user is a developer)
- Honest (if you don't know, say so)
- Safe (never suggest disabling security controls without explaining the risk)

Format code in fenced blocks with language. Use markdown.`

// ---------- Tool implementations ----------

async function callTool(tool: string, args: any, context?: any): Promise<string> {
  const code = args.code || context?.code || ''
  const language = args.language || context?.language || (context?.filename ? detectLanguageByFilename(context.filename).id : 'javascript')

  switch (tool) {
    case 'analyze': {
      const lint = lintCode(code, language)
      const vulns = scanVulnerabilities(code, language)
      const refactor = refactorCode(code, language, false)
      const corrections = correctCode(code, language)
      return JSON.stringify({
        summary: {
          errors: lint.stats.errors,
          warnings: lint.stats.warnings,
          criticalVulns: vulns.stats.critical,
          highVulns: vulns.stats.high,
          securityScore: vulns.stats.score,
          refactorOpportunities: refactor.stats.total,
          autoFixable: corrections.appliedCount,
        },
        lint: lint.problems.slice(0, 10),
        vulnerabilities: vulns.vulnerabilities.slice(0, 10),
        refactoring: refactor.opportunities.slice(0, 10),
        corrections: corrections.corrections.slice(0, 10),
      })
    }
    case 'lint': {
      const result = lintCode(code, language)
      return JSON.stringify({
        stats: result.stats,
        problems: result.problems.slice(0, 20),
      })
    }
    case 'scan': {
      const result = scanVulnerabilities(code, language)
      return JSON.stringify({
        stats: result.stats,
        vulnerabilities: result.vulnerabilities.slice(0, 20),
      })
    }
    case 'refactor': {
      const result = refactorCode(code, language, args.apply === true)
      return JSON.stringify({
        stats: result.stats,
        opportunities: result.opportunities.slice(0, 20),
        applied: result.applied,
      })
    }
    case 'correct': {
      const result = correctCode(code, language)
      return JSON.stringify({
        appliedCount: result.appliedCount,
        corrections: result.corrections.slice(0, 20),
        correctedCode: result.correctedCode,
      })
    }
    case 'search_functions': {
      const results = searchFunctions(args.query || '')
      return JSON.stringify({
        total: results.length,
        functions: results.slice(0, 15).map(f => ({
          id: f.id,
          name: f.name,
          category: f.category,
          description: f.description,
          signature: f.signature,
          implemented: f.implemented,
        })),
      })
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${tool}` })
  }
}

// Parse tool calls from assistant response
function parseToolCalls(content: string): Array<{ tool: string; args: any; raw: string }> {
  const calls: Array<{ tool: string; args: any; raw: string }> = []
  const regex = /<tool_call>\s*(\{[\s\S]*?\})\s*<\/tool_call>/g
  let match
  while ((match = regex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1])
      calls.push({ tool: parsed.tool, args: parsed.args || {}, raw: match[0] })
    } catch {
      // Invalid JSON — skip
    }
  }
  return calls
}

// Strip tool call blocks from response for display
function stripToolCalls(content: string): string {
  return content.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '').trim()
}

// ---------- Main POST handler ----------

export async function POST(req: Request): Promise<Response> {
  const ctx = createRequestContext()

  let body: ChatRequest
  try {
    body = await req.json()
  } catch {
    return apiError('Invalid JSON body', 400, ctx)
  }

  const { messages, provider = 'z-ai', apiKey, model, context } = body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return apiError('Missing messages', 400, ctx)
  }

  if ((provider === 'openai' || provider === 'anthropic') && !apiKey) {
    return apiError(`${provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key required`, 400, ctx)
  }

  const defaultModel = provider === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-haiku-20241022'

  try {
    const contextPrefix = context?.code
      ? `\n\n## Current context\n- File: ${context.filename || 'untitled'}\n- Language: ${context.language || 'auto'}${context.cursorLine ? `\n- Cursor: line ${context.cursorLine}` : ''}\n\n## Current code\n\`\`\`${context.language || ''}\n${context.code.slice(0, 8000)}\n\`\`\`\n${context.selection ? `\n## Selected text\n\`\`\`\n${context.selection.slice(0, 2000)}\n\`\`\`` : ''}`
      : ''

    const fullMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT + contextPrefix },
      ...messages,
    ]

    let rounds = 0
    let lastResponse = ''
    const toolResults: Array<{ tool: string; result: any }> = []

    while (rounds < 3) {
      const response = await chatCompletion(provider as AIProvider, fullMessages, { apiKey, model: model || defaultModel })

      lastResponse = response
      const calls = parseToolCalls(response)

      if (calls.length === 0) break

      fullMessages.push({ role: 'assistant', content: response })

      for (const call of calls) {
        try {
          const result = await callTool(call.tool, call.args, context)
          toolResults.push({ tool: call.tool, result: JSON.parse(result) })
          fullMessages.push({
            role: 'user',
            content: `Tool "${call.tool}" returned:\n\`\`\`json\n${result}\n\`\`\`\n\nNow respond to my original question using this data.`,
          })
        } catch (e: any) {
          fullMessages.push({
            role: 'user',
            content: `Tool "${call.tool}" failed: ${e.message}`,
          })
        }
      }

      rounds++
    }

    const cleanResponse = stripToolCalls(lastResponse)

    return apiSuccess({
      content: cleanResponse,
      toolResults,
      rounds,
    }, ctx, { provider })
  } catch (e: any) {
    return apiError(e?.message || 'Chat failed', 500, ctx)
  }
}
