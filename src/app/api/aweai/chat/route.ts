// AWEAI Chat API — AI agent with tool-calling capabilities
// Supports z-ai-web-dev-sdk (default), OpenAI, and Anthropic providers
// The agent can call AWEAI tools (analyze, lint, scan, refactor) to do real work

import { lintCode } from '@/lib/awecode/linter'
import { scanVulnerabilities } from '@/lib/awecode/vulnerabilities'
import { refactorCode, correctCode } from '@/lib/awecode/refactor'
import { detectLanguageByFilename } from '@/lib/awecode/languages'
import { searchFunctions } from '@/lib/awecode/functions'

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
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Unknown parse error'
      console.warn(`Skipping malformed tool call JSON: ${errMsg}`, match[1].slice(0, 200))
    }
  }
  return calls
}

// Strip tool call blocks from response for display
function stripToolCalls(content: string): string {
  return content.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '').trim()
}

// ---------- Provider implementations ----------

async function callZAI(messages: ChatMessage[]): Promise<string> {
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  const zai = await ZAI.create()
  const completion = await zai.chat.completions.create({
    messages: messages.map(m => ({ role: m.role as any, content: m.content })),
    thinking: { type: 'disabled' },
  })
  return completion.choices[0]?.message?.content || ''
}

async function callOpenAI(messages: ChatMessage[], apiKey: string, model: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `OpenAI API error: ${res.status}`)
  }
  const data = await res.json()
  return data.choices[0]?.message?.content || ''
}

async function callAnthropic(messages: ChatMessage[], apiKey: string, model: string): Promise<string> {
  const system = messages.find(m => m.role === 'system')?.content || ''
  const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }))

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system,
      messages: userMessages,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Anthropic API error: ${res.status}`)
  }
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

// ---------- Main POST handler ----------

export async function POST(req: Request): Promise<Response> {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  let body: ChatRequest
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { messages, provider = 'z-ai', apiKey, model, context } = body

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ ok: false, error: 'Missing messages' }, { status: 400 })
  }

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
      let response: string
      if (provider === 'openai') {
        if (!apiKey) return Response.json({ ok: false, error: 'OpenAI API key required' }, { status: 400 })
        response = await callOpenAI(fullMessages, apiKey, model || 'gpt-4o-mini')
      } else if (provider === 'anthropic') {
        if (!apiKey) return Response.json({ ok: false, error: 'Anthropic API key required' }, { status: 400 })
        response = await callAnthropic(fullMessages, apiKey, model || 'claude-3-5-haiku-20241022')
      } else {
        response = await callZAI(fullMessages)
      }

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

    return Response.json({
      ok: true,
      data: {
        content: cleanResponse,
        toolResults,
        rounds,
      },
      meta: {
        version: '1.0.0',
        durationMs: Date.now() - startTime,
        requestId,
        provider,
      },
    })
  } catch (e: any) {
    return Response.json({
      ok: false,
      error: e?.message || 'Chat failed',
      meta: { version: '1.0.0', durationMs: Date.now() - startTime, requestId },
    }, { status: 500 })
  }
}
