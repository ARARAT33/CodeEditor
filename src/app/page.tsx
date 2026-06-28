'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Code2, Bug, ShieldAlert, Wrench, Zap, Sparkles, Sun, Moon,
  Play, Save, FilePlus, Download, Upload, Terminal, X, ChevronRight,
  Loader2, Check, Brain, PanelLeft, PanelRight, PanelBottom,
  Hash, Database, Globe, Lock, HardDrive, Github, Command as CmdIcon,
  FolderOpen, RefreshCw, Cpu, Layers, Network, FileCode, Search as SearchIcon,
  BookOpen, Settings as SettingsIcon, GitBranch, Eye,
  Plus, FileText, FolderTree, Settings2, Keyboard, HelpCircle,
  ChevronDown, AlertCircle, ScanSearch, Bot
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { CodeEditor } from '@/components/awecode/CodeEditor'
import { FunctionCatalog } from '@/components/awecode/FunctionCatalog'
import { ProblemsPanel } from '@/components/awecode/ProblemsPanel'
import { LocalFilesPanel } from '@/components/awecode/LocalFilesPanel'
import { GitHubPanel } from '@/components/awecode/GitHubPanel'
import { AIChat } from '@/components/awecode/AIChat'
import { CommandPalette } from '@/components/awecode/CommandPalette'
import { RealTerminal } from '@/components/awecode/RealTerminal'
import { LivePreview } from '@/components/awecode/LivePreview'
import ReactMarkdown from 'react-markdown'
import { detectLanguageByFilename, LANGUAGES, LANGUAGE_COUNT, getLanguagesByCategory } from '@/lib/awecode/languages'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// ---------- Types ----------

interface EditorTab {
  id: string
  path: string
  filename: string
  content: string
  originalContent: string
  language: string
  handle?: FileSystemFileHandle  // for local files
  source: 'local' | 'github' | 'memory'
  dirty: boolean
}

// ---------- Sample in-memory files (shown when no folder connected) ----------

const SAMPLE_FILES: EditorTab[] = [
  {
    id: 'sample-1',
    path: '/sample/auth.ts',
    filename: 'auth.ts',
    content: `// AWECode demo — vulnerable auth code
import { query } from './db'

export async function login(username: string, password: string) {
  // Vulnerable: SQL injection via string concat
  const sql = "SELECT * FROM users WHERE name = '" + username + "' AND password = '" + password + "'"
  const result = await query(sql)
  return result[0]
}

export function checkPassword(input: string, hash: string) {
  const crypto = require('crypto')
  const inputHash = crypto.createHash('md5').update(input).digest('hex')
  return inputHash === hash
}

export function generateToken() {
  return Math.random().toString(36).substring(2)
}

export function evalUserCode(code: string) {
  return eval(code)
}

export const apiKey = 'sk_live_4242424242424242'
`,
    originalContent: '',
    language: 'typescript',
    source: 'memory',
    dirty: false,
  },
]

// ---------- Component ----------

