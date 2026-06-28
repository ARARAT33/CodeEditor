// AWECode Vulnerability Scanner — Offline static security analysis
// Detects 50+ vulnerability patterns across multiple languages

export type VulnSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type VulnConfidence = 'certain' | 'high' | 'medium' | 'low'

export type CWE = string // e.g., "CWE-79"

export interface Vulnerability {
  id: string
  ruleId: string
  name: string
  severity: VulnSeverity
  confidence: VulnConfidence
  cwe: CWE
  owaspCategory?: string
  description: string
  impact: string
  recommendation: string
  evidence: string
  line: number
  column: number
  endLine?: number
  endColumn?: number
  references?: { title: string; url: string }[]
  language: string
  fix?: string
}

export interface VulnScanResult {
  vulnerabilities: Vulnerability[]
  stats: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
    total: number
    score: number // 0-100, 100 = no issues
  }
  language: string
  linesScanned: number
  scanTimeMs: number
  rulesChecked: number
}

interface VulnRule {
  id: string
  name: string
  severity: VulnSeverity
  confidence: VulnConfidence
  cwe: CWE
  owaspCategory?: string
  languages: string[]
  description: string
  impact: string
  recommendation: string
  references?: { title: string; url: string }[]
  detect: (code: string, lines: string[]) => Vulnerability[]
}

const OWASP = {
  INJECTION: 'A03:2021 - Injection',
  XSS: 'A03:2021 - Injection (XSS)',
  CRYPTO: 'A02:2021 - Cryptographic Failures',
  AUTH: 'A07:2021 - Identification and Authentication Failures',
  CONFIG: 'A05:2021 - Security Misconfiguration',
  LOGGING: 'A09:2021 - Security Logging and Monitoring Failures',
  SSRF: 'A10:2021 - Server-Side Request Forgery (SSRF)',
  VULN: 'A06:2021 - Vulnerable and Outdated Components',
  DESERIALIZATION: 'A08:2021 - Software and Data Integrity Failures',
  ACCESS: 'A01:2021 - Broken Access Control',
}

function vId(ruleId: string, line: number, col: number): string {
  return `vuln-${ruleId}-L${line}-C${col}`
}

