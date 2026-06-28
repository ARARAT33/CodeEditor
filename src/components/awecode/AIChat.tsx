'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Brain, Send, Settings, X, Trash2, Loader2, Wrench, Check, Copy, User, Bot, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolResults?: Array<{ tool: string; result: any }>
  timestamp: number
  codeBlocks?: Array<{ language: string; code: string }>
}

export interface AIChatProps {
  code: string
  language: string
  filename: string
  selection?: string
  cursorLine?: number
  onApplyCode?: (code: string) => void
  onInsertCode?: (code: string) => void
}

const DEFAULT_SYSTEM_HINT = `I'm AWEAI — your in-editor AI assistant. I can:
- Analyze your code for bugs and security issues
- Suggest refactors and apply fixes
- Search 1000+ utility functions
- Explain code

Ask me anything, or try one of the quick actions below.`

const PROVIDERS = [
  { id: 'z-ai', label: 'Z.ai (default, free)', models: ['glm-4.6', 'glm-4.5'] },
  { id: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { id: 'anthropic', label: 'Anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'] },
]

const QUICK_PROMPTS = [
  { label: 'Analyze code', text: 'Analyze my code for any bugs, security issues, or improvement opportunities.' },
  { label: 'Find vulnerabilities', text: 'Scan my code for security vulnerabilities.' },
  { label: 'Explain code', text: 'Explain what this code does, step by step.' },
  { label: 'Suggest refactor', text: 'Suggest refactoring improvements for this code.' },
  { label: 'Find function', text: 'I need a function to debounce calls. Search the library.' },
  { label: 'Fix all issues', text: 'Run auto-fix on my code and tell me what changed.' },
]

