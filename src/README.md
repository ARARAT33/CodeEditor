# src/ — AWECode Source Code

This directory contains all the TypeScript/React source code for AWECode.

## Structure

```
src/
├── app/                    # Next.js 16 App Router
│   ├── page.tsx            # Main IDE UI (the only user-visible route)
│   ├── layout.tsx          # Root layout
│   ├── globals.css         # Global styles + scrollbar customization
│   └── api/                # API routes (server-side, Node.js runtime)
│       ├── aweai/          # AWEAI — AI agent API
│       │   ├── route.ts            # GET: capabilities, languages, functions
│       │   ├── analyze/route.ts    # POST: full analysis (lint+scan+refactor+correct)
│       │   ├── lint/route.ts       # POST: lint only
│       │   ├── scan/route.ts       # POST: vulnerability scan only
│       │   ├── refactor/route.ts   # POST: refactor suggestions or apply
│       │   ├── chat/route.ts       # POST: AI chat with tool calling
│       │   └── functions/route.ts  # GET: function library
│       ├── auth/github/    # GitHub OAuth device flow
│       ├── github-pr/      # GitHub PR creation
│       ├── folder-scan/    # Multi-file scan
│       ├── ai-deep-scan/   # AI + offline deep scan
│       ├── terminal/       # Sandboxed shell execution
│       ├── preview/        # Live website preview
│       │   ├── route.ts            # POST: create preview, GET: list previews
│       │   └── [...path]/route.ts  # GET: serve preview file
│       └── lib/            # LIB documentation API
│
├── components/
│   ├── ui/                 # shadcn/ui components (Button, Input, Tabs, etc.)
│   └── awecode/            # AWECode-specific components
│       ├── CodeEditor.tsx          # Monaco editor wrapper
│       ├── AIChat.tsx              # AI chat panel with tool calling
│       ├── GitHubPanel.tsx         # GitHub OAuth + repos + PR
│       ├── LocalFilesPanel.tsx     # Local file system browser
│       ├── RealTerminal.tsx        # Terminal UI (talks to /api/terminal)
│       ├── LivePreview.tsx         # Website preview iframe
│       ├── CommandPalette.tsx      # Ctrl+Shift+P palette
│       ├── ProblemsPanel.tsx       # Lint/vuln/refactor/corrections display
│       ├── FunctionCatalog.tsx     # 1000+ function library browser
│       └── FileExplorer.tsx        # In-memory file tree (for non-FSA fallback)
│
├── hooks/
│   ├── use-file-system.ts          # File System Access API wrapper
│   ├── use-github.ts               # GitHub API client
│   ├── use-folder-persistence.ts   # IndexedDB folder handle persistence
│   ├── use-toast.ts                # Toast notifications
│   └── use-mobile.ts               # Mobile detection
│
└── lib/
    ├── utils.ts                    # cn() className utility
    ├── db.ts                       # Prisma client
    └── awecode/                    # Core analysis engines
        ├── languages.ts            # 150+ language definitions
        ├── linter.ts               # 40+ offline lint rules
        ├── vulnerabilities.ts      # 25+ vulnerability rules
        ├── refactor.ts             # Refactor + auto-fix engine
        └── functions.ts            # 1000+ utility function library
```

## Key Files

### `app/page.tsx`
The main IDE interface. Contains:
- Top menu bar (File/Edit/View/Run/Help dropdowns)
- Tab bar (multi-file editing)
- Secondary toolbar (file info, stats badges)
- Left panel (Local Files / GitHub / LIB tabs)
- Center (Monaco editor + Terminal)
- Right panel (AI / Problems / Functions / Preview tabs)
- Status bar
- Command palette

### `lib/awecode/linter.ts`
40+ offline lint rules using regex heuristics. Each rule has:
- `id`, `name`, `description`
- `severity` (error/warning/info/hint)
- `category` (syntax/style/bug/performance/security/best-practice/complexity)
- `languages` (array of language IDs)
- `check(code, lines)` function returning `LintProblem[]`

### `lib/awecode/vulnerabilities.ts`
25+ vulnerability rules. Same structure as linter, plus:
- `cwe` (e.g., "CWE-89")
- `owaspCategory` (e.g., "A03:2021 - Injection")
- `confidence` (certain/high/medium/low)
- `impact`, `recommendation`, `references`

### `lib/awecode/functions.ts`
1000+ utility functions. Each function has:
- `id`, `name`, `category`, `description`
- `signature`, `parameters`, `returns`
- `example`, `tags`
- `complexity` (O(1), O(n), O(n log n), etc.)
- `implemented` (boolean) — if true, has `code` field
- `code` — actual TypeScript implementation

### `app/api/aweai/chat/route.ts`
AI chat with tool calling. Supports 3 providers:
- `z-ai` (default) — uses z-ai-web-dev-sdk
- `openai` — calls api.openai.com directly from server
- `anthropic` — calls api.anthropic.com directly from server

The AI can emit `<tool_call>{"tool": "analyze", "args": {...}}</tool_call>` blocks to invoke tools. Up to 3 rounds of tool calling per turn.

### `hooks/use-file-system.ts`
Wraps the File System Access API. Key methods:
- `openFolder()` — show directory picker, build tree, persist handle
- `readFile(path)` — read file content
- `writeFile(path, content)` — write to disk
- `createFile(parent, name)` / `createFolder(parent, name)`
- `tryRestore()` — restore persisted folder handle on page load
- `disconnect()` — clear state + IndexedDB

## Conventions

- **TypeScript strict mode** throughout
- **`'use client'`** for client components, **`'use server'`** (or no directive) for server
- **shadcn/ui** for all UI components (don't reinvent)
- **lucide-react** for icons
- **Tailwind CSS 4** for styling — use existing CSS variables (`bg-zinc-950`, `text-zinc-100`, etc.)
- **No indigo/blue** colors unless explicitly requested
- All API responses follow `{ ok: boolean, data?: T, error?: string, meta?: {...} }` shape

## Running

```bash
bun install
bun run dev    # → http://localhost:3000
bun run lint   # ESLint check
bun run build  # Production build
```

See the [root README](../README.md) for full documentation.
