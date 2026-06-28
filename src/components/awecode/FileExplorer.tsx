'use client'

import { useState } from 'react'
import { File, Folder, FolderOpen, FileCode, FilePlus, FolderPlus, ChevronRight, ChevronDown, Search, X } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { detectLanguageByFilename } from '@/lib/awecode/languages'
import { cn } from '@/lib/utils'

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'folder'
  content?: string
  children?: FileNode[]
  expanded?: boolean
}

export interface FileExplorerProps {
  files: FileNode[]
  activePath?: string
  onSelectFile?: (path: string, content: string) => void
  onToggleFolder?: (path: string) => void
  onCreateFile?: (parentPath: string, name: string) => void
  onCreateFolder?: (parentPath: string, name: string) => void
  onDeleteFile?: (path: string) => void
}

export function FileExplorer({
  files,
  activePath,
  onSelectFile,
  onToggleFolder,
  onCreateFile,
  onCreateFolder,
}: FileExplorerProps) {
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState<{ parent: string; type: 'file' | 'folder' } | null>(null)
  const [newName, setNewName] = useState('')

  const handleCreate = () => {
    if (!creating || !newName) {
      setCreating(null)
      setNewName('')
      return
    }
    if (creating.type === 'file') {
      onCreateFile?.(creating.parent, newName)
    } else {
      onCreateFolder?.(creating.parent, newName)
    }
    setCreating(null)
    setNewName('')
  }

  const filterFiles = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes
    const q = query.toLowerCase()
    return nodes.reduce((acc, node) => {
      if (node.type === 'file') {
        if (node.name.toLowerCase().includes(q)) acc.push(node)
      } else if (node.children) {
        const filtered = filterFiles(node.children, query)
        if (filtered.length > 0 || node.name.toLowerCase().includes(q)) {
          acc.push({ ...node, children: filtered, expanded: true })
        }
      }
      return acc
    }, [] as FileNode[])
  }

  const filteredFiles = filterFiles(files, search)

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="p-2 border-b border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Explorer</span>
          <div className="flex gap-0.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-100"
              onClick={() => setCreating({ parent: '/', type: 'file' })}
              title="New file"
            >
              <FilePlus className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-100"
              onClick={() => setCreating({ parent: '/', type: 'folder' })}
              title="New folder"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-7 h-7 text-xs bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-1">
          {filteredFiles.length === 0 && (
            <div className="text-center py-8 text-zinc-600 text-xs">
              No files
            </div>
          )}
          {filteredFiles.map(node => (
            <FileNodeView
              key={node.path}
              node={node}
              activePath={activePath}
              onSelectFile={onSelectFile}
              onToggleFolder={onToggleFolder}
              depth={0}
            />
          ))}

          {creating && (
            <div className="flex items-center gap-1 mt-1 pl-2">
              {creating.type === 'file' ? (
                <FilePlus className="h-3.5 w-3.5 text-violet-400" />
              ) : (
                <FolderPlus className="h-3.5 w-3.5 text-violet-400" />
              )}
              <Input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') { setCreating(null); setNewName('') }
                }}
                onBlur={handleCreate}
                placeholder={creating.type === 'file' ? 'filename.ts' : 'folder name'}
                className="h-6 text-xs bg-zinc-900 border-zinc-700 text-zinc-100"
              />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function FileNodeView({
  node,
  activePath,
  onSelectFile,
  onToggleFolder,
  depth,
}: {
  node: FileNode
  activePath?: string
  onSelectFile?: (path: string, content: string) => void
  onToggleFolder?: (path: string) => void
  depth: number
}) {
  const isActive = activePath === node.path
  const lang = node.type === 'file' ? detectLanguageByFilename(node.name) : null

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => onToggleFolder?.(node.path)}
          className="w-full flex items-center gap-1 px-1.5 py-1 hover:bg-zinc-900 rounded text-xs text-zinc-300"
          style={{ paddingLeft: depth * 12 + 4 }}
        >
          {node.expanded ? (
            <ChevronDown className="h-3 w-3 text-zinc-500" />
          ) : (
            <ChevronRight className="h-3 w-3 text-zinc-500" />
          )}
          {node.expanded ? (
            <FolderOpen className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-amber-400" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {node.expanded && node.children && (
          <div>
            {node.children.map(child => (
              <FileNodeView
                key={child.path}
                node={child}
                activePath={activePath}
                onSelectFile={onSelectFile}
                onToggleFolder={onToggleFolder}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => onSelectFile?.(node.path, node.content || '')}
      className={cn(
        'w-full flex items-center gap-1.5 px-1.5 py-1 rounded text-xs transition-colors',
        isActive
          ? 'bg-violet-500/20 text-violet-200'
          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
      )}
      style={{ paddingLeft: depth * 12 + 20 }}
    >
      <FileCode className={cn('h-3.5 w-3.5 flex-shrink-0', lang?.category === 'Web' ? 'text-yellow-400' : lang?.category === 'Systems' ? 'text-orange-400' : lang?.category === 'Database' ? 'text-pink-400' : 'text-zinc-500')} />
      <span className="truncate">{node.name}</span>
    </button>
  )
}
