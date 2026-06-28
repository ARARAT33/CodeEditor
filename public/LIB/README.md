# AWECode Library — Complete Documentation

Welcome to the AWECode documentation library. This directory contains detailed guides for every feature and tool in AWECode.

## Table of Contents

| # | Document | Description |
|---|----------|-------------|
| 1 | [01-editor.md](./01-editor.md) | Code editor features, shortcuts, multi-tab support |
| 2 | [02-linter.md](./02-linter.md) | Offline linter — 40+ rules across 15+ languages |
| 3 | [03-vulnerabilities.md](./03-vulnerabilities.md) | Vulnerability scanner — 25+ security rules, CWE/OWASP mapping |
| 4 | [04-refactor.md](./04-refactor.md) | Code refactoring tools and auto-fix engine |
| 5 | [05-functions.md](./05-functions.md) | 1000+ utility function library |
| 6 | [06-local-files.md](./06-local-files.md) | Local file system access (File System Access API) |
| 7 | [07-github.md](./07-github.md) | GitHub integration — clone, commit, push |
| 8 | [08-ai-agent.md](./08-ai-agent.md) | AI Agent chat — uses your own API key |
| 9 | [09-aweai-api.md](./09-aweai-api.md) | AWEAI REST API reference for AI agents |
| 10 | [10-command-palette.md](./10-command-palette.md) | Command palette and quick open |
| 11 | [11-languages.md](./11-languages.md) | Supported programming languages (150+) |
| 12 | [12-shortcuts.md](./12-shortcuts.md) | Complete keyboard shortcuts reference |

## Quick Start

1. **Open a local folder**: Click "Open Folder" in the sidebar (Chrome/Edge required)
2. **Browse & edit files**: Click any file in the sidebar to open it in the editor
3. **Save to disk**: `Ctrl+S` writes changes back to your real file system
4. **Analyze code**: Click "Analyze All" to run lint + vulnerability scan + refactor
5. **Chat with AI**: Open the AI panel, enter your API key, ask anything about your code
6. **Connect GitHub**: Click the GitHub icon, paste a token, browse and clone your repos

## Architecture

- **Frontend**: Next.js 16 + TypeScript + Monaco Editor + Tailwind CSS
- **Backend**: Next.js API routes (Node.js runtime)
- **File System**: Browser-native File System Access API (no upload, direct disk access)
- **GitHub**: REST API v3 (token-based auth)
- **AI Agent**: Pluggable providers (z-ai-web-dev-sdk default, OpenAI, Anthropic)
- **All analysis is 100% offline**: linter, vulnerability scanner, refactor engine run entirely server-side with no external API calls

## Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Editor & analysis | ✅ | ✅ | ✅ | ✅ |
| Local file access | ✅ | ✅ | ❌ | ❌ |
| GitHub | ✅ | ✅ | ✅ | ✅ |
| AI chat | ✅ | ✅ | ✅ | ✅ |

For local file access, use **Chrome 86+** or **Edge 86+**.
