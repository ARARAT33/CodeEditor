'use client'

// AWECode Local Files Hook — uses the browser-native File System Access API
// to read/write real files on the user's computer.
// Docs: https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
// Includes folder persistence via IndexedDB (handle survives page refresh)

import { useState, useCallback, useEffect, useRef } from 'react'
import { useFolderPersistence } from './use-folder-persistence'

export interface LocalFileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  handle: FileSystemFileHandle | FileSystemDirectoryHandle
  children?: LocalFileNode[]
  expanded?: boolean
}

export interface UseFileSystemOptions {
  maxDepth?: number
  ignoreDirs?: string[]
  ignoreExts?: string[]
}

const DEFAULT_IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', '.cache',
  '__pycache__', '.venv', 'venv', 'env', '.idea', '.vscode',
  'coverage', '.nyc_output', 'out', 'bin', 'obj', 'target',
  '.gradle', '.mvn', '.terraform', '.serverless',
])

const DEFAULT_IGNORE_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.tiff',
  '.mp3', '.mp4', '.avi', '.mov', '.mkv', '.wav', '.flac',
  '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar',
  '.exe', '.dll', '.so', '.dylib', '.bin', '.dat',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.lock', '.pyc', '.pyo', '.class', '.o', '.a',
])

export function useFileSystem(options: UseFileSystemOptions = {}) {
  const {
    maxDepth = 5,
    ignoreDirs = [],
    ignoreExts = [],
  } = options

  const persistence = useFolderPersistence()
  const [restored, setRestored] = useState(false)

  const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [tree, setTree] = useState<LocalFileNode | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openFiles, setOpenFiles] = useState<Map<string, FileSystemFileHandle>>(new Map())
  const [supported] = useState<boolean>(
    typeof window !== 'undefined' && 'showDirectoryPicker' in window
  )

  const ignoreDirSet = new Set([...DEFAULT_IGNORE_DIRS, ...ignoreDirs])
  const ignoreExtSet = new Set([...DEFAULT_IGNORE_EXTS, ...ignoreExts])

  // Auto-restore folder handle on mount (requires user click to re-grant permission)
  const tryRestore = useCallback(async () => {
    if (!persistence.hasSavedHandle) {
      setRestored(true)
      return
    }
    const handle = await persistence.restoreHandle()
    if (handle) {
      setRootHandle(handle)
      try {
        const root = await buildTreeRef.current(handle, '/', 0)
        setTree(root)
      } catch (e) {
        console.warn('Failed to rebuild tree after restore:', e)
      }
    }
    setRestored(true)
  }, [persistence])

  // Ref to hold the latest buildTree (avoids circular dependency)
  const buildTreeRef = useRef<(h: FileSystemDirectoryHandle, p: string, d: number) => Promise<LocalFileNode>>(async () => ({ name: '', path: '', type: 'folder', handle: {} as any }))

  // Recursively build a tree from a directory handle
  const buildTree = useCallback(async (
    dirHandle: FileSystemDirectoryHandle,
    path: string,
    depth: number,
  ): Promise<LocalFileNode> => {
    const node: LocalFileNode = {
      name: dirHandle.name,
      path,
      type: 'folder',
      handle: dirHandle,
      children: [],
      expanded: depth === 0,
    }

    if (depth >= maxDepth) return node

    const entries: LocalFileNode[] = []
    try {
      // @ts-ignore — entries() is supported in Chrome/Edge
      for await (const [name, handle] of dirHandle.entries()) {
        // Skip ignored directories
        if (handle.kind === 'directory' && ignoreDirSet.has(name)) continue
        // Skip ignored file extensions
        if (handle.kind === 'file') {
          const ext = name.substring(name.lastIndexOf('.')).toLowerCase()
          if (ignoreExtSet.has(ext)) continue
          // Skip very large files (>5MB) — they'd be slow to load
          // We'll check size on demand instead
        }

        const childPath = path === '/' ? `/${name}` : `${path}/${name}`
        if (handle.kind === 'directory') {
          const childTree = await buildTree(handle as FileSystemDirectoryHandle, childPath, depth + 1)
          entries.push(childTree)
        } else {
          entries.push({
            name,
            path: childPath,
            type: 'file',
            handle: handle as FileSystemFileHandle,
          })
        }
      }
    } catch (e) {
      console.warn('Error reading directory:', path, e)
    }

    // Sort: folders first, then files, alphabetical
    entries.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })

    node.children = entries
    return node
  }, [maxDepth, ignoreDirSet, ignoreExtSet])

  // Keep ref in sync
  useEffect(() => { buildTreeRef.current = buildTree }, [buildTree])

  // Try to restore on mount
  useEffect(() => {
    tryRestore()
  }, [tryRestore])

  // Open folder picker
  const openFolder = useCallback(async () => {
    if (!supported) {
      setError('Your browser does not support the File System Access API. Use Chrome 86+ or Edge 86+.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      // @ts-ignore — showDirectoryPicker is supported in Chrome/Edge
      const handle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        id: 'awecode-folder',
      })

      // Request readwrite permission explicitly
      const permOpts = { mode: 'readwrite' as PermissionMode }
      // @ts-ignore
      const perm = await handle.queryPermission(permOpts)
      if (perm !== 'granted') {
        // @ts-ignore
        const req = await handle.requestPermission(permOpts)
        if (req !== 'granted') {
          setError('Permission denied. AWECode needs read/write access to edit files.')
          setLoading(false)
          return
        }
      }

      setRootHandle(handle)
      const root = await buildTree(handle, '/', 0)
      setTree(root)
      // Persist the handle for next session
      await persistence.persistHandle(handle)
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        // User cancelled — not an error
      } else {
        setError(e?.message || 'Failed to open folder')
        console.error(e)
      }
    }
    setLoading(false)
  }, [supported, buildTree, persistence])

  // Refresh the tree (re-read from disk)
  const refresh = useCallback(async () => {
    if (!rootHandle) return
    setLoading(true)
    try {
      const root = await buildTree(rootHandle, '/', 0)
      setTree(root)
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh')
    }
    setLoading(false)
  }, [rootHandle, buildTree])

  // Read a file's content
  const readFile = useCallback(async (path: string): Promise<string> => {
    const handle = openFiles.get(path)
    if (handle) {
      const file = await handle.getFile()
      return await file.text()
    }
    // Walk the tree to find the handle
    if (tree) {
      const node = findNode(tree, path)
      if (node?.handle && node.type === 'file') {
        setOpenFiles(prev => new Map(prev).set(path, node.handle as FileSystemFileHandle))
        const file = await (node.handle as FileSystemFileHandle).getFile()
        return await file.text()
      }
    }
    throw new Error(`File not found: ${path}`)
  }, [openFiles, tree])

  // Write to a file (saves to disk)
  const writeFile = useCallback(async (path: string, content: string): Promise<void> => {
    const handle = openFiles.get(path)
    if (!handle) throw new Error(`File not opened: ${path}`)
    // @ts-ignore — createWritable is supported in Chrome/Edge
    const writable = await handle.createWritable()
    await writable.write(content)
    await writable.close()
  }, [openFiles])

  // Create a new file in a directory
  const createFile = useCallback(async (parentPath: string, name: string): Promise<LocalFileNode | null> => {
    if (!tree) return null
    const parentNode = parentPath === '/' ? tree : findNode(tree, parentPath)
    if (!parentNode || parentNode.type !== 'folder') return null

    try {
      // @ts-ignore
      const newHandle = await (parentNode.handle as FileSystemDirectoryHandle).getFileHandle(name, { create: true })
      // Initialize empty
      // @ts-ignore
      const writable = await newHandle.createWritable()
      await writable.write('')
      await writable.close()

      const newNode: LocalFileNode = {
        name,
        path: parentPath === '/' ? `/${name}` : `${parentPath}/${name}`,
        type: 'file',
        handle: newHandle,
      }

      // Add to tree
      parentNode.children = [...(parentNode.children || []), newNode].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      setTree({ ...tree! })

      return newNode
    } catch (e) {
      console.error('Failed to create file:', e)
      return null
    }
  }, [tree])

  // Create a new folder
  const createFolder = useCallback(async (parentPath: string, name: string): Promise<LocalFileNode | null> => {
    if (!tree) return null
    const parentNode = parentPath === '/' ? tree : findNode(tree, parentPath)
    if (!parentNode || parentNode.type !== 'folder') return null

    try {
      // @ts-ignore
      const newHandle = await (parentNode.handle as FileSystemDirectoryHandle).getDirectoryHandle(name, { create: true })
      const newNode: LocalFileNode = {
        name,
        path: parentPath === '/' ? `/${name}` : `${parentPath}/${name}`,
        type: 'folder',
        handle: newHandle,
        children: [],
        expanded: false,
      }
      parentNode.children = [...(parentNode.children || []), newNode].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      setTree({ ...tree! })
      return newNode
    } catch (e) {
      console.error('Failed to create folder:', e)
      return null
    }
  }, [tree])

  // Toggle folder expanded state in the tree
  const toggleFolder = useCallback((path: string) => {
    if (!tree) return
    const toggle = (node: LocalFileNode): LocalFileNode => {
      if (node.path === path) return { ...node, expanded: !node.expanded }
      if (node.children) return { ...node, children: node.children.map(toggle) }
      return node
    }
    setTree(toggle(tree))
  }, [tree])

  // Disconnect from the file system
  const disconnect = useCallback(() => {
    setRootHandle(null)
    setTree(null)
    setOpenFiles(new Map())
    setError(null)
    // Clear persisted handle so it doesn't auto-restore next session
    persistence.clearSaved()
  }, [persistence])

  return {
    supported,
    restored,
    hasSavedHandle: persistence.hasSavedHandle,
    savedFolderName: persistence.savedFolderName,
    tryRestore,
    rootHandle,
    tree,
    loading,
    error,
    openFiles,
    openFolder,
    refresh,
    readFile,
    writeFile,
    createFile,
    createFolder,
    toggleFolder,
    disconnect,
  }
}

// Helper: find a node by path
function findNode(node: LocalFileNode, path: string): LocalFileNode | null {
  if (node.path === path) return node
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, path)
      if (found) return found
    }
  }
  return null
}
