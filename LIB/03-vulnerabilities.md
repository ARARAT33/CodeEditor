# 03 — Vulnerability Scanner

AWECode's vulnerability scanner is a **100% offline static security analyzer** that detects 25+ classes of security issues across multiple programming languages.

## How It Works

1. You click **Scan** (or **Analyze All**)
2. The browser sends the code + language to `POST /api/aweai/scan`
3. The server runs all applicable security rules
4. Vulnerabilities are returned with CWE ID, OWASP category, severity, confidence, impact, recommendation, and code-level fix

## Security Score

After scanning, AWECode calculates a **security score** from 0 to 100:
- Starting at 100
- −25 per critical vulnerability
- −10 per high severity
- −4 per medium
- −1 per low
- −0.5 per informational

| Score | Meaning |
|-------|---------|
| 90-100 | Excellent — production-ready |
| 70-89 | Good — minor issues to address |
| 50-69 | Fair — significant issues, fix before production |
| 30-49 | Poor — serious vulnerabilities present |
| 0-29 | Critical — do not deploy |

## Vulnerability Rules (25+)

### Code Injection
| Rule | CWE | Severity | Languages |
|------|-----|----------|-----------|
| `JS-EVAL` | CWE-94 | critical | JS/TS |
| `JS-NEW-FUNCTION` | CWE-94 | high | JS/TS |
| `JS-DOCUMENT-EVAL` | CWE-94 | high | JS/TS |
| `SQL-INJECTION` | CWE-89 | critical | JS/TS/Python/PHP/Ruby/Java/Go/C# |
| `CMD-INJECTION` | CWE-78 | critical | JS/TS/Python/PHP/Ruby/Go/Java |

### Cross-Site Scripting (XSS)
| Rule | CWE | Severity | Languages |
|------|-----|----------|-----------|
| `JS-SET-INNER-HTML` | CWE-79 | high | JS/TS |

### Path Traversal
| Rule | CWE | Severity | Languages |
|------|-----|----------|-----------|
| `PATH-TRAVERSAL` | CWE-22 | high | JS/TS/Python/PHP/Ruby/Go/Java/C# |

### Secrets & Credentials
| Rule | CWE | Severity | Languages |
|------|-----|----------|-----------|
| `HARDCODED-SECRET` | CWE-798 | high | All |
| `SHELL-CREDS` | CWE-798 | high | Bash/Shell |

Detects:
- AWS access keys (`AKIA...`)
- AWS secret keys
- GitHub tokens (`ghp_...`, `gho_...`, etc.)
- Stripe live keys (`sk_live_...`)
- Slack tokens (`xox[bp]-...`)
- JWT secrets
- Database passwords
- MongoDB/PostgreSQL connection strings with credentials
- Generic API keys, tokens, secrets

### Cryptography
| Rule | CWE | Severity | Languages |
|------|-----|----------|-----------|
| `WEAK-CRYPTO` | CWE-327 | high | All |
| `INSECURE-RANDOM` | CWE-330 | medium | JS/TS/Python/Java/Go/C# |
| `WEAK-PASSWORD-HASH` | CWE-916 | high | JS/TS/Python/PHP/Java/Go/Ruby |
| `TLS-DISABLED` | CWE-295 | high | JS/TS/Python/Go/Java/C# |

Detects:
- MD5, SHA1, DES, RC4 usage
- `Math.random()` for security contexts
- `crypto.createHash('md5')` for passwords
- `rejectUnauthorized: false`
- `NODE_TLS_REJECT_UNAUTHORIZED=0`

### Server-Side Request Forgery (SSRF)
| Rule | CWE | Severity | Languages |
|------|-----|----------|-----------|
| `SSRF` | CWE-918 | high | JS/TS/Python/PHP/Ruby/Go/Java |

### Open Redirect
| Rule | CWE | Severity | Languages |
|------|-----|----------|-----------|
| `OPEN-REDIRECT` | CWE-601 | medium | JS/TS/Python/PHP/Ruby/Java/Go |

