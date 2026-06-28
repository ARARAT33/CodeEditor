// GET /api/lib?doc=<name> — Serve LIB documentation files
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const LIB_DIR = path.join(process.cwd(), 'LIB')

const VALID_DOCS = new Set([
  'README', '00-overview',
  '01-editor', '02-linter', '03-vulnerabilities', '04-refactor',
  '05-functions', '06-local-files', '07-github', '08-ai-agent',
  '09-aweai-api', '10-command-palette', '11-languages', '12-shortcuts',
  '13-terminal', '14-live-preview', '15-errors', '16-faq',
])

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url)
  let doc = url.searchParams.get('doc') || 'README'
  
  // Map overview to README
  if (doc === '00-overview') doc = 'README'
  
  if (!VALID_DOCS.has(doc)) {
    return Response.json({ ok: false, error: 'Invalid doc name' }, { status: 400 })
  }

  try {
    const filePath = path.join(LIB_DIR, `${doc}.md`)
    const content = await fs.readFile(filePath, 'utf-8')
    return new Response(content, {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    })
  } catch (e) {
    return Response.json({ ok: false, error: 'Doc not found' }, { status: 404 })
  }
}
