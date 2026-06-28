# src/lib/awecode/ — Core Analysis Engines

This directory contains the **100% offline** analysis engines that power AWECode's linter, vulnerability scanner, refactoring tools, and function library.

All engines run server-side in Node.js with **no external API calls**. They use regex heuristics and token-based analysis — fast, predictable, and private.

## Files

### `languages.ts`
**150+ programming language definitions.**

Each language has:
- `id` — unique identifier (e.g., `typescript`, `python`)
- `label` — display name
- `extensions` — file extensions (e.g., `['.ts', '.tsx']`)
- `monacoId` — Monaco Editor language ID for syntax highlighting
- `category` — Web/Systems/Scripting/Mobile/Functional/Data/Database/Shell/Hardware/Game/Markup/Config/Esoteric/Other
- `hasLinter` — whether linter has rules for this language
- `hasVulnScan` — whether vulnerability scanner has rules for this language

Key exports:
- `LANGUAGES` — array of all language definitions
- `LANGUAGES_BY_ID` — map for quick lookup
- `detectLanguageByFilename(filename)` — auto-detect language from filename
- `getLanguagesByCategory()` — grouped by category
- `LANGUAGE_COUNT` — total count

### `linter.ts`
**40+ offline lint rules across 15+ languages.**

Rules are organized by category:
- **JavaScript/TypeScript**: `no-var`, `no-console`, `eqeqeq`, `no-eval`, `no-debugger`, `no-empty-block`, `no-implicit-globals`, `prefer-template-literal`, `no-unused-expression`, `java-empty-catch`
- **Python**: `py-unused-import`, `py-bare-except`, `py-print`, `py-f-string-available`, `py-mutable-default`, `py-global-statement`
- **Go**: `go-unused-import`, `go-err-check`
- **Rust**: `rust-unwrap`
- **C/C++**: `c-gets`, `c-scanf-no-limit`, `c-malloc-no-check`
- **SQL**: `sql-select-star`, `sql-string-concat`
- **HTML/CSS**: `html-img-no-alt`, `css-important`
- **Bash**: `shell-echo-printf`, `shell-eval`
- **General** (all languages): `todo-comment`, `long-function`, `deep-nesting`, `magic-numbers`, `no-trailing-spaces`, `max-line-length`, `no-mixed-spaces-and-tabs`, `no-empty-block`

Key exports:
- `lintCode(code, language)` — returns `LintResult` with problems + stats
- `LINT_RULE_COUNT` — total rule count
- `getRulesByLanguage(language)` — rules applicable to a language

Each `LintProblem` includes: `id`, `ruleId`, `ruleName`, `severity`, `message`, `line`, `column`, `suggestion`, `fix`, `category`, `source`.

### `vulnerabilities.ts`
**25+ vulnerability rules with CWE/OWASP mapping.**

Categories:
- **Code Injection**: `JS-EVAL` (CWE-94), `JS-NEW-FUNCTION`, `JS-DOCUMENT-EVAL`, `SQL-INJECTION` (CWE-89), `CMD-INJECTION` (CWE-78)
- **XSS**: `JS-SET-INNER-HTML` (CWE-79)
- **Path Traversal**: `PATH-TRAVERSAL` (CWE-22)
- **Secrets**: `HARDCODED-SECRET` (CWE-798), `SHELL-CREDS`
- **Crypto**: `WEAK-CRYPTO` (CWE-327), `INSECURE-RANDOM` (CWE-330), `WEAK-PASSWORD-HASH` (CWE-916), `TLS-DISABLED` (CWE-295)
- **SSRF**: `SSRF` (CWE-918)
- **Open Redirect**: `OPEN-REDIRECT` (CWE-601)
- **XXE**: `XXE` (CWE-611)
- **Deserialization**: `DESERIALIZATION` (CWE-502)
- **CORS**: `CORS-WILDCARD` (CWE-942)
- **HTTP (no TLS)**: `HTTP-NO-TLS` (CWE-319)
- **Config**: `DEBUG-MODE` (CWE-489), `DOCKER-ROOT` (CWE-250), `DOCKER-LATEST` (CWE-1104)
- **Mass Assignment**: `MASS-ASSIGN` (CWE-915)
- **Info Disclosure**: `INFO-STACKTRACE` (CWE-209)
- **C/C++ Memory**: `C-STRCPY` (CWE-120), `C-FORMAT-STRING` (CWE-134)

Each `Vulnerability` includes: `id`, `ruleId`, `name`, `severity` (critical/high/medium/low/info), `confidence`, `cwe`, `owaspCategory`, `description`, `impact`, `recommendation`, `evidence`, `line`, `column`, `references`, `fix`.

The scanner calculates a **security score** (0-100):
- Start at 100
- −25 per critical, −10 per high, −4 per medium, −1 per low

Key exports:
- `scanVulnerabilities(code, language)` — returns `VulnScanResult`
- `VULN_RULE_COUNT` — total rule count

### `refactor.ts`
**Refactoring engine + auto-fix engine.**

#### Refactor Engine
Detects 14+ refactoring opportunities:
- `convert-var-to-let-const` (JS/TS, auto)
- `convert-to-template-literal` (JS/TS, auto)
- `convert-to-arrow` (JS/TS, auto)
- `convert-promise-to-async-await` (JS/TS, manual)
- `extract-variable` (magic numbers, manual)
- `extract-function` (long/nested code, manual)
- `sort-imports` (auto)
- `add-jsdoc` (auto)
- `add-error-handling` (manual)
- `add-null-check` (manual)
- `convert-callback-to-promise` (manual)
- `invert-condition` (manual)
- `format-code` (auto)
- `remove-comments` (auto)