export default function Home() {
  const { toast } = useToast()

  // Tabs
  const [tabs, setTabs] = useState<EditorTab[]>(SAMPLE_FILES)
  const [activeTabId, setActiveTabId] = useState<string | null>(SAMPLE_FILES[0].id)

  // UI state
  const [theme, setTheme] = useState<'awe-dark' | 'awe-light'>('awe-dark')
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [showBottomPanel, setShowBottomPanel] = useState(true)
  const [leftTab, setLeftTab] = useState<'local' | 'github' | 'docs'>('local')
  const [rightTab, setRightTab] = useState<'problems' | 'functions' | 'ai' | 'preview'>('ai')
  const [problemsTab, setProblemsTab] = useState<'lint' | 'vulns' | 'refactor' | 'correct'>('lint')

  // Analysis state
  const [lint, setLint] = useState<any>(null)
  const [vulns, setVulns] = useState<any>(null)
  const [refactor, setRefactor] = useState<any>(null)
  const [corrections, setCorrections] = useState<any>(null)
  const [deepScanResults, setDeepScanResults] = useState<any>(null)
  const [folderScanResults, setFolderScanResults] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [deepScanning, setDeepScanning] = useState(false)
  const [folderScanning, setFolderScanning] = useState(false)
  const [terminalHeight, setTerminalHeight] = useState(220)

  // Terminal state
  const [terminalLines, setTerminalLines] = useState<Array<{ type: 'info' | 'success' | 'error' | 'command'; text: string }>>([
    { type: 'info', text: 'AWECode v3.0 — Real VS Code-style editor with AI agent' },
    { type: 'info', text: '✓ Local file system access with folder persistence (Chrome/Edge)' },
    { type: 'info', text: '✓ GitHub OAuth login + token + PR creation' },
    { type: 'info', text: '✓ AI Agent chat with tool calling (Z.ai, OpenAI, Anthropic)' },
    { type: 'info', text: '✓ 100% offline linter & vulnerability scanner' },
    { type: 'info', text: '✓ AI-powered deep vulnerability scanner' },
    { type: 'info', text: '✓ Whole-folder scan (all open files at once)' },
    { type: 'info', text: '✓ Real shell terminal (sandboxed)' },
    { type: 'info', text: '✓ Live website preview (HTML/CSS/JS)' },
    { type: 'info', text: '✓ 1000+ function library + 16 searchable LIB docs' },
  ])

  // Command palette
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteMode, setPaletteMode] = useState<'commands' | 'files'>('commands')

  // File system save handler (set by LocalFilesPanel)
  const saveHandlerRef = useRef<((path: string, content: string) => Promise<void>) | null>(null)

  // Refs
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 })

  // ---------- Derived state ----------

  const activeTab = tabs.find(t => t.id === activeTabId) || null
  const code = activeTab?.content || ''
  const filename = activeTab?.filename || 'untitled'
  const detectedLanguage = useMemo(() => detectLanguageByFilename(filename), [filename])
  const effectiveLanguage = activeTab?.language || detectedLanguage.id

  const languagesByCat = useMemo(() => getLanguagesByCategory(), [])

  // ---------- Logging ----------

  const log = useCallback((type: 'info' | 'success' | 'error' | 'command', text: string) => {
    setTerminalLines(prev => [...prev.slice(-100), { type, text }])
  }, [])

  // ---------- Tab management ----------

  const openTab = useCallback((tab: Omit<EditorTab, 'id' | 'dirty'>) => {
    setTabs(prev => {
      // If a tab with the same path exists, activate it
      const existing = prev.find(t => t.path === tab.path)
      if (existing) {
        setActiveTabId(existing.id)
        return prev
      }
      const newTab: EditorTab = {
        ...tab,
        id: crypto.randomUUID(),
        originalContent: tab.content,
        dirty: false,
      }
      setActiveTabId(newTab.id)
      return [...prev, newTab]
    })
  }, [])

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      const idx = prev.findIndex(t => t.id === id)
      if (idx === -1) return prev
      const newTabs = prev.filter(t => t.id !== id)
      if (activeTabId === id) {
        const next = newTabs[idx] || newTabs[idx - 1] || newTabs[0] || null
        setActiveTabId(next?.id || null)
      }
      return newTabs
    })
  }, [activeTabId])

  const updateTabContent = useCallback((id: string, content: string) => {
    setTabs(prev => prev.map(t =>
      t.id === id ? { ...t, content, dirty: content !== t.originalContent } : t
    ))
  }, [])

  // ---------- File operations ----------

  const handleOpenFile = useCallback((path: string, content: string, handle?: FileSystemFileHandle, source: 'local' | 'github' | 'memory' = 'memory') => {
    const filename = path.split('/').pop() || 'untitled'
    const lang = detectLanguageByFilename(filename)
    openTab({
      path,
      filename,
      content,
      language: lang.id,
      handle,
      source,
    })
    log('info', `Opened: ${path}`)
  }, [openTab, log])

  const handleSave = useCallback(async () => {
    if (!activeTab) return
    try {
      if (activeTab.source === 'local' && activeTab.handle && saveHandlerRef.current) {
        await saveHandlerRef.current(activeTab.path, activeTab.content)
      } else if (activeTab.source === 'local' && !activeTab.handle) {
        // Download as file
        const blob = new Blob([activeTab.content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = activeTab.filename
        a.click()
        URL.revokeObjectURL(url)
      }
      // Mark as not dirty
      setTabs(prev => prev.map(t =>
        t.id === activeTab.id ? { ...t, dirty: false, originalContent: t.content } : t
      ))
      log('success', `Saved ${activeTab.filename}`)
      toast({ title: 'File saved', description: activeTab.filename })
    } catch (e: any) {
      log('error', `Save failed: ${e.message}`)
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' })
    }
  }, [activeTab, log, toast])

  const handleDownload = useCallback(() => {
    if (!activeTab) return
    const blob = new Blob([activeTab.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = activeTab.filename
    a.click()
    URL.revokeObjectURL(url)
    log('info', `Downloaded ${activeTab.filename}`)
  }, [activeTab, log])

  const handleUpload = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const content = ev.target?.result as string
        handleOpenFile(`/${file.name}`, content, undefined, 'memory')
      }
      reader.readAsText(file)
    }
    input.click()
  }, [handleOpenFile])

  // ---------- Analysis actions ----------

  const handleAnalyze = useCallback(async () => {
    if (!activeTab) return
    setAnalyzing(true)
    log('command', `awecode analyze ${filename}`)
    try {
      const res = await fetch('/api/aweai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: effectiveLanguage, filename }),
      })
      const json = await res.json()
      if (json.ok) {
        setLint(json.data.lint)
        setVulns(json.data.vulnerabilities)
        setRefactor(json.data.refactoring)
        setCorrections(json.data.corrections)
        const s = json.data.summary
        log('success', `Analyzed in ${json.meta?.durationMs}ms`)
        log('info', `  Lint: ${s.errors} errors, ${s.warnings} warnings`)
        log('info', `  Security: ${s.criticalVulns} critical (score: ${s.securityScore}/100)`)
        log('info', `  Refactor: ${s.refactorOpportunities} opportunities`)
        log('info', `  Auto-fix: ${s.autoFixable} corrections`)
        setRightTab('problems')
        setProblemsTab('lint')
        toast({ title: 'Analysis complete', description: `${s.errors + s.warnings} lint issues · ${s.criticalVulns} critical vulns` })
      } else {
        log('error', `Error: ${json.error}`)
      }
    } catch (e) {
      log('error', `Failed: ${e}`)
    }
    setAnalyzing(false)
  }, [activeTab, code, effectiveLanguage, filename, log, toast])

  const handleLint = useCallback(async () => {
    if (!activeTab) return
    setAnalyzing(true)
    log('command', `awecode lint ${filename}`)
    try {
      const res = await fetch('/api/aweai/lint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: effectiveLanguage, filename }),
      })
      const json = await res.json()
      if (json.ok) {
        setLint(json.data)
        setRightTab('problems')
        setProblemsTab('lint')
        log('success', `Lint: ${json.data.stats.total} problems in ${json.meta?.durationMs}ms`)
        toast({ title: 'Lint complete', description: `${json.data.stats.errors} errors · ${json.data.stats.warnings} warnings` })
      }
    } catch (e) {
      log('error', `Failed: ${e}`)
    }
    setAnalyzing(false)
  }, [activeTab, code, effectiveLanguage, filename, log, toast])

  const handleScan = useCallback(async () => {
    if (!activeTab) return
    setAnalyzing(true)
    log('command', `awecode scan ${filename}`)
    try {
      const res = await fetch('/api/aweai/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: effectiveLanguage, filename }),
      })
      const json = await res.json()
      if (json.ok) {
        setVulns(json.data)
        setRightTab('problems')
        setProblemsTab('vulns')
        log('success', `Scan: ${json.data.stats.total} vulns, score ${json.data.stats.score}/100`)
        toast({ title: 'Scan complete', description: `${json.data.stats.critical} critical · score ${json.data.stats.score}` })
      }
    } catch (e) {
      log('error', `Failed: ${e}`)
    }
    setAnalyzing(false)
  }, [activeTab, code, effectiveLanguage, filename, log, toast])

  const handleRefactor = useCallback(async () => {
    if (!activeTab) return
    setAnalyzing(true)
    log('command', `awecode refactor ${filename}`)
    try {
      const res = await fetch('/api/aweai/refactor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: effectiveLanguage, filename, apply: false, mode: 'refactor' }),
      })
      const json = await res.json()
      if (json.ok) {
        setRefactor(json.data)
        setRightTab('problems')
        setProblemsTab('refactor')
        log('success', `Refactor: ${json.data.stats.total} opportunities`)
        toast({ title: 'Refactor analysis', description: `${json.data.stats.total} opportunities` })
      }
    } catch (e) {
      log('error', `Failed: ${e}`)
    }
    setAnalyzing(false)
  }, [activeTab, code, effectiveLanguage, filename, log, toast])

  const handleAutoFix = useCallback(async () => {
    if (!activeTab) return
    setAnalyzing(true)
    log('command', `awecode autofix ${filename}`)
    try {
      const res = await fetch('/api/aweai/refactor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: effectiveLanguage, filename, apply: false, mode: 'correct' }),
      })
      const json = await res.json()
      if (json.ok) {
        setCorrections(json.data)
        if (json.data.correctedCode && json.data.correctedCode !== code) {
          updateTabContent(activeTab.id, json.data.correctedCode)
          log('success', `Auto-fixed ${json.data.appliedCount} issues`)
          toast({ title: 'Auto-fix applied', description: `${json.data.appliedCount} corrections` })
        } else {
          log('info', `No auto-fixable issues`)
          toast({ title: 'Nothing to auto-fix' })
        }
        setRightTab('problems')
        setProblemsTab('correct')
      }
    } catch (e) {
      log('error', `Failed: ${e}`)
    }
    setAnalyzing(false)
  }, [activeTab, code, effectiveLanguage, filename, log, toast, updateTabContent])

  // AI Deep Vulnerability Scan (offline regex + AI analysis)
  const handleDeepScan = useCallback(async () => {
    if (!activeTab) return
    setDeepScanning(true)
    setDeepScanResults(null)
    log('command', `awecode deep-scan ${filename} (AI + offline)`)
    try {
      const aiProvider = typeof window !== 'undefined' ? (localStorage.getItem('awecode:ai-provider') || 'z-ai') : 'z-ai'
      const aiKey = typeof window !== 'undefined' ? (localStorage.getItem('awecode:ai-api-key') || '') : ''
      const aiModel = typeof window !== 'undefined' ? (localStorage.getItem('awecode:ai-model') || '') : ''
      const res = await fetch('/api/ai-deep-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: effectiveLanguage,
          filename,
          provider: aiProvider,
          apiKey: aiKey || undefined,
          model: aiModel || undefined,
        }),
      })
      const json = await res.json()
      if (json.ok) {
        setDeepScanResults(json.data)
        const s = json.data.summary
        log('success', `Deep scan: ${s.totalFindings} findings (offline: ${s.offlineOnly}, AI: ${s.aiOnly})`)
        toast({
          title: 'AI Deep Scan complete',
          description: `${s.critical} critical · ${s.high} high · ${s.medium} medium`,
        })
        setRightTab('problems')
        setProblemsTab('vulns')
      } else {
        log('error', `Deep scan failed: ${json.error}`)
        toast({ title: 'Deep scan failed', description: json.error, variant: 'destructive' })
      }
    } catch (e: any) {
      log('error', `Deep scan failed: ${e.message}`)
      toast({ title: 'Deep scan failed', description: e.message, variant: 'destructive' })
    }
    setDeepScanning(false)
  }, [activeTab, code, effectiveLanguage, filename, log, toast])

  // Scan all files in current folder
  const handleScanFolder = useCallback(async () => {
    setFolderScanning(true)
    setFolderScanResults(null)
    log('command', `awecode scan-folder (all open files: ${tabs.length})`)
    try {
      const files = tabs.map(t => ({ path: t.path, content: t.content }))
      const res = await fetch('/api/folder-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, mode: 'analyze' }),
      })
      const json = await res.json()
      if (json.ok) {
        setFolderScanResults(json.data)
        const s = json.data.summary
        log('success', `Folder scan: ${json.data.filesScanned} files, ${s.totalErrors} errors, ${s.totalVulnerabilities} vulns (score: ${s.securityScore})`)
        toast({
          title: 'Folder scan complete',
          description: `${json.data.filesScanned} files · ${s.totalCritical} critical · score ${s.securityScore}`,
        })
        setRightTab('problems')
        setProblemsTab('vulns')
      } else {
        log('error', `Folder scan failed: ${json.error}`)
        toast({ title: 'Folder scan failed', description: json.error, variant: 'destructive' })
      }
    } catch (e: any) {
      log('error', `Folder scan failed: ${e.message}`)
      toast({ title: 'Folder scan failed', description: e.message, variant: 'destructive' })
    }
    setFolderScanning(false)
  }, [tabs, log, toast])

  const handleJumpTo = useCallback((line: number, column: number) => {
    if (editorRef.current && monacoRef.current) {
      editorRef.current.revealLineInCenter(line)
      editorRef.current.setPosition({ lineNumber: line, column })
      editorRef.current.focus()
    }
  }, [])

  const handleInsertFunction = useCallback((codeToInsert: string, name: string) => {
    if (editorRef.current) {
      const position = editorRef.current.getPosition()
      editorRef.current.executeEdits('insert-function', [{
        range: new monacoRef.current.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column,
        ),
        text: codeToInsert,
      }])
      editorRef.current.focus()
      log('info', `Inserted function: ${name}`)
    }
  }, [log])

  const handleApplyCode = useCallback((newCode: string) => {
    if (activeTab) {
      updateTabContent(activeTab.id, newCode)
      toast({ title: 'Code applied' })
    }
  }, [activeTab, updateTabContent, toast])

  const handleInsertCode = useCallback((newCode: string) => {
    if (editorRef.current) {
      const position = editorRef.current.getPosition()
      editorRef.current.executeEdits('ai-insert', [{
        range: new monacoRef.current.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        text: newCode,
      }])
      editorRef.current.focus()
      toast({ title: 'Code inserted' })
    }
  }, [toast])

  // ---------- GitHub clone handler ----------

  const handleCloneToFiles = useCallback((files: Array<{ path: string; content: string }>, repoName: string) => {
    // Open the first file in a new tab and inform the user
    if (files.length > 0) {
      const first = files[0]
      handleOpenFile(`/${repoName}/${first.path}`, first.content, undefined, 'github')
      log('success', `Cloned ${files.length} files from ${repoName}`)
      log('info', `First file opened: ${first.path}`)
      log('info', `All ${files.length} files are available — open more from the GitHub panel`)
    }
  }, [handleOpenFile, log])

  // ---------- Command palette ----------

  const commands = useMemo(() => [
    { id: 'analyze', label: 'Analyze: Run Full Analysis', icon: Sparkles, category: 'analysis', shortcut: '⇧⌘A', action: handleAnalyze },
    { id: 'lint', label: 'Analyze: Lint Code', icon: Bug, category: 'analysis', shortcut: '⇧⌘L', action: handleLint },
    { id: 'scan', label: 'Analyze: Scan Vulnerabilities', icon: ShieldAlert, category: 'analysis', shortcut: '⇧⌘S', action: handleScan },
    { id: 'refactor', label: 'Analyze: Refactor', icon: Wrench, category: 'analysis', action: handleRefactor },
    { id: 'autofix', label: 'Analyze: Auto-Fix', icon: Zap, category: 'analysis', action: handleAutoFix },
    { id: 'save', label: 'File: Save', icon: Save, category: 'file', shortcut: '⌘S', action: handleSave },
    { id: 'download', label: 'File: Download', icon: Download, category: 'file', action: handleDownload },
    { id: 'upload', label: 'File: Upload', icon: Upload, category: 'file', action: handleUpload },
    { id: 'open-folder', label: 'Local: Open Folder (File System Access)', icon: FolderOpen, category: 'local', action: () => setLeftTab('local') },
    { id: 'github', label: 'GitHub: Connect / Browse', icon: Github, category: 'github', action: () => setLeftTab('github') },
    { id: 'ai', label: 'AI: Open Chat', icon: Brain, category: 'ai', action: () => setRightTab('ai') },
    { id: 'docs', label: 'View: Open Documentation (LIB)', icon: BookOpen, category: 'view', action: () => setLeftTab('docs') },
    { id: 'theme', label: 'Editor: Toggle Theme', icon: theme === 'awe-dark' ? Sun : Moon, category: 'editor', action: () => setTheme(t => t === 'awe-dark' ? 'awe-light' : 'awe-dark') },
    { id: 'toggle-left', label: 'View: Toggle Sidebar', icon: PanelLeft, category: 'view', shortcut: '⌘B', action: () => setShowLeftPanel(v => !v) },
    { id: 'toggle-right', label: 'View: Toggle Right Panel', icon: PanelRight, category: 'view', action: () => setShowRightPanel(v => !v) },
    { id: 'toggle-bottom', label: 'View: Toggle Terminal', icon: PanelBottom, category: 'view', shortcut: '⌘`', action: () => setShowBottomPanel(v => !v) },
  ], [handleAnalyze, handleLint, handleScan, handleRefactor, handleAutoFix, handleSave, handleDownload, handleUpload, theme])

  const paletteFiles = useMemo(() => tabs.map(t => ({ name: t.filename, path: t.path })), [tabs])

  // ---------- Keyboard shortcuts ----------

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey

      // Command palette
      if (meta && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault()
        setPaletteMode('commands')
        setPaletteOpen(true)
        return
      }
      // Quick open
      if (meta && !e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault()
        setPaletteMode('files')
        setPaletteOpen(true)
        return
      }
      // Save
      if (meta && (e.key === 's' || e.key === 'S') && !e.shiftKey) {
        e.preventDefault()
        handleSave()
        return
      }
      // Analyze all
      if (meta && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault()
        handleAnalyze()
        return
      }
      // Scan
      if (meta && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault()
        handleScan()
        return
      }
      // Toggle sidebar
      if (meta && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault()
        setShowLeftPanel(v => !v)
        return
      }
      // Toggle terminal
      if (meta && e.key === '`') {
        e.preventDefault()
        setShowBottomPanel(v => !v)
        return
      }
      // Close tab
      if (meta && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault()
        if (activeTabId) closeTab(activeTabId)
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave, handleAnalyze, handleScan, activeTabId, closeTab])

  const editorLanguage = useMemo(() => detectLanguageByFilename(filename).monacoId, [filename])

  // ---------- Render ----------

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top Menu Bar */}
      <header className="h-12 border-b border-zinc-800 flex items-center px-3 gap-1 bg-zinc-950 flex-shrink-0">
        <div className="flex items-center gap-2 pr-3 border-r border-zinc-800">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-500 flex items-center justify-center font-black text-white text-xs">
            A
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-bold leading-none bg-gradient-to-r from-violet-300 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent">
              AWECode
            </div>
            <div className="text-[9px] text-zinc-500 leading-none mt-0.5">v3.0 · {LANGUAGE_COUNT}+ langs · 1000+ fns · AI</div>
          </div>
        </div>

        <nav className="flex items-center gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 rounded">File</button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-zinc-900 border-zinc-800 text-zinc-200">
              <DropdownMenuItem onClick={handleSave} className="text-xs">
                <Save className="h-3.5 w-3.5 mr-2" /> Save <span className="ml-auto text-[10px] text-zinc-500">⌘S</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleUpload} className="text-xs">
                <Upload className="h-3.5 w-3.5 mr-2" /> Upload File...
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload} className="text-xs">
                <Download className="h-3.5 w-3.5 mr-2" /> Download
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem onClick={() => { setPaletteMode('commands'); setPaletteOpen(true) }} className="text-xs">
                <Plus className="h-3.5 w-3.5 mr-2" /> Command Palette <span className="ml-auto text-[10px] text-zinc-500">⇧⌘P</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 rounded">Edit</button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-zinc-900 border-zinc-800 text-zinc-200">
              <DropdownMenuItem onClick={() => editorRef.current?.getAction('editor.action.formatDocument')?.run()} className="text-xs">
                <Code2 className="h-3.5 w-3.5 mr-2" /> Format Document <span className="ml-auto text-[10px] text-zinc-500">⇧⌥F</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAutoFix} disabled={analyzing} className="text-xs">
                {analyzing ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Zap className="h-3.5 w-3.5 mr-2" />} Auto-fix Code
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRefactor} disabled={analyzing} className="text-xs">
                {analyzing ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Wrench className="h-3.5 w-3.5 mr-2" />} Suggest Refactors
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 rounded">View</button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-zinc-900 border-zinc-800 text-zinc-200">
              <DropdownMenuItem onClick={() => setShowLeftPanel(v => !v)} className="text-xs">
                <PanelLeft className="h-3.5 w-3.5 mr-2" /> Toggle Sidebar <span className="ml-auto text-[10px] text-zinc-500">⌘B</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowRightPanel(v => !v)} className="text-xs">
                <PanelRight className="h-3.5 w-3.5 mr-2" /> Toggle Right Panel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowBottomPanel(v => !v)} className="text-xs">
                <PanelBottom className="h-3.5 w-3.5 mr-2" /> Toggle Terminal <span className="ml-auto text-[10px] text-zinc-500">⌘`</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem onClick={() => setTheme(t => t === 'awe-dark' ? 'awe-light' : 'awe-dark')} className="text-xs">
                {theme === 'awe-dark' ? <Sun className="h-3.5 w-3.5 mr-2" /> : <Moon className="h-3.5 w-3.5 mr-2" />} Toggle Theme
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRightTab('preview')} className="text-xs">
                <Eye className="h-3.5 w-3.5 mr-2" /> Live Preview
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 rounded">Run</button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-zinc-900 border-zinc-800 text-zinc-200">
              <DropdownMenuItem onClick={handleAnalyze} disabled={analyzing} className="text-xs">
                {analyzing ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-2" />} Analyze All <span className="ml-auto text-[10px] text-zinc-500">⇧⌘A</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLint} disabled={analyzing} className="text-xs">
                {analyzing ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Bug className="h-3.5 w-3.5 mr-2" />} Lint Code <span className="ml-auto text-[10px] text-zinc-500">⇧⌘L</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleScan} disabled={analyzing} className="text-xs">
                {analyzing ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <ShieldAlert className="h-3.5 w-3.5 mr-2" />} Scan Vulnerabilities <span className="ml-auto text-[10px] text-zinc-500">⇧⌘S</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem onClick={handleDeepScan} disabled={deepScanning} className="text-xs">
                {deepScanning ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <ScanSearch className="h-3.5 w-3.5 mr-2" />} AI Deep Scan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleScanFolder} disabled={folderScanning} className="text-xs">
                {folderScanning ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <FolderTree className="h-3.5 w-3.5 mr-2" />} Scan Whole Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 rounded">Help</button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-zinc-900 border-zinc-800 text-zinc-200">
              <DropdownMenuItem onClick={() => setLeftTab('docs')} className="text-xs">
                <BookOpen className="h-3.5 w-3.5 mr-2" /> Open LIB Documentation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setPaletteMode('commands'); setPaletteOpen(true) }} className="text-xs">
                <Keyboard className="h-3.5 w-3.5 mr-2" /> Keyboard Shortcuts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRightTab('ai')} className="text-xs">
                <Bot className="h-3.5 w-3.5 mr-2" /> Ask AI for Help
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex-1" />

        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100"
          onClick={() => { setPaletteMode('commands'); setPaletteOpen(true) }}
          title="Command Palette (Ctrl+Shift+P)"
        >
          <CmdIcon className="h-3.5 w-3.5" />
        </Button>

        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-8 text-xs gap-1.5 text-zinc-300" onClick={handleSave}>
            <Save className="h-3.5 w-3.5" /> Save
          </Button>

          <Button size="sm" variant="ghost" className="h-8 text-xs gap-1.5 text-blue-300 hover:text-blue-200 hover:bg-blue-500/10" onClick={handleLint} disabled={analyzing}>
            {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bug className="h-3.5 w-3.5" />} Lint
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs gap-1.5 text-red-300 hover:text-red-200 hover:bg-red-500/10" onClick={handleScan} disabled={analyzing}>
            {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldAlert className="h-3.5 w-3.5" />} Scan
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs gap-1.5 text-amber-300 hover:text-amber-200 hover:bg-amber-500/10" onClick={handleRefactor} disabled={analyzing}>
            {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wrench className="h-3.5 w-3.5" />} Refactor
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs gap-1.5 text-violet-300 hover:text-violet-200 hover:bg-violet-500/10" onClick={handleAutoFix} disabled={analyzing}>
            {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />} Auto-fix
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs gap-1.5 text-fuchsia-300 hover:text-fuchsia-200 hover:bg-fuchsia-500/10"
            onClick={handleDeepScan}
            disabled={deepScanning}
            title="AI-powered deep vulnerability scan"
          >
            {deepScanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanSearch className="h-3.5 w-3.5" />} Deep Scan
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs gap-1.5 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10"
            onClick={handleScanFolder}
            disabled={folderScanning}
            title="Scan all open files (whole folder)"
          >
            {folderScanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FolderTree className="h-3.5 w-3.5" />} Scan Folder
          </Button>

          <Button
            size="sm"
            className="h-8 ml-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs gap-1.5"
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Analyze
          </Button>

          <div className="h-5 w-px bg-zinc-800 mx-1" />

          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-zinc-400" onClick={() => setTheme(t => t === 'awe-dark' ? 'awe-light' : 'awe-dark')}>
            {theme === 'awe-dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </header>

      {/* Tabs bar */}
      <div className="h-9 border-b border-zinc-800 flex items-center bg-zinc-950 flex-shrink-0 overflow-x-auto">
        {tabs.map(tab => (
          <div
            key={tab.id}
            role="tab"
            tabIndex={0}
            onClick={() => setActiveTabId(tab.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTabId(tab.id) } }}
            className={cn(
              'group flex items-center gap-1.5 px-3 h-full border-r border-zinc-800 text-xs transition-colors cursor-pointer',
              tab.id === activeTabId ? 'bg-zinc-900 text-zinc-100' : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'
            )}
          >
            <FileCode className={cn(
              'h-3 w-3 flex-shrink-0',
              tab.source === 'local' ? 'text-emerald-400' : tab.source === 'github' ? 'text-violet-400' : 'text-zinc-500'
            )} />
            <span className="font-mono truncate max-w-[160px]">{tab.filename}</span>
            {tab.dirty && <span className="text-amber-400 text-[10px]">●</span>}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
              className="ml-1 text-zinc-600 hover:text-zinc-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label={`Close ${tab.filename}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <div className="flex-1" />
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-400" onClick={() => setShowLeftPanel(v => !v)} title="Toggle sidebar">
          <PanelLeft className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Secondary toolbar */}
      <div className="h-9 border-b border-zinc-800 flex items-center px-3 gap-2 bg-zinc-950 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <FileCode className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-zinc-200 font-mono">{filename}</span>
          {activeTab?.dirty && <span className="text-amber-400 text-[10px]">●</span>}
          <Badge variant="outline" className="text-[10px] bg-zinc-900 border-zinc-700 text-zinc-400 px-1.5 py-0">
            {detectedLanguage.label}
          </Badge>
          {activeTab?.source === 'local' && (
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-300 border-emerald-500/30 px-1.5 py-0">
              <HardDrive className="h-2.5 w-2.5 mr-1" /> Local
            </Badge>
          )}
          {activeTab?.source === 'github' && (
            <Badge variant="outline" className="text-[10px] bg-violet-500/10 text-violet-300 border-violet-500/30 px-1.5 py-0">
              <Github className="h-2.5 w-2.5 mr-1" /> GitHub
            </Badge>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          {lint && (
            <Badge variant="outline" className="text-[10px] bg-zinc-900 border-zinc-800 text-zinc-400">
              <Bug className="h-3 w-3 mr-1 text-blue-400" /> {lint.stats.total}
            </Badge>
          )}
          {vulns && (
            <Badge variant="outline" className={cn(
              'text-[10px] border-zinc-800',
              vulns.stats.critical > 0 ? 'bg-red-500/10 text-red-300 border-red-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            )}>
              <ShieldAlert className="h-3 w-3 mr-1" /> {vulns.stats.total} (score: {vulns.stats.score})
            </Badge>
          )}
        </div>

        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-400" onClick={() => setShowRightPanel(v => !v)}>
          <PanelRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Main editor layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel */}
        {showLeftPanel && (
          <aside className="w-64 border-r border-zinc-800 flex-shrink-0 flex flex-col">
            <Tabs value={leftTab} onValueChange={(v: any) => setLeftTab(v)} className="flex-1 flex flex-col">
              <TabsList className="grid grid-cols-3 bg-zinc-950 border-b border-zinc-800 rounded-none h-9">
                <TabsTrigger value="local" className="text-[10px] data-[state=active]:bg-zinc-900 data-[state=active]:text-emerald-300">
                  <HardDrive className="h-3 w-3 mr-1" /> Files
                </TabsTrigger>
                <TabsTrigger value="github" className="text-[10px] data-[state=active]:bg-zinc-900 data-[state=active]:text-violet-300">
                  <Github className="h-3 w-3 mr-1" /> GitHub
                </TabsTrigger>
                <TabsTrigger value="docs" className="text-[10px] data-[state=active]:bg-zinc-900 data-[state=active]:text-amber-300">
                  <BookOpen className="h-3 w-3 mr-1" /> LIB
                </TabsTrigger>
              </TabsList>

              <TabsContent value="local" className="flex-1 mt-0 min-h-0">
                <LocalFilesPanel
                  onOpenFile={(path, content, handle) => handleOpenFile(path, content, handle, 'local')}
                  activePath={activeTab?.source === 'local' ? activeTab.path : undefined}
                  registerSaveHandler={(h) => { saveHandlerRef.current = h }}
                  onDisconnect={() => log('info', 'Disconnected from local folder')}
                  onScanFolder={handleScanFolder}
                  scanLoading={folderScanning}
                />
              </TabsContent>

              <TabsContent value="github" className="flex-1 mt-0 min-h-0">
                <GitHubPanel
                  onOpenFile={(path, content) => handleOpenFile(path, content, undefined, 'github')}
                  onCloneToFiles={handleCloneToFiles}
                />
              </TabsContent>

              <TabsContent value="docs" className="flex-1 mt-0 min-h-0">
                <DocsPanel />
              </TabsContent>
            </Tabs>
          </aside>
        )}

        {/* Center: Editor + Terminal */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Editor */}
          <div className="flex-1 min-h-0">
            {activeTab ? (
              <CodeEditor
                key={activeTab.id}
                value={activeTab.content}
                language={effectiveLanguage}
                monacoLanguage={editorLanguage}
                theme={theme}
                onChange={(v) => updateTabContent(activeTab.id, v)}
                onMount={(ed, monaco) => {
                  editorRef.current = ed
                  monacoRef.current = monaco
                  ed.onDidChangeCursorPosition((e: any) => {
                    setCursorPos({ line: e.position.lineNumber, col: e.position.column })
                  })
                }}
                path={activeTab.path}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500">
                <div className="text-center">
                  <FileCode className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
                  <p className="text-sm">No file open</p>
                  <p className="text-xs mt-1">Open a file from the sidebar, or press <kbd className="border border-zinc-700 rounded px-1">Ctrl+P</kbd></p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom panel: Real Terminal */}
          {showBottomPanel && (
            <div className="border-t border-zinc-800 flex flex-col bg-zinc-950 flex-shrink-0" style={{ height: terminalHeight }}>
              <RealTerminal height={terminalHeight} onHeightChange={setTerminalHeight} />
            </div>
          )}
        </main>

        {/* Right panel */}
        {showRightPanel && (
          <aside className={cn('border-l border-zinc-800 flex-shrink-0 flex flex-col transition-all', rightTab === 'preview' ? 'w-[600px]' : 'w-96')}>
            <Tabs value={rightTab} onValueChange={(v: any) => setRightTab(v)} className="flex-1 flex flex-col">
              <TabsList className="grid grid-cols-4 bg-zinc-950 border-b border-zinc-800 rounded-none h-9">
                <TabsTrigger value="ai" className="text-xs data-[state=active]:bg-zinc-900 data-[state=active]:text-violet-300">
                  <Brain className="h-3.5 w-3.5 mr-1.5" /> AI
                </TabsTrigger>
                <TabsTrigger value="problems" className="text-xs data-[state=active]:bg-zinc-900 data-[state=active]:text-violet-300">
                  <Bug className="h-3.5 w-3.5 mr-1.5" /> Problems
                </TabsTrigger>
                <TabsTrigger value="functions" className="text-xs data-[state=active]:bg-zinc-900 data-[state=active]:text-violet-300">
                  <Code2 className="h-3.5 w-3.5 mr-1.5" /> Fns
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs data-[state=active]:bg-zinc-900 data-[state=active]:text-violet-300">
                  <Eye className="h-3.5 w-3.5 mr-1.5" /> Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ai" className="flex-1 mt-0 min-h-0">
                <AIChat
                  code={code}
                  language={effectiveLanguage}
                  filename={filename}
                  cursorLine={cursorPos.line}
                  onApplyCode={handleApplyCode}
                  onInsertCode={handleInsertCode}
                />
              </TabsContent>

              <TabsContent value="problems" className="flex-1 mt-0 min-h-0">
                <ProblemsPanel
                  lint={lint}
                  vulnerabilities={vulns}
                  refactor={refactor}
                  corrections={corrections}
                  onJumpTo={handleJumpTo}
                  activeTab={problemsTab}
                  onTabChange={setProblemsTab}
                />
              </TabsContent>

              <TabsContent value="functions" className="flex-1 mt-0 min-h-0">
                <FunctionCatalog onInsert={handleInsertFunction} language={effectiveLanguage} />
              </TabsContent>

              <TabsContent value="preview" className="flex-1 mt-0 min-h-0">
                <LivePreview files={tabs.map(t => ({ path: t.path, content: t.content }))} />
              </TabsContent>
            </Tabs>
          </aside>
        )}
      </div>

      {/* Status bar */}
      <footer className="h-6 border-t border-zinc-800 flex items-center px-3 gap-3 text-[10px] text-zinc-500 bg-zinc-950 flex-shrink-0">
        <span className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" /> main
        </span>
        <span className="flex items-center gap-1">
          <Code2 className="h-3 w-3" /> {detectedLanguage.label}
        </span>
        <span className="flex items-center gap-1">
          <Hash className="h-3 w-3" /> Ln {cursorPos.line}, Col {cursorPos.col}
        </span>
        <span className="flex items-center gap-1">
          <Database className="h-3 w-3" /> UTF-8
        </span>
        <span className="flex items-center gap-1">
          <Globe className="h-3 w-3" /> {effectiveLanguage}
        </span>
        <div className="flex-1" />
        <span className="flex items-center gap-1">
          <Lock className="h-3 w-3 text-emerald-400" /> 100% Offline Linter
        </span>
        <span className="flex items-center gap-1">
          <Cpu className="h-3 w-3" /> {LANGUAGE_COUNT}+ langs
        </span>
        <span className="flex items-center gap-1">
          <Layers className="h-3 w-3 text-violet-400" /> 1000+ fns
        </span>
        <span className="flex items-center gap-1">
          <Network className="h-3 w-3 text-fuchsia-400" /> AWEAI API
        </span>
      </footer>

      {/* Command palette */}
      <CommandPalette
        open={paletteOpen}
        mode={paletteMode}
        commands={commands}
        files={paletteFiles}
        onOpenFile={(path) => {
          const tab = tabs.find(t => t.path === path)
          if (tab) setActiveTabId(tab.id)
        }}
        onClose={() => setPaletteOpen(false)}
      />
    </div>
  )
}

// ---------- Docs Panel ----------

const LIB_DOCS = [
  { name: 'README.md', path: '00-overview', icon: BookOpen, desc: 'Overview & quick start' },
  { name: '01-editor.md', path: '01-editor', icon: Code2, desc: 'Editor features & shortcuts' },
  { name: '02-linter.md', path: '02-linter', icon: Bug, desc: 'Offline linter (40+ rules)' },
  { name: '03-vulnerabilities.md', path: '03-vulnerabilities', icon: ShieldAlert, desc: 'Vulnerability scanner (25+ rules)' },
  { name: '04-refactor.md', path: '04-refactor', icon: Wrench, desc: 'Refactoring & auto-fix' },
  { name: '05-functions.md', path: '05-functions', icon: Layers, desc: '1000+ function library' },
  { name: '06-local-files.md', path: '06-local-files', icon: HardDrive, desc: 'Local file system access & persistence' },
  { name: '07-github.md', path: '07-github', icon: Github, desc: 'GitHub OAuth, clone, commit, PR' },
  { name: '08-ai-agent.md', path: '08-ai-agent', icon: Brain, desc: 'AI agent chat (your API key)' },
  { name: '09-aweai-api.md', path: '09-aweai-api', icon: Network, desc: 'AWEAI REST API reference' },
  { name: '10-command-palette.md', path: '10-command-palette', icon: CmdIcon, desc: 'Command palette & quick open' },
  { name: '11-languages.md', path: '11-languages', icon: Globe, desc: '150+ supported languages' },
  { name: '12-shortcuts.md', path: '12-shortcuts', icon: Hash, desc: 'Keyboard shortcuts' },
  { name: '13-terminal.md', path: '13-terminal', icon: Terminal, desc: 'Real shell terminal' },
  { name: '14-live-preview.md', path: '14-live-preview', icon: Eye, desc: 'Live website preview' },
  { name: '15-errors.md', path: '15-errors', icon: AlertCircle, desc: 'Common errors & solutions' },
  { name: '16-faq.md', path: '16-faq', icon: HelpCircle, desc: 'Frequently asked questions' },
]

function DocsPanel() {
  const [activeDoc, setActiveDoc] = useState<string | null>(null)
  const [docContent, setDocContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const filteredDocs = useMemo(() => {
    if (!search) return LIB_DOCS
    const q = search.toLowerCase()
    return LIB_DOCS.filter(doc =>
      doc.name.toLowerCase().includes(q) ||
      doc.desc.toLowerCase().includes(q) ||
      doc.path.toLowerCase().includes(q)
    )
  }, [search])

  const openDoc = async (docPath: string) => {
    setActiveDoc(docPath)
    setLoading(true)
    try {
      const res = await fetch(`/api/lib?doc=${docPath === '00-overview' ? 'README' : docPath}`)
      if (res.ok) {
        setDocContent(await res.text())
      } else {
        setDocContent('Documentation file not found.')
      }
    } catch (e) {
      setDocContent('Failed to load documentation.')
    }
    setLoading(false)
  }

  if (activeDoc) {
    return (
      <div className="flex flex-col h-full bg-zinc-950">
        <div className="p-2 border-b border-zinc-800 flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-7 text-xs text-zinc-400" onClick={() => setActiveDoc(null)}>
            ← Back
          </Button>
          <BookOpen className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-mono text-zinc-200">{LIB_DOCS.find(d => d.path === activeDoc)?.name}</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 max-w-none prose prose-invert prose-sm">
            {loading ? (
              <div className="text-center py-8 text-xs text-zinc-500">Loading...</div>
            ) : (
              <div className="text-zinc-200 text-xs leading-relaxed [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-amber-300 [&_h1]:mb-2 [&_h1]:mt-3 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-violet-300 [&_h2]:mb-1.5 [&_h2]:mt-3 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-zinc-100 [&_h3]:mb-1 [&_h3]:mt-2 [&_p]:mb-2 [&_p]:text-zinc-300 [&_li]:text-zinc-300 [&_li]:ml-4 [&_li]:list-disc [&_code]:bg-zinc-900 [&_code]:border [&_code]:border-zinc-800 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[10px] [&_code]:font-mono [&_code]:text-emerald-300 [&_pre]:bg-zinc-900 [&_pre]:border [&_pre]:border-zinc-800 [&_pre]:rounded [&_pre]:p-2 [&_pre]:my-2 [&_pre_code]:bg-transparent [&_pre_code]:border-0 [&_pre_code]:p-0 [&_pre_code]:text-[10px] [&_pre_code]:text-zinc-200 [&_a]:text-violet-400 [&_a]:underline [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-zinc-800 [&_th]:bg-zinc-900 [&_th]:p-1.5 [&_th]:text-left [&_th]:text-[10px] [&_td]:border [&_td]:border-zinc-800 [&_td]:p-1.5 [&_td]:text-[10px] [&_blockquote]:border-l-2 [&_blockquote]:border-violet-500 [&_blockquote]:pl-2 [&_blockquote]:text-zinc-400">
                <ReactMarkdown>{docContent}</ReactMarkdown>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-2 border-b border-zinc-800 space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-semibold text-zinc-100">AWECode Library</span>
          <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-300 border-amber-500/30 ml-auto">
            {LIB_DOCS.length} docs
          </Badge>
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <Input
            placeholder="Search docs (e.g. 'github', 'terminal', 'error')..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-7 h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredDocs.length === 0 && (
            <div className="text-center py-8 text-xs text-zinc-500">
              No docs match "{search}"
            </div>
          )}
          {filteredDocs.map(doc => (
            <button
              key={doc.path}
              onClick={() => openDoc(doc.path)}
              className="w-full text-left p-2 rounded border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-amber-500/30"
            >
              <div className="flex items-center gap-1.5">
                <doc.icon className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                <span className="text-xs font-mono text-zinc-200 truncate">{doc.name}</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5 ml-5">{doc.desc}</div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
