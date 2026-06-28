# 01 — Code Editor

The AWECode editor is built on **Monaco Editor** (the same engine that powers VS Code). This means you get the same syntax highlighting, IntelliSense, bracket matching, and code navigation features.

## Features

### Syntax Highlighting
- 150+ programming languages supported
- Custom AWE Dark and AWE Light themes
- Per-token coloring (keywords, strings, numbers, comments, types, functions)

### IntelliSense
- Autocompletion for keywords, functions, variables
- Parameter hints when typing function calls
- Quick info on hover
- Member list for objects

### Code Navigation
- **Go to Definition**: `F12`
- **Peek Definition**: `Shift+F12`
- **Find All References**: `Shift+Alt+F12`
- **Rename Symbol**: `F2`
- **Bracket Matching**: automatic
- **Bracket Pair Colorization**: enabled

### Editing Features
- Multi-cursor editing: `Ctrl+Alt+Down` / `Ctrl+Alt+Up`
- Select next occurrence: `Ctrl+D`
- Select all occurrences: `Ctrl+Shift+L`
- Move line up/down: `Alt+Up` / `Alt+Down`
- Copy line up/down: `Shift+Alt+Down` / `Shift+Alt+Up`
- Delete line: `Ctrl+Shift+K`
- Comment toggle: `Ctrl+/`
- Format document: `Shift+Alt+F`
- Fold/unfold: `Ctrl+Shift+[` / `Ctrl+Shift+]`

### Search & Replace
- Find: `Ctrl+F`
- Replace: `Ctrl+H`
- Find in files: `Ctrl+Shift+F` (uses sidebar search panel)

### Multi-Tab Support
AWECode supports multiple open files in tabs:
- Click a file in the sidebar to open it in a new tab
- Click the `×` on a tab to close it
- Right-click a tab for more options
- Tabs persist their undo history and cursor position

### Themes
Two custom themes are included:
- **AWE Dark** (default) — deep black background with violet/fuchsia accents
- **AWE Light** — clean white with violet accents

Toggle theme with the sun/moon icon in the top-right corner.

## Configuration

Editor options exposed in the UI:
- Font size (12-20px)
- Word wrap (on/off)
- Tab size (2/4/8)
- Minimap visibility
- Render whitespace
- Sticky scroll (enabled by default)

## Performance

Monaco is loaded on-demand via `@monaco-editor/react`'s lazy loader. The first time you open the editor, the Monaco runtime is downloaded (~3MB gzipped) and cached. Subsequent loads are instant.

For very large files (>10MB), consider closing other tabs to keep memory usage reasonable.
