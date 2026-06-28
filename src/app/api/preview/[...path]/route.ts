// Catch-all route for serving preview files
// /api/preview/<id>/<file path>

import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PREVIEW_DIR = path.join(process.cwd(), '.previews')

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const { path: segments } = await params
  if (!segments || segments.length < 2) {
    return new Response('Not found', { status: 404 })
  }
  const previewId = segments[0]
  const filePath = segments.slice(1).join('/')
  const fullPath = path.join(PREVIEW_DIR, previewId, filePath)

  // Prevent path traversal
  const resolved = path.resolve(fullPath)
  if (!resolved.startsWith(PREVIEW_DIR)) {
    return new Response('Forbidden', { status: 403 })
  }

  try {
    const content = await fs.readFile(resolved)
    const ext = path.extname(filePath).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html; charset=utf-8',
      '.htm': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.mjs': 'application/javascript; charset=utf-8',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.otf': 'font/otf',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.webmanifest': 'application/manifest+json',
      '.xml': 'application/xml',
      '.txt': 'text/plain; charset=utf-8',
    }
    const mime = mimeTypes[ext] || 'application/octet-stream'

    let body: Buffer | string = content
    if (ext === '.html' || ext === '.htm') {
      let html = content.toString('utf-8')
      const base = `/api/preview/${previewId}/`
      html = html.replace(/(src|href)\s*=\s*["']([^"']+)["']/g, (match, attr, url) => {
        if (/^(https?:)?\/\//i.test(url) || url.startsWith('#') || url.startsWith('data:') || url.startsWith('mailto:')) {
          return match
        }
        if (url.startsWith('/')) url = url.substring(1)
        return `${attr}="${base}${url}"`
      })
      body = html
    }

    return new Response(body, {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new Response('File not found', { status: 404 })
  }
}
