// Shared AI provider client for the AWEAI routes.
// The chat and deep-scan routes previously each carried their own copies of the
// z-ai / OpenAI / Anthropic call functions; this module unifies them behind a
// single chatCompletion() dispatcher that takes a list of chat messages.

export type AIProvider = 'z-ai' | 'openai' | 'anthropic'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
}

export interface ChatCompletionOptions {
  apiKey?: string
  model?: string
}

async function callZAI(messages: AIMessage[]): Promise<string> {
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  const zai = await ZAI.create()
  const completion = await zai.chat.completions.create({
    messages: messages.map(m => ({ role: m.role as any, content: m.content })),
    thinking: { type: 'disabled' },
  })
  return completion.choices[0]?.message?.content || ''
}

async function callOpenAI(messages: AIMessage[], apiKey: string | undefined, model: string): Promise<string> {
  if (!apiKey) throw new Error('OpenAI API key required')
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

async function callAnthropic(messages: AIMessage[], apiKey: string | undefined, model: string): Promise<string> {
  if (!apiKey) throw new Error('Anthropic API key required')
  const system = messages.find(m => m.role === 'system')?.content || ''
  const userMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
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

// Runs a chat completion against the selected provider and returns the raw
// text content. Throws when a cloud provider is selected without an API key.
export async function chatCompletion(
  provider: AIProvider,
  messages: AIMessage[],
  opts: ChatCompletionOptions = {},
): Promise<string> {
  switch (provider) {
    case 'openai':
      return callOpenAI(messages, opts.apiKey, opts.model || 'gpt-4o-mini')
    case 'anthropic':
      return callAnthropic(messages, opts.apiKey, opts.model || 'claude-3-5-sonnet-20241022')
    default:
      return callZAI(messages)
  }
}
