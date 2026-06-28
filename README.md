<div align="center">

# ⚡ AWECode

### The All-in-One AI-Powered Code Editor

**150+ languages · 1000+ functions · Real local files · GitHub OAuth · AI agent · 100% offline linter & vulnerability scanner**

[Features](#-features) · [Quick Start](#-quick-start) · [Architecture](#-architecture) · [API](#-aweai-api) · [Docs](#-documentation)

</div>

---

## 🎯 What is AWECode?

AWECode is a **browser-based, VS Code-style code editor** built with Next.js 16, Monaco Editor, and the Z.ai SDK. It runs entirely in your browser — no backend to deploy, no data leaves your machine unless you choose to use AI features.

Unlike typical "online editors", AWECode is built for real work:

- 📂 **Open real folders on your computer** (Chrome/Edge File System Access API) — your files stay on disk, edits save directly via `Ctrl+S`
- 🔐 **Connect to GitHub with OAuth** (no token juggling) — browse repos, clone files, commit, and open Pull Requests right from the editor
- 🤖 **AI Agent with tool calling** — the AI can lint your code, scan for vulnerabilities, suggest refactors, search the function library, and apply changes to the editor
- 🛡️ **100% offline security scanner** — 25+ vulnerability rules with CWE/OWASP mapping, plus AI-powered deep scan for subtle logic flaws
- 🧠 **1000+ utility function library** — searchable, copy-paste ready, organized into 30+ categories
- 🖥️ **Real sandboxed terminal** — run `node`, `python`, `ruby`, `gcc`, `git`, `curl`, and 40+ other commands
- 👁️ **Live website preview** — open HTML/CSS/JS, see the rendered site in a sandboxed iframe
- 📚 **16 searchable LIB documents** — every feature, rule, error, and shortcut explained

---

## ✨ Features

### Editor (Monaco-powered)
- Syntax highlighting for **150+ programming languages**
- Custom AWE Dark and AWE Light themes
- Multi-tab editing with per-tab undo history
- IntelliSense, bracket pair colorization, multi-cursor, sticky scroll
- Find/Replace, Go to Definition, Peek, Rename Symbol
- Configurable font size, word wrap, tab size, minimap

### Static Analysis (100% offline, server-side)
| Engine | Rules | Languages |
|--------|-------|-----------|
| **Linter** | 40+ | JS/TS, Python, Java, Go, Rust, C/C++, PHP, SQL, HTML, CSS, Bash, Dockerfile, … |
| **Vulnerability Scanner** | 25+ | All major languages — CWE/OWASP mapped, security score 0-100 |
| **Refactor Engine** | 20+ | var→const, template literals, arrow functions, sort imports, extract function, … |
| **Auto-Fix** | 10+ | High-confidence corrections applied automatically |

### AI Agent (3 providers)
- **Z.ai SDK** — default, free tier, no API key needed
- **OpenAI** — gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo (your key)
- **Anthropic** — claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus (your key)

The AI has **tool calling** — it can invoke `analyze`, `lint`, `scan`, `refactor`, `correct`, `search_functions` to do real work, not just chat.

### AI Deep Scan
Combines the offline regex scanner with AI analysis to find subtle vulnerabilities the regex can't catch:
- Business logic flaws
- Authentication/authorization issues
- Race conditions and TOCTOU bugs
- Subtle cryptographic misuse
- Logic-level injection

### Real Terminal
Sandboxed shell on the server (`/tmp/awecode-workspace`). Allowed commands include:
`ls`, `cat`, `grep`, `awk`, `sed`, `node`, `python`, `python3`, `ruby`, `php`, `perl`, `go`, `rustc`, `cargo`, `gcc`, `g++`, `clang`, `make`, `cmake`, `javac`, `java`, `deno`, `bun`, `tsx`, `tsc`, `sqlite3`, `md5sum`, `sha256sum`, `base64`, `jq`, `git`, `npm`, `npx`, `yarn`, `pnpm`, `curl`, `wget`, …

### Live Preview
Open HTML/CSS/JS files → see the rendered website in a sandboxed iframe. Relative paths are auto-rewritten so assets load correctly. Rebuild button refreshes after edits.

### GitHub Integration
- **OAuth Device Flow** (no client secret needed) — Client ID `Ov23liqTkPOCO4ZZ5WcH`
- Browse your repos (public + private)
- View file tree, read any file
- Clone files into the editor
- Commit & push single files
- **Create Pull Requests** — add multiple files, set branch + title + body, AWECode creates branch + commit + PR in one call

### Local File System
- Uses File System Access API (Chrome 86+ / Edge 86+)
- **Folder persistence via IndexedDB** — handle survives page refresh, one click to reconnect
- Auto-skips `node_modules`, `.git`, `dist`, etc.
- Create new files and folders on disk
- Save with `Ctrl+S` writes directly to disk

### Function Library (1000+)
30+ categories: String, Array, Object, Math, Date, Validation, Hash, Crypto, JWT, Color, URL, Sort, Search, Distance, DOM, Promise, Async, Convert, Function, Linear Algebra, Tree, Graph, Stats, Geometry, Bit, i18n, Diff, Compression, Sanitize, Encoding, JSON, Regex, Iterator, Log, Data Structure, …

### Command Palette
`Ctrl+Shift+P` (commands) and `Ctrl+P` (quick open files) — 16+ commands with keyboard shortcuts.

### LIB Documentation
16 searchable Markdown documents covering every feature, rule, error, and shortcut. Open the LIB tab in the left sidebar.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** or **Bun** (recommended)
- **Chrome 86+** or **Edge 86+** for local file access (Firefox/Safari work for everything except local files)

### Install & Run

```bash
# Clone or extract the project
cd AWECode

# Install dependencies (use bun for speed, or npm/yarn)
bun install
# or: npm install

# Start dev server
bun run dev
# or: npm run dev

# Open in browser
# → http://localhost:3000
```

### Production Build

```bash
bun run build
bun run start
```

### Try It Out

1. **Open a local folder** — Left sidebar → Files → "Open Folder" → pick any project folder
2. **Analyze code** — Click "Analyze" in the top toolbar (or `Ctrl+Shift+A`)
3. **Chat with AI** — Right sidebar → AI tab → click "Analyze code" quick prompt
4. **Connect GitHub** — Left sidebar → GitHub → "Sign in with GitHub"
5. **Run terminal commands** — Bottom panel → type `node -e 'console.log(1+1)'`
6. **Preview a website** — Open an HTML file → Right sidebar → Preview tab
7. **Read the docs** — Left sidebar → LIB → search for any feature

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser (Client)                       │
│                                                              │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ Monaco   │  │ AI Chat      │  │ Local Files (FSA API) │ │
│  │ Editor   │  │ (3 providers)│  │ + IndexedDB persist   │ │
│  └──────────┘  └──────────────┘  └───────────────────────┘ │
│                                                              │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ Terminal │  │ GitHub Panel │  │ Live Preview iframe   │ │
│  │ (input)  │  │ (OAuth flow) │  │                       │ │
│  └──────────┘  └──────────────┘  └───────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────┴──────────────────────────────────┐
│                  Next.js 16 API Routes (Server)              │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ /api/aweai/*    │  │ /api/auth/      │  │ /api/        │ │
│  │ analyze         │  │   github        │  │   terminal   │ │
│  │ lint            │  │   (OAuth flow)  │  │   (sandboxed │ │
│  │ scan            │  │ /api/github-pr  │  │    shell)    │ │
│  │ refactor        │  │   (PR create)   │  │ /api/preview │ │
│  │ chat (AI)       │  └─────────────────┘  │   (serve     │ │
│  │ functions       │                       │    files)    │ │
│  └─────────────────┘                       └──────────────┘ │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ /api/folder-scan│  │ /api/ai-deep-   │  │ /api/lib     │ │
│  │ (multi-file)    │  │   scan          │  │ (Markdown    │ │
│  │                 │  │ (regex + AI)    │  │  docs)       │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Icons | lucide-react |
| Markdown | react-markdown |
| AI (default) | z-ai-web-dev-sdk |
| AI (optional) | OpenAI, Anthropic (your API keys) |
| File System | File System Access API + IndexedDB |
| Auth | GitHub OAuth Device Flow |
| Database | Prisma + SQLite (optional) |

### Project Structure

```
AWECode/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main IDE UI
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── aweai/            # Lint, scan, refactor, chat
│   │       │   ├── analyze/
│   │       │   ├── lint/
│   │       │   ├── scan/
│   │       │   ├── refactor/
│   │       │   ├── chat/
│   │       │   ├── functions/
│   │       │   └── route.ts      # Capabilities
│   │       ├── auth/github/      # OAuth device flow
│   │       ├── github-pr/        # PR creation
│   │       ├── folder-scan/      # Multi-file scan
│   │       ├── ai-deep-scan/     # AI + offline scan
│   │       ├── terminal/         # Sandboxed shell
│   │       ├── preview/          # Live website preview
│   │       └── lib/              # LIB markdown docs
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   └── awecode/
│   │       ├── CodeEditor.tsx
│   │       ├── AIChat.tsx
│   │       ├── GitHubPanel.tsx
│   │       ├── LocalFilesPanel.tsx
│   │       ├── RealTerminal.tsx
│   │       ├── LivePreview.tsx
│   │       ├── CommandPalette.tsx
│   │       ├── ProblemsPanel.tsx
│   │       ├── FunctionCatalog.tsx
│   │       └── FileExplorer.tsx
│   ├── hooks/
│   │   ├── use-file-system.ts
│   │   ├── use-github.ts
│   │   └── use-folder-persistence.ts
│   └── lib/
│       ├── utils.ts
│       ├── db.ts
│       └── awecode/
│           ├── languages.ts      # 150+ languages
│           ├── linter.ts         # 40+ rules
│           ├── vulnerabilities.ts # 25+ rules
│           ├── refactor.ts       # Refactor + auto-fix
│           └── functions.ts      # 1000+ functions
├── LIB/                          # 16 documentation files
│   ├── README.md
│   ├── 01-editor.md
│   ├── 02-linter.md
│   ├── 03-vulnerabilities.md
│   ├── 04-refactor.md
│   ├── 05-functions.md
│   ├── 06-local-files.md
│   ├── 07-github.md
│   ├── 08-ai-agent.md
│   ├── 09-aweai-api.md
│   ├── 10-command-palette.md
│   ├── 11-languages.md
│   ├── 12-shortcuts.md
│   ├── 13-terminal.md
│   ├── 14-live-preview.md
│   ├── 15-errors.md
│   └── 16-faq.md
├── prisma/
├── public/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── README.md (this file)
```

---

## 🤖 AWEAI API

AWEAI is the REST API that powers AWECode's AI agent integration. External AI agents (Claude, GPT, custom agents) can call these endpoints.

### Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/aweai` | API capabilities |
| `GET` | `/api/aweai?action=languages` | List 150+ supported languages |
| `GET` | `/api/aweai?action=functions` | Browse 1000+ function library |
| `POST` | `/api/aweai/analyze` | Full analysis (lint + scan + refactor + correct) |
| `POST` | `/api/aweai/lint` | Lint code only |
| `POST` | `/api/aweai/scan` | Vulnerability scan only |
| `POST` | `/api/aweai/refactor` | Refactor suggestions or auto-apply |
| `POST` | `/api/aweai/chat` | AI chat with tool calling |
| `POST` | `/api/folder-scan` | Scan multiple files at once |
| `POST` | `/api/ai-deep-scan` | AI + offline deep vulnerability scan |
| `POST` | `/api/terminal` | Execute shell command (sandboxed) |
| `POST` | `/api/preview` | Create live website preview |
| `GET` | `/api/preview/<id>/<file>` | Serve preview file |
| `POST` | `/api/auth/github` | GitHub OAuth device flow |
| `POST` | `/api/github-pr` | Create PR (branch + commit + PR) |
| `GET` | `/api/lib?doc=<name>` | Get LIB documentation |

### Example: Analyze Code

```bash
curl -X POST http://localhost:3000/api/aweai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "eval(userInput)",
    "language": "javascript"
  }'
```

Response (truncated):
```json
{
  "ok": true,
  "data": {
    "lint": { "stats": { "errors": 1, "warnings": 0 } },
    "vulnerabilities": {
      "stats": { "critical": 1, "score": 75 },
      "vulnerabilities": [{
        "ruleId": "JS-EVAL",
        "cwe": "CWE-94",
        "severity": "critical",
        "recommendation": "Never use eval()..."
      }]
    }
  }
}
```

### Example: AI Chat with Tool Calling

```bash
curl -X POST http://localhost:3000/api/aweai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{ "role": "user", "content": "Analyze my code for issues" }],
    "provider": "z-ai",
    "context": {
      "filename": "auth.ts",
      "language": "typescript",
      "code": "eval(userInput)"
    }
  }'
```

The AI will automatically call the `analyze` tool, get the results, and respond with a summary.

See [`LIB/09-aweai-api.md`](./LIB/09-aweai-api.md) for the full API reference.

---

## 📚 Documentation

The complete documentation lives in the [`LIB/`](./LIB) folder. Browse it in the editor (left sidebar → LIB tab) or read the Markdown files directly.

| Doc | Content |
|-----|---------|
| [00-overview](./LIB/README.md) | Overview & quick start |
| [01-editor](./LIB/01-editor.md) | Editor features & shortcuts |
| [02-linter](./LIB/02-linter.md) | 40+ lint rules with examples |
| [03-vulnerabilities](./LIB/03-vulnerabilities.md) | 25+ vulnerability rules, CWE/OWASP |
| [04-refactor](./LIB/04-refactor.md) | Refactoring & auto-fix |
| [05-functions](./LIB/05-functions.md) | 1000+ function library |
| [06-local-files](./LIB/06-local-files.md) | File System Access API + persistence |
| [07-github](./LIB/07-github.md) | OAuth, clone, commit, PR |
| [08-ai-agent](./LIB/08-ai-agent.md) | AI chat with tool calling |
| [09-aweai-api](./LIB/09-aweai-api.md) | REST API reference |
| [10-command-palette](./LIB/10-command-palette.md) | Command palette & quick open |
| [11-languages](./LIB/11-languages.md) | 150+ supported languages |
| [12-shortcuts](./LIB/12-shortcuts.md) | Keyboard shortcuts |
| [13-terminal](./LIB/13-terminal.md) | Real shell terminal |
| [14-live-preview](./LIB/14-live-preview.md) | Website preview |
| [15-errors](./LIB/15-errors.md) | Common errors & solutions |
| [16-faq](./LIB/16-faq.md) | FAQ |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+P` | Command Palette |
| `Ctrl+P` | Quick Open file |
| `Ctrl+S` | Save file |
| `Ctrl+Shift+A` | Analyze all |
| `Ctrl+Shift+S` | Scan vulnerabilities |
| `Ctrl+Shift+L` | Lint code |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+\`` | Toggle terminal |
| `Ctrl+W` | Close tab |
| `Shift+Alt+F` | Format document |

Full list in [`LIB/12-shortcuts.md`](./LIB/12-shortcuts.md).

---

## 🔒 Privacy & Security

| Data | Where it goes |
|------|---------------|
| **Local files** | Never leave your browser |
| **GitHub token** | Stored in browser `localStorage`, sent only to `api.github.com` |
| **AI API key** | Stored in browser `localStorage`, sent only to your chosen AI provider |
| **Code for lint/scan** | Sent to AWECode's server, processed locally, no external calls |
| **Code for AI chat** | Sent to your chosen AI provider (Z.ai, OpenAI, or Anthropic) |
| **Terminal commands** | Executed on AWECode's server in a sandboxed directory |

### Terminal Sandbox
- Working directory: `/tmp/awecode-workspace`
- Only an allowlist of commands runs (see [`LIB/13-terminal.md`](./LIB/13-terminal.md))
- 15-second timeout per command
- No root access, no network egress restrictions inside the sandbox

### GitHub OAuth
- Uses Device Flow (no client secret in the browser)
- Client ID: `Ov23liqTkPOCO4ZZ5WcH`
- Scopes: `repo`, `read:user`, `workflow`
- Token stored in browser only — revoke anytime at [github.com/settings/tokens](https://github.com/settings/tokens)

---

## 🌐 Browser Support

| Feature | Chrome 86+ | Edge 86+ | Firefox | Safari |
|---------|:---------:|:--------:|:-------:|:------:|
| Editor & analysis | ✅ | ✅ | ✅ | ✅ |
| Local file access | ✅ | ✅ | ❌ | ❌ |
| GitHub | ✅ | ✅ | ✅ | ✅ |
| AI chat | ✅ | ✅ | ✅ | ✅ |
| Terminal | ✅ | ✅ | ✅ | ✅ |
| Live preview | ✅ | ✅ | ✅ | ✅ |

For the full experience, use **Chrome 86+** or **Edge 86+**.

---

## 🛠 Development

### Scripts

```bash
bun run dev        # Start dev server (port 3000)
bun run build      # Production build
bun run start      # Start production server
bun run lint       # ESLint
bun run db:push    # Push Prisma schema to SQLite
bun run db:generate # Generate Prisma client
```

### Adding a New Lint Rule

Edit `src/lib/awecode/linter.ts` and add a rule to the `RULES` array:

```typescript
{
  id: 'my-rule',
  name: 'My Rule',
  severity: 'warning',
  category: 'best-practice',
  languages: ['javascript', 'typescript'],
  description: 'Description here',
  check: (code, lines) => {
    const problems: LintProblem[] = []
    lines.forEach((line, idx) => {
      if (line.includes('bad-pattern')) {
        problems.push({
          id: makeId('my-rule', idx + 1, 1),
          ruleId: 'my-rule',
          ruleName: 'My Rule',
          severity: 'warning',
          message: 'Found bad pattern',
          line: idx + 1,
          column: 1,
          category: 'best-practice',
          source: 'awecode-lint',
        })
      }
    })
    return problems
  },
}
```

### Adding a New Vulnerability Rule

Edit `src/lib/awecode/vulnerabilities.ts` and add a rule to the `RULES` array with the same structure (plus `cwe`, `owaspCategory`, `impact`, `recommendation`).

### Adding a New Language

Edit `src/lib/awecode/languages.ts` and add an entry to `LANGUAGES`:

```typescript
{
  id: 'mylang',
  label: 'My Language',
  extensions: ['.myl'],
  monacoId: 'plaintext',  // or register a custom Monaco language
  category: 'Other',
  hasLinter: false,
  hasVulnScan: false,
}
```

### Adding a New Utility Function

Edit `src/lib/awecode/functions.ts` and add an entry to `implementedFunctions` (with code) or `moreTemplates` (metadata only).

---

## 📦 Deployment

### Vercel
1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Framework preset: Next.js
4. Deploy

### Self-hosted (Docker)
```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY . .
RUN bun run build
EXPOSE 3000
CMD ["bun", "run", "start"]
```

```bash
docker build -t awecode .
docker run -p 3000:3000 awecode
```

### Self-hosted (Bun)
```bash
bun install
bun run build
bun run start
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a PR

Please run `bun run lint` before submitting.

---

## 📄 License

MIT — see [LICENSE](./LICENSE).

---

## 🙏 Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — the editor that powers VS Code
- [shadcn/ui](https://ui.shadcn.com/) — beautiful, accessible React components
- [Tailwind CSS](https://tailwindcss.com/) — utility-first CSS
- [Next.js](https://nextjs.org/) — the React framework
- [Z.ai](https://z.ai/) — AI SDK provider
- [lucide](https://lucide.dev/) — beautiful icons

---

<div align="center">

**[AWECode](https://github.com/awecode)** — Built with ❤️ for developers who want a real editor in the browser.

</div>