const RULES: VulnRule[] = [
  // ============ Code Injection ============
  {
    id: 'JS-EVAL',
    name: 'Use of eval()',
    severity: 'critical',
    confidence: 'high',
    cwe: 'CWE-94',
    owaspCategory: OWASP.INJECTION,
    languages: ['javascript', 'typescript'],
    description: 'eval() executes arbitrary JavaScript code, allowing code injection attacks.',
    impact: 'Remote Code Execution (RCE). Attackers can execute any code in the application context.',
    recommendation: 'Never use eval(). Use JSON.parse() for JSON data, or Function constructor with strict input validation.',
    references: [
      { title: 'MDN: eval()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval' },
      { title: 'OWASP: Code Injection', url: 'https://owasp.org/www-community/attacks/Code_Injection' },
    ],
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/\beval\s*\(/)
        if (m) {
          out.push({
            id: vId('JS-EVAL', idx + 1, line.indexOf('eval') + 1),
            ruleId: 'JS-EVAL',
            name: 'Use of eval()',
            severity: 'critical',
            confidence: 'high',
            cwe: 'CWE-94',
            owaspCategory: OWASP.INJECTION,
            description: 'eval() executes arbitrary JavaScript code.',
            impact: 'Remote Code Execution (RCE).',
            recommendation: 'Avoid eval(). Use JSON.parse() or Function() with strict validation.',
            evidence: line.trim(),
            line: idx + 1,
            column: line.indexOf('eval') + 1,
            references: [
              { title: 'MDN: eval()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval' },
            ],
            language: 'javascript',
            fix: '// Replace eval(x) with safer alternative:\n// JSON.parse(x) for JSON\n// Function("return " + x)() for trusted code only',
          })
        }
      })
      return out
    },
  },
  {
    id: 'JS-NEW-FUNCTION',
    name: 'Use of new Function()',
    severity: 'high',
    confidence: 'high',
    cwe: 'CWE-94',
    owaspCategory: OWASP.INJECTION,
    languages: ['javascript', 'typescript'],
    description: 'new Function() compiles and executes arbitrary code from a string.',
    impact: 'Code injection if input is attacker-controlled.',
    recommendation: 'Avoid dynamic code generation. Pre-define functions or use safe interpreters.',
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      lines.forEach((line, idx) => {
        if (line.match(/new\s+Function\s*\(/)) {
          out.push({
            id: vId('JS-NEW-FN', idx + 1, line.indexOf('Function') + 1),
            ruleId: 'JS-NEW-FUNCTION',
            name: 'Use of new Function()',
            severity: 'high',
            confidence: 'high',
            cwe: 'CWE-94',
            owaspCategory: OWASP.INJECTION,
            description: 'new Function() compiles and executes arbitrary code.',
            impact: 'Code injection.',
            recommendation: 'Avoid dynamic code generation.',
            evidence: line.trim(),
            line: idx + 1,
            column: line.indexOf('Function') + 1,
            language: 'javascript',
          })
        }
      })
      return out
    },
  },
  {
    id: 'JS-SET-INNER-HTML',
    name: 'XSS via innerHTML',
    severity: 'high',
    confidence: 'high',
    cwe: 'CWE-79',
    owaspCategory: OWASP.XSS,
    languages: ['javascript', 'typescript'],
    description: 'Setting innerHTML with untrusted data leads to Cross-Site Scripting (XSS).',
    impact: 'Attacker can execute JavaScript in victim browser, steal cookies, redirect, etc.',
    recommendation: 'Use textContent or sanitize input with DOMPurify before assignment.',
    references: [
      { title: 'OWASP: XSS', url: 'https://owasp.org/www-community/attacks/xss/' },
      { title: 'DOMPurify', url: 'https://github.com/cure53/DOMPurify' },
    ],
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      lines.forEach((line, idx) => {
        if (line.match(/\.innerHTML\s*=/)) {
          out.push({
            id: vId('XSS-INNERHTML', idx + 1, line.indexOf('.innerHTML') + 1),
            ruleId: 'JS-SET-INNER-HTML',
            name: 'XSS via innerHTML',
            severity: 'high',
            confidence: 'high',
            cwe: 'CWE-79',
            owaspCategory: OWASP.XSS,
            description: 'Setting innerHTML with untrusted data causes XSS.',
            impact: 'Cross-Site Scripting (XSS).',
            recommendation: 'Use textContent or sanitize with DOMPurify.',
            evidence: line.trim(),
            line: idx + 1,
            column: line.indexOf('.innerHTML') + 1,
            references: [
              { title: 'OWASP: XSS', url: 'https://owasp.org/www-community/attacks/xss/' },
            ],
            language: 'javascript',
            fix: '// Replace: el.innerHTML = userInput;\n// With: el.textContent = userInput;\n// Or: el.innerHTML = DOMPurify.sanitize(userInput);',
          })
        }
        if (line.match(/\.outerHTML\s*=/)) {
          out.push({
            id: vId('XSS-OUTERHTML', idx + 1, line.indexOf('.outerHTML') + 1),
            ruleId: 'JS-SET-INNER-HTML',
            name: 'XSS via outerHTML',
            severity: 'high',
            confidence: 'high',
            cwe: 'CWE-79',
            owaspCategory: OWASP.XSS,
            description: 'Setting outerHTML with untrusted data causes XSS.',
            impact: 'Cross-Site Scripting (XSS).',
            recommendation: 'Use textContent or sanitize with DOMPurify.',
            evidence: line.trim(),
            line: idx + 1,
            column: line.indexOf('.outerHTML') + 1,
            language: 'javascript',
          })
        }
        if (line.match(/document\.write\s*\(/)) {
          out.push({
            id: vId('XSS-DOCWRITE', idx + 1, line.indexOf('document.write') + 1),
            ruleId: 'JS-SET-INNER-HTML',
            name: 'XSS via document.write()',
            severity: 'high',
            confidence: 'high',
            cwe: 'CWE-79',
            owaspCategory: OWASP.XSS,
            description: 'document.write() with untrusted data causes XSS.',
            impact: 'Cross-Site Scripting (XSS).',
            recommendation: 'Use textContent or safe DOM methods.',
            evidence: line.trim(),
            line: idx + 1,
            column: line.indexOf('document.write') + 1,
            language: 'javascript',
          })
        }
      })
      return out
    },
  },
  {
    id: 'JS-DOCUMENT-EVAL',
    name: 'Unsafe document.eval-like methods',
    severity: 'high',
    confidence: 'high',
    cwe: 'CWE-94',
    owaspCategory: OWASP.INJECTION,
    languages: ['javascript', 'typescript'],
    description: 'setTimeout/setInterval with string argument is equivalent to eval().',
    impact: 'Code injection if input is attacker-controlled.',
    recommendation: 'Pass a function reference instead of a string.',
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/(setTimeout|setInterval)\s*\(\s*['"`]/)
        if (m) {
          out.push({
            id: vId('TIMER-STRING', idx + 1, line.indexOf(m[1]) + 1),
            ruleId: 'JS-DOCUMENT-EVAL',
            name: 'Unsafe ' + m[1] + ' with string argument',
            severity: 'high',
            confidence: 'high',
            cwe: 'CWE-94',
            owaspCategory: OWASP.INJECTION,
            description: m[1] + ' with string argument acts like eval().',
            impact: 'Code injection.',
            recommendation: 'Pass a function: setTimeout(() => fn(), 1000)',
            evidence: line.trim(),
            line: idx + 1,
            column: line.indexOf(m[1]) + 1,
            language: 'javascript',
            fix: '// Replace: setTimeout("doStuff()", 1000)\n// With: setTimeout(() => doStuff(), 1000)',
          })
        }
      })
      return out
    },
  },

  // ============ SQL Injection ============
  {
    id: 'SQL-INJECTION',
    name: 'SQL Injection',
    severity: 'critical',
    confidence: 'high',
    cwe: 'CWE-89',
    owaspCategory: OWASP.INJECTION,
    languages: ['javascript', 'typescript', 'python', 'php', 'ruby', 'java', 'go', 'csharp'],
    description: 'String concatenation in SQL queries allows SQL injection attacks.',
    impact: 'Database disclosure, modification, or destruction. Account takeover. RCE on DB server.',
    recommendation: 'Use parameterized queries / prepared statements. Never concatenate user input into SQL.',
    references: [
      { title: 'OWASP: SQL Injection', url: 'https://owasp.org/www-community/attacks/SQL_Injection' },
      { title: 'CWE-89', url: 'https://cwe.mitre.org/data/definitions/89.html' },
    ],
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      const patterns = [
        { regex: /(execute|exec|query)\s*\(\s*['"`].*?['"`]\s*\+/i, lang: ['javascript', 'typescript', 'php', 'ruby'] },
        { regex: /\+\s*['"`].*?(SELECT|INSERT|UPDATE|DELETE|WHERE|FROM)/i, lang: ['javascript', 'typescript', 'csharp', 'java'] },
        { regex: /['"`].*?(SELECT|INSERT|UPDATE|DELETE|WHERE|FROM).*?['"`]\s*\+/, lang: ['javascript', 'typescript', 'csharp', 'java'] },
        { regex: /cursor\.execute\s*\(\s*['"].*?['"]\s*%/, lang: ['python'] },
        { regex: /cursor\.execute\s*\(\s*f['"]/, lang: ['python'] },
        { regex: /f['"]\s*(SELECT|INSERT|UPDATE|DELETE)/i, lang: ['python'] },
        { regex: /\.\s*format\s*\(\s*['"]\s*(SELECT|INSERT|UPDATE|DELETE)/i, lang: ['python'] },
        { regex: /mysql_query\s*\(\s*['"].*?\$/, lang: ['php'] },
        { regex: /pg_query\s*\(\s*['"].*?\$/, lang: ['php'] },
        { regex: /\$_GET\[|\$_POST\[|\$_REQUEST\[/, lang: ['php'] },
      ]
      lines.forEach((line, idx) => {
        for (const p of patterns) {
          if (p.lang.includes('all') || true) { // patterns themselves are language-agnostic enough
            if (p.regex.test(line)) {
              const match = p.regex.exec(line)
              const col = match ? match.index + 1 : 1
              out.push({
                id: vId('SQL-INJ', idx + 1, col),
                ruleId: 'SQL-INJECTION',
                name: 'SQL Injection',
                severity: 'critical',
                confidence: 'high',
                cwe: 'CWE-89',
                owaspCategory: OWASP.INJECTION,
                description: 'Possible SQL injection via string concatenation or f-string.',
                impact: 'Database compromise.',
                recommendation: 'Use parameterized queries: cursor.execute("SELECT ... WHERE id = %s", (id,))',
                evidence: line.trim(),
                line: idx + 1,
                column: col,
                references: [
                  { title: 'OWASP: SQL Injection', url: 'https://owasp.org/www-community/attacks/SQL_Injection' },
                ],
                language: 'javascript',
                fix: '// Use parameterized queries:\n// db.query("SELECT * FROM users WHERE id = ?", [userId])',
              })
              break
            }
          }
        }
      })
      return out
    },
  },

  // ============ Command Injection ============
  {
    id: 'CMD-INJECTION',
    name: 'Command Injection',
    severity: 'critical',
    confidence: 'high',
    cwe: 'CWE-78',
    owaspCategory: OWASP.INJECTION,
    languages: ['javascript', 'typescript', 'python', 'php', 'ruby', 'go', 'java'],
    description: 'Passing user input to shell commands allows command injection.',
    impact: 'Arbitrary OS command execution. Full system compromise.',
    recommendation: 'Use execFile/spawn with array args, never shell:true. Validate input strictly.',
    references: [
      { title: 'OWASP: Command Injection', url: 'https://owasp.org/www-community/attacks/Command_Injection' },
    ],
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      const patterns = [
        /child_process\.exec\s*\(/,
        /exec\s*\(\s*['"`].*?\$\{/,
        /exec\s*\(\s*['"`].*?%\s*\(/,  // Python %-formatting
        /os\.system\s*\(/,
        /os\.popen\s*\(/,
        /subprocess\.call\s*\(\s*['"`].*?%/,
        /subprocess\.call\s*\(\s*['"`].*?\+/,
        /subprocess\.Popen\s*\(\s*['"`].*?%/,
        /shell_exec\s*\(/,
        /system\s*\(\s*['"`].*?\$/,
        /`.*?\$\{.*?\}.*`/,  // backtick with interpolation (could be shell)
      ]
      lines.forEach((line, idx) => {
        for (const re of patterns) {
          if (re.test(line)) {
            const m = re.exec(line)
            const col = m ? m.index + 1 : 1
            out.push({
              id: vId('CMD-INJ', idx + 1, col),
              ruleId: 'CMD-INJECTION',
              name: 'Command Injection',
              severity: 'critical',
              confidence: 'high',
              cwe: 'CWE-78',
              owaspCategory: OWASP.INJECTION,
              description: 'Possible OS command injection.',
              impact: 'Arbitrary OS command execution.',
              recommendation: 'Use execFile/spawn with array arguments. Avoid shell:true.',
              evidence: line.trim(),
              line: idx + 1,
              column: col,
              references: [
                { title: 'OWASP: Command Injection', url: 'https://owasp.org/www-community/attacks/Command_Injection' },
              ],
              language: 'javascript',
              fix: '// Use array form:\n// execFile("ls", ["-la", userDir])\n// not exec(`ls -la ${userDir}`)',
            })
            break
          }
        }
      })
      return out
    },
  },

  // ============ Path Traversal ============
  {
    id: 'PATH-TRAVERSAL',
    name: 'Path Traversal',
    severity: 'high',
    confidence: 'medium',
    cwe: 'CWE-22',
    owaspCategory: OWASP.ACCESS,
    languages: ['javascript', 'typescript', 'python', 'php', 'ruby', 'go', 'java', 'csharp'],
    description: 'File operations with user-controlled paths can be exploited for path traversal.',
    impact: 'Read/write arbitrary files. Information disclosure. Code execution.',
    recommendation: 'Validate and sanitize paths. Use path.resolve() and verify the result is within the expected directory.',
    references: [
      { title: 'OWASP: Path Traversal', url: 'https://owasp.org/www-community/attacks/Path_Traversal' },
    ],
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      const patterns = [
        /open\s*\(\s*['"`].*?\$\{/,
        /open\s*\(\s*f['"]/,
        /fs\.(read|write|append|unlink|stat|access)File\s*\(\s*['"`].*?\$\{/,
        /fs\.(read|write|append|unlink|stat|access)File\s*\(\s*req\./,
        /file_get_contents\s*\(\s*\$_/,
        /fopen\s*\(\s*['"`].*?\$/,
        /os\.path\.join\s*\([^)]*req\./,
        /os\.path\.join\s*\([^)]*input\(/,
      ]
      lines.forEach((line, idx) => {
        for (const re of patterns) {
          if (re.test(line)) {
            const m = re.exec(line)
            const col = m ? m.index + 1 : 1
            out.push({
              id: vId('PATH-TRAV', idx + 1, col),
              ruleId: 'PATH-TRAVERSAL',
              name: 'Path Traversal',
              severity: 'high',
              confidence: 'medium',
              cwe: 'CWE-22',
              owaspCategory: OWASP.ACCESS,
              description: 'Possible path traversal via user input.',
              impact: 'Arbitrary file read/write.',
              recommendation: 'Validate path with path.resolve() and check it is within expected directory.',
              evidence: line.trim(),
              line: idx + 1,
              column: col,
              references: [
                { title: 'OWASP: Path Traversal', url: 'https://owasp.org/www-community/attacks/Path_Traversal' },
              ],
              language: 'javascript',
              fix: '// const safe = path.resolve(baseDir, userInput);\n// if (!safe.startsWith(baseDir)) throw new Error("Invalid path");',
            })
            break
          }
        }
      })
      return out
    },
  },

  // ============ Hardcoded Secrets ============
  {
    id: 'HARDCODED-SECRET',
    name: 'Hardcoded Secret',
    severity: 'high',
    confidence: 'high',
    cwe: 'CWE-798',
    owaspCategory: OWASP.AUTH,
    languages: ['javascript', 'typescript', 'python', 'php', 'ruby', 'java', 'go', 'rust', 'csharp', 'bash', 'yaml', 'ini'],
    description: 'Hardcoded passwords, API keys, or tokens can be extracted from source code or version control.',
    impact: 'Account compromise, unauthorized API access, data breaches.',
    recommendation: 'Use environment variables or a secret manager. Never commit secrets to version control.',
    references: [
      { title: 'CWE-798', url: 'https://cwe.mitre.org/data/definitions/798.html' },
    ],
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      const patterns = [
        { re: /\b(API_KEY|api_key|apikey)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]/, name: 'API key' },
        { re: /\b(AWS_SECRET_ACCESS_KEY|aws_secret)\s*[:=]\s*['"][A-Za-z0-9/+]{40}['"]/, name: 'AWS secret key' },
        { re: /\bAWS_ACCESS_KEY_ID\s*[:=]\s*['"]?AKIA[0-9A-Z]{16}['"]?/, name: 'AWS access key' },
        { re: /\b(GITHUB_TOKEN|gh_token|github_token)\s*[:=]\s*['"]gh[pousr]_[A-Za-z0-9]{36,}['"]/, name: 'GitHub token' },
        { re: /\bpassword\s*[:=]\s*['"][^'"]{4,}['"]/, name: 'Password', ignoreIf: ['example', 'test', 'placeholder', 'your', 'xxx', '***', '<', 'changeme'] },
        { re: /\bpasswd\s*[:=]\s*['"][^'"]{4,}['"]/, name: 'Password', ignoreIf: ['example', 'test', 'placeholder', 'your', 'xxx', '***', '<', 'changeme'] },
        { re: /\bsecret\s*[:=]\s*['"][A-Za-z0-9+/=]{16,}['"]/, name: 'Secret' },
        { re: /\bPRIVATE_KEY\b\s*[:=]\s*['"]-----BEGIN/, name: 'Private key' },
        { re: /\b(token|access_token|auth_token)\s*[:=]\s*['"][A-Za-z0-9._\-]{20,}['"]/, name: 'Token' },
        { re: /\b(STRIPE_SECRET_KEY|stripe_sk)\s*[:=]\s*['"]sk_live_[A-Za-z0-9]{24,}['"]/, name: 'Stripe secret key' },
        { re: /\bSLACK_TOKEN\s*[:=]\s*['"]xox[baprs]-[A-Za-z0-9\-]{10,}['"]/, name: 'Slack token' },
        { re: /\b(JWT_SECRET|jwt_secret)\s*[:=]\s*['"][^'"]{8,}['"]/, name: 'JWT secret' },
        { re: /\bDB_PASSWORD\s*[:=]\s*['"][^'"]{4,}['"]/, name: 'DB password' },
        { re: /\b(MONGO_URI|MONGODB_URI)\s*[:=]\s*['"]mongodb(\+srv)?:\/\/[^:]+:[^@]+@/, name: 'MongoDB connection string with credentials' },
        { re: /\b(DATABASE_URL|DB_URL)\s*[:=]\s*['"]postgres(ql)?:\/\/[^:]+:[^@]+@/, name: 'PostgreSQL URL with credentials' },
      ]
      lines.forEach((line, idx) => {
        for (const p of patterns) {
          if (p.re.test(line)) {
            const m = p.re.exec(line)
            const col = m ? m.index + 1 : 1
            // Check ignore list
            if ('ignoreIf' in p && p.ignoreIf) {
              const lower = line.toLowerCase()
              if (p.ignoreIf.some((s) => lower.includes(s))) continue
            }
            out.push({
              id: vId('SECRET-' + idx + '-' + col, idx + 1, col),
              ruleId: 'HARDCODED-SECRET',
              name: 'Hardcoded ' + p.name,
              severity: 'high',
              confidence: 'high',
              cwe: 'CWE-798',
              owaspCategory: OWASP.AUTH,
              description: 'Possible hardcoded ' + p.name + ' detected in source.',
              impact: 'Secret exposed in code/version control. Account compromise.',
              recommendation: 'Move to environment variable or secret manager.',
              evidence: line.trim().substring(0, 80) + (line.length > 80 ? '...' : ''),
              line: idx + 1,
              column: col,
              references: [
                { title: 'CWE-798', url: 'https://cwe.mitre.org/data/definitions/798.html' },
              ],
              language: 'javascript',
              fix: '// const apiKey = process.env.API_KEY;',
            })
            break
          }
        }
      })
      return out
    },
  },

  // ============ Weak Crypto ============
  {
    id: 'WEAK-CRYPTO',
    name: 'Weak Cryptography',
    severity: 'high',
    confidence: 'high',
    cwe: 'CWE-327',
    owaspCategory: OWASP.CRYPTO,
    languages: ['javascript', 'typescript', 'python', 'php', 'java', 'go', 'csharp', 'ruby'],
    description: 'Use of broken or weak cryptographic algorithms (MD5, SHA1, DES, etc.).',
    impact: 'Data confidentiality/integrity can be broken. Passwords cracked.',
    recommendation: 'Use SHA-256 or stronger. For passwords, use bcrypt/scrypt/argon2.',
    references: [
      { title: 'OWASP: Cryptographic Storage', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html' },
    ],
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      const patterns = [
        { re: /\bmd5\s*\(/, name: 'MD5' },
        { re: /\bsha1\s*\(/, name: 'SHA1' },
        { re: /\bMD5\.Create/, name: 'MD5 (Go)' },
        { re: /\bSHA1\.Create/, name: 'SHA1 (Go)' },
        { re: /hashlib\.md5\b/, name: 'MD5 (Python)' },
        { re: /hashlib\.sha1\b/, name: 'SHA1 (Python)' },
        { re: /MessageDigest\.getInstance\s*\(\s*['"]MD5['"]/, name: 'MD5 (Java)' },
        { re: /MessageDigest\.getInstance\s*\(\s*['"]SHA-?1['"]/, name: 'SHA1 (Java)' },
        { re: /\bDES\b/, name: 'DES' },
        { re: /\bRC4\b/, name: 'RC4' },
        { re: /createCipher\s*\(/, name: 'createCipher (deprecated)' },
        { re: /createDecipher\s*\(/, name: 'createDecipher (deprecated)' },
      ]
      lines.forEach((line, idx) => {
        for (const p of patterns) {
          if (p.re.test(line)) {
            const m = p.re.exec(line)
            const col = m ? m.index + 1 : 1
            out.push({
              id: vId('WEAK-CRYPTO-' + idx, idx + 1, col),
              ruleId: 'WEAK-CRYPTO',
              name: 'Weak Crypto: ' + p.name,
              severity: 'high',
              confidence: 'high',
              cwe: 'CWE-327',
              owaspCategory: OWASP.CRYPTO,
              description: 'Use of weak/broken cryptographic algorithm: ' + p.name + '.',
              impact: 'Hashes can be reversed. Encryption can be broken.',
              recommendation: 'Use SHA-256/SHA-3 for hashing. Use bcrypt/scrypt/argon2 for passwords.',
              evidence: line.trim(),
              line: idx + 1,
              column: col,
              references: [
                { title: 'OWASP: Cryptographic Storage', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html' },
              ],
              language: 'javascript',
              fix: '// Use crypto.createHash("sha256") instead of md5/sha1\n// Use bcrypt for passwords: bcrypt.hash(pw, 10)',
            })
            break
          }
        }
      })
      return out
    },
  },

  // ============ Insecure Random ============
  {
    id: 'INSECURE-RANDOM',
    name: 'Insecure Random Number Generator',
    severity: 'medium',
    confidence: 'high',
    cwe: 'CWE-330',
    owaspCategory: OWASP.CRYPTO,
    languages: ['javascript', 'typescript', 'python', 'java', 'go', 'csharp'],
    description: 'Math.random() and similar are not cryptographically secure.',
    impact: 'Predictable tokens, sessions, or keys can be guessed by attackers.',
    recommendation: 'Use crypto.getRandomValues() (browser) or crypto.randomBytes() (Node.js).',
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      const patterns = [
        /Math\.random\s*\(\s*\)/,
        /random\.random\s*\(\s*\)/,  // Python random module
        /\brandom\s*\.\s*random\s*\(/,
        /\brandom\s*\.\s*randint\s*\(/,
        /\brandom\s*\.\s*choice\s*\(/,
        /java\.util\.Random/,
        /Math\.Random/,
      ]
      lines.forEach((line, idx) => {
        for (const re of patterns) {
          if (re.test(line)) {
            const m = re.exec(line)
            const col = m ? m.index + 1 : 1
            out.push({
              id: vId('INSECRAND-' + idx, idx + 1, col),
              ruleId: 'INSECURE-RANDOM',
              name: 'Insecure RNG',
              severity: 'medium',
              confidence: 'high',
              cwe: 'CWE-330',
              owaspCategory: OWASP.CRYPTO,
              description: 'Insecure random number generator used.',
              impact: 'Predictable random values; tokens/keys can be guessed.',
              recommendation: 'Use crypto.getRandomValues() or secrets module.',
              evidence: line.trim(),
              line: idx + 1,
              column: col,
              language: 'javascript',
              fix: '// const arr = new Uint32Array(1);\n// crypto.getRandomValues(arr);',
            })
            break
          }
        }
      })
      return out
    },
  },

  // ============ SSRF ============
  {
    id: 'SSRF',
    name: 'Server-Side Request Forgery (SSRF)',
    severity: 'high',
    confidence: 'medium',
    cwe: 'CWE-918',
    owaspCategory: OWASP.SSRF,
    languages: ['javascript', 'typescript', 'python', 'php', 'ruby', 'go', 'java'],
    description: 'HTTP requests with user-controlled URLs enable SSRF attacks.',
    impact: 'Access internal services, cloud metadata endpoints. Bypass firewalls.',
    recommendation: 'Validate URL scheme/host. Block internal IPs (169.254.169.254, localhost, 10.x, 192.168.x). Use allowlists.',
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      const patterns = [
        /fetch\s*\(\s*req\./,
        /fetch\s*\(\s*req\.query\./,
        /axios\.get\s*\(\s*req\./,
        /requests\.get\s*\(\s*[^)]*input/,
        /requests\.get\s*\(\s*[^)]*request\./,
        /urlopen\s*\(\s*[^)]*request\./,
        /http\.Get\s*\(\s*[^)]*r\.URL\./,
        /curl_init\s*\(\s*\$/,
        /file_get_contents\s*\(\s*['"]http['"]\s*\.\s*\$/,
      ]
      lines.forEach((line, idx) => {
        for (const re of patterns) {
          if (re.test(line)) {
            const m = re.exec(line)
            const col = m ? m.index + 1 : 1
            out.push({
              id: vId('SSRF-' + idx, idx + 1, col),
              ruleId: 'SSRF',
              name: 'SSRF',
              severity: 'high',
              confidence: 'medium',
              cwe: 'CWE-918',
              owaspCategory: OWASP.SSRF,
              description: 'HTTP request with user-controlled URL — possible SSRF.',
              impact: 'Access internal network, cloud metadata. Bypass firewalls.',
              recommendation: 'Validate URL scheme/host. Block internal IPs. Use allowlists.',
              evidence: line.trim(),
              line: idx + 1,
              column: col,
              language: 'javascript',
            })
            break
          }
        }
      })
      return out
    },
  },

  // ============ Open Redirect ============
  {
    id: 'OPEN-REDIRECT',
    name: 'Open Redirect',
    severity: 'medium',
    confidence: 'medium',
    cwe: 'CWE-601',
    owaspCategory: OWASP.ACCESS,
    languages: ['javascript', 'typescript', 'python', 'php', 'ruby', 'java', 'go'],
    description: 'Redirects to user-controlled URLs enable phishing attacks.',
    impact: 'Attacker can craft malicious links that appear to come from your domain.',
    recommendation: 'Validate redirect URL against an allowlist of trusted domains.',
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      const patterns = [
        /res\.redirect\s*\(\s*req\./,
        /redirect\s*\(\s*request\./,
        /redirect\s*\(\s*input\(/,
        /header\s*\(\s*['"]Location['"]\s*,\s*req\./,
        /response\.sendRedirect\s*\(\s*request\./,
        /Location:\s*['"]?\s*\$_/,
      ]
      lines.forEach((line, idx) => {
        for (const re of patterns) {
          if (re.test(line)) {
            const m = re.exec(line)
            const col = m ? m.index + 1 : 1
            out.push({
              id: vId('OPENREDIR-' + idx, idx + 1, col),
              ruleId: 'OPEN-REDIRECT',
              name: 'Open Redirect',
              severity: 'medium',
              confidence: 'medium',
              cwe: 'CWE-601',
              owaspCategory: OWASP.ACCESS,
              description: 'Redirect to user-controlled URL — possible open redirect.',
              impact: 'Phishing attacks via trusted domain.',
              recommendation: 'Validate redirect target against allowlist.',
              evidence: line.trim(),
              line: idx + 1,
              column: col,
              language: 'javascript',
            })
            break
          }
        }
      })
      return out
    },
  },

  // ============ XXE ============
  {
    id: 'XXE',
    name: 'XML External Entity (XXE)',
    severity: 'high',
    confidence: 'high',
    cwe: 'CWE-611',
    owaspCategory: OWASP.INJECTION,
    languages: ['javascript', 'typescript', 'python', 'java', 'php', 'csharp'],
    description: 'XML parsing without disabling external entities enables XXE attacks.',
    impact: 'File disclosure, SSRF, DoS, and in some cases RCE.',
    recommendation: 'Disable DTDs and external entities in XML parser configuration.',
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      const patterns = [
        /new\s+DOMParser\s*\(\s*\)\s*\.parseFromString/,
        /et\.fromstring\s*\(/,  // ElementTree
        /xml\.etree\.ElementTree/,
        /DocumentBuilderFactory/,
        /XMLReader/,
        /SAXParser/,
        /simplexml_load_string/,
        /XmlDocument\(\)\.Load/,
      ]
      lines.forEach((line, idx) => {
        for (const re of patterns) {
          if (re.test(line)) {
            const m = re.exec(line)
            const col = m ? m.index + 1 : 1
            // Check next 5 lines for DTD/external entity disabling
            const nearby = lines.slice(Math.max(0, idx - 5), Math.min(lines.length, idx + 5)).join('\n')
            if (!nearby.match(/disallow-doctype-decl|disable-doctype-decl|FEATURE_SECURE_PROCESSing|setFeature.*disallow/i) &&
                !nearby.match(/resolveCustomEntities\s*=\s*false|no_ent|noent\s*=\s*false|XML_PARSE_NOENT/i)) {
              out.push({
                id: vId('XXE-' + idx, idx + 1, col),
                ruleId: 'XXE',
                name: 'Possible XXE',
                severity: 'high',
                confidence: 'medium',
                cwe: 'CWE-611',
                owaspCategory: OWASP.INJECTION,
                description: 'XML parser used without explicit XXE protection.',
                impact: 'File disclosure, SSRF, DoS, possible RCE.',
                recommendation: 'Disable DTDs and external entities in XML parser.',
                evidence: line.trim(),
                line: idx + 1,
                column: col,
                language: 'javascript',
              })
              break
            }
          }
        }
      })
      return out
    },
  },

  // ============ Insecure Deserialization ============
  {
    id: 'DESERIALIZATION',
    name: 'Insecure Deserialization',
    severity: 'critical',
    confidence: 'high',
    cwe: 'CWE-502',
    owaspCategory: OWASP.DESERIALIZATION,
    languages: ['javascript', 'typescript', 'python', 'java', 'php', 'ruby', 'csharp'],
    description: 'Deserializing untrusted data can lead to RCE.',
    impact: 'Remote Code Execution, privilege escalation.',
    recommendation: 'Avoid deserialize of untrusted data. Use JSON. Implement integrity checks.',
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      const patterns = [
        /yaml\.load\s*\(/,  // Python yaml.load without SafeLoader
        /pickle\.loads?\s*\(/,
        /cPickle\.loads?\s*\(/,
        /marshal\.loads?\s*\(/,
        /shelve\.open\s*\(/,
        /unserialize\s*\(\s*\$_/,
        /ObjectInputStream/,
        /readObject\s*\(\s*\)/,
        /BinaryFormatter\s*\(\s*\)\s*\.Deserialize/,
        /new\s+JavaScriptSerializer/,
      ]
      lines.forEach((line, idx) => {
        for (const re of patterns) {
          if (re.test(line)) {
            const m = re.exec(line)
            const col = m ? m.index + 1 : 1
            // For Python yaml.load specifically, check if SafeLoader is used
            if (re.source.includes('yaml')) {
              const nextLines = lines.slice(idx, idx + 1).join('')
              if (nextLines.match(/SafeLoader|FullLoader/)) continue
            }
            out.push({
              id: vId('DESER-' + idx, idx + 1, col),
              ruleId: 'DESERIALIZATION',
              name: 'Insecure Deserialization',
              severity: 'critical',
              confidence: 'high',
              cwe: 'CWE-502',
              owaspCategory: OWASP.DESERIALIZATION,
              description: 'Deserialization of possibly untrusted data.',
              impact: 'Remote Code Execution.',
              recommendation: 'Use JSON. For YAML, use yaml.safe_load().',
              evidence: line.trim(),
              line: idx + 1,
              column: col,
              language: 'javascript',
              fix: '// Python: yaml.safe_load(data) instead of yaml.load(data)',
            })
            break
          }
        }
      })
      return out
    },
  },

  // ============ CORS ============
  {
    id: 'CORS-WILDCARD',
    name: 'Permissive CORS',
    severity: 'medium',
    confidence: 'high',
    cwe: 'CWE-942',
    owaspCategory: OWASP.CONFIG,
    languages: ['javascript', 'typescript', 'python', 'php', 'java', 'go'],
    description: 'Access-Control-Allow-Origin: * allows any website to make cross-origin requests.',
    impact: 'Sensitive data accessible from any origin. CSRF-like attacks.',
    recommendation: 'Specify explicit allowed origins. Never combine wildcard with credentials.',
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      const patterns = [
        /Access-Control-Allow-Origin['"]?\s*[:,]\s*['"]\*['"]/,
        /cors\s*\(\s*\{\s*origin\s*:\s*['"]\*['"]/,
        /Access-Control-Allow-Credentials['"]?\s*[:,]\s*true/,
      ]
      lines.forEach((line, idx) => {
        for (const re of patterns) {
          if (re.test(line)) {
            const m = re.exec(line)
            const col = m ? m.index + 1 : 1
            out.push({
              id: vId('CORS-' + idx, idx + 1, col),
              ruleId: 'CORS-WILDCARD',
              name: 'Permissive CORS',
              severity: 'medium',
              confidence: 'high',
              cwe: 'CWE-942',
              owaspCategory: OWASP.CONFIG,
              description: 'CORS allows any origin or wildcard with credentials.',
              impact: 'Cross-origin attacks from any website.',
              recommendation: 'Specify allowed origins explicitly.',
              evidence: line.trim(),
              line: idx + 1,
              column: col,
              language: 'javascript',
            })
            break
          }
        }
      })
      return out
    },
  },

  // ============ HTTP (no TLS) ============
  {
    id: 'HTTP-NO-TLS',
    name: 'Insecure HTTP URL',
    severity: 'medium',
    confidence: 'high',
    cwe: 'CWE-319',
    owaspCategory: OWASP.CRYPTO,
    languages: ['javascript', 'typescript', 'python', 'php', 'ruby', 'go', 'java'],
    description: 'Hardcoded http:// URLs (not https://) — traffic can be intercepted.',
    impact: 'Man-in-the-middle attacks, data interception.',
    recommendation: 'Use HTTPS for all external URLs.',
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      lines.forEach((line, idx) => {
        // Skip localhost / 127.0.0.1 / internal IPs
        if (line.match(/https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.|10\.|172\.)/)) return
        const m = line.match(/http:\/\/[a-z0-9.\-]+\.[a-z]{2,}/i)
        if (m) {
          out.push({
            id: vId('HTTP-' + idx, idx + 1, m.index + 1),
            ruleId: 'HTTP-NO-TLS',
            name: 'Insecure HTTP URL',
            severity: 'low',
            confidence: 'medium',
            cwe: 'CWE-319',
            owaspCategory: OWASP.CRYPTO,
            description: 'Hardcoded http:// URL — use https:// instead.',
            impact: 'Traffic can be intercepted.',
            recommendation: 'Use https:// for all external URLs.',
            evidence: line.trim(),
            line: idx + 1,
            column: m.index + 1,
            language: 'javascript',
          })
        }
      })
      return out
    },
  },

  // ============ Debug Mode ============
  {
    id: 'DEBUG-MODE',
    name: 'Debug Mode Enabled',
    severity: 'medium',
    confidence: 'high',
    cwe: 'CWE-489',
    owaspCategory: OWASP.CONFIG,
    languages: ['python', 'javascript', 'typescript', 'php', 'ruby'],
    description: 'Debug mode enabled in production leaks sensitive information.',
    impact: 'Stack traces, source code, configuration disclosure.',
    recommendation: 'Disable debug in production. Use environment variable.',
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      const patterns = [
        /app\.run\s*\(\s*debug\s*=\s*True/,
        /app\.debug\s*=\s*True/,
        /DEBUG\s*=\s*True/,
        /NODE_ENV.*development/,
        /displayErrors\s*=\s*On/,
        /error_reporting\s*\(\s*E_ALL\s*\)/,
        /config\.environments\.production\s*=\s*\{[\s\S]*?debug:\s*true/,
      ]
      lines.forEach((line, idx) => {
        for (const re of patterns) {
          if (re.test(line)) {
            const m = re.exec(line)
            const col = m ? m.index + 1 : 1
            out.push({
              id: vId('DEBUG-' + idx, idx + 1, col),
              ruleId: 'DEBUG-MODE',
              name: 'Debug Mode Enabled',
              severity: 'medium',
              confidence: 'high',
              cwe: 'CWE-489',
              owaspCategory: OWASP.CONFIG,
              description: 'Debug mode appears to be enabled.',
              impact: 'Information disclosure (stack traces, source).',
              recommendation: 'Disable debug in production. Use env var.',
              evidence: line.trim(),
              line: idx + 1,
              column: col,
              language: 'javascript',
            })
            break
          }
        }
      })
      return out
    },
  },

  // ============ C/C++ Buffer ============
  {
    id: 'C-STRCPY',
    name: 'Unsafe strcpy',
    severity: 'critical',
    confidence: 'high',
    cwe: 'CWE-120',
    owaspCategory: OWASP.INJECTION,
    languages: ['c', 'cpp'],
    description: 'strcpy does not check buffer length, causing buffer overflows.',
    impact: 'Buffer overflow → RCE.',
    recommendation: 'Use strncpy or strlcpy with explicit size.',
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      lines.forEach((line, idx) => {
        if (line.match(/\bstrcpy\s*\(/)) {
          out.push({
            id: vId('STRCPY-' + idx, idx + 1, line.indexOf('strcpy') + 1),
            ruleId: 'C-STRCPY',
            name: 'Unsafe strcpy',
            severity: 'critical',
            confidence: 'high',
            cwe: 'CWE-120',
            owaspCategory: OWASP.INJECTION,
            description: 'strcpy does not bound-check.',
            impact: 'Buffer overflow → RCE.',
            recommendation: 'Use strncpy(dst, src, sizeof(dst) - 1); dst[sizeof(dst)-1] = 0;',
            evidence: line.trim(),
            line: idx + 1,
            column: line.indexOf('strcpy') + 1,
            language: 'c',
            fix: 'strncpy(dst, src, sizeof(dst) - 1); dst[sizeof(dst) - 1] = \'\\0\';',
          })
        }
        if (line.match(/\bsprintf\s*\(/)) {
          out.push({
            id: vId('SPRINTF-' + idx, idx + 1, line.indexOf('sprintf') + 1),
            ruleId: 'C-STRCPY',
            name: 'Unsafe sprintf',
            severity: 'high',
            confidence: 'high',
            cwe: 'CWE-120',
            owaspCategory: OWASP.INJECTION,
            description: 'sprintf does not bound-check.',
            impact: 'Buffer overflow.',
            recommendation: 'Use snprintf(dst, sizeof(dst), ...).',
            evidence: line.trim(),
            line: idx + 1,
            column: line.indexOf('sprintf') + 1,
            language: 'c',
            fix: 'snprintf(dst, sizeof(dst), ...)',
          })
        }
        if (line.match(/\bstrcat\s*\(/)) {
          out.push({
            id: vId('STRCAT-' + idx, idx + 1, line.indexOf('strcat') + 1),
            ruleId: 'C-STRCPY',
            name: 'Unsafe strcat',
            severity: 'high',
            confidence: 'high',
            cwe: 'CWE-120',
            owaspCategory: OWASP.INJECTION,
            description: 'strcat does not bound-check.',
            impact: 'Buffer overflow.',
            recommendation: 'Use strncat(dst, src, sizeof(dst) - strlen(dst) - 1).',
            evidence: line.trim(),
            line: idx + 1,
            column: line.indexOf('strcat') + 1,
            language: 'c',
          })
        }
      })
      return out
    },
  },
  {
    id: 'C-FORMAT-STRING',
    name: 'Format String Vulnerability',
    severity: 'critical',
    confidence: 'high',
    cwe: 'CWE-134',
    owaspCategory: OWASP.INJECTION,
    languages: ['c', 'cpp'],
    description: 'printf with user-controlled format string allows memory disclosure / writes.',
    impact: 'Memory read/write, RCE.',
    recommendation: 'Always use a format string: printf("%s", user_input).',
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/\b(printf|fprintf|sprintf|syslog)\s*\(\s*([^,)]+)\s*\)/)
        if (m && !m[2].includes('"')) {
          // Only one argument and not a string literal — likely a format string vuln
          out.push({
            id: vId('FMTSTR-' + idx, idx + 1, line.indexOf(m[1]) + 1),
            ruleId: 'C-FORMAT-STRING',
            name: 'Format String Vulnerability',
            severity: 'critical',
            confidence: 'high',
            cwe: 'CWE-134',
            owaspCategory: OWASP.INJECTION,
            description: m[1] + ' called with non-literal format string.',
            impact: 'Memory disclosure, RCE.',
            recommendation: `Use ${m[1]}("%s", arg) instead of ${m[1]}(arg).`,
            evidence: line.trim(),
            line: idx + 1,
            column: line.indexOf(m[1]) + 1,
            language: 'c',
            fix: `${m[1]}("%s", ${m[2].trim()})`,
          })
        }
      })
      return out
    },
  },

  // ============ Mass Assignment ============
  {
    id: 'MASS-ASSIGN',
    name: 'Mass Assignment',
    severity: 'medium',
    confidence: 'medium',
    cwe: 'CWE-915',
    owaspCategory: OWASP.ACCESS,
    languages: ['javascript', 'typescript', 'python', 'ruby', 'php', 'java'],
    description: 'Directly assigning user input to model objects can allow setting protected fields.',
    impact: 'Privilege escalation, data tampering.',
    recommendation: 'Use allowlist of fields. Never assign request body directly to model.',
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      const patterns = [
        /Object\.assign\s*\(\s*\w+\s*,\s*req\.body/,
        /\.\s*update\s*\(\s*req\.body/,
        /\.\s*save\s*\(\s*\)/,  // too noisy, skip
        /new\s+\w+\s*\(\s*req\.body/,
        /setattr\s*\(\s*\w+\s*,\s*k\s*,\s*v\)/,
        /update_attributes/,
        /\bassign_attributes\s+params/,
      ]
      lines.forEach((line, idx) => {
        for (const re of patterns) {
          if (re.test(line)) {
            const m = re.exec(line)
            const col = m ? m.index + 1 : 1
            out.push({
              id: vId('MASS-' + idx, idx + 1, col),
              ruleId: 'MASS-ASSIGN',
              name: 'Mass Assignment',
              severity: 'medium',
              confidence: 'medium',
              cwe: 'CWE-915',
              owaspCategory: OWASP.ACCESS,
              description: 'Possible mass assignment of user input to model.',
              impact: 'Privilege escalation, data tampering.',
              recommendation: 'Use explicit field allowlist.',
              evidence: line.trim(),
              line: idx + 1,
              column: col,
              language: 'javascript',
            })
            break
          }
        }
      })
      return out
    },
  },

  // ============ Information Disclosure ============
  {
    id: 'INFO-STACKTRACE',
    name: 'Stack Trace Disclosure',
    severity: 'low',
    confidence: 'high',
    cwe: 'CWE-209',
    owaspCategory: OWASP.LOGGING,
    languages: ['javascript', 'typescript', 'python', 'java', 'php', 'csharp'],
    description: 'Returning stack traces to clients leaks implementation details.',
    impact: 'Information disclosure helps attackers craft targeted attacks.',
    recommendation: 'Log full error internally. Return generic error to client.',
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      const patterns = [
        /res\.send\s*\(\s*err\.stack/,
        /res\.json\s*\(\s*\{\s*error\s*:\s*err\s*\}\)/,
        /response\.send\s*\(\s*e\.getMessage/,
        /printStackTrace\s*\(\s*\)/,
        /echo\s+\$e->getMessage/,
        /return\s+str\s*\(\s*e\s*\)/,  // python
      ]
      lines.forEach((line, idx) => {
        for (const re of patterns) {
          if (re.test(line)) {
            const m = re.exec(line)
            const col = m ? m.index + 1 : 1
            out.push({
              id: vId('STACK-' + idx, idx + 1, col),
              ruleId: 'INFO-STACKTRACE',
              name: 'Stack Trace Disclosure',
              severity: 'low',
              confidence: 'high',
              cwe: 'CWE-209',
              owaspCategory: OWASP.LOGGING,
              description: 'Possible stack trace disclosure to client.',
              impact: 'Information disclosure.',
              recommendation: 'Log internally, return generic error.',
              evidence: line.trim(),
              line: idx + 1,
              column: col,
              language: 'javascript',
            })
            break
          }
        }
      })
      return out
    },
  },

  // ============ Hashing passwords (no salt) ============
  {
    id: 'WEAK-PASSWORD-HASH',
    name: 'Weak Password Hashing',
    severity: 'high',
    confidence: 'high',
    cwe: 'CWE-916',
    owaspCategory: OWASP.CRYPTO,
    languages: ['javascript', 'typescript', 'python', 'php', 'java', 'go', 'ruby'],
    description: 'Using MD5/SHA1/SHA256 directly for password hashing is insecure (too fast).',
    impact: 'Password hashes can be brute-forced quickly.',
    recommendation: 'Use bcrypt, scrypt, argon2, or PBKDF2 with proper work factor.',
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      const patterns = [
        /crypto\.createHash\s*\(\s*['"]sha?256?['"]\s*\)\s*\.update\s*\([^)]*password/i,
        /crypto\.createHash\s*\(\s*['"]md5['"]\s*\)\s*\.update\s*\([^)]*password/i,
        /hashlib\.sha?256?\s*\(\s*password/i,
        /hashlib\.md5\s*\(\s*password/i,
        /md5\s*\(\s*password/i,
        /sha1\s*\(\s*password/i,
        /MessageDigest\.getInstance\s*\(\s*['"]SHA-?256['"]\s*\)[\s\S]{0,100}password/i,
      ]
      lines.forEach((line, idx) => {
        for (const re of patterns) {
          if (re.test(line)) {
            const m = re.exec(line)
            const col = m ? m.index + 1 : 1
            out.push({
              id: vId('WEAKPW-' + idx, idx + 1, col),
              ruleId: 'WEAK-PASSWORD-HASH',
              name: 'Weak Password Hashing',
              severity: 'high',
              confidence: 'high',
              cwe: 'CWE-916',
              owaspCategory: OWASP.CRYPTO,
              description: 'Fast hash used for password — vulnerable to brute force.',
              impact: 'Password cracking is fast and cheap.',
              recommendation: 'Use bcrypt.hashpw(pw, bcrypt.gensalt(12)) or argon2.',
              evidence: line.trim(),
              line: idx + 1,
              column: col,
              language: 'javascript',
              fix: '// const bcrypt = require("bcrypt");\n// const hash = bcrypt.hashSync(password, 12);',
            })
            break
          }
        }
      })
      return out
    },
  },

  // ============ Disabled TLS verification ============
  {
    id: 'TLS-DISABLED',
    name: 'TLS Verification Disabled',
    severity: 'high',
    confidence: 'high',
    cwe: 'CWE-295',
    owaspCategory: OWASP.CRYPTO,
    languages: ['javascript', 'typescript', 'python', 'go', 'java', 'csharp'],
    description: 'Disabling TLS certificate verification allows MITM attacks.',
    impact: 'Man-in-the-middle attacks; encrypted traffic can be intercepted.',
    recommendation: 'Always verify TLS certificates in production.',
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      const patterns = [
        /rejectUnauthorized\s*:\s*false/,
        /NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]0['"]/,
        /verify\s*:\s*false/,
        /InsecureSkipVerify\s*:\s*true/,
        /CURLOPT_SSL_VERIFYPEER\s*,\s*0/,
        /checkServerIdentity\s*:\s*\(\s*\)\s*=>\s*\{?\s*\}/,
        /ssl._create_default_https_context\s*=\s*ssl._create_unverified_context/,
      ]
      lines.forEach((line, idx) => {
        for (const re of patterns) {
          if (re.test(line)) {
            const m = re.exec(line)
            const col = m ? m.index + 1 : 1
            out.push({
              id: vId('TLS-' + idx, idx + 1, col),
              ruleId: 'TLS-DISABLED',
              name: 'TLS Verification Disabled',
              severity: 'high',
              confidence: 'high',
              cwe: 'CWE-295',
              owaspCategory: OWASP.CRYPTO,
              description: 'TLS certificate verification disabled.',
              impact: 'MITM attacks possible.',
              recommendation: 'Enable TLS verification. Fix certificate issues, do not bypass them.',
              evidence: line.trim(),
              line: idx + 1,
              column: col,
              language: 'javascript',
            })
            break
          }
        }
      })
      return out
    },
  },

  // ============ Dockerfile issues ============
  {
    id: 'DOCKER-ROOT',
    name: 'Container Runs as Root',
    severity: 'medium',
    confidence: 'high',
    cwe: 'CWE-250',
    owaspCategory: OWASP.CONFIG,
    languages: ['dockerfile'],
    description: 'Running containers as root increases blast radius of container escape.',
    impact: 'If container escapes, attacker gets root on host.',
    recommendation: 'Create non-root user: USER node',
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      const hasUserDirective = lines.some(l => l.match(/^\s*USER\s+\S+/i))
      if (!hasUserDirective) {
        lines.forEach((line, idx) => {
          if (line.match(/^\s*FROM\s+/i) && idx === lines.findIndex(l => l.match(/^\s*FROM\s+/i))) {
            out.push({
              id: vId('DOCKER-ROOT', idx + 1, 1),
              ruleId: 'DOCKER-ROOT',
              name: 'Container Runs as Root',
              severity: 'medium',
              confidence: 'high',
              cwe: 'CWE-250',
              owaspCategory: OWASP.CONFIG,
              description: 'No USER directive — container runs as root by default.',
              impact: 'Container escape = host root.',
              recommendation: 'Add: RUN adduser -D appuser && USER appuser',
              evidence: line.trim(),
              line: idx + 1,
              column: 1,
              language: 'dockerfile',
              fix: '# Add at end of Dockerfile:\n# RUN addgroup -S app && adduser -S app -G app\n# USER app',
            })
          }
        })
      }
      return out
    },
  },
  {
    id: 'DOCKER-LATEST',
    name: 'Using :latest tag',
    severity: 'low',
    confidence: 'high',
    cwe: 'CWE-1104',
    owaspCategory: OWASP.VULN,
    languages: ['dockerfile'],
    description: 'Using :latest tag makes builds non-reproducible and pulls in unknown versions.',
    impact: 'Unexpected breaking changes, unpatched vulnerabilities.',
    recommendation: 'Pin to specific version tag.',
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/^\s*FROM\s+(\S+):latest/i)
        if (m) {
          out.push({
            id: vId('DOCKER-LATEST', idx + 1, 1),
            ruleId: 'DOCKER-LATEST',
            name: 'Using :latest tag',
            severity: 'low',
            confidence: 'high',
            cwe: 'CWE-1104',
            owaspCategory: OWASP.VULN,
            description: 'Avoid :latest tag in FROM.',
            impact: 'Non-reproducible builds.',
            recommendation: 'Pin specific version: ' + m[1] + ':1.2.3',
            evidence: line.trim(),
            line: idx + 1,
            column: 1,
            language: 'dockerfile',
          })
        }
      })
      return out
    },
  },

  // ============ Hardcoded credentials in shell ============
  {
    id: 'SHELL-CREDS',
    name: 'Hardcoded credentials in shell',
    severity: 'high',
    confidence: 'high',
    cwe: 'CWE-798',
    owaspCategory: OWASP.AUTH,
    languages: ['bash', 'shell', 'powershell'],
    description: 'Hardcoded passwords in shell scripts leak credentials.',
    impact: 'Account compromise.',
    recommendation: 'Read from environment variables or secret manager.',
    detect: (code, lines) => {
      const out: Vulnerability[] = []
      const patterns = [
        /\bPASSWORD\s*=\s*['"][^'"]+['"]/,
        /\bPASS\s*=\s*['"][^'"]+['"]/,
        /\bTOKEN\s*=\s*['"][^'"]+['"]/,
        /\bSECRET\s*=\s*['"][^'"]+['"]/,
        /\bAPI_KEY\s*=\s*['"][^'"]+['"]/,
        /\bmysql\s+-u\s+\w+\s+-p['"][^'"]+['"]/,
        /\bpsql\s+.*-p['"][^'"]+['"]/,
        /\bcurl\s+-u\s+\w+:\S+/,
      ]
      lines.forEach((line, idx) => {
        for (const re of patterns) {
          if (re.test(line) && !line.match(/\$\{?\w+\}?/) && !line.match(/example|placeholder|your|xxx/i)) {
            const m = re.exec(line)
            const col = m ? m.index + 1 : 1
            out.push({
              id: vId('SHCRED-' + idx, idx + 1, col),
              ruleId: 'SHELL-CREDS',
              name: 'Hardcoded shell credentials',
              severity: 'high',
              confidence: 'high',
              cwe: 'CWE-798',
              owaspCategory: OWASP.AUTH,
              description: 'Hardcoded credentials in shell script.',
              impact: 'Credential exposure.',
              recommendation: 'Use env vars: PASSWORD="${PASSWORD}"',
              evidence: line.trim().substring(0, 80),
              line: idx + 1,
              column: col,
              language: 'bash',
              fix: '# Use env var instead:\n# PASSWORD="${PASSWORD:?Need PASSWORD set}"',
            })
            break
          }
        }
      })
      return out
    },
  },
]

// ---------- Main Scan Function ----------

export function scanVulnerabilities(code: string, language: string): VulnScanResult {
  const startTime = Date.now()
  const lines = code.split('\n')
  const allVulns: Vulnerability[] = []

  for (const rule of RULES) {
    if (rule.languages.includes(language) || rule.languages.includes('all')) {
      try {
        const vulns = rule.detect(code, lines)
        allVulns.push(...vulns)
      } catch (e) {
        // Skip failed rules
      }
    }
  }

  // Sort by severity then line
  const sevOrder: Record<VulnSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
  allVulns.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity] || a.line - b.line)

  const critical = allVulns.filter((v) => v.severity === 'critical').length
  const high = allVulns.filter((v) => v.severity === 'high').length
  const medium = allVulns.filter((v) => v.severity === 'medium').length
  const low = allVulns.filter((v) => v.severity === 'low').length
  const info = allVulns.filter((v) => v.severity === 'info').length

  // Calculate security score (0-100, 100 = perfect)
  let score = 100
  score -= critical * 25
  score -= high * 10
  score -= medium * 4
  score -= low * 1
  score -= info * 0.5
  score = Math.max(0, Math.min(100, score))

  return {
    vulnerabilities: allVulns,
    stats: {
      critical,
      high,
      medium,
      low,
      info,
      total: allVulns.length,
      score: Math.round(score * 10) / 10,
    },
    language,
    linesScanned: lines.length,
    scanTimeMs: Date.now() - startTime,
    rulesChecked: RULES.filter((r) => r.languages.includes(language)).length,
  }
}

export const VULN_RULE_COUNT = RULES.length

export function getVulnRulesByLanguage(language: string): VulnRule[] {
  return RULES.filter((r) => r.languages.includes(language) || r.languages.includes('all'))
}
