# 09 — AWEAI REST API

AWEAI is the REST API that powers AWECode's AI agent integration. External AI agents (Claude, GPT, custom agents) can call these endpoints to analyze code, find vulnerabilities, refactor, and browse the function library.

## Base URL

```
http://your-host/api/aweai
```

All endpoints return JSON. Successful responses have `ok: true`; errors have `ok: false` and an `error` field.

## Endpoints

### `GET /api/aweai`

Get API capabilities, supported features, and stats.

**Query params:**
- `action=capabilities` (default) — capabilities overview
- `action=languages` — list supported languages
- `action=functions` — list functions (first 100)
- `action=function&id=<id>` — get a specific function

**Response (capabilities):**
```json
{
  "ok": true,
  "data": {
    "name": "AWEAI",
    "version": "1.0.0",
    "endpoints": [...],
    "stats": {
      "languagesSupported": 150,
      "lintRules": 40,
      "vulnerabilityRules": 25,
      "functions": 1000
    },
    "features": ["offline-lint", "offline-vulnerability-scan", ...]
  },
  "meta": { "version": "1.0.0", "durationMs": 1, "requestId": "..." }
}
```

### `POST /api/aweai/analyze`

Full analysis: lint + vulnerabilities + refactor + corrections in one call.

**Request body:**
```json
{
  "code": "var x = 1; eval(userInput);",
  "language": "javascript",
  "filename": "test.js"
}
```

Either `language` or `filename` is required. If both are given, `language` takes precedence. If only `filename` is given, the language is auto-detected.

**Response:**
```json
{
  "ok": true,
  "data": {
    "language": "javascript",
    "lines": 1,
    "characters": 30,
    "lint": { "problems": [...], "stats": {...} },
    "vulnerabilities": { "vulnerabilities": [...], "stats": {...} },
    "refactoring": { "opportunities": [...], "stats": {...} },
    "corrections": { "corrections": [...], "appliedCount": 1, "correctedCode": "..." },
    "summary": {
      "errors": 1,
      "warnings": 1,
      "criticalVulns": 1,
      "securityScore": 75,
      "refactorOpportunities": 3,
      "autoFixable": 1
    }
  }
}
```

### `POST /api/aweai/lint`

Lint code only.

**Request body:**
```json
{
  "code": "var x = 1;",
  "language": "javascript",
  "filename": "test.js"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "problems": [
      {
        "id": "no-var-L1-C1",
        "ruleId": "no-var",
        "ruleName": "Disallow var keyword",
        "severity": "warning",
        "message": "Use 'let' or 'const' instead of 'var' for variable 'x'.",
        "line": 1,
        "column": 1,
        "suggestion": "let x",
        "fix": "let x",
        "category": "best-practice",
        "source": "awecode-lint"
      }
    ],
    "stats": { "errors": 0, "warnings": 1, "infos": 0, "hints": 0, "total": 1 },
    "language": "javascript",
    "linesAnalyzed": 1,
    "analysisTimeMs": 1
  }
}
```

### `POST /api/aweai/scan`

Vulnerability scan only.

**Request body:**
```json
{
  "code": "eval(userInput)",
  "language": "javascript"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "vulnerabilities": [
      {
        "id": "vuln-JS-EVAL-L1-C1",
        "ruleId": "JS-EVAL",
        "name": "Use of eval()",
        "severity": "critical",
        "confidence": "high",
        "cwe": "CWE-94",
        "owaspCategory": "A03:2021 - Injection",
        "description": "eval() executes arbitrary JavaScript code.",
        "impact": "Remote Code Execution (RCE).",
        "recommendation": "Never use eval()...",
        "evidence": "eval(userInput)",
        "line": 1,
        "column": 1,
        "references": [...],
        "language": "javascript",
        "fix": "// Replace eval(x)..."
      }
    ],
    "stats": {
      "critical": 1, "high": 0, "medium": 0, "low": 0, "info": 0,
      "total": 1, "score": 75
    },
    "language": "javascript",
    "linesScanned": 1,
    "scanTimeMs": 1,
    "rulesChecked": 15
  }
}
```

### `POST /api/aweai/refactor`

Get refactoring suggestions or auto-apply corrections.

