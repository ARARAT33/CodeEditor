'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Eye, RefreshCw, ExternalLink, X, Loader2, Globe, Code2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { detectLanguageByFilename } from '@/lib/awecode/languages'
import { cn } from '@/lib/utils'

export interface LivePreviewProps {
  // All open files (keyed by path) so the preview can pick out HTML/CSS/JS
  files: Array<{ path: string; content: string }>
  // Default entry file (auto-detected if not specified)
  entry?: string
}

interface PreviewState {
  previewId: string | null
  url: string | null
  loading: boolean
  error: string | null
}

export function LivePreview({ files, entry }: LivePreviewProps) {
  const [preview, setPreview] = useState<PreviewState>({
    previewId: null,
    url: null,
    loading: false,
    error: null,
  })
  const [entryPath, setEntryPath] = useState<string>(entry || 'index.html')
  const [iframeKey, setIframeKey] = useState(0)
  const { toast } = useToast()

  // Auto-detect HTML files
  const htmlFiles = files.filter(f => f.path.endsWith('.html') || f.path.endsWith('.htm'))
  const cssFiles = files.filter(f => f.path.endsWith('.css'))
  const jsFiles = files.filter(f => f.path.endsWith('.js') || f.path.endsWith('.mjs'))

  useEffect(() => {
    if (!entry && htmlFiles.length > 0) {
      setEntryPath(htmlFiles[0].path)
    }
  }, [htmlFiles, entry])

  const generatePreview = useCallback(async () => {
    if (files.length === 0) {
      toast({ title: 'No files to preview', variant: 'destructive' })
      return
    }
    setPreview(prev => ({ ...prev, loading: true, error: null }))
    try {
      // Filter to web files only
      const webFiles = files.filter(f => {
        const ext = f.path.split('.').pop()?.toLowerCase()
        return ['html', 'htm', 'css', 'js', 'mjs', 'json', 'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'woff', 'woff2', 'ttf', 'otf', 'mp4', 'mp3', 'wav', 'webmanifest', 'xml', 'txt'].includes(ext || '')
      }).map(f => ({ path: f.path.replace(/^\//, ''), content: f.content }))

      if (webFiles.length === 0) {
        setPreview(prev => ({ ...prev, loading: false, error: 'No web files (HTML/CSS/JS) found' }))
        return
      }

      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: webFiles, entry: entryPath.replace(/^\//, '') }),
      })
      const data = await res.json()
      if (data.ok) {
        setPreview({
          previewId: data.previewId,
          url: data.url,
          loading: false,
          error: null,
        })
        setIframeKey(k => k + 1)
        toast({ title: 'Preview ready', description: `${webFiles.length} files served` })
      } else {
        setPreview(prev => ({ ...prev, loading: false, error: data.error || 'Failed' }))
      }
    } catch (e: any) {
      setPreview(prev => ({ ...prev, loading: false, error: e.message }))
    }
  }, [files, entryPath, toast])

  const refresh = () => setIframeKey(k => k + 1)

  const openInNewTab = () => {
    if (preview.url) window.open(preview.url, '_blank', 'noopener,noreferrer')
  }

  // Auto-generate preview when files change
  useEffect(() => {
    if (htmlFiles.length > 0 && !preview.url) {
      generatePreview()
    }
  }, [htmlFiles.length])  // only on count change

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800">
      <div className="h-9 border-b border-zinc-800 flex items-center px-3 gap-2 bg-zinc-950 flex-shrink-0">
        <Eye className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-xs font-semibold text-zinc-200">Live Preview</span>
        <div className="flex-1" />
        <Select value={entryPath} onValueChange={setEntryPath}>
          <SelectTrigger className="h-7 w-40 text-xs bg-zinc-900 border-zinc-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800 max-h-60">
            {htmlFiles.length === 0 && (
              <SelectItem value="index.html" disabled>No HTML files</SelectItem>
            )}
            {htmlFiles.map(f => (
              <SelectItem key={f.path} value={f.path}>{f.path}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-400" onClick={refresh} disabled={!preview.url} title="Refresh">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-400" onClick={openInNewTab} disabled={!preview.url} title="Open in new tab">
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 min-h-0 relative">
        {preview.loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
        )}
        {preview.error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-center p-4">
            <X className="h-8 w-8 text-red-400 mb-2" />
            <p className="text-xs text-red-400">{preview.error}</p>
            <Button size="sm" className="mt-3 bg-violet-600 hover:bg-violet-500 text-white" onClick={generatePreview}>
              Try Again
            </Button>
          </div>
        )}
        {!preview.url && !preview.loading && !preview.error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-center p-4">
            <Globe className="h-10 w-10 text-zinc-700 mb-3" />
            <p className="text-xs text-zinc-400 mb-3">
              {htmlFiles.length === 0
                ? 'Open an HTML file to see a live preview'
                : 'Click "Generate" to preview your website'}
            </p>
            {htmlFiles.length > 0 && (
              <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white" onClick={generatePreview}>
                Generate Preview
              </Button>
            )}
          </div>
        )}
        {preview.url && (
          <iframe
            key={iframeKey}
            src={preview.url}
            className="w-full h-full bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            title="Live Preview"
          />
        )}
      </div>

      <div className="border-t border-zinc-800 p-1.5 bg-zinc-950 flex items-center gap-2 flex-shrink-0">
        <Code2 className="h-3 w-3 text-zinc-500" />
        <span className="text-[10px] text-zinc-500">
          {files.length} files · {htmlFiles.length} HTML · {cssFiles.length} CSS · {jsFiles.length} JS
        </span>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[10px] border-zinc-700 text-zinc-300"
          onClick={generatePreview}
          disabled={preview.loading || htmlFiles.length === 0}
        >
          {preview.loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
          Rebuild
        </Button>
      </div>
    </div>
  )
}
