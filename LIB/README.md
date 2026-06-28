# LIB/ — AWECode Documentation Library

Complete, searchable documentation for every AWECode feature, tool, rule, error, and shortcut.

## Reading the Docs

### In AWECode
1. Open the editor at http://localhost:3000
2. Left sidebar → **LIB** tab
3. Use the search box to find any topic
4. Click any document to read it (rendered as Markdown)

### Directly
Open any `.md` file in this directory with your favorite Markdown viewer, or read it on GitHub.

## Documents

| # | File | Content |
|---|------|---------|
| 00 | [README.md](./README.md) | This overview & quick start |
| 01 | [01-editor.md](./01-editor.md) | Monaco editor features, shortcuts, themes |
| 02 | [02-linter.md](./02-linter.md) | 40+ lint rules with examples and fixes |
| 03 | [03-vulnerabilities.md](./03-vulnerabilities.md) | 25+ vulnerability rules, CWE/OWASP mapping |
| 04 | [04-refactor.md](./04-refactor.md) | Refactoring tools and auto-fix engine |
| 05 | [05-functions.md](./05-functions.md) | 1000+ utility function library |
| 06 | [06-local-files.md](./06-local-files.md) | File System Access API, folder persistence |
| 07 | [07-github.md](./07-github.md) | OAuth login, browse repos, clone, commit, PR |
| 08 | [08-ai-agent.md](./08-ai-agent.md) | AI agent chat, tool calling, providers |
| 09 | [09-aweai-api.md](./09-aweai-api.md) | AWEAI REST API reference |
| 10 | [10-command-palette.md](./10-command-palette.md) | Command palette and quick open |
| 11 | [11-languages.md](./11-languages.md) | 150+ supported languages |
| 12 | [12-shortcuts.md](./12-shortcuts.md) | Complete keyboard shortcuts |
| 13 | [13-terminal.md](./13-terminal.md) | Real shell terminal, allowed commands |
| 14 | [14-live-preview.md](./14-live-preview.md) | Live website preview |
| 15 | [15-errors.md](./15-errors.md) | Common errors & solutions |
| 16 | [16-faq.md](./16-faq.md) | Frequently asked questions |

## Quick Search Tips

The LIB panel search box matches document names, descriptions, and paths. Try searching for:
- **A feature**: `github`, `terminal`, `ai`, `preview`
- **A rule ID**: `no-eval`, `sql-injection`, `py-mutable-default`
- **An error message**: `hydration`, `undefined is not a function`
- **A language**: `python`, `rust`, `typescript`
- **A shortcut**: `Ctrl+S`, `palette`

## Document Format

All docs are written in GitHub-flavored Markdown with:
- Headers (`#`, `##`, `###`)
- Tables for rule catalogs
- Code blocks with language hints (```javascript, ```python, ```bash)
- Internal links to other LIB docs
- External links to OWASP, CWE, MDN, etc.

## Contributing

To add a new doc:
1. Create `NN-name.md` in this directory (NN = next number)
2. Add an entry to the table above
3. Add the doc name to `VALID_DOCS` in `src/app/api/lib/route.ts`
4. Add an entry to `LIB_DOCS` in `src/app/page.tsx`

## Serving

Docs are served by `GET /api/lib?doc=<name>` which reads from this directory. The route validates doc names against an allowlist to prevent path traversal.

See the [root README](../README.md) for the full project overview.