**Request body:**
```json
{
  "code": "var x = 1; const y = 'a' + x;",
  "language": "javascript",
  "apply": false,
  "mode": "refactor"
}
```

- `mode`: `"refactor"` (default) or `"correct"`
- `apply`: `true` to auto-apply safe transformations, `false` to get suggestions only

**Response (refactor mode):**
```json
{
  "ok": true,
  "data": {
    "opportunities": [
      {
        "id": "rf-var-0",
        "type": "convert-var-to-let-const",
        "title": "Convert 'var' to 'const'/'let'",
        "description": "Variable 'x' is declared with var...",
        "language": "javascript",
        "line": 1,
        "column": 1,
        "snippet": "var x = 1;",
        "benefit": "Block-scoped, no hoisting bugs...",
        "difficulty": "easy",
        "automated": true
      }
    ],
    "applied": [],
    "stats": { "total": 2, "automated": 2, "manual": 0, "byDifficulty": {...} }
  }
}
```

**Response (correct mode):**
```json
{
  "ok": true,
  "data": {
    "corrections": [
      {
        "id": "corr-var-0",
        "type": "best-practice",
        "title": "Replace 'var' with 'const'",
        "description": "const is block-scoped...",
        "line": 1,
        "column": 1,
        "original": "var x = 1;",
        "corrected": "const x = 1;",
        "confidence": "medium",
        "ruleId": "no-var"
      }
    ],
    "appliedCount": 1,
    "correctedCode": "const x = 1; const y = `a${x}`;",
    "language": "javascript"
  }
}
```

### `GET /api/aweai/functions`

Browse the function library.

**Query params:**
- `q=<query>` — search by name/description/tags
- `category=<cat>` — filter by category
- `id=<id>` — get a specific function
- `limit=<n>` — max results (default 100, max 500)
- `categories=1` — list all categories
- `stats=1` — get library stats

**Response (search):**
```json
{
  "ok": true,
  "data": {
    "query": "sort",
    "results": [
      {
        "id": "sort-quick",
        "name": "quickSort",
        "category": "Sort",
        "description": "Quick sort implementation.",
        "signature": "quickSort<T>(arr: T[], cmp?: (a: T, b: T) => number): T[]",
        "parameters": [...],
        "returns": {...},
        "example": "quickSort([3,1,4,1,5,9,2,6])",
        "tags": ["sort", "algorithm"],
        "complexity": "O(n log n)",
        "implemented": true,
        "code": "function quickSort<T>(...) { ... }"
      }
    ]
  }
}
```

## Error Handling

All errors return non-2xx HTTP status codes with this body:

```json
{
  "ok": false,
  "error": "Missing 'code' field",
  "meta": { "version": "1.0.0", "durationMs": 1, "requestId": "..." }
}
```

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad request (missing/invalid fields) |
| 404 | Resource not found (e.g., function ID) |
| 405 | Method not allowed |
| 500 | Server error |

## Rate Limits

AWEAI has no built-in rate limits. The analysis runs synchronously and is CPU-bound, so heavy use may slow down the server.

For production deployment:
- Add rate limiting at the reverse proxy (e.g., Nginx)
- Cache results by code hash for repeated requests
- Run analysis in a worker pool for concurrent requests

## Authentication

AWEAI endpoints have **no authentication** — they're intended for use within AWECode. For external agent use, deploy behind a reverse proxy with auth, or add API key middleware.

## SDK Example (Python)

```python
import requests

AWEAI_URL = "http://your-host/api/aweai"

def analyze_code(code: str, language: str) -> dict:
    r = requests.post(f"{AWEAI_URL}/analyze", json={
        "code": code,
        "language": language,
    })
    r.raise_for_status()
    return r.json()["data"]

result = analyze_code("eval('1+1')", "javascript")
print(f"Security score: {result['vulnerabilities']['stats']['score']}")
print(f"Critical issues: {result['summary']['criticalVulns']}")
```

## SDK Example (JavaScript/Node)

```javascript
const res = await fetch('http://your-host/api/aweai/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code, language: 'javascript' }),
})
const { data } = await res.json()
console.log(`Found ${data.summary.errors} errors`)
console.log(`Security score: ${data.vulnerabilities.stats.score}`)
```
