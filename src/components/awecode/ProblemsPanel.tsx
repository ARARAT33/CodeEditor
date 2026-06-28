'use client'

import { useState } from 'react'
import { AlertCircle, AlertTriangle, Info, Lightbulb, ShieldAlert, ShieldCheck, ShieldX, ChevronRight, Bug, Wrench, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { LintResult, LintProblem } from '@/lib/awecode/linter'
import type { VulnScanResult, Vulnerability } from '@/lib/awecode/vulnerabilities'
import type { RefactorResult, RefactorOpportunity } from '@/lib/awecode/refactor'
import type { CorrectionResult, Correction } from '@/lib/awecode/refactor'

const severityConfig = {
  error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Error' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Warning' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Info' },
  hint: { icon: Lightbulb, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30', label: 'Hint' },
}

const vulnSeverityConfig = {
  critical: { icon: ShieldX, color: 'text-red-500', bg: 'bg-red-500/15', border: 'border-red-500/40', label: 'Critical' },
  high: { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'High' },
  medium: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Medium' },
  low: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Low' },
  info: { icon: Info, color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', label: 'Info' },
}

export interface ProblemsPanelProps {
  lint?: LintResult | null
  vulnerabilities?: VulnScanResult | null
  refactor?: RefactorResult | null
  corrections?: CorrectionResult | null
  onJumpTo?: (line: number, column: number) => void
  onApplyCorrection?: (correction: Correction) => void
  onApplyRefactor?: (opportunity: RefactorOpportunity) => void
  activeTab?: 'lint' | 'vulns' | 'refactor' | 'correct'
  onTabChange?: (tab: 'lint' | 'vulns' | 'refactor' | 'correct') => void
}

export function ProblemsPanel({
  lint,
  vulnerabilities,
  refactor,
  corrections,
  onJumpTo,
  onApplyCorrection,
  onApplyRefactor,
  activeTab = 'lint',
  onTabChange,
}: ProblemsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info' | 'hint'>('all')

  const tabs = [
    { id: 'lint' as const, label: 'Lint', count: lint?.stats.total || 0, icon: Bug },
    { id: 'vulns' as const, label: 'Security', count: vulnerabilities?.stats.total || 0, icon: ShieldAlert },
    { id: 'refactor' as const, label: 'Refactor', count: refactor?.stats.total || 0, icon: Wrench },
    { id: 'correct' as const, label: 'Auto-fix', count: corrections?.corrections.length || 0, icon: Zap },
  ]

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Tabs */}
      <div className="flex items-center border-b border-zinc-800 px-2 pt-2 gap-1">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-t-md transition-colors',
                isActive
                  ? 'bg-zinc-900 text-violet-300 border-b-2 border-violet-500'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  'ml-1 px-1.5 py-0.5 text-[10px] rounded-full',
                  isActive ? 'bg-violet-500/20 text-violet-300' : 'bg-zinc-800 text-zinc-400'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {activeTab === 'lint' && <LintView result={lint} filter={filter} setFilter={setFilter} onJumpTo={onJumpTo} />}
          {activeTab === 'vulns' && <VulnsView result={vulnerabilities} onJumpTo={onJumpTo} />}
          {activeTab === 'refactor' && <RefactorView result={refactor} onApply={onApplyRefactor} />}
          {activeTab === 'correct' && <CorrectionsView result={corrections} onApply={onApplyCorrection} />}
        </div>
      </ScrollArea>
    </div>
  )
}

function LintView({ result, filter, setFilter, onJumpTo }: {
  result?: LintResult | null
  filter: string
  setFilter: (f: any) => void
  onJumpTo?: (line: number, column: number) => void
}) {
  if (!result) {
    return <EmptyState icon={Bug} title="No analysis yet" hint="Click 'Analyze' to lint your code" />
  }

  const filtered = filter === 'all' ? result.problems : result.problems.filter(p => p.severity === filter)

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1 text-xs">
        <StatChip label="Errors" value={result.stats.errors} color="text-red-400" bg="bg-red-500/10" />
        <StatChip label="Warnings" value={result.stats.warnings} color="text-amber-400" bg="bg-amber-500/10" />
        <StatChip label="Info" value={result.stats.infos} color="text-blue-400" bg="bg-blue-500/10" />
        <StatChip label="Hints" value={result.stats.hints} color="text-violet-400" bg="bg-violet-500/10" />
      </div>

      <div className="flex items-center gap-1 text-xs">
        <span className="text-zinc-500">Analyzed {result.linesAnalyzed} lines in {result.analysisTimeMs}ms</span>
      </div>

      <div className="flex gap-1 flex-wrap">
        {(['all', 'error', 'warning', 'info', 'hint'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-2 py-0.5 text-[10px] uppercase rounded-md border',
              filter === f
                ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-zinc-500 text-sm">
            <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-emerald-500/50" />
            No problems found
          </div>
        )}
        {filtered.map((p) => {
          const cfg = severityConfig[p.severity]
          const Icon = cfg.icon
          return (
            <button
              key={p.id}
              onClick={() => onJumpTo?.(p.line, p.column)}
              className={cn('w-full text-left p-2 rounded-md border transition-colors', cfg.bg, cfg.border, 'hover:opacity-80')}
            >
              <div className="flex items-start gap-2">
                <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', cfg.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[10px] uppercase font-semibold', cfg.color)}>{cfg.label}</span>
                    <code className="text-[10px] text-zinc-500 font-mono">{p.ruleId}</code>
                    <span className="text-[10px] text-zinc-600">L{p.line}:{p.column}</span>
                  </div>
                  <div className="text-xs text-zinc-200 mt-0.5">{p.message}</div>
                  {p.suggestion && (
                    <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                      <Lightbulb className="h-3 w-3 text-violet-400" />
                      {p.suggestion}
                    </div>
                  )}
                </div>
                <ChevronRight className="h-3 w-3 text-zinc-600 flex-shrink-0 mt-1" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function VulnsView({ result, onJumpTo }: { result?: VulnScanResult | null, onJumpTo?: (l: number, c: number) => void }) {
  if (!result) {
    return <EmptyState icon={ShieldAlert} title="No scan yet" hint="Click 'Scan' to find vulnerabilities" />
  }

  const score = result.stats.score
  const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="space-y-2">
      <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase text-zinc-500 font-semibold">Security Score</span>
          <span className={cn('text-2xl font-bold', scoreColor)}>{score}</span>
        </div>
        <Progress value={score} className="h-2" />
        <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
          <span>0 (critical)</span>
          <span>100 (perfect)</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 text-xs">
        <StatChip label="Critical" value={result.stats.critical} color="text-red-500" bg="bg-red-500/15" />
        <StatChip label="High" value={result.stats.high} color="text-red-400" bg="bg-red-500/10" />
        <StatChip label="Medium" value={result.stats.medium} color="text-amber-400" bg="bg-amber-500/10" />
        <StatChip label="Low" value={result.stats.low} color="text-blue-400" bg="bg-blue-500/10" />
      </div>

      <div className="text-[10px] text-zinc-500">
        Scanned {result.linesScanned} lines · {result.rulesChecked} rules checked · {result.scanTimeMs}ms
      </div>

      <div className="space-y-1">
        {result.vulnerabilities.length === 0 && (
          <div className="text-center py-8 text-zinc-500 text-sm">
            <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-emerald-500/50" />
            No vulnerabilities found
          </div>
        )}
        {result.vulnerabilities.map((v) => {
          const cfg = vulnSeverityConfig[v.severity]
          const Icon = cfg.icon
          return (
            <div
              key={v.id}
              onClick={() => onJumpTo?.(v.line, v.column)}
              className={cn('p-2 rounded-md border cursor-pointer transition-colors hover:opacity-80', cfg.bg, cfg.border)}
            >
              <div className="flex items-start gap-2">
                <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', cfg.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-[10px] uppercase font-bold', cfg.color)}>{cfg.label}</span>
                    <Badge variant="outline" className="text-[9px] bg-zinc-900 border-zinc-700 text-zinc-300 px-1 py-0">
                      {v.cwe}
                    </Badge>
                    <span className="text-[10px] text-zinc-600">L{v.line}:{v.column}</span>
                    <span className="text-[10px] text-zinc-600">·</span>
                    <span className="text-[10px] text-zinc-500">conf: {v.confidence}</span>
                  </div>
                  <div className="text-xs font-semibold text-zinc-100 mt-0.5">{v.name}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{v.description}</div>
                  <div className="bg-black/40 border border-zinc-800 rounded mt-1 p-1.5 overflow-x-auto">
                    <code className="text-[10px] font-mono text-red-300 whitespace-pre">{v.evidence}</code>
                  </div>
                  <div className="text-[11px] text-zinc-300 mt-1.5">
                    <span className="text-amber-400 font-semibold">Impact: </span>
                    {v.impact}
                  </div>
                  <div className="text-[11px] text-zinc-300 mt-0.5">
                    <span className="text-emerald-400 font-semibold">Fix: </span>
                    {v.recommendation}
                  </div>
                  {v.fix && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded mt-1 p-1.5">
                      <code className="text-[10px] font-mono text-emerald-300 whitespace-pre-wrap">{v.fix}</code>
                    </div>
                  )}
                  {v.references && v.references.length > 0 && (
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      {v.references.map((r, i) => (
                        <a
                          key={i}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-violet-400 hover:text-violet-300 underline"
                          onClick={e => e.stopPropagation()}
                        >
                          {r.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RefactorView({ result, onApply }: { result?: RefactorResult | null, onApply?: (op: RefactorOpportunity) => void }) {
  if (!result) {
    return <EmptyState icon={Wrench} title="No refactor analysis" hint="Click 'Refactor' to find improvement opportunities" />
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1 text-xs">
        <StatChip label="Easy" value={result.stats.byDifficulty.easy} color="text-emerald-400" bg="bg-emerald-500/10" />
        <StatChip label="Medium" value={result.stats.byDifficulty.medium} color="text-amber-400" bg="bg-amber-500/10" />
        <StatChip label="Hard" value={result.stats.byDifficulty.hard} color="text-red-400" bg="bg-red-500/10" />
      </div>

      {result.applied.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-2">
          <div className="text-xs font-semibold text-emerald-400 mb-1">Auto-applied</div>
          {result.applied.map((a, i) => (
            <div key={i} className="text-[11px] text-zinc-300">{a.type}</div>
          ))}
        </div>
      )}

      <div className="space-y-1">
        {result.opportunities.length === 0 && (
          <div className="text-center py-8 text-zinc-500 text-sm">
            <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-emerald-500/50" />
            No refactoring opportunities
          </div>
        )}
        {result.opportunities.map((op) => (
          <div key={op.id} className="p-2 rounded-md border bg-zinc-900/50 border-zinc-800 hover:border-zinc-700">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                'text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded',
                op.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-300' :
                op.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                'bg-red-500/20 text-red-300'
              )}>
                {op.difficulty}
              </span>
              {op.automated && (
                <Badge variant="outline" className="text-[9px] bg-violet-500/10 text-violet-300 border-violet-500/30 px-1 py-0">
                  auto
                </Badge>
              )}
              <span className="text-[10px] text-zinc-500">L{op.line}</span>
            </div>
            <div className="text-xs font-semibold text-zinc-100 mt-1">{op.title}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">{op.description}</div>
            {op.snippet && (
              <div className="bg-black/40 border border-zinc-800 rounded mt-1 p-1.5 overflow-x-auto">
                <code className="text-[10px] font-mono text-zinc-300 whitespace-pre">{op.snippet}</code>
              </div>
            )}
            <div className="text-[11px] text-emerald-300 mt-1">
              <span className="font-semibold">Benefit: </span>{op.benefit}
            </div>
            {op.automated && onApply && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 h-7 text-xs border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
                onClick={() => onApply(op)}
              >
                <Wrench className="h-3 w-3 mr-1" /> Apply
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function CorrectionsView({ result, onApply }: { result?: CorrectionResult | null, onApply?: (c: Correction) => void }) {
  if (!result) {
    return <EmptyState icon={Zap} title="No corrections" hint="Click 'Auto-fix' to fix issues automatically" />
  }

  return (
    <div className="space-y-2">
      <div className="bg-violet-500/10 border border-violet-500/30 rounded p-2">
        <div className="text-xs text-violet-300">
          <span className="font-bold">{result.appliedCount}</span> corrections auto-applied
        </div>
      </div>
      <div className="space-y-1">
        {result.corrections.length === 0 && (
          <div className="text-center py-8 text-zinc-500 text-sm">
            <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-emerald-500/50" />
            No corrections needed
          </div>
        )}
        {result.corrections.map((c) => (
          <div key={c.id} className="p-2 rounded-md border bg-zinc-900/50 border-zinc-800">
            <div className="flex items-center gap-2">
              <Zap className={cn(
                'h-3.5 w-3.5',
                c.confidence === 'high' ? 'text-emerald-400' :
                c.confidence === 'medium' ? 'text-amber-400' : 'text-zinc-400'
              )} />
              <span className="text-[10px] uppercase text-zinc-500 font-semibold">{c.type}</span>
              <span className="text-[10px] text-zinc-600">L{c.line}:{c.column}</span>
              <span className="text-[10px] text-zinc-500">·</span>
              <span className="text-[10px] text-zinc-400">conf: {c.confidence}</span>
            </div>
            <div className="text-xs font-semibold text-zinc-100 mt-1">{c.title}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">{c.description}</div>
            <div className="bg-red-500/10 border border-red-500/30 rounded mt-1 p-1.5">
              <div className="text-[9px] uppercase text-red-400 font-semibold mb-0.5">Before</div>
              <code className="text-[10px] font-mono text-red-300 whitespace-pre-wrap">{c.original}</code>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded mt-1 p-1.5">
              <div className="text-[9px] uppercase text-emerald-400 font-semibold mb-0.5">After</div>
              <code className="text-[10px] font-mono text-emerald-300 whitespace-pre-wrap">{c.corrected}</code>
            </div>
            {onApply && c.confidence !== 'high' && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 h-7 text-xs border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
                onClick={() => onApply(c)}
              >
                <Zap className="h-3 w-3 mr-1" /> Apply
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function StatChip({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={cn('flex items-center justify-between px-2 py-1 rounded border border-zinc-800', bg)}>
      <span className="text-zinc-400">{label}</span>
      <span className={cn('font-bold', color)}>{value}</span>
    </div>
  )
}

function EmptyState({ icon: Icon, title, hint }: { icon: any; title: string; hint: string }) {
  return (
    <div className="text-center py-12 text-zinc-500">
      <Icon className="h-10 w-10 mx-auto mb-2 text-zinc-700" />
      <div className="text-sm font-medium text-zinc-400">{title}</div>
      <div className="text-xs mt-1">{hint}</div>
    </div>
  )
}
