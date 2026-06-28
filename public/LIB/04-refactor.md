# 04 — Refactoring & Auto-Fix

AWECode includes two complementary tools for improving existing code:

1. **Refactor Engine** — suggests improvements (some can be auto-applied)
2. **Auto-Fix Engine** — applies safe corrections automatically

Both run **100% offline**.

## Refactor Engine

The refactor engine analyzes your code and produces a list of **refactoring opportunities** — each describing a change that would improve the code's readability, maintainability, or correctness.

### Opportunity Types (20+)

| Type | Description | Auto? |
|------|-------------|-------|
| `convert-var-to-let-const` | Replace `var` with `const`/`let` | ✅ |
| `convert-to-template-literal` | Replace string concat with template literals | ✅ |
| `convert-to-arrow` | Convert function expressions to arrow functions | ✅ |
| `convert-promise-to-async-await` | Convert `.then()` chains to `async/await` | manual |
| `extract-variable` | Extract magic numbers to named constants | manual |
| `extract-function` | Extract long/nested code to a function | manual |
| `sort-imports` | Sort imports alphabetically | ✅ |
| `add-jsdoc` | Add JSDoc/docstring to undocumented functions | ✅ |
| `add-error-handling` | Wrap `await` in try/catch | manual |
| `add-null-check` | Add optional chaining for deep property access | manual |
| `convert-callback-to-promise` | Convert Node-style callbacks to Promises | manual |
| `invert-condition` | Invert `if` for early return (reduce nesting) | manual |
| `format-code` | Trim trailing whitespace, normalize | ✅ |
| `remove-comments` | Strip comments (careful!) | ✅ |
| `remove-unused-imports` | Remove imports not used | manual |

### Difficulty Levels

Each opportunity is rated by difficulty:
- **easy** — safe, mechanical change (e.g., `var` → `const`)
- **medium** — requires some judgment (e.g., extract function)
- **auto** flag means it can be applied without human review

### Using Refactor

1. Click **Refactor** in the top toolbar
2. Open **Problems** tab → **Refactor** sub-tab
3. Browse opportunities, sorted by difficulty
4. Click **Apply** on any auto-applicable opportunity
5. The code is rewritten and the editor updates

### From the API
```bash
# Get suggestions only
curl -X POST http://your-host/api/aweai/refactor \
  -H "Content-Type: application/json" \
  -d '{
    "code": "var x = 1; const y = 'a' + x;",
    "language": "javascript",
    "apply": false,
    "mode": "refactor"
  }'

# Apply safe refactorings
curl -X POST http://your-host/api/aweai/refactor \
  -H "Content-Type: application/json" \
  -d '{
    "code": "var x = 1; const y = 'a' + x;",
    "language": "javascript",
    "apply": true,
    "mode": "refactor"
  }'
```

## Auto-Fix Engine

Auto-fix applies **safe, high-confidence corrections** to your code automatically. It's the fastest way to clean up common issues.

### What Auto-Fix Does

| Correction | Languages | Confidence |
|------------|-----------|------------|
| `==` → `===`, `!=` → `!==` | JS/TS | high |
| Remove trailing whitespace | all | high |
| Python: mutable default → `None` | Python | high |
| Python: bare `except:` → `except Exception:` | Python | high |
| `var` → `const` | JS/TS | medium |
| Remove `debugger` statements | JS/TS | high |
| `strcpy` → `strncpy` with bounds | C/C++ | high |

Only **high-confidence** corrections are auto-applied. Medium and low confidence corrections are listed but require manual approval.

### Using Auto-Fix

1. Click **Auto-fix** in the top toolbar
2. The engine runs all applicable corrections
3. Safe corrections are applied to your code immediately
4. The editor updates with the new code
5. Open **Problems** tab → **Auto-fix** sub-tab to see what was changed (before/after for each correction)

### From the API
```bash
curl -X POST http://your-host/api/aweai/refactor \
  -H "Content-Type: application/json" \
  -d '{
    "code": "var x = 1; if (x == 1) { console.log('equal'); }",
    "language": "javascript",
    "mode": "correct"
  }'
```

Response includes:
- `corrections` — full list of detected corrections
- `appliedCount` — how many were auto-applied
- `correctedCode` — the new code with fixes applied

## Safety

- **Auto-fix only applies high-confidence corrections**
- Medium/low confidence corrections are listed but not applied
- The original code is preserved in the `original` field of each correction
- You can review each change in the Auto-fix tab before saving

## Limits

The refactor and auto-fix engines use **regex heuristics**, not full AST. This means:
- Complex transformations (like extracting a function) are suggested but not auto-applied
- Some opportunities may be false positives — review before applying
- For best results, run **Lint** first to find issues, then **Auto-fix** to correct them, then **Refactor** for deeper improvements
