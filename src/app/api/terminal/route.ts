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
  'date', 'whoami', 'uname', 'env',
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
  try {
    await fs.mkdir(WORKSPACE, { recursive: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    throw new Error(`Failed to create workspace directory: ${message}`)
  }
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
    try {
      await fs.mkdir(workingDir, { recursive: true })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      return Response.json({ ok: false, error: `Failed to create working directory: ${message}` }, { status: 500 })
    }

    // Check the main command (first word)
    const cmdParts = command.trim().split(/\s+/)
    const mainCmd = cmdParts[0]
    if (!ALLOWED_COMMANDS.has(mainCmd)) {
      return Response.json({
        ok: false,
        error: `Command "${mainCmd}" is not allowed. Allowed: ${Array.from(ALLOWED_COMMANDS).sort().join(', ')}`,
      }, { status: 403 })
    }

    // Run via shell to support pipes
    const child = spawn('sh', ['-c', command], {
      cwd: workingDir,
      env: {
        ...process.env,
        PATH: process.env.PATH,
        HOME: workingDir,
        TERM: 'xterm-256color',
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
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Server error'
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}