Each opportunity has `difficulty` (easy/medium/hard) and `automated` (bool).

#### Auto-Fix Engine
Applies high-confidence corrections automatically:
- `==` → `===`, `!=` → `!==` (JS/TS)
- Remove trailing whitespace (all)
- Python: mutable default → `None`, bare `except:` → `except Exception:`
- `var` → `const` (JS/TS)
- Remove `debugger` statements (JS/TS)
- `strcpy` → `strncpy` (C/C++)

Key exports:
- `findRefactorOpportunities(code, language)` — returns `RefactorOpportunity[]`
- `applyRefactoring(code, type, language)` — applies a specific refactor
- `refactorCode(code, language, autoApply)` — full refactor
- `correctCode(code, language)` — auto-fix

### `functions.ts`
**1000+ utility function library.**

30+ categories: String, Array, Object, Math, Number, Date, Time, Boolean, Function, JSON, Regex, Type Check, Encoding, Crypto, Hash, Color, URL, UUID, Random, Validation, Format, Convert, DOM, Event, Promise, Async, File, Path, Sort, Search, Data Structure, Cache, Log, Distance, Bit, Geometry, Stats, Linear Algebra, Tree, Graph Algo, Set, Map, Tuple, Queue, Stack, Heap, Trie, Bitmap, Tokenizer, Parser, Lexer, Formatter, Optimizer, Minifier, Beautifier, Diff, Patch, Merge, Stream, Iterator, Generator, Coroutine, Channel, Mutex, Semaphore, Lock, Atomic, Concurrent, Worker, Thread, Process, Socket, HTTP, TCP, UDP, WebSocket, RPC, GraphQL, REST, CRUD, Auth, JWT, OAuth, Session, Cookie, CSRF, XSS, SQL Injection, Sanitize, Escape, Encrypt, Decrypt, Sign, Verify, HMAC, AES, RSA, ECC, PBKDF2, Argon2, Bcrypt, Scrypt, Base64, Hex, URL Encode, HTML Entity, Unicode, Emoji, RTL, LTR, i18n, L10n, Plural, Gender, Timezone, Currency, Number Format, Date Format, Phone, Postal Code, IP, MAC, ISBN, Credit Card, VIN, Barcode, QR Code, Hash Table, Bloom Filter, HyperLogLog, Skip List, B-Tree, Red-Black Tree, AVL Tree, Splay Tree, Segment Tree, Fenwick Tree, Disjoint Set, Graph Algo, DFS, BFS, Dijkstra, A*, Floyd, Bellman-Ford, Topological Sort, MST, Max Flow, String Match, KMP, Boyer-Moore, Rabin-Karp, Z Algorithm, Suffix Array, Suffix Tree, Compression, Huffman, LZ77, LZW, Run Length, Soundex, Metaphone, Levenshtein, Jaro, Jaro-Winkler, N-gram, TF-IDF, Stemmer, Stop Word, Tokenizer NLP, POS Tagger, NER, Sentiment, Classifier, Cluster, K-Means, DBSCAN, PCA, SVD, Regression, Bayes, Decision Tree, Random Forest, SVM, Neural Net, Gradient, Backprop, Activation, Loss, Optimizer ML, Matrix, Vector, Tensor, Convolution, Pooling, Recurrent, Attention, Transformer, Embedding, Tokenization.

~200 functions have full TypeScript implementations; the rest have metadata (signature, parameters, returns, example, tags).

Key exports:
- `getAllFunctions()` — all 1000+ functions
- `searchFunctions(query)` — search by name/description/tags
- `getFunctionsByCategory(category)` — filter by category
- `getFunctionById(id)` — get a specific function
- `getFunctionCategories()` — list all categories
- `getFunctionStats()` — total + implemented counts
- `FUNCTION_COUNT` — total count

## Adding New Rules/Functions

### Add a Lint Rule
```typescript
// In linter.ts, add to RULES array:
{
  id: 'my-rule',
  name: 'My Rule',
  severity: 'warning',
  category: 'best-practice',
  languages: ['javascript'],
  description: 'Description',
  check: (code, lines) => {
    const problems: LintProblem[] = []
    // ... your logic
    return problems
  },
}
```

### Add a Vulnerability Rule
Same as lint rule, but add `cwe`, `owaspCategory`, `confidence`, `impact`, `recommendation`, `references`.

### Add a Function
```typescript
// In functions.ts, add to implementedFunctions:
fn(
  'my-fn-id',
  'myFunction',
  'Category',
  'Description',
  'myFunction(arg: string): boolean',
  [{ name: 'arg', type: 'string', description: 'Input' }],
  { type: 'boolean', description: 'Result' },
  "myFunction('test') // true",
  ['tag1', 'tag2'],
  'O(n)',
  `function myFunction(arg: string): boolean {
  return arg.length > 0
}`,
)
```

## Testing

There's no test suite yet (planned). To manually test:
1. Start the dev server: `bun run dev`
2. Open http://localhost:3000
3. Open a sample file with known issues
4. Click "Analyze" and verify the results match expectations

See the [root README](../../README.md) for the full project overview.
