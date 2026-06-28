# src/app/api/ — AWECode API Routes

Next.js 16 API routes (App Router). All routes run on the **Node.js runtime** (not Edge) for full access to `child_process`, `fs`, etc.

All responses follow this shape:
```typescript
{
  ok: boolean
  data?: T
  error?: string
  meta?: { version: string, durationMs: number, requestId: string }
}
```

## Routes

### `/api/aweai/` — AWEAI Core API

The AI agent API. Powers the in-editor AI chat and can be called by external AI agents.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/aweai` | Capabilities, stats, endpoint list |
| `GET` | `/api/aweai?action=languages` | List 150+ supported languages |
| `GET` | `/api/aweai?action=functions` | Browse 1000+ function library |
| `GET` | `/api/aweai?action=function&id=<id>` | Get a specific function |
| `POST` | `/api/aweai` | Combined analysis (action: analyze/lint/scan/refactor/correct) |
| `POST` | `/api/aweai/analyze` | Full analysis (lint + scan + refactor + correct) |
| `POST` | `/api/aweai/lint` | Lint code only |
| `POST` | `/api/aweai/scan` | Vulnerability scan only |
| `POST` | `/api/aweai/refactor` | Refactor suggestions or auto-apply |
| `POST` | `/api/aweai/chat` | AI chat with tool calling |
| `GET` | `/api/aweai/functions` | Function library (with search/filter) |

**Request body** (for POST):
```json
{
  "code": "var x = 1;",
  "language": "javascript",
  "filename": "test.js"
}
```
Either `language` or `filename` is required. If only `filename`, language is auto-detected.

See [`LIB/09-aweai-api.md`](../../../LIB/09-aweai-api.md) for full reference.

### `/api/auth/github/` — GitHub OAuth

GitHub OAuth **Device Flow** — works without a client secret.

**Client ID:** `Ov23liqTkPOCO4ZZ5WcH`
**Scopes:** `repo`, `read:user`, `workflow`

**Flow:**
1. `POST /api/auth/github` with empty body → returns `device_code`, `user_code`, `verification_uri`
2. User opens `verification_uri` in browser, enters `user_code`, authorizes
3. Frontend polls `POST /api/auth/github` with `{ device_code }` every 5 seconds
4. When authorized, returns `{ access_token, user }`

The user code is displayed in the UI with a copy button, and `verification_uri` opens in a new tab automatically.

### `/api/github-pr/` — GitHub PR Creation

Creates a Pull Request in one API call.

**Request:**
```json
{
  "token": "ghp_...",
  "owner": "username",
  "repo": "my-repo",
  "baseBranch": "main",
  "newBranch": "feature/my-changes",
  "files": [
    { "path": "src/index.ts", "content": "..." }
  ],
  "commitMessage": "Add feature X",
  "prTitle": "Add feature X",
  "prBody": "Description..."
}
```

**What it does:**
1. Gets the SHA of the base branch
2. Creates blobs for each file
3. Creates a new tree with the file changes
4. Creates a commit on top of the base
5. Creates a new branch ref pointing to the commit
6. Opens a pull request from the new branch to the base

**Response:** `{ ok, pr: { number, url, branch, commitSha } }`

### `/api/folder-scan/` — Multi-File Scan

Scans multiple files at once (for "Scan Whole Folder" feature).

**Request:**
```json
{
  "files": [
    { "path": "src/auth.ts", "content": "..." },
    { "path": "src/utils.py", "content": "..." }
  ],
  "mode": "analyze"  // or "lint" or "scan"
}
```

**Response:** Per-file results + aggregated stats (totalErrors, totalCritical, securityScore, etc.)

### `/api/ai-deep-scan/` — AI + Offline Deep Scan

Combines the offline regex scanner with AI analysis for deeper vulnerability detection.

**Request:**
```json
{
  "code": "...",
  "language": "javascript",
  "filename": "auth.ts",
  "provider": "z-ai",  // or "openai" or "anthropic"
  "apiKey": "...",     // required for openai/anthropic
  "model": "gpt-4o"    // optional
}
```

**What it does:**
1. Runs the offline regex scanner (25+ rules)
2. Sends the code to the AI with a security-auditor system prompt
3. AI returns JSON array of findings (subtle logic bugs, auth flaws, etc.)
4. Combines offline + AI findings, sorted by severity

**Response:** `{ ok, data: { offlineStats, aiFindingsCount, combined, summary } }`

### `/api/terminal/` — Sandboxed Shell

Executes shell commands in a sandboxed directory.

**Request:**
```json
{
  "command": "node -e 'console.log(1+1)'",
  "cwd": "subdir",  // optional, relative to /tmp/awecode-workspace
  "timeout": 15000  // optional, default 10000ms
}
```

**Sandbox:**
- Working directory: `/tmp/awecode-workspace`
- Only an allowlist of ~40 commands runs (ls, cat, grep, node, python, ruby, gcc, git, curl, etc.)
- 15s default timeout
- stdout/stderr capped at 100KB each

**Response:** `{ ok, data: { stdout, stderr, exitCode, timedOut, cwd } }`

See [`LIB/13-terminal.md`](../../../LIB/13-terminal.md) for the full allowed commands list.

### `/api/preview/` — Live Website Preview

Serves HTML/CSS/JS files as a previewable website.

**POST `/api/preview`** — create a preview:
```json
{
  "files": [
    { "path": "index.html", "content": "<h1>Hello</h1>" },
    { "path": "style.css", "content": "body { color: red; }" }
  ],
  "entry": "index.html"
}
```
Response: `{ ok, previewId, url: "/api/preview/<id>/index.html" }`

**GET `/api/preview/<id>/<file>`** — serve a preview file:
- Sets correct MIME type (text/html, text/css, application/javascript, etc.)
- For HTML files, rewrites relative `src`/`href` to point to `/api/preview/<id>/...`
- Prevents path traversal (must stay within PREVIEW_DIR)

**GET `/api/preview`** — list all preview IDs.

Previews are stored in `.previews/` directory (gitignored).

### `/api/lib/` — LIB Documentation

Serves the Markdown documentation files from the `LIB/` directory.

**GET `/api/lib?doc=<name>`** — get a specific doc.

Valid doc names: `README`, `00-overview`, `01-editor`, `02-linter`, `03-vulnerabilities`, `04-refactor`, `05-functions`, `06-local-files`, `07-github`, `08-ai-agent`, `09-aweai-api`, `10-command-palette`, `11-languages`, `12-shortcuts`, `13-terminal`, `14-live-preview`, `15-errors`, `16-faq`.

Returns the raw Markdown content with `Content-Type: text/markdown`.

## Conventions

- All routes use `export const runtime = 'nodejs'` (not Edge)
- Long-running routes set `export const maxDuration = 60` (or higher)
- Request validation: return 400 with `{ ok: false, error }` for bad input
- Errors: return 500 with `{ ok: false, error: e.message }`
- Success: return 200 with `{ ok: true, data, meta: { durationMs, requestId } }`
- Use `crypto.randomUUID()` for request IDs
- Measure time with `Date.now()` at start and end

## Adding a New API Route

1. Create a new directory: `src/app/api/my-endpoint/`
2. Add `route.ts`:
```typescript
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest): Promise<Response> {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    const body = await req.json()
    // ... your logic
    return Response.json({
      ok: true,
      data: { /* ... */ },
      meta: { durationMs: Date.now() - startTime, requestId },
    })
  } catch (e: any) {
    return Response.json({
      ok: false,
      error: e.message,
      meta: { durationMs: Date.now() - startTime, requestId },
    }, { status: 500 })
  }
}
```

See the [root README](../../../README.md) for the full project overview.
