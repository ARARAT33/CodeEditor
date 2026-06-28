# src/hooks/ — React Custom Hooks

Custom React hooks used across AWECode components.

## Hooks

### `use-file-system.ts`
Wraps the browser-native **File System Access API** for reading/writing real local files.

**Returns:**
```typescript
{
  supported: boolean,              // true if browser supports FSA API
  restored: boolean,               // true after initial restore attempt
  hasSavedHandle: boolean,         // true if a folder handle is persisted
  savedFolderName: string | null,  // name of the persisted folder
  rootHandle: FileSystemDirectoryHandle | null,
  tree: LocalFileNode | null,      // file tree
  loading: boolean,
  error: string | null,
  openFiles: Map<string, FileSystemFileHandle>,
  
  // Methods
  openFolder(): Promise<void>,
  tryRestore(): Promise<void>,
  refresh(): Promise<void>,
  readFile(path: string): Promise<string>,
  writeFile(path: string, content: string): Promise<void>,
  createFile(parentPath: string, name: string): Promise<LocalFileNode | null>,
  createFolder(parentPath: string, name: string): Promise<LocalFileNode | null>,
  toggleFolder(path: string): void,
  disconnect(): void,
}
```

**Features:**
- Recursive tree building (up to 5 levels deep)
- Auto-skips `node_modules`, `.git`, `dist`, `build`, etc.
- Auto-skips binary file extensions (.png, .jpg, .zip, .exe, etc.)
- Persists folder handle via `useFolderPersistence`
- Auto-restores on mount (requires user click to re-grant permission)

**Browser support:** Chrome 86+, Edge 86+, Opera 72+

### `use-folder-persistence.ts`
Persists a `FileSystemDirectoryHandle` in **IndexedDB** so the folder survives page refresh.

**Returns:**
```typescript
{
  savedFolderName: string | null,
  hasSavedHandle: boolean,
  persistHandle(handle: FileSystemDirectoryHandle): Promise<void>,
  restoreHandle(): Promise<FileSystemDirectoryHandle | null>,
  clearSaved(): Promise<void>,
}
```

**How it works:**
- Uses a dedicated IndexedDB database (`awecode-fs`) with one object store (`handles`)
- The root folder handle is stored under key `root-folder-handle`
- On restore, queries permission; if not granted, requests it (requires user gesture)
- Clearing the saved handle prevents auto-restore on next visit

### `use-github.ts`
GitHub API client for browsing repos, viewing files, cloning, and committing.

**Returns:**
```typescript
{
  token: string | null,
  user: GitHubUser | null,
  repos: GitHubRepo[],
  loading: boolean,
  error: string | null,
  selectedRepo: GitHubRepo | null,
  fileTree: GitHubFile[],
  commits: GitHubCommit[],
  
  // Methods
  loadStoredToken(): string | null,
  connect(token: string): Promise<boolean>,
  disconnect(): void,
  listRepos(): Promise<void>,
  selectRepo(repo: GitHubRepo): Promise<void>,
  getFileContent(repo, path, branch?): Promise<string>,
  getCommits(repo, perPage?): Promise<void>,
  commitFile(repo, path, content, message, branch?): Promise<boolean>,
  createBranch(repo, branchName): Promise<boolean>,
}
```

**API endpoints used** (all direct to `api.github.com`):
- `GET /user` — get authenticated user
- `GET /user/repos?sort=updated&per_page=100` — list repos
- `GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1` — get file tree
- `GET /repos/{owner}/{repo}/contents/{path}?ref={branch}` — get file content
- `GET /repos/{owner}/{repo}/commits?per_page=30` — list commits
- `PUT /repos/{owner}/{repo}/contents/{path}` — create/update file (creates a commit)
- `GET /repos/{owner}/{repo}/git/refs/heads/{branch}` — get branch SHA
- `POST /repos/{owner}/{repo}/git/refs` — create new branch

**Token storage:** `localStorage['awecode:github-token']` — sent only to `api.github.com`, never to AWECode's server.

### `use-toast.ts`
Toast notification hook (from shadcn/ui). Used to show success/error messages.

```typescript
const { toast } = useToast()
toast({ title: 'File saved', description: 'auth.ts' })
toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' })
```

### `use-mobile.ts`
Detects mobile viewport (for responsive behavior).

```typescript
const isMobile = useMobile()
// → true if viewport width < 768px
```

## Conventions

- All hooks use `'use client'` directive (they use browser APIs)
- Hooks that fetch data return `{ loading, error, data }` pattern
- Async methods return Promises
- Cleanup functions in useEffect to prevent memory leaks
- Refs used to avoid stale closures in async callbacks

## Adding a New Hook

1. Create `src/hooks/use-my-hook.ts`:
```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'

export function useMyHook(initialValue: string) {
  const [value, setValue] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // side effects
  }, [])

  const doSomething = useCallback(async () => {
    setLoading(true)
    try {
      // ...
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }, [])

  return { value, loading, error, doSomething }
}
```

2. Use in a component:
```typescript
import { useMyHook } from '@/hooks/use-my-hook'

function MyComponent() {
  const { value, loading, doSomething } = useMyHook('initial')
  // ...
}
```

See the [root README](../../README.md) for the full project overview.
