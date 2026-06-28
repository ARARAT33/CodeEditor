# src/components/awecode/ — AWECode UI Components

React components that make up the AWECode IDE interface. All components are client-side (`'use client'`) and use shadcn/ui + Tailwind CSS.

## Components

### `CodeEditor.tsx`
Monaco Editor wrapper with custom AWE themes.

**Props:**
- `value`, `language`, `monacoLanguage`, `theme` ('awe-dark' | 'awe-light')
- `onChange`, `onMount`, `fontSize`, `readOnly`, `path`

**Features:**
- Two custom themes: AWE Dark (deep black + violet/fuchsia), AWE Light (clean white + violet)
- Full IntelliSense, bracket pair colorization, sticky scroll, multi-cursor
- Configurable minimap, word wrap, font ligatures
- Per-path model management (for multi-file)

### `AIChat.tsx`
AI agent chat panel with tool calling.

**Props:**
- `code`, `language`, `filename`, `selection`, `cursorLine`
- `onApplyCode(code)`, `onInsertCode(code)`

**Features:**
- 3 providers: Z.ai (default), OpenAI, Anthropic
- API key stored in `localStorage`, never sent to AWECode server
- 6 quick prompts (Analyze, Find vulns, Explain, Refactor, Find function, Fix all)
- AI responses include code blocks with Apply/Insert/Copy buttons
- Tool call results shown in collapsible sections
- Auto-scroll, message history

### `GitHubPanel.tsx`
GitHub integration panel.

**Props:**
- `onOpenFile(path, content)`, `onCloneToFiles(files, repoName)`

**Features:**
- **OAuth Device Flow** — "Sign in with GitHub" button, no token needed
  - Shows 8-digit user code, opens github.com/login/device
  - Polls until authorized, then connects
- Token-based login as fallback
- 4 views: Repos / Files / Commits / PR
- **PR creation** — add files, set branch + title + body, creates branch + commit + PR
- Commit & Push panel (single file)
- Repo search

### `LocalFilesPanel.tsx`
Local file system browser using File System Access API.

**Props:**
- `onOpenFile(path, content, handle)`, `activePath`
- `registerSaveHandler(handler)`, `onDisconnect`
- `onScanFolder`, `scanLoading`

**Features:**
- "Open Folder" button (Chrome/Edge 86+)
- Shows folder tree (auto-skips node_modules, .git, etc.)
- Create new files/folders on disk
- **Folder persistence** — after refresh, shows "Reconnect to {folder}" button
- "Scan All" button for whole-folder vulnerability scan
- Per-file language icon colors

### `RealTerminal.tsx`
Real shell terminal UI.

**Props:**
- `height`, `onHeightChange`

**Features:**
- Sends commands to `POST /api/terminal`
- Real shell execution (sandboxed on server)
- Command history (↑/↓)
- Clear (Ctrl+L)
- Resize buttons (smaller/larger)
- Color-coded output (input/output/error/info)
- 15s timeout indicator

### `LivePreview.tsx`
Live website preview for HTML/CSS/JS.

**Props:**
- `files` (array of {path, content})

**Features:**
- Auto-detects HTML entry file
- Sends files to `POST /api/preview`, gets preview URL
- Renders in sandboxed iframe (allow-scripts, allow-same-origin, allow-forms, allow-popups, allow-modals)
- Entry file selector
- Rebuild button to refresh after edits
- Open in new tab button
- File count display

### `CommandPalette.tsx`
VS Code-style command palette.

**Props:**
- `open`, `onClose`, `commands`, `mode` ('commands' | 'files'), `files`, `onOpenFile`

**Features:**
- Two modes: commands (`Ctrl+Shift+P`) and files (`Ctrl+P`)
- Fuzzy search
- Keyboard navigation (↑/↓/Enter/Esc)
- Shows shortcut hints
- Modal overlay with backdrop

### `ProblemsPanel.tsx`
Analysis results display.

**Props:**
- `lint`, `vulnerabilities`, `refactor`, `corrections`
- `onJumpTo(line, col)`, `onApplyCorrection`, `onApplyRefactor`
- `activeTab`, `onTabChange`

**Features:**
- 4 sub-tabs: Lint / Security / Refactor / Auto-fix
- Filter by severity (All/Error/Warning/Info/Hint)
- Click any problem to jump to line in editor
- Security score (0-100) with color coding
- CWE/OWASP badges for vulnerabilities
- Before/After code blocks for corrections
- Apply buttons for safe auto-corrections

### `FunctionCatalog.tsx`
1000+ function library browser.

**Props:**
- `onInsert(code, name)`, `language`

**Features:**
- Fetches from `/api/aweai/functions`
- Search by name/description/tags
- Filter by category (dropdown)
- Function detail panel with signature, parameters, returns, example, complexity
- Insert (into editor) and Copy buttons
- "impl" badge for implemented functions

### `FileExplorer.tsx`
In-memory file tree (used when File System Access API isn't available).

**Props:**
- `files` (FileNode[]), `activePath`, `onSelectFile`, `onToggleFolder`, etc.

**Features:**
- Recursive folder tree
- Create new files/folders (in-memory)
- Search files by name
- Language-colored file icons

## Conventions

- All components use `'use client'` directive
- Use shadcn/ui primitives (Button, Input, Tabs, ScrollArea, Select, etc.)
- Use lucide-react for icons
- Use Tailwind CSS classes — stick to the zinc color palette (bg-zinc-950, text-zinc-100, border-zinc-800)
- Violet/fuchsia/amber for accents
- No indigo or blue
- All API calls go through `fetch()` to relative URLs (e.g., `/api/aweai/analyze`)
- Toast notifications via `useToast()` hook

## File Layout Pattern

Each component file follows this pattern:
```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Icon1, Icon2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
// ... other shadcn/ui imports
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export interface ComponentProps {
  // ...
}

export function Component({ ... }: ComponentProps) {
  // State
  // Effects
  // Callbacks
  // Render
}
```

See the [root README](../../README.md) for the full project overview.
