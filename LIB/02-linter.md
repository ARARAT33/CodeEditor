# 02 — Offline Linter

AWECode's linter is a **100% offline static analyzer**. It runs entirely on the server using regular expressions and token heuristics — no external API calls, no cloud services, no telemetry.

## How It Works

1. You click **Lint** (or **Analyze All**)
2. The browser sends the code + language to `POST /api/aweai/lint`
3. The server runs all applicable rules against the code
4. Problems are returned with line/column, severity, suggestion, and (where applicable) auto-fix

## Supported Languages

The linter has language-specific rules for:
- **JavaScript / TypeScript**: 10+ rules
- **Python**: 6+ rules
- **Java**: 2+ rules
- **Go**: 2+ rules
- **Rust**: 1+ rule
- **C / C++**: 3+ rules
- **PHP**: 1+ rule
- **SQL**: 2+ rules
- **HTML / CSS**: 2+ rules
- **Bash / Shell**: 2+ rules
- **Dockerfile**: 2+ rules (security section)

Generic rules (whitespace, line length, magic numbers, deep nesting, long functions, TODO comments) apply to all languages.

## Rule Catalog (40+ rules)

### JavaScript / TypeScript
| Rule ID | Severity | Description |
|---------|----------|-------------|
| `no-var` | warning | Disallow `var` keyword (use `let`/`const`) |
| `no-console` | hint | No `console.*` statements in production |
| `eqeqeq` | warning | Require `===` and `!==` (no `==`/`!=`) |
| `no-eval` | error | Disallow `eval()` |
| `no-debugger` | warning | No `debugger` statements |
| `no-empty-block` | hint | No empty `{}` blocks |
| `no-implicit-globals` | info | Variables declared without `let`/`const`/`var` |
| `prefer-template-literal` | hint | Use template literals instead of string concat |
| `no-unused-expression` | info | Expressions with no effect |
| `no-trailing-spaces` | hint | Trailing whitespace |
| `max-line-length` | hint | Lines over 120 chars |
| `no-mixed-spaces-and-tabs` | warning | Mixed indentation |
| `java-empty-catch` | warning | Empty `catch {}` blocks |

### Python
| Rule ID | Severity | Description |
|---------|----------|-------------|
| `py-unused-import` | hint | Imported name not used in file |
| `py-bare-except` | warning | Bare `except:` (use `except Exception:`) |
| `py-print` | hint | Use `logging` module instead of `print()` |
| `py-f-string-available` | hint | Could use f-string instead of `.format()` |
| `py-mutable-default` | error | Mutable default argument (`=[]`, `={}`) |
| `py-global-statement` | warning | Use of `global` statement |

### Go
| Rule ID | Severity | Description |
|---------|----------|-------------|
| `go-unused-import` | error | Unused import (Go compiler rejects) |
| `go-err-check` | warning | Unchecked error return value |

### Rust
| Rule ID | Severity | Description |
|---------|----------|-------------|
| `rust-unwrap` | warning | `.unwrap()` can panic |

### C / C++
| Rule ID | Severity | Description |
|---------|----------|-------------|
| `c-gets` | error | `gets()` is unsafe (use `fgets()`) |
| `c-scanf-no-limit` | error | `scanf("%s", ...)` without width limit |
| `c-malloc-no-check` | warning | `malloc()` result not checked for NULL |

### SQL
| Rule ID | Severity | Description |
|---------|----------|-------------|
| `sql-select-star` | hint | Avoid `SELECT *` |
| `sql-string-concat` | error | String concat in SQL = injection risk |

### HTML / CSS
| Rule ID | Severity | Description |
|---------|----------|-------------|
| `html-img-no-alt` | warning | `<img>` without `alt` attribute |
| `css-important` | hint | Avoid `!important` |

### Bash / Shell
| Rule ID | Severity | Description |
|---------|----------|-------------|
| `shell-echo-printf` | hint | Prefer `printf` over `echo` |
| `shell-eval` | error | Avoid `eval` in shell scripts |

### General (all languages)
| Rule ID | Severity | Description |
|---------|----------|-------------|
| `todo-comment` | info | `TODO`/`FIXME`/`HACK` comments |
| `long-function` | hint | Functions over 50 lines |
| `deep-nesting` | warning | Code nested 5+ levels |
| `magic-numbers` | hint | Unnamed numeric literals |
| `no-trailing-spaces` | hint | Trailing whitespace |
| `max-line-length` | hint | Lines over 120 chars |
| `no-mixed-spaces-and-tabs` | warning | Mixed indentation |
| `no-empty-block` | hint | Empty `{}` blocks |

## Severity Levels

| Level | Color | Meaning |
|-------|-------|---------|
| `error` | red | Likely bug or security issue — fix immediately |
| `warning` | amber | Probable issue or bad practice |
| `info` | blue | Informational, may indicate a problem |
| `hint` | violet | Style/suggestion — not necessarily wrong |

## Using the Linter

### From the UI
1. Click the **Lint** button in the top toolbar
2. Open the **Problems** tab in the right panel
3. Filter by severity (All / Error / Warning / Info / Hint)
4. Click any problem to jump to the line in the editor

### From the API
```bash
curl -X POST http://your-host/api/aweai/lint \
  -H "Content-Type: application/json" \
  -d '{
    "code": "var x = 1;",
    "language": "javascript",
    "filename": "test.js"
  }'
```

Response:
```json
{
  "ok": true,
  "data": {
    "problems": [
      {
        "id": "no-var-L1-C1",
        "ruleId": "no-var",
        "severity": "warning",
        "message": "Use 'let' or 'const' instead of 'var' for variable 'x'.",
        "line": 1,
        "column": 1,
        "suggestion": "let x",
        "fix": "let x",
        "category": "best-practice"
      }
    ],
    "stats": { "errors": 0, "warnings": 1, "infos": 0, "hints": 0, "total": 1 }
  }
}
```

## Extending the Linter

To add a new rule, edit `src/lib/awecode/linter.ts` and add a `LintRule` object to the `RULES` array. Each rule needs:
- `id`, `name`, `description`
- `severity`, `category`
- `languages` (array of language IDs)
- `check(code, lines)` function that returns `LintProblem[]`

The linter automatically picks up new rules on next server reload.
