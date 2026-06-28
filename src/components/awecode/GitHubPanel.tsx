'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Github, Search, RefreshCw, Folder, FileCode, Lock, LogOut, GitBranch, GitCommit, Loader2, ChevronRight, ChevronDown, Star, Eye, Clock, GitPullRequest, ExternalLink, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useGitHub, type GitHubRepo, type GitHubFile } from '@/hooks/use-github'
import { useToast } from '@/hooks/use-toast'
import { detectLanguageByFilename } from '@/lib/awecode/languages'
import { cn } from '@/lib/utils'

export interface GitHubPanelProps {
  onOpenFile?: (path: string, content: string) => void
  onCloneToFiles?: (files: Array<{ path: string; content: string }>, repoName: string) => void
}

export function GitHubPanel({ onOpenFile, onCloneToFiles }: GitHubPanelProps) {
  const gh = useGitHub()
  const [tokenInput, setTokenInput] = useState('')
  const [search, setSearch] = useState('')
  const [activeView, setActiveView] = useState<'repos' | 'files' | 'commits' | 'pr'>('repos')
  const [selectedFile, setSelectedFile] = useState<GitHubFile | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [commitMsg, setCommitMsg] = useState('')
  const [commitPath, setCommitPath] = useState('')
  const [commitContent, setCommitContent] = useState('')
  const [cloning, setCloning] = useState(false)

  // OAuth state
  const [oauthPending, setOauthPending] = useState(false)
  const [oauthUserCode, setOauthUserCode] = useState<string | null>(null)
  const [oauthUri, setOauthUri] = useState<string | null>(null)
  const oauthPollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // PR creation state
  const [prTitle, setPrTitle] = useState('')
  const [prBody, setPrBody] = useState('')
  const [prBranch, setPrBranch] = useState('')
  const [prFiles, setPrFiles] = useState<Array<{ path: string; content: string }>>([])
  const [creatingPR, setCreatingPR] = useState(false)
  const [prResult, setPrResult] = useState<{ url: string; number: number } | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  const { toast } = useToast()

  // Load stored token on mount
  useEffect(() => {
    const stored = gh.loadStoredToken()
    if (stored) {
      gh.connect(stored)
    }
    return () => {
      if (oauthPollRef.current) clearTimeout(oauthPollRef.current)
    }
  }, [])

  // OAuth device flow
  const startOAuth = async () => {
    setOauthPending(true)
    try {
      const res = await fetch('/api/auth/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.ok) {
        setOauthUserCode(data.user_code)
        setOauthUri(data.verification_uri)
        // Open GitHub device auth page in new tab
        window.open(data.verification_uri, '_blank')
        // Start polling
        pollOAuth(data.device_code, data.interval || 5)
      } else {
        toast({ title: 'OAuth failed', description: data.error, variant: 'destructive' })
        setOauthPending(false)
      }
    } catch (e: any) {
      toast({ title: 'OAuth failed', description: e.message, variant: 'destructive' })
      setOauthPending(false)
    }
  }

  const pollOAuth = async (deviceCode: string, interval: number) => {
    const poll = async () => {
      try {
        const res = await fetch('/api/auth/github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_code: deviceCode }),
        })
        const data = await res.json()
        if (data.ok && data.access_token) {
          // Success!
          setOauthPending(false)
          setOauthUserCode(null)
          setOauthUri(null)
          await gh.connect(data.access_token)
          toast({ title: 'GitHub connected', description: `Signed in as ${data.user?.login}` })
          return
        }
        if (data.status === 'pending' || data.status === 'slow_down') {
          // Keep polling
          const wait = (data.interval || interval) * 1000
          oauthPollRef.current = setTimeout(poll, wait)
        } else {
          setOauthPending(false)
          setOauthUserCode(null)
          toast({ title: 'OAuth failed', description: data.error || 'Authorization expired', variant: 'destructive' })
        }
      } catch (e) {
        oauthPollRef.current = setTimeout(poll, (interval + 1) * 1000)
      }
    }
    oauthPollRef.current = setTimeout(poll, interval * 1000)
  }

  const cancelOAuth = () => {
    if (oauthPollRef.current) clearTimeout(oauthPollRef.current)
    setOauthPending(false)
    setOauthUserCode(null)
    setOauthUri(null)
  }

  const copyUserCode = () => {
    if (oauthUserCode) {
      navigator.clipboard.writeText(oauthUserCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  // PR creation
  const handleCreatePR = async () => {
    if (!gh.selectedRepo || !prTitle || !prBranch || prFiles.length === 0) {
      toast({ title: 'Need title, branch name, and at least one file' })
      return
    }
    setCreatingPR(true)
    setPrResult(null)
    try {
      const res = await fetch('/api/github-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: gh.token,
          owner: gh.selectedRepo.owner.login,
          repo: gh.selectedRepo.name,
          baseBranch: gh.selectedRepo.default_branch,
          newBranch: prBranch,
          files: prFiles,
          commitMessage: prTitle,
          prTitle,
          prBody: prBody || `Created via AWECode`,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setPrResult({ url: data.pr.url, number: data.pr.number })
        toast({ title: `PR #${data.pr.number} created`, description: data.pr.url })
      } else {
        toast({ title: 'PR failed', description: data.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'PR failed', description: e.message, variant: 'destructive' })
    }
    setCreatingPR(false)
  }

  const addCurrentFileToPR = () => {
    if (!commitPath || !commitContent) return
    setPrFiles(prev => {
      const filtered = prev.filter(f => f.path !== commitPath)
      return [...filtered, { path: commitPath, content: commitContent }]
    })
    toast({ title: `Added ${commitPath} to PR (${prFiles.length + 1} files)` })
  }

  const filteredRepos = gh.repos.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.full_name.toLowerCase().includes(search.toLowerCase())
  )

  const handleConnect = async () => {
    if (!tokenInput.trim()) return
    const ok = await gh.connect(tokenInput.trim())
    if (ok) toast({ title: 'Connected to GitHub', description: gh.user?.login })
    else toast({ title: 'Connection failed', description: gh.error, variant: 'destructive' })
  }

  const handleDisconnect = () => {
    gh.disconnect()
    setTokenInput('')
    setActiveView('repos')
    toast({ title: 'Disconnected from GitHub' })
  }

  const handleOpenFile = async (file: GitHubFile) => {
    if (!gh.selectedRepo) return
    setSelectedFile(file)
    try {
      const content = await gh.getFileContent(gh.selectedRepo, file.path)
      setFileContent(content)
      onOpenFile?.(file.path, content)
    } catch (e: any) {
      toast({ title: 'Failed to load file', description: e.message, variant: 'destructive' })
    }
  }

  const handleClone = async () => {
    if (!gh.selectedRepo) return
    setCloning(true)
    try {
      // Fetch the file tree, then fetch each file's content
      const files: Array<{ path: string; content: string }> = []
      for (const file of gh.fileTree.slice(0, 200)) { // limit to 200 files
        try {
          const content = await gh.getFileContent(gh.selectedRepo, file.path)
          files.push({ path: file.path, content })
        } catch {}
      }
      if (files.length === 0) {
        toast({ title: 'No files to clone', variant: 'destructive' })
        setCloning(false)
        return
      }
      onCloneToFiles?.(files, gh.selectedRepo.name)
      toast({ title: `Cloned ${files.length} files`, description: gh.selectedRepo.full_name })
    } catch (e: any) {
      toast({ title: 'Clone failed', description: e.message, variant: 'destructive' })
    }
    setCloning(false)
  }

  const handleCommit = async () => {
    if (!gh.selectedRepo || !commitPath || !commitMsg) {
      toast({ title: 'Need path, content, and message' })
      return
    }
    const ok = await gh.commitFile(gh.selectedRepo, commitPath, commitContent, commitMsg)
    if (ok) {
      toast({ title: 'Committed to GitHub', description: commitMsg })
      setCommitMsg('')
    } else {
      toast({ title: 'Commit failed', description: gh.error, variant: 'destructive' })
    }
  }

  // ---------- Not connected ----------
  if (!gh.user) {
    return (
      <div className="flex flex-col h-full bg-zinc-950 p-3 overflow-y-auto">
        <div className="flex items-center gap-2 mb-3">
          <Github className="h-5 w-5 text-zinc-300" />
          <span className="text-sm font-semibold text-zinc-100">Connect to GitHub</span>
        </div>

        {/* OAuth login (recommended) */}
        <div className="border border-violet-500/30 bg-violet-500/5 rounded-md p-3 mb-3">
          <div className="text-xs font-semibold text-violet-300 mb-1">Sign in with GitHub (recommended)</div>
          <p className="text-[10px] text-zinc-400 mb-2">
            OAuth device flow — no token needed. You'll authorize AWECode on github.com.
          </p>
          {oauthPending ? (
            <div className="space-y-2">
              {oauthUserCode && (
                <div className="bg-zinc-900 border border-zinc-700 rounded p-2 text-center">
                  <div className="text-[10px] text-zinc-500 mb-1">Enter this code on GitHub:</div>
                  <button
                    onClick={copyUserCode}
                    className="text-2xl font-mono font-bold tracking-wider text-violet-300 hover:text-violet-200 inline-flex items-center gap-2"
                  >
                    {oauthUserCode}
                    {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              )}
              {oauthUri && (
                <a
                  href={oauthUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-violet-400 hover:underline flex items-center gap-1 justify-center"
                >
                  <ExternalLink className="h-3 w-3" /> {oauthUri}
                </a>
              )}
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
                <Loader2 className="h-3 w-3 animate-spin" /> Waiting for authorization...
              </div>
              <Button size="sm" variant="ghost" className="w-full h-7 text-xs text-zinc-400" onClick={cancelOAuth}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white"
              onClick={startOAuth}
            >
              <Github className="h-3.5 w-3.5 mr-2" /> Sign in with GitHub
            </Button>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-[10px] text-zinc-500 uppercase">or use token</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        <p className="text-xs text-zinc-400 mb-2">
          Use a Personal Access Token instead.
        </p>
        <Input
          type="password"
          value={tokenInput}
          onChange={e => setTokenInput(e.target.value)}
          placeholder="ghp_... (classic) or github_pat_... (fine-grained)"
          className="bg-zinc-900 border-zinc-800 text-zinc-100 font-mono text-xs mb-2"
        />
        <Button
          className="bg-zinc-800 hover:bg-zinc-700 text-white"
          disabled={!tokenInput.trim() || gh.loading}
          onClick={handleConnect}
        >
          {gh.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Lock className="h-3.5 w-3.5 mr-2" />}
          Connect with Token
        </Button>
        {gh.error && <p className="text-[10px] text-red-400 mt-2">{gh.error}</p>}
        <div className="mt-4 text-[10px] text-zinc-500 space-y-1">
          <p className="font-semibold text-zinc-400">Get a token:</p>
          <p>1. Go to github.com/settings/tokens</p>
          <p>2. Generate new token (classic)</p>
          <p>3. Select scopes: <code className="text-violet-400">repo</code>, <code className="text-violet-400">read:user</code></p>
          <p>4. Copy and paste above</p>
        </div>
        <div className="mt-3 text-[10px] text-zinc-500 bg-zinc-900/50 border border-zinc-800 rounded p-2">
          <p className="font-semibold text-zinc-400 mb-1">🔒 Privacy</p>
          <p>Your token is stored only in your browser's localStorage and sent directly to api.github.com. It never touches AWECode's server.</p>
        </div>
      </div>
    )
  }

  // ---------- Connected ----------
  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="p-2 border-b border-zinc-800 space-y-2">
        <div className="flex items-center gap-2">
          <Github className="h-4 w-4 text-zinc-300" />
          <span className="text-xs font-semibold text-zinc-100">{gh.user.login}</span>
          <Badge variant="outline" className="text-[9px] bg-zinc-900 border-zinc-700 text-zinc-400">
            {gh.user.public_repos} repos
          </Badge>
          <div className="flex-1" />
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-400" onClick={handleDisconnect} title="Disconnect">
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* View tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveView('repos')}
            className={cn(
              'flex-1 text-[10px] uppercase font-semibold py-1 rounded',
              activeView === 'repos' ? 'bg-violet-500/20 text-violet-300' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            Repos
          </button>
          <button
            onClick={() => setActiveView('files')}
            disabled={!gh.selectedRepo}
            className={cn(
              'flex-1 text-[10px] uppercase font-semibold py-1 rounded disabled:opacity-40',
              activeView === 'files' ? 'bg-violet-500/20 text-violet-300' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            Files
          </button>
          <button
            onClick={() => setActiveView('commits')}
            disabled={!gh.selectedRepo}
            className={cn(
              'flex-1 text-[10px] uppercase font-semibold py-1 rounded disabled:opacity-40',
              activeView === 'commits' ? 'bg-violet-500/20 text-violet-300' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            Commits
          </button>
          <button
            onClick={() => setActiveView('pr')}
            disabled={!gh.selectedRepo}
            className={cn(
              'flex-1 text-[10px] uppercase font-semibold py-1 rounded disabled:opacity-40',
              activeView === 'pr' ? 'bg-violet-500/20 text-violet-300' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            PR
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Repos view */}
          {activeView === 'repos' && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <Input
                  placeholder="Search repos..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-7 h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-100"
                />
              </div>
              <Button size="sm" variant="ghost" className="w-full h-7 text-xs text-zinc-400" onClick={gh.listRepos}>
                <RefreshCw className="h-3 w-3 mr-1" /> Refresh
              </Button>
              {gh.loading && (
                <div className="text-center py-4 text-xs text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading repos...
                </div>
              )}
              {filteredRepos.map(repo => (
                <button
                  key={repo.id}
                  onClick={() => { gh.selectRepo(repo); setActiveView('files') }}
                  className={cn(
                    'w-full text-left p-2 rounded border transition-colors',
                    gh.selectedRepo?.id === repo.id
                      ? 'bg-violet-500/15 border-violet-500/40'
                      : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {repo.private ? <Lock className="h-3 w-3 text-amber-400" /> : <Folder className="h-3 w-3 text-zinc-500" />}
                    <span className="text-xs font-mono text-zinc-200 truncate">{repo.name}</span>
                  </div>
                  {repo.description && (
                    <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">{repo.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-500">
                    {repo.language && <span>{repo.language}</span>}
                    <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5" /> {repo.stargazers_count}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {new Date(repo.updated_at).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
              {filteredRepos.length === 0 && !gh.loading && (
                <div className="text-center py-8 text-xs text-zinc-500">No repos found</div>
              )}
            </div>
          )}

          {/* Files view */}
          {activeView === 'files' && gh.selectedRepo && (
            <div className="space-y-2">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded p-2">
                <div className="flex items-center gap-1.5">
                  <GitBranch className="h-3 w-3 text-violet-400" />
                  <span className="text-xs font-mono text-zinc-200">{gh.selectedRepo.full_name}</span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">Branch: {gh.selectedRepo.default_branch}</div>
                <Button
                  size="sm"
                  className="w-full mt-2 h-7 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                  onClick={handleClone}
                  disabled={cloning}
                >
                  {cloning ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Clone to Local
                </Button>
              </div>

              {gh.loading && <div className="text-center py-4 text-xs text-zinc-500">Loading files...</div>}

              {!gh.loading && gh.fileTree.length === 0 && (
                <div className="text-center py-4 text-xs text-zinc-500">No files in this repo</div>
              )}

              {!gh.loading && gh.fileTree.length > 0 && (
                <div className="space-y-0.5 max-h-96 overflow-y-auto">
                  {gh.fileTree.map(file => (
                    <button
                      key={file.sha}
                      onClick={() => handleOpenFile(file)}
                      className={cn(
                        'w-full text-left flex items-center gap-1.5 px-1.5 py-1 rounded text-xs',
                        selectedFile?.sha === file.sha
                          ? 'bg-violet-500/15 text-violet-200'
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                      )}
                      title={file.path}
                    >
                      <FileCode className="h-3 w-3 flex-shrink-0 text-zinc-500" />
                      <span className="truncate">{file.path}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Commits view */}
          {activeView === 'commits' && gh.selectedRepo && (
            <div className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full h-7 text-xs border-zinc-700 text-zinc-300"
                onClick={() => gh.getCommits(gh.selectedRepo!)}
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Load commits
              </Button>
              {gh.commits.map(c => (
                <div key={c.sha} className="p-2 rounded border border-zinc-800 bg-zinc-900/50">
                  <div className="flex items-start gap-1.5">
                    <GitCommit className="h-3 w-3 text-violet-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-zinc-200 line-clamp-2">{c.commit.message}</div>
                      <div className="text-[10px] text-zinc-500 mt-1">
                        {c.commit.author.name} · {new Date(c.commit.author.date).toLocaleString()}
                      </div>
                      <a
                        href={c.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-violet-400 hover:underline mt-0.5 inline-block"
                      >
                        View on GitHub →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
              {gh.commits.length === 0 && (
                <div className="text-center py-4 text-xs text-zinc-500">Click "Load commits"</div>
              )}
            </div>
          )}

          {/* PR creation view */}
          {activeView === 'pr' && gh.selectedRepo && (
            <div className="space-y-2">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded p-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <GitPullRequest className="h-3.5 w-3.5 text-violet-400" />
                  <span className="text-xs font-semibold text-zinc-200">Create Pull Request</span>
                </div>
                <div className="text-[10px] text-zinc-500 mb-2">
                  Base: <code className="text-zinc-300">{gh.selectedRepo.default_branch}</code> ← New: <code className="text-violet-300">your branch</code>
                </div>

                <label className="text-[10px] uppercase text-zinc-500 font-semibold">Branch name</label>
                <Input
                  placeholder="feature/my-changes"
                  value={prBranch}
                  onChange={e => setPrBranch(e.target.value)}
                  className="h-7 text-[11px] bg-zinc-900 border-zinc-800 text-zinc-100 font-mono mb-2 mt-0.5"
                />

                <label className="text-[10px] uppercase text-zinc-500 font-semibold">PR title</label>
                <Input
                  placeholder="Add feature X"
                  value={prTitle}
                  onChange={e => setPrTitle(e.target.value)}
                  className="h-7 text-[11px] bg-zinc-900 border-zinc-800 text-zinc-100 mb-2 mt-0.5"
                />

                <label className="text-[10px] uppercase text-zinc-500 font-semibold">PR description</label>
                <textarea
                  placeholder="Describe your changes..."
                  value={prBody}
                  onChange={e => setPrBody(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-100 resize-none mb-2 mt-0.5"
                />

                <div className="border-t border-zinc-800 pt-2 mt-2">
                  <div className="text-[10px] uppercase text-zinc-500 font-semibold mb-1.5">Files in this PR ({prFiles.length})</div>
                  {prFiles.length === 0 && (
                    <div className="text-[10px] text-zinc-500 mb-2">Add files using the form below:</div>
                  )}
                  {prFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded px-2 py-1 mb-1">
                      <code className="text-[10px] text-zinc-300 font-mono truncate">{f.path}</code>
                      <button
                        onClick={() => setPrFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-[10px] text-red-400 hover:text-red-300 ml-2"
                      >Remove</button>
                    </div>
                  ))}

                  <div className="mt-2 space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 font-semibold">Add file to PR</label>
                    <Input
                      placeholder="path/to/file.ts"
                      value={commitPath}
                      onChange={e => setCommitPath(e.target.value)}
                      className="h-7 text-[11px] bg-zinc-900 border-zinc-800 text-zinc-100 font-mono"
                    />
                    <textarea
                      placeholder="File content..."
                      value={commitContent}
                      onChange={e => setCommitContent(e.target.value)}
                      rows={3}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-100 font-mono resize-none"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-7 text-xs border-zinc-700 text-zinc-300"
                      onClick={addCurrentFileToPR}
                      disabled={!commitPath || !commitContent}
                    >
                      + Add File to PR
                    </Button>
                  </div>
                </div>

                <Button
                  size="sm"
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                  disabled={!prTitle || !prBranch || prFiles.length === 0 || creatingPR}
                  onClick={handleCreatePR}
                >
                  {creatingPR ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <GitPullRequest className="h-3 w-3 mr-1" />}
                  Create PR ({prFiles.length} files)
                </Button>

                {prResult && (
                  <div className="mt-2 bg-emerald-500/10 border border-emerald-500/30 rounded p-2">
                    <div className="text-xs font-semibold text-emerald-300">PR #{prResult.number} created!</div>
                    <a
                      href={prResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-violet-400 hover:underline flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="h-3 w-3" /> {prResult.url}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Commit panel (always at bottom when in files view) */}
      {activeView === 'files' && gh.selectedRepo && (
        <div className="border-t border-zinc-800 p-2 bg-zinc-900/30">
          <div className="text-[10px] uppercase text-zinc-500 font-semibold mb-1.5">Commit & Push</div>
          <Input
            placeholder="File path (e.g., src/index.ts)"
            value={commitPath}
            onChange={e => setCommitPath(e.target.value)}
            className="h-7 text-[11px] bg-zinc-900 border-zinc-800 text-zinc-100 font-mono mb-1"
          />
          <textarea
            placeholder="File content..."
            value={commitContent}
            onChange={e => setCommitContent(e.target.value)}
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-100 font-mono mb-1 resize-none"
          />
          <Input
            placeholder="Commit message"
            value={commitMsg}
            onChange={e => setCommitMsg(e.target.value)}
            className="h-7 text-[11px] bg-zinc-900 border-zinc-800 text-zinc-100 mb-1"
          />
          <Button
            size="sm"
            className="w-full h-7 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
            disabled={!commitPath || !commitMsg || gh.loading}
            onClick={handleCommit}
          >
            {gh.loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <GitCommit className="h-3 w-3 mr-1" />}
            Commit to {gh.selectedRepo.default_branch}
          </Button>
        </div>
      )}
    </div>
  )
}