### XML External Entity (XXE)
| Rule | CWE | Severity | Languages |
|------|-----|----------|-----------|
| `XXE` | CWE-611 | high | JS/TS/Python/Java/PHP/C# |

### Insecure Deserialization
| Rule | CWE | Severity | Languages |
|------|-----|----------|-----------|
| `DESERIALIZATION` | CWE-502 | critical | JS/TS/Python/Java/PHP/Ruby/C# |

Detects:
- Python `pickle.loads`, `yaml.load` (without SafeLoader)
- Java `ObjectInputStream.readObject`
- PHP `unserialize` on `$_GET`/`$_POST`
- .NET `BinaryFormatter.Deserialize`

### CORS & Headers
| Rule | CWE | Severity | Languages |
|------|-----|----------|-----------|
| `CORS-WILDCARD` | CWE-942 | medium | JS/TS/Python/PHP/Java/Go |

### HTTP (no TLS)
| Rule | CWE | Severity | Languages |
|------|-----|----------|-----------|
| `HTTP-NO-TLS` | CWE-319 | low/medium | All |

### Configuration Issues
| Rule | CWE | Severity | Languages |
|------|-----|----------|-----------|
| `DEBUG-MODE` | CWE-489 | medium | Python/JS/TS/PHP/Ruby |
| `DOCKER-ROOT` | CWE-250 | medium | Dockerfile |
| `DOCKER-LATEST` | CWE-1104 | low | Dockerfile |

### Mass Assignment
| Rule | CWE | Severity | Languages |
|------|-----|----------|-----------|
| `MASS-ASSIGN` | CWE-915 | medium | JS/TS/Python/Ruby/PHP/Java |

### Information Disclosure
| Rule | CWE | Severity | Languages |
|------|-----|----------|-----------|
| `INFO-STACKTRACE` | CWE-209 | low | JS/TS/Python/Java/PHP/C# |

### C / C++ Memory Safety
| Rule | CWE | Severity | Languages |
|------|-----|----------|-----------|
| `C-STRCPY` | CWE-120 | critical | C/C++ |
| `C-FORMAT-STRING` | CWE-134 | critical | C/C++ |

## OWASP Top 10 Mapping

Each vulnerability is mapped to its OWASP Top 10 (2021) category:
- **A01** — Broken Access Control
- **A02** — Cryptographic Failures
- **A03** — Injection (incl. XSS)
- **A05** — Security Misconfiguration
- **A06** — Vulnerable and Outdated Components
- **A07** — Identification and Authentication Failures
- **A08** — Software and Data Integrity Failures
- **A09** — Security Logging and Monitoring Failures
- **A10** — Server-Side Request Forgery

## Using the Scanner

### From the UI
1. Click the **Scan** button in the top toolbar
2. Open the **Problems** tab → **Security** sub-tab
3. Each vulnerability shows:
   - Severity and CWE badge
   - Code evidence
   - Impact description
   - Recommendation
   - Code-level fix (when available)
   - Links to OWASP and other references

### From the API
```bash
curl -X POST http://your-host/api/aweai/scan \
  -H "Content-Type: application/json" \
  -d '{
    "code": "eval(userInput)",
    "language": "javascript"
  }'
```

Response includes full vulnerability details, security score, and per-severity counts.

## Confidence Levels

Each vulnerability has a confidence rating:
- `certain` — definite issue (none currently; reserved for AST-based rules)
- `high` — very likely a real issue based on pattern
- `medium` — likely an issue, but may be a false positive
- `low` — possible issue, requires human review

Treat `medium` and `low` confidence findings as starting points for review, not definitive issues.

## False Positives

Because the scanner uses regex heuristics (no full AST), false positives are possible. Common causes:
- Strings that happen to contain "password" or "token"
- Test code with sample secrets
- Comments containing patterns

To reduce false positives:
- Use the confidence level to prioritize
- Review the evidence column — if the highlighted code is not actually dangerous, dismiss it
- For real secrets detection, the rule ignores common placeholder values (`example`, `test`, `your`, `xxx`, `***`, `<`, `changeme`)
