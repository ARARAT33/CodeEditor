# 16 — FAQ

Frequently asked questions about AWECode.

## General

### Is AWECode free?
Yes, AWECode is free to use. The default AI provider (Z.ai SDK) has a free tier. For OpenAI/Anthropic, you use your own API key and pay their per-token rates.

### Does AWECode work offline?
The linter, vulnerability scanner, refactoring engine, and auto-fix all run 100% offline on the server. The AI chat requires internet (to call the AI provider). Local file access works offline once you've opened a folder.

### What browsers are supported?
- **Chrome 86+** — Full support including local file access
- **Edge 86+** — Full support including local file access
- **Opera 72+** — Full support
- **Firefox** — All features except local file access (uses demo files)
- **Safari** — All features except local file access

### Is my code sent to any external service?
- **Linter, scanner, refactor**: Run on AWECode's server, no external calls
- **AI chat**: Goes to your chosen AI provider (Z.ai, OpenAI, or Anthropic)
- **Local files**: Never leave your browser
- **GitHub token**: Stored in your browser's localStorage, sent only to api.github.com

## Editor

### Can I use AWECode instead of VS Code?
AWECode is designed for quick edits, security analysis, and AI-powered coding. For full-time development, VS Code has more extensions and integrations.

### Can I install extensions?
Not yet. AWECode has a fixed set of features. We may add extension support in the future.

### Does AWECode support my language?
AWECode supports 150+ programming languages for syntax highlighting. The linter has language-specific rules for the most popular ones (JS, TS, Python, Java, Go, Rust, C/C++, PHP, SQL, Bash, etc.). See LIB → Languages for the full list.

## Local Files

### Where are my files stored?
Files stay on your computer. AWECode uses the File System Access API to read and write directly to disk. Nothing is uploaded.

### Does the folder persist after refresh?
Yes. AWECode saves the folder handle in IndexedDB. After refresh, you'll see a "Reconnect" button in the sidebar to re-grant permission (browser requires a user gesture).

### Can I edit binary files?
No, AWECode only handles text files. Binary files (images, PDFs, executables) are skipped in the file tree.

### What's the file size limit?
Files up to ~10MB work well. Larger files may be slow to load.

## GitHub

### Do I need a token?
No, you can sign in with GitHub OAuth (device flow). No token needed. Alternatively, you can use a Personal Access Token.

### What scopes does the OAuth request?
- `repo` — Read/write access to your repositories (public and private)
- `read:user` — Read your profile
- `workflow` — Access GitHub Actions workflows

### Can I create PRs?
Yes. Open the GitHub panel → PR tab. Add files, set a branch name and title, and click "Create PR". AWECode will:
1. Create a new branch from the default branch
2. Commit your files to the new branch
3. Open a pull request to the default branch

### Can I push to existing branches?
Yes. Use the "Commit & Push" panel in the Files view. Enter the file path, content, and commit message.

## AI Agent

### What can the AI do?
- Read your current file
- Run analysis tools (lint, scan, refactor, auto-fix)
- Search the function library
- Suggest code changes
- Apply code to the editor (with your confirmation)

### Which AI providers are supported?
- **Z.ai SDK** (default, free tier)
- **OpenAI** (gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo)
- **Anthropic** (claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus)

### How much does AI cost?
- **Z.ai**: Free tier available, then paid
- **OpenAI**: ~$0.15 per million input tokens (gpt-4o-mini), ~$2.50 (gpt-4o)
- **Anthropic**: ~$0.25 per million input tokens (haiku), ~$3 (sonnet)

Each chat message uses ~500-5000 tokens depending on context size.

### Is my code sent to the AI?
Yes, when you chat, your current file's content is included in the prompt so the AI can answer questions about it. This is necessary for the AI to be useful. Your code goes directly to your chosen AI provider (not through AWECode's server when using OpenAI/Anthropic).

## Terminal

### Is the terminal a real shell?
Yes. Commands run in `sh` on the AWECode server (sandboxed to `/tmp/awecode-workspace`).

### Can I run any command?
No, only an allowlist of safe commands. See LIB → Terminal for the full list.

### Can the terminal access my local files?
No. The terminal runs on the server, not on your computer. It cannot see your local files. To work with local files, use the editor.

## Security

### Is AWECode secure to use with sensitive code?
- All analysis runs server-side locally (no external API calls)
- Local files never leave your browser
- AI chat goes to your chosen AI provider — don't use sensitive code with cloud AI if that's a concern
- GitHub tokens are stored in browser localStorage and sent only to GitHub

### Can AWECode be self-hosted?
Yes, AWECode is a standard Next.js app. Clone the repo, run `npm install && npm run dev`.

### Does AWECode have access to my GitHub password?
No. AWECode uses OAuth device flow or Personal Access Tokens. We never see your GitHub password.
