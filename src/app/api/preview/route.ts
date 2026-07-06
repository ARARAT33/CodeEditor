// Live Preview API — serves HTML/CSS/JS files as a previewable website
// POST /api/preview — receives files, returns a preview URL

import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PREVIEW_DIR = path.join(process.cwd(), '.previews')

// Ensure preview directory exists
async function ensureDir() {
  await fs.mkdir(PREVIEW_DIR, { recursive: true })
}

// POST: create a new preview from files
export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json()
    const { files, entry = 'index.html' } = body

    if (!files || !Array.isArray(files)) {
      return Response.json({ ok: false, error: 'Missing files' }, { status: 400 })
    }

    const previewId = crypto.randomBytes(8).toString('hex')
    const previewPath = path.join(PREVIEW_DIR, previewId)
    await fs.mkdir(previewPath, { recursive: true })

    for (const file of files) {
      const filePath = path.join(previewPath, file.path)
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, file.content, 'utf-8')
    }

    return Response.json({
      ok: true,
      previewId,
      url: `/api/preview/${previewId}/${entry}`,
      entry,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Preview creation failed'
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}

// GET: list all previews
export async function GET(req: Request): Promise<Response> {
  await ensureDir()
  try {
    const dirs = await fs.readdir(PREVIEW_DIR)
    return Response.json({ ok: true, previews: dirs })
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      return Response.json({ ok: true, previews: [] })
    }
    const message = e instanceof Error ? e.message : 'Failed to list previews'
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}