export function AIChat({ code, language, filename, selection, cursorLine, onApplyCode, onInsertCode }: AIChatProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  // Load settings from localStorage using lazy initial state
  const [provider, setProvider] = useState<string>(() => typeof window !== 'undefined' ? (localStorage.getItem('awecode:ai-provider') || 'z-ai') : 'z-ai')
  const [apiKey, setApiKey] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem('awecode:ai-api-key') || '') : '')
  const [model, setModel] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem('awecode:ai-model') || '') : '')
  const [expandedToolResults, setExpandedToolResults] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const saveSettings = useCallback(() => {
    localStorage.setItem('awecode:ai-provider', provider)
    localStorage.setItem('awecode:ai-api-key', apiKey)
    localStorage.setItem('awecode:ai-model', model)
    setShowSettings(false)
    toast({ title: 'AI settings saved' })
  }, [provider, apiKey, model, toast])

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text || input).trim()
    if (!content || loading) return

    const userMsg: AIChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/aweai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          provider,
          apiKey: provider !== 'z-ai' ? apiKey : undefined,
          model: model || undefined,
          context: {
            filename,
            language,
            code,
            selection,
            cursorLine,
          },
        }),
      })
      const json = await res.json()
      if (json.ok) {
        // Extract code blocks from response
        const codeBlocks: Array<{ language: string; code: string }> = []
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
        let match
        while ((match = codeBlockRegex.exec(json.data.content)) !== null) {
          codeBlocks.push({ language: match[1] || 'text', code: match[2] })
        }

        const aiMsg: AIChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: json.data.content,
          toolResults: json.data.toolResults,
          timestamp: Date.now(),
          codeBlocks,
        }
        setMessages(prev => [...prev, aiMsg])
      } else {
        toast({ title: 'AI error', description: json.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Failed to chat', description: e.message, variant: 'destructive' })
    }
    setLoading(false)
  }, [input, loading, messages, provider, apiKey, model, filename, language, code, selection, cursorLine, toast])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearHistory = () => {
    setMessages([])
    toast({ title: 'Chat history cleared' })
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({ title: 'Copied to clipboard' })
  }

  const toggleToolResult = (id: string) => {
    setExpandedToolResults(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="p-2 border-b border-zinc-800 flex items-center gap-2">
        <Brain className="h-4 w-4 text-violet-400" />
        <span className="text-xs font-semibold text-zinc-200">AWEAI Chat</span>
        <Badge variant="outline" className="text-[9px] bg-violet-500/10 text-violet-300 border-violet-500/30">
          {PROVIDERS.find(p => p.id === provider)?.label.split(' ')[0]}
        </Badge>
        <div className="flex-1" />
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-400" onClick={() => setShowSettings(s => !s)}>
          <Settings className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-400" onClick={clearHistory}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 space-y-2">
          <div>
            <label className="text-[10px] uppercase text-zinc-500 font-semibold">Provider</label>
            <Select value={provider} onValueChange={(v) => { setProvider(v); setModel('') }}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {PROVIDERS.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {provider !== 'z-ai' && (
            <div>
              <label className="text-[10px] uppercase text-zinc-500 font-semibold">API Key</label>
              <Input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 mt-1 font-mono text-xs"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Stored locally in your browser. Never sent to AWECode's server.
              </p>
            </div>
          )}
          <div>
            <label className="text-[10px] uppercase text-zinc-500 font-semibold">Model</label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100 mt-1">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {PROVIDERS.find(p => p.id === provider)?.models.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" className="w-full bg-violet-600 hover:bg-violet-500 text-white" onClick={saveSettings}>
            Save Settings
          </Button>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 px-3">
            <Brain className="h-10 w-10 mx-auto mb-3 text-violet-500/50" />
            <p className="text-xs text-zinc-400 mb-4">{DEFAULT_SYSTEM_HINT}</p>
            <div className="grid grid-cols-1 gap-1">
              {QUICK_PROMPTS.map(q => (
                <button
                  key={q.label}
                  onClick={() => sendMessage(q.text)}
                  className="text-left p-2 rounded-md border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-violet-500/30 text-xs text-zinc-300"
                >
                  <Zap className="h-3 w-3 inline mr-1.5 text-violet-400" />
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}>
            <div className={cn(
              'h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0',
              msg.role === 'user' ? 'bg-violet-600' : 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
            )}>
              {msg.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
            </div>
            <div className={cn('flex-1 min-w-0', msg.role === 'user' && 'flex justify-end')}>
              <div className={cn(
                'inline-block max-w-full rounded-lg px-3 py-2 text-xs',
                msg.role === 'user'
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-900 text-zinc-200 border border-zinc-800'
              )}>
                {/* Tool results */}
                {msg.toolResults && msg.toolResults.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {msg.toolResults.map((tr, i) => {
                      const id = `${msg.id}-tool-${i}`
                      const expanded = expandedToolResults.has(id)
                      return (
                        <div key={i} className="border border-violet-500/30 bg-violet-500/5 rounded p-1.5">
                          <button
                            onClick={() => toggleToolResult(id)}
                            className="w-full flex items-center gap-1.5 text-[10px] text-violet-300"
                          >
                            <Wrench className="h-3 w-3" />
                            <span className="font-mono">{tr.tool}</span>
                            <span className="text-zinc-500 ml-auto">{expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</span>
                          </button>
                          {expanded && (
                            <pre className="mt-1 text-[10px] font-mono text-zinc-300 overflow-x-auto max-h-48 overflow-y-auto">
                              {JSON.stringify(tr.result, null, 2)}
                            </pre>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Content with code blocks */}
                <MessageContent content={msg.content} codeBlocks={msg.codeBlocks} onCopyCode={copyCode} onApplyCode={onApplyCode} onInsertCode={onInsertCode} />
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
              <span className="text-xs text-zinc-400">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-2 border-t border-zinc-800">
        <div className="flex gap-1.5 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask AWEAI about ${filename}...`}
            rows={2}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-violet-500/50"
          />
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-500 text-white"
            disabled={!input.trim() || loading}
            onClick={() => sendMessage()}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-[10px] text-zinc-600 mt-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}

// ---------- Message Content with code blocks ----------

function MessageContent({
  content,
  codeBlocks,
  onCopyCode,
  onApplyCode,
  onInsertCode,
}: {
  content: string
  codeBlocks?: Array<{ language: string; code: string }>
  onCopyCode?: (code: string) => void
  onApplyCode?: (code: string) => void
  onInsertCode?: (code: string) => void
}) {
  // Split content by code blocks
  const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = []
  const regex = /```(\w+)?\n([\s\S]*?)```/g
  let lastIdx = 0
  let match
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ type: 'text', content: content.slice(lastIdx, match.index) })
    }
    parts.push({ type: 'code', language: match[1] || 'text', content: match[2] })
    lastIdx = regex.lastIndex
  }
  if (lastIdx < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIdx) })
  }

  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return (
            <div key={i} className="whitespace-pre-wrap leading-relaxed">{part.content}</div>
          )
        }
        return (
          <div key={i} className="bg-black border border-zinc-800 rounded overflow-hidden">
            <div className="flex items-center justify-between px-2 py-1 bg-zinc-900 border-b border-zinc-800">
              <span className="text-[10px] text-zinc-400 font-mono">{part.language}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => onCopyCode?.(part.content)}
                  className="text-[10px] text-zinc-400 hover:text-zinc-100 px-1.5 py-0.5 rounded hover:bg-zinc-800"
                >
                  <Copy className="h-2.5 w-2.5 inline" />
                </button>
                {onInsertCode && (
                  <button
                    onClick={() => onInsertCode(part.content)}
                    className="text-[10px] text-violet-400 hover:text-violet-300 px-1.5 py-0.5 rounded hover:bg-violet-500/10"
                  >
                    Insert
                  </button>
                )}
                {onApplyCode && (
                  <button
                    onClick={() => onApplyCode(part.content)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 px-1.5 py-0.5 rounded hover:bg-emerald-500/10"
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
            <pre className="p-2 text-[11px] font-mono text-zinc-200 overflow-x-auto"><code>{part.content}</code></pre>
          </div>
        )
      })}
    </div>
  )
}
