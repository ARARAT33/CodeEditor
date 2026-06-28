'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, ChevronRight, Copy, Check, X, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getFunctionStats, getFunctionCategories } from '@/lib/awecode/functions'
import { useToast } from '@/hooks/use-toast'

export interface FunctionCatalogProps {
  onInsert?: (code: string, name: string) => void
  language?: string
}

// Fetch and display the function catalog (uses /api/aweai/functions)
export function FunctionCatalog({ onInsert, language = 'typescript' }: FunctionCatalogProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [functions, setFunctions] = useState<any[]>([])
  const [stats, setStats] = useState<{ total: number; implemented: number }>({ total: 0, implemented: 0 })
  const [categories, setCategories] = useState<string[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Load categories and stats first
    fetch('/api/aweai/functions?categories=1')
      .then(r => r.json())
      .then(r => setCategories(r.data?.categories || []))
      .catch(() => {})
    fetch('/api/aweai/functions?stats=1')
      .then(r => r.json())
      .then(r => setStats(r.data || { total: 0, implemented: 0 }))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (category !== 'all') params.set('category', category)
    params.set('limit', '200')
    Promise.resolve().then(() => setLoading(true))
    fetch('/api/aweai/functions?' + params.toString())
      .then(r => r.json())
      .then(r => {
        if (cancelled) return
        setFunctions(r.data?.functions || r.data?.results || [])
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [search, category])

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: 'Copied to clipboard' })
  }

  const handleInsert = (fn: any) => {
    if (fn.code && onInsert) {
      onInsert(fn.code, fn.name)
      toast({ title: `Inserted: ${fn.name}` })
    } else if (onInsert) {
      onInsert(`// ${fn.name}: ${fn.description}\n${fn.signature} {\n  // TODO: implement\n}\n`, fn.name)
      toast({ title: `Inserted template: ${fn.name}` })
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-3 border-b border-zinc-800 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-violet-500/10 text-violet-300 border-violet-500/30">
            {stats.total.toLocaleString()}+ functions
          </Badge>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
            {stats.implemented} implemented
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search 1000+ functions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-zinc-500" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 max-h-72">
            <SelectItem value="all">All categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading && (
            <div className="text-center py-8 text-zinc-500 text-sm">Loading functions…</div>
          )}
          {!loading && functions.length === 0 && (
            <div className="text-center py-8 text-zinc-500 text-sm">No functions found.</div>
          )}
          {!loading && functions.map((fn) => (
            <button
              key={fn.id}
              onClick={() => setSelected(fn)}
              className={`w-full text-left p-2 rounded-md transition-colors border ${
                selected?.id === fn.id
                  ? 'bg-violet-500/15 border-violet-500/40'
                  : 'bg-zinc-900/50 border-transparent hover:bg-zinc-900 hover:border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono text-violet-300 truncate">{fn.name}</code>
                {fn.implemented && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px] px-1.5 py-0">
                    impl
                  </Badge>
                )}
              </div>
              <div className="text-xs text-zinc-400 truncate mt-0.5">{fn.description}</div>
              <div className="text-[10px] text-zinc-600 mt-0.5">{fn.category}</div>
            </button>
          ))}
        </div>
      </ScrollArea>

      {selected && (
        <div className="border-t border-zinc-800 bg-zinc-950 max-h-72 overflow-y-auto">
          <div className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <code className="text-sm font-mono font-bold text-violet-300">{selected.name}</code>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100"
                onClick={() => setSelected(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-zinc-300">{selected.description}</p>
            <div className="bg-zinc-900 border border-zinc-800 rounded p-2 overflow-x-auto">
              <code className="text-xs font-mono text-cyan-300 whitespace-pre-wrap">{selected.signature}</code>
            </div>
            {selected.parameters && selected.parameters.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] uppercase text-zinc-500 font-semibold">Parameters</div>
                {selected.parameters.map((p: any, i: number) => (
                  <div key={i} className="text-xs">
                    <code className="text-violet-300">{p.name}</code>
                    <span className="text-zinc-500">: {p.type}</span>
                    <span className="text-zinc-400"> — {p.description}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="text-xs">
              <span className="text-[10px] uppercase text-zinc-500 font-semibold">Returns: </span>
              <code className="text-emerald-300">{selected.returns?.type}</code>
              <span className="text-zinc-400"> — {selected.returns?.description}</span>
            </div>
            {selected.example && (
              <div className="bg-zinc-900 border border-zinc-800 rounded p-2">
                <div className="text-[10px] uppercase text-zinc-500 font-semibold mb-1">Example</div>
                <code className="text-xs font-mono text-amber-300 whitespace-pre-wrap">{selected.example}</code>
              </div>
            )}
            {selected.complexity && (
              <Badge variant="outline" className="text-[10px] bg-zinc-900 border-zinc-700 text-zinc-300">
                Complexity: {selected.complexity}
              </Badge>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="bg-violet-600 hover:bg-violet-500 text-white"
                onClick={() => handleInsert(selected)}
              >
                Insert
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                onClick={() => handleCopy(selected.code || selected.signature)}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
