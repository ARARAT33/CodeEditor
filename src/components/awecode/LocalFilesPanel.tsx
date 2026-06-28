'use client'

import { useState, useCallback, useEffect } from 'react'
import { FolderOpen, RefreshCw, FilePlus, FolderPlus, HardDrive, AlertCircle, FileCode, Folder, FolderOpen as FolderOpenIcon, ChevronRight, ChevronDown, X, Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useFileSystem, type LocalFileNode } from '@/hooks/use-file-system'
import { detectLanguageByFilename } from '@/lib/awecode/languages'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export interface LocalFilesPanelProps {
  onOpenFile?: (path: string, content: string, handle?: FileSystemFileHandle) => void
  onSaveFile?: (path: string, content: string) => Promise<void>
  activePath?: string
  registerSaveHandler?: (handler: (path: string, content: string) => Promise<void>) => void
  onDisconnect?: () => void
  onScanFolder?: () => void
  scanLoading?: boolean
}

export function LocalFilesPanel({ onOpenFile, activePath, registerSaveHandler, onDisconnect, onScanFolder, scanLoading }: LocalFilesPanelProps) {
  const fs = useFileSystem()
  const [creating, setCreating] = useState<{ parent: string; type: 'file' | 'folder' } | null>(null)
  const [newName, setNewName] = useState('')
  const { toast } = useToast()

  // Register the save handler so the parent can save files
  useEffect(() => {
    if (registerSaveHandler) {
      registerSaveHandler(async (path: string, content: string) => {
        await fs.writeFile(path, content)
      })
    }
  }, [registerSaveHandler, fs])

  const handleCreate = async () => {
    if (!creating || !newName) {
      setCreating(null)
      setNewName('')
      return
    }
    if (creating.type === 'file') {
      const node = await fs.createFile(creating.parent, newName)
      if (node) {
        toast({ title: 'File created', description: newName })
        onOpenFile?.(node.path, '', node.handle as FileSystemFileHandle)
      } else {
        toast({ title: 'Failed to create file', variant: 'destructive' })
      }
    } else {
      const node = await fs.createFolder(creating.parent, newName)
      if (node) toast({ title: 'Folder created', description: newName })
      else toast({ title: 'Failed to create folder', variant: 'destructive' })
    }
    setCreating(null)
    setNewName('')
  }

  const handleOpenFile = async (node: LocalFileNode) => {
    try {
      const content = await fs.readFile(node.path)
      onOpenFile?.(node.path, content, node.handle as FileSystemFileHandle)
    } catch (e: any) {
      toast({ title: 'Failed to open file', description: e.message, variant: 'destructive' })
    }
  }

  // ---------- Not connected: show open folder button ----------
  if (!fs.tree) {
    return (
      <div className="flex flex-col h-full bg-zinc-950 p-3">
        <div className="flex items-center gap-2 mb-3">
          <HardDrive className="h-5 w-5 text-zinc-300" />
          <span className="text-sm font-semibold text-zinc-100">Local Files</span>
        </div>

        {!fs.supported ? (
          <div className="text-center py-6 px-3">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-400/50" />
            <p className="text-xs text-zinc-400 mb-2">Browser not supported</p>
            <p className="text-[10px] text-zinc-500">
              File System Access API requires Chrome 86+ or Edge 86+. Firefox/Safari are not supported.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-400 mb-3">
              Open a folder on your computer to browse and edit real files. Changes you save are written directly to disk.
            </p>
            <Button
              className="bg-violet-600 hover:bg-violet-500 text-white"
              onClick={fs.openFolder}
              disabled={fs.loading}
            >
              {fs.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <FolderOpen className="h-3.5 w-3.5 mr-2" />}
              Open Folder
            </Button>

            {/* Restore previous folder */}
            {fs.hasSavedHandle && !fs.tree && (
              <div className="mt-3 border border-emerald-500/30 bg-emerald-500/5 rounded p-2">
                <div className="text-[10px] text-emerald-300 font-semibold mb-1">Previous folder available</div>
                <p className="text-[10px] text-zinc-400 mb-2">
                  <code className="text-emerald-300">{fs.savedFolderName}</code> — click to re-connect.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-xs border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                  onClick={() => fs.tryRestore()}
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Reconnect to "{fs.savedFolderName}"
                </Button>
              </div>
            )}

            {fs.error && <p className="text-[10px] text-red-400 mt-2">{fs.error}</p>}
            <div className="mt-4 text-[10px] text-zinc-500 space-y-1">
              <p className="font-semibold text-zinc-400">What you can do:</p>
              <p>• Browse real local files</p>
              <p>• Edit and save to disk (Ctrl+S)</p>
              <p>• Create new files and folders</p>
              <p>• No upload — direct disk access</p>
            </div>
            <div className="mt-3 text-[10px] text-zinc-500 bg-zinc-900/50 border border-zinc-800 rounded p-2">
              <p className="font-semibold text-zinc-400 mb-1">🔒 Privacy</p>
              <p>AWECode only sees the folder you choose. Files never leave your browser — analysis runs on AWECode's server but you choose what to send.</p>
            </div>
          </>
        )}
      </div>
    )
  }

  // ---------- Connected: show file tree ----------
  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="p-2 border-b border-zinc-800 space-y-2">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-100 truncate">{fs.tree.name}</span>
          <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
            Local
          </Badge>
          <div className="flex-1" />
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-400" onClick={fs.refresh} title="Refresh">
            <RefreshCw className={cn('h-3.5 w-3.5', fs.loading && 'animate-spin')} />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-400" onClick={() => { fs.disconnect(); onDisconnect?.() }} title="Disconnect">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100"
            onClick={() => setCreating({ parent: '/', type: 'file' })}
            title="New file"
          >
            <FilePlus className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100"
            onClick={() => setCreating({ parent: '/', type: 'folder' })}
            title="New folder"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </Button>
          {onScanFolder && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[10px] text-red-300 hover:text-red-200 hover:bg-red-500/10"
              onClick={onScanFolder}
              disabled={scanLoading}
              title="Scan whole folder for vulnerabilities"
            >
              {scanLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ShieldAlert className="h-3 w-3 mr-1" />}
              Scan All
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-1">
          {/* Render tree */}
          <LocalFileNodeView
            node={fs.tree}
            activePath={activePath}
            onOpenFile={handleOpenFile}
            onToggleFolder={fs.toggleFolder}
            depth={0}
            isRoot
          />

          {/* New file/folder input */}
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

function LocalFileNodeView({
  node,
  activePath,
  onOpenFile,
  onToggleFolder,
  depth,
  isRoot = false,
}: {
  node: LocalFileNode
  activePath?: string
  onOpenFile?: (node: LocalFileNode) => void
  onToggleFolder?: (path: string) => void
  depth: number
  isRoot?: boolean
}) {
  const isActive = activePath === node.path

  if (node.type === 'folder') {
    return (
      <div>
        {!isRoot && (
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
              <FolderOpenIcon className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Folder className="h-3.5 w-3.5 text-amber-400" />
            )}
            <span className="truncate">{node.name}</span>
          </button>
        )}
        {node.expanded && node.children && (
          <div>
            {node.children.map(child => (
              <LocalFileNodeView
                key={child.path}
                node={child}
                activePath={activePath}
                onOpenFile={onOpenFile}
                onToggleFolder={onToggleFolder}
                depth={isRoot ? 0 : depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const lang = detectLanguageByFilename(node.name)
  const iconColor =
    lang?.category === 'Web' ? 'text-yellow-400' :
    lang?.category === 'Systems' ? 'text-orange-400' :
    lang?.category === 'Database' ? 'text-pink-400' :
    lang?.category === 'Scripting' ? 'text-emerald-400' :
    'text-zinc-500'

  return (
    <button
      onClick={() => onOpenFile?.(node)}
      className={cn(
        'w-full flex items-center gap-1.5 px-1.5 py-1 rounded text-xs transition-colors',
        isActive
          ? 'bg-violet-500/20 text-violet-200'
          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
      )}
      style={{ paddingLeft: depth * 12 + 20 }}
    >
      <FileCode className={cn('h-3.5 w-3.5 flex-shrink-0', iconColor)} />
      <span className="truncate">{node.name}</span>
    </button>
  )
}
