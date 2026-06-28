'use client'

// AWECode GitHub Integration Hook
// Connects to GitHub via Personal Access Token (PAT) and lets you:
// - List your repositories
// - Browse a repo's file tree
// - View file contents
// - Clone (download ZIP) to local disk
// - Edit and commit changes back

import { useState, useCallback } from 'react'

const GITHUB_API = 'https://api.github.com'

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  owner: { login: string }
  private: boolean
  description: string | null
  default_branch: string
  updated_at: string
  language: string | null
  stargazers_count: number
  html_url: string
}

export interface GitHubFile {
  name: string
  path: string
  type: 'file' | 'dir' | 'symlink' | 'submodule'
  sha: string
  size: number
  download_url: string | null
  content?: string  // populated after fetching
}

export interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: { name: string; email: string; date: string }
  }
  html_url: string
}

export interface GitHubUser {
  login: string
  name: string | null
  avatar_url: string
  html_url: string
  public_repos: number
  followers: number
}

export function useGitHub() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)
  const [fileTree, setFileTree] = useState<GitHubFile[]>([])
  const [commits, setCommits] = useState<GitHubCommit[]>([])

  // Load token from localStorage on mount
  const loadStoredToken = useCallback(() => {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem('awecode:github-token')
    if (stored) {
      setToken(stored)
      return stored
    }
    return null
  }, [])

  // Save token to localStorage
  const saveToken = useCallback((t: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('awecode:github-token', t)
    }
    setToken(t)
  }, [])

  // Connect with a token
  const connect = useCallback(async (newToken: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${GITHUB_API}/user`, {
        headers: {
          Authorization: `Bearer ${newToken}`,
          Accept: 'application/vnd.github+json',
        },
      })
      if (!res.ok) {
        if (res.status === 401) throw new Error('Invalid token')
        if (res.status === 403) throw new Error('Rate limit exceeded or token lacks scope')
        throw new Error(`GitHub API error: ${res.status}`)
      }
      const u: GitHubUser = await res.json()
      setUser(u)
      saveToken(newToken)
      // Fetch repos
      const reposRes = await fetch(`${GITHUB_API}/user/repos?sort=updated&per_page=100`, {
        headers: {
          Authorization: `Bearer ${newToken}`,
          Accept: 'application/vnd.github+json',
        },
      })
      if (reposRes.ok) {
        const r: GitHubRepo[] = await reposRes.json()
        setRepos(r)
      }
      return true
    } catch (e: any) {
      setError(e?.message || 'Failed to connect')
      return false
    } finally {
      setLoading(false)
    }
  }, [saveToken])

  // Disconnect
  const disconnect = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('awecode:github-token')
    }
    setToken(null)
    setUser(null)
    setRepos([])
    setSelectedRepo(null)
    setFileTree([])
    setCommits([])
    setError(null)
  }, [])

  // List repos (refresh)
  const listRepos = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${GITHUB_API}/user/repos?sort=updated&per_page=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
      })
      if (res.ok) setRepos(await res.json())
    } catch (e: any) {
      setError(e?.message)
    }
    setLoading(false)
  }, [token])

  // Select a repo and fetch its file tree
  const selectRepo = useCallback(async (repo: GitHubRepo) => {
    setSelectedRepo(repo)
    setFileTree([])
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${GITHUB_API}/repos/${repo.full_name}/git/trees/${repo.default_branch}?recursive=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
          },
        }
      )
      if (res.ok) {
        const data = await res.json()
        const files: GitHubFile[] = (data.tree || [])
          .filter((t: any) => t.type === 'blob')
          .map((t: any) => ({
            name: t.path.split('/').pop(),
            path: t.path,
            type: 'file' as const,
            sha: t.sha,
            size: t.size,
            download_url: null,
          }))
        setFileTree(files)
      }
    } catch (e: any) {
      setError(e?.message)
    }
    setLoading(false)
  }, [token])

  // Get file content
  const getFileContent = useCallback(async (repo: GitHubRepo, path: string, branch?: string): Promise<string> => {
    const ref = branch ? `?ref=${branch}` : ''
    const res = await fetch(
      `${GITHUB_API}/repos/${repo.full_name}/contents/${path}${ref}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
      }
    )
    if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`)
    const data = await res.json()
    if (data.encoding === 'base64' && data.content) {
      return atob(data.content.replace(/\n/g, ''))
    }
    return data.content || ''
  }, [token])

  // Get recent commits
  const getCommits = useCallback(async (repo: GitHubRepo, perPage = 30) => {
    setLoading(true)
    try {
      const res = await fetch(
        `${GITHUB_API}/repos/${repo.full_name}/commits?per_page=${perPage}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
          },
        }
      )
      if (res.ok) setCommits(await res.json())
    } catch (e: any) {
      setError(e?.message)
    }
    setLoading(false)
  }, [token])

  // Commit a file change to GitHub
  const commitFile = useCallback(async (
    repo: GitHubRepo,
    path: string,
    content: string,
    message: string,
    branch?: string,
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)
    const targetBranch = branch || repo.default_branch
    try {
      // 1. Get the current file's SHA (if it exists)
      let sha: string | null = null
      try {
        const res = await fetch(
          `${GITHUB_API}/repos/${repo.full_name}/contents/${path}?ref=${targetBranch}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github+json',
            },
          }
        )
        if (res.ok) {
          const data = await res.json()
          sha = data.sha
        }
      } catch {}

      // 2. Update the file via the Contents API (creates a commit automatically)
      const res = await fetch(
        `${GITHUB_API}/repos/${repo.full_name}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            content: btoa(unescape(encodeURIComponent(content))),
            sha: sha || undefined,
            branch: targetBranch,
          }),
        }
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || `Failed to commit: ${res.status}`)
      }
      setLoading(false)
      return true
    } catch (e: any) {
      setError(e?.message)
      setLoading(false)
      return false
    }
  }, [token])

  // Create a new branch
  const createBranch = useCallback(async (repo: GitHubRepo, branchName: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      // 1. Get the SHA of the default branch
      const refRes = await fetch(
        `${GITHUB_API}/repos/${repo.full_name}/git/refs/heads/${repo.default_branch}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
          },
        }
      )
      if (!refRes.ok) throw new Error('Failed to get default branch SHA')
      const refData = await refRes.json()
      const sha = refData.object.sha

      // 2. Create the new branch
      const res = await fetch(
        `${GITHUB_API}/repos/${repo.full_name}/git/refs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: `refs/heads/${branchName}`,
            sha,
          }),
        }
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to create branch')
      }
      setLoading(false)
      return true
    } catch (e: any) {
      setError(e?.message)
      setLoading(false)
      return false
    }
  }, [token])

  return {
    token,
    user,
    repos,
    loading,
    error,
    selectedRepo,
    fileTree,
    commits,
    loadStoredToken,
    connect,
    disconnect,
    listRepos,
    selectRepo,
    getFileContent,
    getCommits,
    commitFile,
    createBranch,
  }
}
