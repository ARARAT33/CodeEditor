'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Terminal as TerminalIcon, X, Trash2, Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export interface TerminalLine {
  id: string
  type: 'input' | 'output' | 'error' | 'info'
  text: string
  cwd?: string
}

export interface RealTerminalProps {
  height?: number
  onHeightChange?: (h: number) => void
}

export function RealTerminal({ height = 220, onHeightChange }: RealTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: 'init1', type: 'info', text: 'AWECode Terminal v1.0 — Real shell execution (sandboxed)' },
    { id: 'init2', type: 'info', text: 'Supported: ls, cat, echo, grep, node, python, ruby, php, gcc, git, npm, curl, ...' },
    { id: 'init3', type: 'info', text: 'Working directory: /tmp/awecode-workspace' },
  ])
  const [input, setInput] = useState('')
  const [cwd, setCwd] = useState('~')
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [running, setRunning] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines, running])

  const runCommand = useCallback(async (cmd: string) => {
    if (!cmd.trim() || running) return
    const cmdId = crypto.randomUUID()
    setLines(prev => [...prev, { id: cmdId, type: 'input', text: cmd, cwd }])
    setHistory(prev => [...prev, cmd])
    setHistoryIdx(-1)
    setInput('')
    setRunning(true)

    try {
      const res = await fetch('/api/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, timeout: 15000 }),
      })
      const data = await res.json()
      if (data.ok) {
        const d = data.data
        if (d.stdout) {
          d.stdout.split('\n').forEach((line: string, i: number) => {
            if (line || i === 0) {
              setLines(prev => [...prev, { id: `${cmdId}-out-${i}`, type: 'output', text: line }])
            }
          })
        }
        if (d.stderr) {
          d.stderr.split('\n').forEach((line: string, i: number) => {
            if (line || i === 0) {
              setLines(prev => [...prev, { id: `${cmdId}-err-${i}`, type: 'error', text: line }])
            }
          })
        }
        if (d.timedOut) {
          setLines(prev => [...prev, { id: `${cmdId}-to`, type: 'error', text: '⏱ Command timed out after 15s' }])
        }
        if (!d.stdout && !d.stderr && !d.timedOut) {
          setLines(prev => [...prev, { id: `${cmdId}-done`, type: 'info', text: `(exit ${d.exitCode})` }])
        }
        if (d.cwd) setCwd(d.cwd)
      } else {
        setLines(prev => [...prev, { id: `${cmdId}-err`, type: 'error', text: data.error || 'Failed' }])
      }
    } catch (e: any) {
      setLines(prev => [...prev, { id: `${cmdId}-err`, type: 'error', text: e.message }])
    }
    setRunning(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [running, cwd])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      runCommand(input)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1)
        setHistoryIdx(newIdx)
        setInput(history[newIdx])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIdx !== -1) {
        const newIdx = historyIdx + 1
        if (newIdx >= history.length) {
          setHistoryIdx(-1)
          setInput('')
        } else {
          setHistoryIdx(newIdx)
          setInput(history[newIdx])
        }
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setLines([])
    }
  }

  const clear = () => setLines([])

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-t border-zinc-800" style={{ height }}>
      <div className="h-8 border-b border-zinc-800 flex items-center px-3 gap-2 bg-zinc-950 flex-shrink-0">
        <TerminalIcon className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-xs text-zinc-300 font-semibold">Terminal</span>
        <span className="text-[10px] text-zinc-500">· real shell, sandboxed</span>
        <div className="flex-1" />
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-zinc-500" onClick={clear} title="Clear (Ctrl+L)">
          <Trash2 className="h-3 w-3" />
        </Button>
        {onHeightChange && (
          <>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-zinc-500" onClick={() => onHeightChange(Math.max(80, height - 50))} title="Smaller">
              <ChevronDown className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-zinc-500" onClick={() => onHeightChange(Math.min(600, height + 50))} title="Larger">
              <ChevronUp className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 font-mono text-xs">
        {lines.map(line => (
          <div key={line.id} className={cn(
            'leading-relaxed whitespace-pre-wrap break-all',
            line.type === 'input' && 'text-violet-300',
            line.type === 'output' && 'text-zinc-300',
            line.type === 'error' && 'text-red-400',
            line.type === 'info' && 'text-zinc-500',
          )}>
            {line.type === 'input' && <span className="text-emerald-400">{line.cwd || '~'} $ </span>}
            {line.text}
          </div>
        ))}
        {running && (
          <div className="text-zinc-500 flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" /> running...
          </div>
        )}
      </div>

      <div className="border-t border-zinc-800 p-2 flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-emerald-400 font-mono flex-shrink-0">{cwd} $</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={running}
          placeholder="Type a command and press Enter (try: ls, echo hello, node -e 'console.log(1+1)')"
          className="flex-1 bg-transparent border-0 text-xs text-zinc-100 font-mono focus:outline-none placeholder:text-zinc-600"
          autoFocus
        />
      </div>
    </div>
  )
}
