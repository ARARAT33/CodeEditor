'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, Command, FileCode, ChevronRight, Wrench, ShieldAlert, Bug, Zap, Brain, Github, HardDrive, Sun, Moon, Save, FolderOpen, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface Command {
  id: string
  label: string
  hint?: string
  shortcut?: string
  icon: any
  category: 'file' | 'analysis' | 'editor' | 'view' | 'github' | 'ai' | 'local'
  action: () => void
}

export interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  commands: Command[]
  mode?: 'commands' | 'files'
  files?: Array<{ name: string; path: string }>
  onOpenFile?: (path: string) => void
}

export function CommandPalette({ open, onClose, commands, mode = 'commands', files = [], onOpenFile }: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      // Defer state reset to avoid synchronous setState in effect
      const t = setTimeout(() => {
        setSearch('')
        setSelectedIdx(0)
        inputRef.current?.focus()
      }, 0)
      return () => clearTimeout(t)
    }
  }, [open])

  const filtered = useMemo(() => {
    if (mode === 'files') {
      if (!search) return files.slice(0, 50)
      const q = search.toLowerCase()
      return files.filter(f =>
        f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)
      ).slice(0, 50)
    }
    if (!search) return commands.slice(0, 50)
    const q = search.toLowerCase()
    return commands.filter(c =>
      c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.hint?.toLowerCase().includes(q)
    ).slice(0, 50)
  }, [search, commands, files, mode])

  useEffect(() => {
    const t = setTimeout(() => setSelectedIdx(0), 0)
    return () => clearTimeout(t)
  }, [search, mode])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = filtered[selectedIdx]
      if (item) {
        if (mode === 'files' && 'path' in item) {
          onOpenFile?.(item.path)
        } else if ('action' in item) {
          item.action()
        }
        onClose()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 p-3 border-b border-zinc-800">
          {mode === 'commands' ? <Command className="h-4 w-4 text-violet-400" /> : <FileCode className="h-4 w-4 text-violet-400" />}
          <Input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'commands' ? 'Type a command...' : 'Search files by name...'}
            className="border-0 bg-transparent focus-visible:ring-0 text-zinc-100 placeholder:text-zinc-600"
          />
          <kbd className="text-[10px] text-zinc-500 border border-zinc-700 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="p-6 text-center text-sm text-zinc-500">
              {mode === 'commands' ? 'No commands found' : 'No files found'}
            </div>
          )}

          {mode === 'commands' && filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              onMouseEnter={() => setSelectedIdx(i)}
              onClick={() => { cmd.action(); onClose() }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-left text-sm',
                i === selectedIdx ? 'bg-violet-500/15 text-violet-100' : 'text-zinc-300 hover:bg-zinc-900'
              )}
            >
              <cmd.icon className={cn('h-4 w-4 flex-shrink-0', i === selectedIdx ? 'text-violet-400' : 'text-zinc-500')} />
              <div className="flex-1 min-w-0">
                <div className="truncate">{cmd.label}</div>
                {cmd.hint && <div className="text-[10px] text-zinc-500 truncate">{cmd.hint}</div>}
              </div>
              <span className="text-[10px] text-zinc-500 uppercase">{cmd.category}</span>
              {cmd.shortcut && (
                <kbd className="text-[10px] text-zinc-500 border border-zinc-700 rounded px-1.5 py-0.5">{cmd.shortcut}</kbd>
              )}
            </button>
          ))}

          {mode === 'files' && filtered.map((file, i) => (
            <button
              key={file.path}
              onMouseEnter={() => setSelectedIdx(i)}
              onClick={() => { onOpenFile?.(file.path); onClose() }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-left text-sm',
                i === selectedIdx ? 'bg-violet-500/15 text-violet-100' : 'text-zinc-300 hover:bg-zinc-900'
              )}
            >
              <FileCode className="h-4 w-4 flex-shrink-0 text-zinc-500" />
              <span className="flex-1 truncate font-mono text-xs">{file.name}</span>
              <span className="text-[10px] text-zinc-600 truncate max-w-xs">{file.path}</span>
            </button>
          ))}
        </div>

        <div className="p-2 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between text-[10px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span><kbd className="border border-zinc-700 rounded px-1">↑↓</kbd> navigate</span>
            <span><kbd className="border border-zinc-700 rounded px-1">↵</kbd> select</span>
            <span><kbd className="border border-zinc-700 rounded px-1">ESC</kbd> close</span>
          </div>
          <span>{filtered.length} results</span>
        </div>
      </div>
    </div>
  )
}
