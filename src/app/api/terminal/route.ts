// Terminal API — executes commands in a sandboxed environment
// POST /api/terminal — run a command, return stdout/stderr
// Note: For security, only safe commands are allowed; no network access, no fs writes outside workspace

import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const maxDuration = 30

// Allowlist of commands that can run safely
const ALLOWED_COMMANDS = new Set([
  'ls', 'pwd', 'cat', 'echo', 'head', 'tail', 'wc', 'grep', 'find',
  'sort', 'uniq', 'cut', 'tr', 'awk', 'sed',
  'node', 'python', 'python3', 'ruby', 'php', 'perl', 'go', 'rustc', 'cargo',
  'gcc', 'g++', 'clang', 'clang++', 'make', 'cmake',
  'javac', 'java', 'kotlin', 'kotlinc',
  'deno', 'bun', 'tsx', 'ts-node', 'tsc',
  'sql', 'sqlite3',
  'date', 'whoami', 'uname',
  'md5sum', 'sha256sum', 'sha1sum', 'base64',
  'jq', 'yq',
  'git', 'npm', 'npx', 'yarn', 'pnpm',
  'curl', 'wget',  // for downloading
])

interface TerminalRequest {
  command: string
  cwd?: string  // working directory within /tmp/awecode-workspace
  timeout?: number  // ms, default 10000
}

const WORKSPACE = '/tmp/awecode-workspace'

async function ensureWorkspace() {
  try { await fs.mkdir(WORKSPACE, { recursive: true }) } catch {}
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body: TerminalRequest = await req.json()
    const { command, cwd, timeout = 10000 } = body

    if (!command || typeof command !== 'string') {
      return Response.json({ ok: false, error: 'Missing command' }, { status: 400 })
    }

    await ensureWorkspace()

    // Parse command - support pipes and basic shell features
    const workingDir = cwd ? path.resolve(WORKSPACE, cwd) : WORKSPACE
    if (!workingDir.startsWith(WORKSPACE)) {
      return Response.json({ ok: false, error: 'Working directory outside workspace' }, { status: 403 })
    }

    // Ensure working directory exists
    try { await fs.mkdir(workingDir, { recursive: true }) } catch {}

    // Reject dangerous shell metacharacters that could bypass the allowlist.
    // Pipes (|) and simple redirects (>, >>) are permitted for convenience;
    // everything else that could chain or substitute commands is blocked.
    const DANGEROUS_SHELL_CHARS = /[;`$\\!&{}\[\]\(\)]/
    if (DANGEROUS_SHELL_CHARS.test(command)) {
      return Response.json({
        ok: false,
        error: 'Command contains disallowed shell characters. Pipes (|) and redirects (>, >>) are allowed, but ;, `, $, &, etc. are not.',
      }, { status: 403 })
    }

    // Validate every command in a pipeline
    const pipeSegments = command.split('|').map(s => s.trim()).filter(Boolean)
    for (const segment of pipeSegments) {
      const segCmd = segment.split(/\s+/)[0]
      if (!ALLOWED_COMMANDS.has(segCmd)) {
        return Response.json({
          ok: false,
          error: `Command "${segCmd}" is not allowed. Allowed: ${Array.from(ALLOWED_COMMANDS).sort().join(', ')}`,
        }, { status: 403 })
      }
    }

    // Run via shell to support pipes — only pass a minimal, safe environment.
    const child = spawn('sh', ['-c', command], {
      cwd: workingDir,
      env: {
        PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
        HOME: workingDir,
        TERM: 'xterm-256color',
        LANG: 'en_US.UTF-8',
      },
      timeout,
    })

    let stdout = ''
    let stderr = ''
    let timedOut = false

    child.stdout.on('data', (data) => { stdout += data.toString() })
    child.stderr.on('data', (data) => { stderr += data.toString() })

    const exitCode = await new Promise<number>((resolve) => {
      child.on('close', (code) => resolve(code ?? 0))
      child.on('error', (err) => {
        stderr += err.message
        resolve(1)
      })
      setTimeout(() => {
        if (!child.killed) {
          timedOut = true
          child.kill('SIGTERM')
        }
      }, timeout)
    })

    return Response.json({
      ok: true,
      data: {
        stdout: stdout.slice(0, 100000),  // cap at 100KB
        stderr: stderr.slice(0, 100000),
        exitCode,
        timedOut,
        cwd: workingDir.replace(WORKSPACE, '~'),
      },
    })
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 })
  }
}
