# 10 — Command Palette & Quick Open

AWECode includes a VS Code-style command palette and quick file open for fast keyboard-driven navigation.

## Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)

The command palette lets you search and execute any AWECode command by name.

### Opening
- Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
- Or click the **≡** icon in the top-right corner

### Available Commands

#### File Operations
- `File: New File` — create a new file in the current folder
- `File: New Folder` — create a new folder
- `File: Open Folder` — open a local folder from disk
- `File: Save` — save the current file (`Ctrl+S`)
- `File: Save All` — save all open files
- `File: Close Tab` — close the current tab (`Ctrl+W`)
- `File: Close All` — close all tabs
- `File: Upload` — open a file from your computer
- `File: Download` — download the current file

#### Analysis
- `Analyze: Run Full Analysis` — lint + scan + refactor + auto-fix
- `Analyze: Lint Code` — run the linter only
- `Analyze: Scan Vulnerabilities` — run the security scanner
- `Analyze: Refactor` — get refactoring suggestions
- `Analyze: Auto-Fix` — apply safe corrections

#### Editor
- `Editor: Toggle Theme` — switch between dark and light
- `Editor: Format Document` — format the current file (`Shift+Alt+F`)
- `Editor: Toggle Word Wrap` — enable/disable word wrap
- `Editor: Increase Font Size` — `Ctrl++`
- `Editor: Decrease Font Size` — `Ctrl+-`
- `Editor: Toggle Minimap` — show/hide the minimap

#### View
- `View: Toggle Sidebar` — show/hide the left panel (`Ctrl+B`)
- `View: Toggle Right Panel` — show/hide the right panel
- `View: Toggle Terminal` — show/hide the bottom panel (`Ctrl+\``)
- `View: Toggle Problems Panel` — focus the problems panel

#### GitHub
- `GitHub: Connect` — connect with a personal access token
- `GitHub: Disconnect` — clear the stored token
- `GitHub: Browse Repos` — list your repositories
- `GitHub: Clone Repo` — clone a repo to local disk
- `GitHub: Commit & Push` — commit current changes to GitHub

#### AI
- `AI: Open Chat` — focus the AI chat panel
- `AI: Configure Provider` — set up API key
- `AI: Clear History` — clear the chat history

#### Local Files
- `Files: Open Folder` — open a local folder
- `Files: Revoke Permissions` — revoke file system access

### Filtering
Type to filter commands by name. The list updates as you type. Press `Enter` to execute the selected command.

### Navigation
- `↑` / `↓` — navigate the list
- `Enter` — execute
- `Esc` — close

## Quick Open (`Ctrl+P` / `Cmd+P`)

Quick open lets you jump to any file by name (fuzzy search).

### Opening
- Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac)

### Searching
- Type part of a filename — fuzzy matching finds files anywhere in the project
- Examples:
  - `auth` matches `src/auth.ts`, `src/utils/auth.py`, `docs/auth.md`
  - `uai` matches `src/lib/awecode/linter.ts` (fuzzy)
  - `*.py` lists all Python files

### Symbols
- Type `@` to search for symbols in the current file (functions, classes)
- Type `#` to search for symbols across all files
- Type `:` to jump to a line number (e.g., `:42`)

## Tips

- The command palette is the fastest way to discover AWECode's features
- If you forget a keyboard shortcut, open the palette and search by name
- Quick Open remembers your recent files — they appear at the top of the list
- Use `Ctrl+P` then `@` to quickly navigate within a large file
