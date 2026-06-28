# 08 — AI Agent (Chat)

AWECode includes an AI agent that you can chat with about your code. The agent can:

- Explain code
- Suggest improvements
- Find bugs and security issues
- Apply fixes to your code
- Run AWEAI analysis tools (lint, scan, refactor) on demand
- Answer questions about the function library

## API Key Configuration

The AI agent uses your **own API key**. AWECode supports three providers:

### 1. Z.ai SDK (default, no key needed)
- Already integrated in AWECode
- Free tier available
- Works out of the box

### 2. OpenAI
- Get an API key from https://platform.openai.com/api-keys
- Models: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`
- Pricing: per-token, see https://openai.com/pricing

### 3. Anthropic
- Get an API key from https://console.anthropic.com/
- Models: `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`, `claude-3-opus-20240229`
- Pricing: per-token, see https://www.anthropic.com/pricing

### Setting Your Key

1. Open the **AI** tab in the right panel
2. Click the **Settings (gear)** icon
3. Select your provider
4. Paste your API key
5. Select a model
6. Click **Save**

Your key is stored in `localStorage` and **never sent to AWECode's server** — chat requests go directly from your browser to the provider's API (for OpenAI/Anthropic) or through AWECode's server using the z-ai SDK.

## Chat Features

### Context Awareness
The AI agent automatically has access to:
- The current file's name and language
- The current file's content
- The cursor position
- The selected text (if any)
- Recent chat history

### Tool Calling
The AI can call these tools to do real work:

| Tool | What it does |
|------|-------------|
| `analyze` | Run full AWEAI analysis (lint + scan + refactor) |
| `lint` | Run the linter on current code |
| `scan` | Run the vulnerability scanner |
| `refactor` | Get refactoring suggestions |
| `correct` | Auto-fix common issues |
| `search_functions` | Search the function library |
| `apply_code` | Replace code in the editor |
| `insert_code` | Insert code at cursor |
| `read_file` | Read another file (when local files are open) |

When the AI calls a tool, you'll see the tool call in the chat (e.g., "🔧 Running vulnerability scan..."), followed by the result, and then the AI's response.

### Example Conversations

**You**: "What's wrong with this code?"
**AI**: [calls `analyze` tool] → "I found 3 issues: SQL injection on line 5, hardcoded API key on line 12, and use of `var` on line 20. The most critical is the SQL injection — would you like me to fix it?"

**You**: "Yes, fix the SQL injection"
**AI**: [calls `apply_code` tool] → "Done. I replaced the string concatenation with a parameterized query. Here's the diff: ..."

**You**: "Is there a function in the library for debouncing?"
**AI**: [calls `search_functions` tool with query "debounce"] → "Yes! There's a `debounce` function in the Time category. Here's the signature: `debounce<T>(fn: T, wait: number): T`. Want me to insert it?"

**You**: "Explain what this function does"
**AI**: [reads cursor context] → "This function authenticates a user by checking their credentials against the database. However, there's a security issue..."

### Applying Code Changes
When the AI suggests code changes:
1. The change appears in a code block in the chat
2. Below the code block, you see **Apply** and **Insert** buttons
3. **Apply** — replaces the current selection (or whole file if no selection)
4. **Insert** — inserts the code at your cursor position
5. The editor updates immediately; you can `Ctrl+Z` to undo

## Privacy

- **Z.ai SDK**: messages go through AWECode's server (which calls the z-ai SDK)
- **OpenAI**: messages go directly from your browser to `api.openai.com`
- **Anthropic**: messages go directly from your browser to `api.anthropic.com`
- AWECode's server never sees your messages when using OpenAI/Anthropic directly
- Your API key is stored only in `localStorage` on your computer

## System Prompt

The AI agent uses this system prompt (you can customize it in Settings):

```
You are AWEAI, the AI assistant built into AWECode — a powerful code editor.
You help the user write, understand, and improve their code.

You have access to tools:
- analyze: run lint + vulnerability scan + refactor analysis on current code
- lint: run the offline linter
- scan: scan for security vulnerabilities
- refactor: get refactoring suggestions
- correct: auto-fix common issues
- search_functions: search the 1000+ function library
- apply_code: replace code in the editor
- insert_code: insert code at cursor
- read_file: read another open file

When the user asks about issues, call `analyze` first.
When the user asks for utility functions, call `search_functions`.
When you suggest code, ask if the user wants you to apply it.

Be concise. Use markdown formatting. Show code in fenced blocks.
```

## Limits

- **Context window**: depends on the model (e.g., GPT-4o: 128K tokens, Claude 3.5 Sonnet: 200K tokens)
- **File size**: very large files may exceed the context window — the AI will see only the first ~50K characters
- **Tool calls**: max 10 tool calls per turn
- **History**: last 20 messages kept in context

## Cost Awareness

When using OpenAI/Anthropic:
- Each chat message costs tokens (input + output)
- Tool calls add tokens (the tool result is added to context)
- Large files = more tokens = higher cost
- Use `gpt-4o-mini` or `claude-3-5-haiku` for cheaper chat
- Use `gpt-4o` or `claude-3-5-sonnet` for complex analysis

The chat UI shows the token count after each response.
