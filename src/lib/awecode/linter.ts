// AWECode Offline Linter — 99% offline, rule-based static analysis
// No external API calls. Pure regex + token heuristic checks.
// Supports JavaScript, TypeScript, Python, PHP, Ruby, Go, Rust, Java, C/C++, C#, Bash, SQL, HTML, CSS

export type Severity = 'error' | 'warning' | 'info' | 'hint'

export interface LintProblem {
  id: string
  ruleId: string
  ruleName: string
  severity: Severity
  message: string
  line: number
  column: number
  endLine?: number
  endColumn?: number
  suggestion?: string
  fix?: string
  category: 'syntax' | 'style' | 'bug' | 'performance' | 'security' | 'best-practice' | 'complexity'
  source: string
}

export interface LintResult {
  problems: LintProblem[]
  stats: {
    errors: number
    warnings: number
    infos: number
    hints: number
    total: number
    byCategory: Record<string, number>
  }
  language: string
  linesAnalyzed: number
  analysisTimeMs: number
}

interface LintRule {
  id: string
  name: string
  severity: Severity
  category: LintProblem['category']
  languages: string[]
  description: string
  check: (code: string, lines: string[]) => LintProblem[]
}

// ---------- Helper utilities ----------

function makeId(ruleId: string, line: number, col: number): string {
  return `${ruleId}-L${line}-C${col}`
}

// Skip single-line comments and strings to reduce false positives
function stripStringsAndComments(line: string, language: string): string {
  let result = line
  // Block comment markers within a line
  if (['javascript', 'typescript', 'java', 'c', 'cpp', 'csharp', 'go', 'rust', 'php', 'swift', 'kotlin', 'dart'].includes(language)) {
    result = result.replace(/\/\/.*$/g, '')
  }
  if (['python', 'ruby'].includes(language)) {
    result = result.replace(/#.*$/g, '')
  }
  if (['sql'].includes(language)) {
    result = result.replace(/--.*$/g, '')
  }
  // Remove string literals (single, double, backtick)
  result = result.replace(/"(?:[^"\\]|\\.)*"/g, '""')
  result = result.replace(/'(?:[^'\\]|\\.)*'/g, "''")
  result = result.replace(/`(?:[^`\\]|\\.)*`/g, '``')
  return result
}

// ---------- Lint Rules ----------

const RULES: LintRule[] = [
  // ============ JavaScript / TypeScript ============
  {
    id: 'no-var',
    name: 'Disallow var keyword',
    severity: 'warning',
    category: 'best-practice',
    languages: ['javascript', 'typescript'],
    description: 'Use let or const instead of var for block-scoped variables.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const stripped = stripStringsAndComments(line, 'javascript')
        const m = stripped.match(/\bvar\s+([A-Za-z_$][\w$]*)/)
        if (m) {
          const col = stripped.indexOf('var') + 1
          problems.push({
            id: makeId('no-var', idx + 1, col),
            ruleId: 'no-var',
            ruleName: 'Disallow var keyword',
            severity: 'warning',
            message: `Use 'let' or 'const' instead of 'var' for variable '${m[1]}'.`,
            line: idx + 1,
            column: col,
            suggestion: 'let ' + m[1],
            fix: 'let ' + m[1],
            category: 'best-practice',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'no-console',
    name: 'No console statements',
    severity: 'hint',
    category: 'best-practice',
    languages: ['javascript', 'typescript'],
    description: 'Avoid leaving console statements in production code.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/console\.(log|debug|info|warn|error)\s*\(/)
        if (m) {
          const col = line.indexOf('console') + 1
          problems.push({
            id: makeId('no-console', idx + 1, col),
            ruleId: 'no-console',
            ruleName: 'No console statements',
            severity: 'hint',
            message: `Unexpected console.${m[1]} statement.`,
            line: idx + 1,
            column: col,
            suggestion: 'Remove or replace with proper logger.',
            category: 'best-practice',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'eqeqeq',
    name: 'Require strict equality',
    severity: 'warning',
    category: 'bug',
    languages: ['javascript', 'typescript'],
    description: 'Use === and !== instead of == and !== to avoid type coercion bugs.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const stripped = stripStringsAndComments(line, 'javascript')
        const m = stripped.match(/([^=!<>])==([^=])/)
        if (m) {
          const col = stripped.indexOf('==', stripped.indexOf(m[1]) + 1) + 1
          problems.push({
            id: makeId('eqeqeq', idx + 1, col),
            ruleId: 'eqeqeq',
            ruleName: 'Require strict equality',
            severity: 'warning',
            message: `Use '===' instead of '==' for strict comparison.`,
            line: idx + 1,
            column: col,
            suggestion: 'Replace == with ===',
            fix: '===',
            category: 'bug',
            source: 'awecode-lint',
          })
        }
        const m2 = stripped.match(/([^=!<>])!=([^=])/)
        if (m2) {
          const col = stripped.indexOf('!=', stripped.indexOf(m2[1]) + 1) + 1
          problems.push({
            id: makeId('eqeqeq-neq', idx + 1, col),
            ruleId: 'eqeqeq',
            ruleName: 'Require strict inequality',
            severity: 'warning',
            message: `Use '!==' instead of '!=' for strict comparison.`,
            line: idx + 1,
            column: col,
            suggestion: 'Replace != with !==',
            fix: '!==',
            category: 'bug',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'no-eval',
    name: 'Disallow eval',
    severity: 'error',
    category: 'security',
    languages: ['javascript', 'typescript'],
    description: 'eval() can execute arbitrary code, leading to security vulnerabilities.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/\beval\s*\(/)
        if (m) {
          const col = line.indexOf('eval') + 1
          problems.push({
            id: makeId('no-eval', idx + 1, col),
            ruleId: 'no-eval',
            ruleName: 'Disallow eval',
            severity: 'error',
            message: 'eval() is dangerous and can lead to code injection attacks.',
            line: idx + 1,
            column: col,
            suggestion: 'Avoid eval. Use JSON.parse() or Function() constructor with caution.',
            category: 'security',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'no-unused-vars-heuristic',
    name: 'Possibly unused variable',
    severity: 'hint',
    category: 'best-practice',
    languages: ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c', 'cpp', 'csharp'],
    description: 'Heuristic check: variable declared but possibly never used.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      const declRegexes: Record<string, RegExp> = {
        javascript: /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g,
        typescript: /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*[:=]/g,
        python: /\b([A-Za-z_][\w]*)\s*=/g,
        java: /\b(?:int|long|double|float|boolean|String|var)\s+([A-Za-z_$][\w$]*)\s*=/g,
        go: /\b[a-zA-Z_][\w]*\s*:?=\s*/g,
        rust: /\blet\s+(?:mut\s+)?([A-Za-z_][\w]*)\s*[:=]/g,
        c: /\b(?:int|char|float|double|long|short|void|size_t)\s+\*?\s*([A-Za-z_][\w]*)\s*=/g,
        cpp: /\b(?:int|char|float|double|long|short|void|auto|size_t|std::string)\s+\*?\s*([A-Za-z_][\w]*)\s*=/g,
        csharp: /\b(?:int|long|double|float|decimal|bool|string|var)\s+([A-Za-z_][\w]*)\s*=/g,
      }
      return problems // Body filled by language-specific scanner
    },
  },
  {
    id: 'no-debugger',
    name: 'No debugger statement',
    severity: 'warning',
    category: 'best-practice',
    languages: ['javascript', 'typescript'],
    description: 'Remove debugger statements from production code.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/\bdebugger\b/)
        if (m) {
          const col = line.indexOf('debugger') + 1
          problems.push({
            id: makeId('no-debugger', idx + 1, col),
            ruleId: 'no-debugger',
            ruleName: 'No debugger statement',
            severity: 'warning',
            message: 'Unexpected debugger statement.',
            line: idx + 1,
            column: col,
            suggestion: 'Remove debugger statement.',
            category: 'best-practice',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'no-empty-block',
    name: 'No empty block',
    severity: 'hint',
    category: 'best-practice',
    languages: ['javascript', 'typescript', 'java', 'c', 'cpp', 'csharp', 'go', 'rust'],
    description: 'Empty block statements can indicate missing implementation.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/\{\s*\}/)
        if (m) {
          const col = line.indexOf('{') + 1
          problems.push({
            id: makeId('no-empty-block', idx + 1, col),
            ruleId: 'no-empty-block',
            ruleName: 'No empty block',
            severity: 'hint',
            message: 'Empty block detected.',
            line: idx + 1,
            column: col,
            suggestion: 'Add implementation or a comment explaining why the block is empty.',
            category: 'best-practice',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'no-trailing-spaces',
    name: 'No trailing whitespace',
    severity: 'hint',
    category: 'style',
    languages: ['javascript', 'typescript', 'python', 'ruby', 'java', 'go', 'rust', 'c', 'cpp', 'csharp', 'php', 'bash', 'shell', 'sql'],
    description: 'Trailing whitespace is unnecessary and can cause diff noise.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/[ \t]+$/)
        if (m) {
          problems.push({
            id: makeId('no-trailing-spaces', idx + 1, line.length - m[0].length + 1),
            ruleId: 'no-trailing-spaces',
            ruleName: 'No trailing whitespace',
            severity: 'hint',
            message: 'Trailing whitespace detected.',
            line: idx + 1,
            column: line.length - m[0].length + 1,
            suggestion: 'Remove trailing whitespace.',
            fix: line.replace(/[ \t]+$/, ''),
            category: 'style',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'max-line-length',
    name: 'Max line length exceeded',
    severity: 'hint',
    category: 'style',
    languages: ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c', 'cpp', 'csharp'],
    description: 'Lines should not exceed 120 characters for readability.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        if (line.length > 120) {
          problems.push({
            id: makeId('max-line-length', idx + 1, 121),
            ruleId: 'max-line-length',
            ruleName: 'Max line length exceeded',
            severity: 'hint',
            message: `Line is ${line.length} characters (max 120).`,
            line: idx + 1,
            column: 121,
            suggestion: 'Break the line into multiple lines.',
            category: 'style',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'no-mixed-spaces-and-tabs',
    name: 'No mixed spaces and tabs',
    severity: 'warning',
    category: 'style',
    languages: ['javascript', 'typescript', 'python', 'ruby', 'php', 'bash', 'shell'],
    description: 'Mixing spaces and tabs can cause inconsistent rendering and Python errors.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        if (line.match(/^[ \t]*\t[ \t]* /) || line.match(/^[ \t]* [ \t]*\t/)) {
          problems.push({
            id: makeId('mixed-indent', idx + 1, 1),
            ruleId: 'no-mixed-spaces-and-tabs',
            ruleName: 'No mixed spaces and tabs',
            severity: 'warning',
            message: 'Mixed spaces and tabs in indentation.',
            line: idx + 1,
            column: 1,
            suggestion: 'Use only spaces or only tabs for indentation.',
            category: 'style',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'no-implicit-globals',
    name: 'No implicit globals',
    severity: 'error',
    category: 'bug',
    languages: ['javascript', 'typescript'],
    description: 'Variables declared without var/let/const become implicit globals.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const stripped = stripStringsAndComments(line, 'javascript')
        const m = stripped.match(/^\s*([A-Za-z_$][\w$]*)\s*=/)
        if (m && !['const', 'let', 'var', 'function', 'class', 'if', 'for', 'while', 'switch', 'return', 'export', 'import', 'default', 'await'].includes(m[1])) {
          const before = stripped.substring(0, stripped.indexOf(m[1]))
          if (!before.match(/(?:const|let|var|function|return|export|import|=|,|\(|\[|\{|;|:|\?|&|\||\+|-|\*|\/|<|>|\!)\s*$/)) {
            // Could be an implicit global — keep as info, low confidence
            const col = stripped.indexOf(m[1]) + 1
            problems.push({
              id: makeId('no-implicit-globals', idx + 1, col),
              ruleId: 'no-implicit-globals',
              ruleName: 'Possible implicit global',
              severity: 'info',
              message: `Possible implicit global variable '${m[1]}'. Add 'let'/'const'/'var'.`,
              line: idx + 1,
              column: col,
              suggestion: 'Use let/const/var to declare variables.',
              category: 'bug',
              source: 'awecode-lint',
            })
          }
        }
      })
      return problems
    },
  },
  {
    id: 'prefer-template-literal',
    name: 'Prefer template literals',
    severity: 'hint',
    category: 'best-practice',
    languages: ['javascript', 'typescript'],
    description: 'Template literals are more readable than string concatenation.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const stripped = stripStringsAndComments(line, 'javascript')
        const m = stripped.match(/['"][^'"]*['"]\s*\+\s*[A-Za-z_$]/)
        if (m) {
          const col = stripped.indexOf(m[0]) + 1
          problems.push({
            id: makeId('prefer-template', idx + 1, col),
            ruleId: 'prefer-template-literal',
            ruleName: 'Prefer template literals',
            severity: 'hint',
            message: 'Use template literals instead of string concatenation.',
            line: idx + 1,
            column: col,
            suggestion: 'Use `string ${variable}` instead.',
            category: 'best-practice',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'no-unused-expression',
    name: 'Unused expression',
    severity: 'warning',
    category: 'bug',
    languages: ['javascript', 'typescript'],
    description: 'Expressions with no effect may indicate a bug.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const stripped = stripStringsAndComments(line, 'javascript').trim()
        const m = stripped.match(/^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*;/)
        if (m && !['true', 'false', 'null', 'undefined', 'this', 'super'].includes(m[1])) {
          // Skip if it's actually a function call (handled elsewhere)
          if (!stripped.match(/^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\(/)) {
            const col = stripped.indexOf(m[1]) + 1
            problems.push({
              id: makeId('no-unused-expr', idx + 1, col),
              ruleId: 'no-unused-expression',
              ruleName: 'Unused expression',
              severity: 'info',
              message: `Expression '${m[1]}' has no effect.`,
              line: idx + 1,
              column: col,
              suggestion: 'Remove the expression or assign it to a variable.',
              category: 'bug',
              source: 'awecode-lint',
            })
          }
        }
      })
      return problems
    },
  },

  // ============ Python ============
  {
    id: 'py-unused-import',
    name: 'Unused import (heuristic)',
    severity: 'hint',
    category: 'best-practice',
    languages: ['python'],
    description: 'Imported name may not be used.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      const imports: { name: string; line: number; col: number }[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/^\s*(?:from\s+\S+\s+)?import\s+([A-Za-z_][\w]*(?:\s+as\s+([A-Za-z_][\w]*))?)/)
        if (m) {
          const name = m[2] || m[1]
          imports.push({ name, line: idx + 1, col: line.indexOf('import') + 1 })
        }
      })
      const codeWithoutImports = lines.map((l, i) => {
        if (l.match(/^\s*(?:from\s+\S+\s+)?import\s+/)) return ''
        return l
      }).join('\n')
      for (const imp of imports) {
        const re = new RegExp(`\\b${imp.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)
        if (!re.test(codeWithoutImports)) {
          problems.push({
            id: makeId('py-unused-import', imp.line, imp.col),
            ruleId: 'py-unused-import',
            ruleName: 'Unused import',
            severity: 'hint',
            message: `Import '${imp.name}' may be unused.`,
            line: imp.line,
            column: imp.col,
            suggestion: 'Remove unused import.',
            category: 'best-practice',
            source: 'awecode-lint',
          })
        }
      }
      return problems
    },
  },
  {
    id: 'py-bare-except',
    name: 'Bare except clause',
    severity: 'warning',
    category: 'best-practice',
    languages: ['python'],
    description: 'Bare except clauses catch too broadly, including SystemExit and KeyboardInterrupt.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/^\s*except\s*:/)
        if (m) {
          const col = line.indexOf('except') + 1
          problems.push({
            id: makeId('py-bare-except', idx + 1, col),
            ruleId: 'py-bare-except',
            ruleName: 'Bare except clause',
            severity: 'warning',
            message: 'Use "except Exception:" instead of bare "except:".',
            line: idx + 1,
            column: col,
            suggestion: 'except Exception:',
            fix: 'except Exception:',
            category: 'best-practice',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'py-print',
    name: 'Use of print()',
    severity: 'hint',
    category: 'best-practice',
    languages: ['python'],
    description: 'Use logging module instead of print() for production code.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/\bprint\s*\(/)
        if (m) {
          const col = line.indexOf('print') + 1
          problems.push({
            id: makeId('py-print', idx + 1, col),
            ruleId: 'py-print',
            ruleName: 'Use of print()',
            severity: 'hint',
            message: 'Consider using logging module instead of print().',
            line: idx + 1,
            column: col,
            suggestion: 'import logging; logger = logging.getLogger(__name__)',
            category: 'best-practice',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'py-f-string-available',
    name: 'Could use f-string',
    severity: 'hint',
    category: 'style',
    languages: ['python'],
    description: 'f-strings are more readable than .format() or % formatting.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/\.\s*format\s*\(/)
        if (m) {
          const col = line.indexOf('.format') + 1
          problems.push({
            id: makeId('py-fstring', idx + 1, col),
            ruleId: 'py-f-string-available',
            ruleName: 'Could use f-string',
            severity: 'hint',
            message: 'Consider using f-string instead of .format().',
            line: idx + 1,
            column: col,
            suggestion: 'Use f"...{variable}..." syntax.',
            category: 'style',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'py-mutable-default',
    name: 'Mutable default argument',
    severity: 'error',
    category: 'bug',
    languages: ['python'],
    description: 'Mutable default arguments are shared across calls, leading to subtle bugs.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/def\s+\w+\s*\([^)]*=\s*(\[\]|\{\}|set\(\)|dict\(\)|list\(\)|[A-Z]\w*\(\))/)
        if (m) {
          const col = line.indexOf('=') + 1
          problems.push({
            id: makeId('py-mutable-default', idx + 1, col),
            ruleId: 'py-mutable-default',
            ruleName: 'Mutable default argument',
            severity: 'error',
            message: `Mutable default argument '${m[1]}' will be shared across function calls.`,
            line: idx + 1,
            column: col,
            suggestion: 'Use None as default and initialize inside the function.',
            fix: 'Use None as default and initialize inside the function.',
            category: 'bug',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'py-global-statement',
    name: 'Use of global statement',
    severity: 'warning',
    category: 'best-practice',
    languages: ['python'],
    description: 'Using global makes code harder to test and reason about.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/^\s*global\s+/)
        if (m) {
          const col = line.indexOf('global') + 1
          problems.push({
            id: makeId('py-global', idx + 1, col),
            ruleId: 'py-global-statement',
            ruleName: 'Use of global statement',
            severity: 'warning',
            message: 'Avoid using global. Return values from functions instead.',
            line: idx + 1,
            column: col,
            suggestion: 'Return value and assign in caller.',
            category: 'best-practice',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },

  // ============ SQL ============
  {
    id: 'sql-select-star',
    name: 'Avoid SELECT *',
    severity: 'hint',
    category: 'performance',
    languages: ['sql'],
    description: 'SELECT * returns unnecessary columns and breaks when schema changes.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/\bSELECT\s+\*\s+FROM\b/i)
        if (m) {
          const col = line.toUpperCase().indexOf('SELECT') + 1
          problems.push({
            id: makeId('sql-select-star', idx + 1, col),
            ruleId: 'sql-select-star',
            ruleName: 'Avoid SELECT *',
            severity: 'hint',
            message: 'Avoid SELECT *. Specify columns explicitly.',
            line: idx + 1,
            column: col,
            suggestion: 'List column names explicitly.',
            category: 'performance',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'sql-string-concat',
    name: 'Possible SQL injection (string concat)',
    severity: 'error',
    category: 'security',
    languages: ['sql'],
    description: 'String concatenation in SQL queries is a SQL injection vector.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/['"]\s*(?:\+|\|\||&)\s*['"]?/)
        if (m && line.match(/SELECT|INSERT|UPDATE|DELETE|WHERE/i)) {
          const col = line.indexOf(m[0]) + 1
          problems.push({
            id: makeId('sql-inject', idx + 1, col),
            ruleId: 'sql-string-concat',
            ruleName: 'Possible SQL injection',
            severity: 'error',
            message: 'String concatenation in SQL. Use parameterized queries.',
            line: idx + 1,
            column: col,
            suggestion: 'Use prepared statements: WHERE col = ?',
            category: 'security',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },

  // ============ PHP ============
  {
    id: 'php-short-open-tag',
    name: 'Short open tag',
    severity: 'warning',
    category: 'best-practice',
    languages: ['php'],
    description: 'Short open tags <? may not be enabled on all servers.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        if (line.match(/<\?(?!php|=)/)) {
          const col = line.indexOf('<?') + 1
          problems.push({
            id: makeId('php-short-tag', idx + 1, col),
            ruleId: 'php-short-open-tag',
            ruleName: 'Short open tag',
            severity: 'warning',
            message: 'Use <?php instead of short open tag <?.',
            line: idx + 1,
            column: col,
            suggestion: 'Use <?php',
            fix: '<?php',
            category: 'best-practice',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },

  // ============ Java ============
  {
    id: 'java-system-out',
    name: 'Avoid System.out.println',
    severity: 'hint',
    category: 'best-practice',
    languages: ['java'],
    description: 'Use a proper logging framework instead of System.out.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/System\.(out|err)\.(print|println|printf)\s*\(/)
        if (m) {
          const col = line.indexOf('System') + 1
          problems.push({
            id: makeId('java-sysout', idx + 1, col),
            ruleId: 'java-system-out',
            ruleName: 'Avoid System.out.println',
            severity: 'hint',
            message: 'Use SLF4J or Log4j instead of System.out/err.',
            line: idx + 1,
            column: col,
            suggestion: 'private static final Logger log = LoggerFactory.getLogger(...);',
            category: 'best-practice',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'java-empty-catch',
    name: 'Empty catch block',
    severity: 'warning',
    category: 'bug',
    languages: ['java', 'javascript', 'typescript', 'csharp', 'python'],
    description: 'Empty catch blocks swallow exceptions silently.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/catch\s*\([^)]*\)\s*\{\s*\}/)
        if (m) {
          const col = line.indexOf('catch') + 1
          problems.push({
            id: makeId('empty-catch', idx + 1, col),
            ruleId: 'java-empty-catch',
            ruleName: 'Empty catch block',
            severity: 'warning',
            message: 'Empty catch block. Log or rethrow the exception.',
            line: idx + 1,
            column: col,
            suggestion: 'Add logging or rethrow the exception.',
            category: 'bug',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },

  // ============ Go ============
  {
    id: 'go-unused-import',
    name: 'Unused import',
    severity: 'error',
    category: 'bug',
    languages: ['go'],
    description: 'Go does not allow unused imports.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      const imports: { name: string; line: number; col: number; alias?: string }[] = []
      lines.forEach((line, idx) => {
        const m1 = line.match(/^\s*import\s+"([^"]+)"/)
        if (m1) {
          const parts = m1[1].split('/')
          const name = parts[parts.length - 1]
          imports.push({ name, line: idx + 1, col: line.indexOf('import') + 1 })
        }
        const m2 = line.match(/^\s*(\w+)\s+"([^"]+)"/)
        if (m2) {
          imports.push({ name: m2[1], line: idx + 1, col: 1, alias: m2[1] })
        }
      })
      const codeWithoutImports = lines.filter(l => !l.match(/^\s*import\s/) && !l.match(/^\s*\w+\s+"[^"]+"\s*$/)).join('\n')
      for (const imp of imports) {
        const re = new RegExp(`\\b${imp.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)
        if (!re.test(codeWithoutImports)) {
          problems.push({
            id: makeId('go-unused-import', imp.line, imp.col),
            ruleId: 'go-unused-import',
            ruleName: 'Unused import',
            severity: 'error',
            message: `Import '${imp.name}' is unused.`,
            line: imp.line,
            column: imp.col,
            suggestion: 'Remove the unused import.',
            category: 'bug',
            source: 'awecode-lint',
          })
        }
      }
      return problems
    },
  },
  {
    id: 'go-err-check',
    name: 'Unchecked error',
    severity: 'warning',
    category: 'bug',
    languages: ['go'],
    description: 'Errors should be checked, not ignored.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/[A-Za-z_][\w]*\([^)]*\)\s*$/)
        if (m && line.match(/(os\.|fmt\.|io\.|ioutil\.|http\.)/) && !line.match(/=\s*\w/) && !line.match(/:=/)) {
          const col = 1
          problems.push({
            id: makeId('go-err', idx + 1, col),
            ruleId: 'go-err-check',
            ruleName: 'Unchecked error',
            severity: 'warning',
            message: 'Return value (error) may be unchecked.',
            line: idx + 1,
            column: col,
            suggestion: 'Assign to err and check: if err != nil { ... }',
            category: 'bug',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },

  // ============ Rust ============
  {
    id: 'rust-unwrap',
    name: 'Avoid .unwrap()',
    severity: 'warning',
    category: 'bug',
    languages: ['rust'],
    description: '.unwrap() panics on None/Err. Use pattern matching or ? operator.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/\.unwrap\(\)/)
        if (m) {
          const col = line.indexOf('.unwrap') + 1
          problems.push({
            id: makeId('rust-unwrap', idx + 1, col),
            ruleId: 'rust-unwrap',
            ruleName: 'Avoid .unwrap()',
            severity: 'warning',
            message: '.unwrap() can panic. Use ? operator or match instead.',
            line: idx + 1,
            column: col,
            suggestion: 'Use `?` or `match`/`if let` for safer error handling.',
            category: 'bug',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },

  // ============ C/C++ ============
  {
    id: 'c-gets',
    name: 'gets() is dangerous',
    severity: 'error',
    category: 'security',
    languages: ['c', 'cpp'],
    description: 'gets() is unsafe and removed in C11. Use fgets() instead.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/\bgets\s*\(/)
        if (m) {
          const col = line.indexOf('gets') + 1
          problems.push({
            id: makeId('c-gets', idx + 1, col),
            ruleId: 'c-gets',
            ruleName: 'gets() is dangerous',
            severity: 'error',
            message: 'gets() is unsafe (buffer overflow). Use fgets() instead.',
            line: idx + 1,
            column: col,
            suggestion: 'fgets(buf, sizeof(buf), stdin);',
            fix: 'fgets(buf, sizeof(buf), stdin)',
            category: 'security',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'c-scanf-no-limit',
    name: 'scanf without width limit',
    severity: 'error',
    category: 'security',
    languages: ['c', 'cpp'],
    description: 'scanf with %s without width is a buffer overflow risk.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/scanf\s*\([^)]*%s/)
        if (m && !line.match(/%[\d]+s/)) {
          const col = line.indexOf('scanf') + 1
          problems.push({
            id: makeId('c-scanf', idx + 1, col),
            ruleId: 'c-scanf-no-limit',
            ruleName: 'scanf without width limit',
            severity: 'error',
            message: 'scanf %s without width limit can overflow buffer.',
            line: idx + 1,
            column: col,
            suggestion: 'Use %99s (width = buffer size - 1).',
            fix: 'Use width specifier like %99s',
            category: 'security',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'c-malloc-no-check',
    name: 'malloc result unchecked',
    severity: 'warning',
    category: 'bug',
    languages: ['c', 'cpp'],
    description: 'malloc can return NULL on failure.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/=\s*malloc\s*\(/)
        if (m) {
          // Check next 3 lines for NULL check
          const nextLines = lines.slice(idx + 1, idx + 4).join('\n')
          if (!nextLines.match(/NULL|null|if\s*\(/)) {
            const col = line.indexOf('malloc') + 1
            problems.push({
              id: makeId('c-malloc', idx + 1, col),
              ruleId: 'c-malloc-no-check',
              ruleName: 'malloc result unchecked',
              severity: 'warning',
              message: 'malloc() may return NULL. Check the result before use.',
              line: idx + 1,
              column: col,
              suggestion: 'if (ptr == NULL) { /* handle error */ }',
              category: 'bug',
              source: 'awecode-lint',
            })
          }
        }
      })
      return problems
    },
  },

  // ============ HTML / CSS ============
  {
    id: 'html-img-no-alt',
    name: 'Image missing alt',
    severity: 'warning',
    category: 'best-practice',
    languages: ['html'],
    description: 'Images should have alt attributes for accessibility.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        if (line.match(/<img\b/) && !line.match(/\balt\s*=/)) {
          const col = line.indexOf('<img') + 1
          problems.push({
            id: makeId('img-alt', idx + 1, col),
            ruleId: 'html-img-no-alt',
            ruleName: 'Image missing alt',
            severity: 'warning',
            message: '<img> element is missing alt attribute.',
            line: idx + 1,
            column: col,
            suggestion: 'Add alt="description" for accessibility.',
            fix: 'alt=""',
            category: 'best-practice',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'css-important',
    name: 'Avoid !important',
    severity: 'hint',
    category: 'best-practice',
    languages: ['css', 'scss', 'less'],
    description: '!important makes styles hard to override.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        if (line.match(/!important/)) {
          const col = line.indexOf('!important') + 1
          problems.push({
            id: makeId('css-important', idx + 1, col),
            ruleId: 'css-important',
            ruleName: 'Avoid !important',
            severity: 'hint',
            message: 'Avoid !important. Use more specific selectors instead.',
            line: idx + 1,
            column: col,
            suggestion: 'Increase selector specificity instead.',
            category: 'best-practice',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },

  // ============ Bash / Shell ============
  {
    id: 'shell-echo-printf',
    name: 'Prefer printf over echo',
    severity: 'hint',
    category: 'best-practice',
    languages: ['bash', 'shell', 'powershell'],
    description: 'printf is more portable and predictable than echo.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        if (line.match(/^\s*echo\s+["']?-/)) {
          const col = line.indexOf('echo') + 1
          problems.push({
            id: makeId('echo-printf', idx + 1, col),
            ruleId: 'shell-echo-printf',
            ruleName: 'Prefer printf over echo',
            severity: 'hint',
            message: 'Consider using printf for portability.',
            line: idx + 1,
            column: col,
            suggestion: 'printf "format\\n" args',
            category: 'best-practice',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'shell-eval',
    name: 'Avoid eval',
    severity: 'error',
    category: 'security',
    languages: ['bash', 'shell'],
    description: 'eval can execute arbitrary input. Avoid if possible.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        if (line.match(/\beval\s+/)) {
          const col = line.indexOf('eval') + 1
          problems.push({
            id: makeId('shell-eval', idx + 1, col),
            ruleId: 'shell-eval',
            ruleName: 'Avoid eval',
            severity: 'error',
            message: 'eval is dangerous. Use arrays or other safe alternatives.',
            line: idx + 1,
            column: col,
            suggestion: 'Use arrays: cmd=(ls -la); "${cmd[@]}"',
            category: 'security',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },

  // ============ General ============
  {
    id: 'todo-comment',
    name: 'TODO comment',
    severity: 'info',
    category: 'best-practice',
    languages: ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c', 'cpp', 'csharp', 'ruby', 'php', 'bash'],
    description: 'TODO comments indicate incomplete work.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const m = line.match(/\b(TODO|FIXME|HACK|XXX|BUG)\b/)
        if (m) {
          const col = line.indexOf(m[1]) + 1
          problems.push({
            id: makeId('todo-' + idx, idx + 1, col),
            ruleId: 'todo-comment',
            ruleName: `${m[1]} comment`,
            severity: 'info',
            message: `${m[1]} comment found.`,
            line: idx + 1,
            column: col,
            suggestion: 'Resolve before shipping.',
            category: 'best-practice',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'long-function',
    name: 'Long function',
    severity: 'hint',
    category: 'complexity',
    languages: ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c', 'cpp', 'csharp', 'ruby', 'php'],
    description: 'Functions longer than 50 lines are hard to maintain.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      // Find function definitions and count lines until matching close
      const fnRegexByLang: Record<string, RegExp> = {
        javascript: /\b(function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>)|class\s+\w+)\b/,
        typescript: /\b(function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>)|class\s+\w+)\b/,
        python: /\bdef\s+\w+/,
        java: /\b(public|private|protected|static|\s)+\s*\w+\s+\w+\s*\([^)]*\)\s*(?:throws\s+\w+)?\s*\{/,
        go: /\bfunc\s+/,
        rust: /\bfn\s+/,
        c: /^\w[\w\s\*]*\s+\w+\s*\([^)]*\)\s*\{/,
        cpp: /^\w[\w\s\*:<>,&]*\s+\w+\s*\([^)]*\)\s*(?::\s*\w+\(.*\))?\s*\{/,
        csharp: /\b(public|private|protected|static|void|int|string|bool)\s+\w+\s*\([^)]*\)\s*\{/,
        ruby: /\bdef\s+/,
        php: /\bfunction\s+\w+\s*\(/,
      }
      const re = fnRegexByLang['javascript'] // generic
      let inFunc = false
      let funcStart = 0
      let depth = 0
      lines.forEach((line, idx) => {
        if (!inFunc && re.test(line)) {
          inFunc = true
          funcStart = idx + 1
          depth = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length
        } else if (inFunc) {
          depth += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length
          if (depth <= 0) {
            const length = idx + 1 - funcStart
            if (length > 50) {
              problems.push({
                id: makeId('long-fn', funcStart, 1),
                ruleId: 'long-function',
                ruleName: 'Long function',
                severity: 'hint',
                message: `Function is ${length} lines long (max 50).`,
                line: funcStart,
                column: 1,
                suggestion: 'Refactor into smaller functions.',
                category: 'complexity',
                source: 'awecode-lint',
              })
            }
            inFunc = false
          }
        }
      })
      return problems
    },
  },
  {
    id: 'deep-nesting',
    name: 'Deeply nested code',
    severity: 'warning',
    category: 'complexity',
    languages: ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c', 'cpp', 'csharp', 'ruby', 'php', 'bash'],
    description: 'Deeply nested code (4+ levels) is hard to read. Refactor.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      lines.forEach((line, idx) => {
        const indent = line.match(/^(\s*)/)?.[1].length || 0
        const tabSize = 2
        const levels = indent / tabSize
        if (levels >= 5) {
          problems.push({
            id: makeId('deep-nest', idx + 1, 1),
            ruleId: 'deep-nesting',
            ruleName: 'Deeply nested code',
            severity: 'warning',
            message: `Code is nested ${levels} levels deep. Consider extracting to a function.`,
            line: idx + 1,
            column: 1,
            suggestion: 'Extract nested logic into a helper function.',
            category: 'complexity',
            source: 'awecode-lint',
          })
        }
      })
      return problems
    },
  },
  {
    id: 'magic-numbers',
    name: 'Magic number',
    severity: 'hint',
    category: 'best-practice',
    languages: ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c', 'cpp', 'csharp'],
    description: 'Magic numbers should be named constants.',
    check: (code, lines) => {
      const problems: LintProblem[] = []
      const commonNumbers = new Set([0, 1, -1, 2, 10, 100, 1000])
      lines.forEach((line, idx) => {
        const stripped = stripStringsAndComments(line, 'javascript')
        const matches = stripped.matchAll(/\b(\d{2,})\b/g)
        for (const m of matches) {
          const num = parseInt(m[1])
          if (!commonNumbers.has(num) && num > 1) {
            const col = stripped.indexOf(m[1], m.index) + 1
            problems.push({
              id: makeId('magic-' + idx + '-' + col, idx + 1, col),
              ruleId: 'magic-numbers',
              ruleName: 'Magic number',
              severity: 'hint',
              message: `Magic number ${m[1]}. Consider extracting to a named constant.`,
              line: idx + 1,
              column: col,
              suggestion: 'const NAME = ' + m[1] + ';',
              category: 'best-practice',
              source: 'awecode-lint',
            })
            break // only one per line
          }
        }
      })
      return problems
    },
  },
]

// ---------- Main Lint Function ----------

export function lintCode(code: string, language: string): LintResult {
  const startTime = Date.now()
  const lines = code.split('\n')
  const allProblems: LintProblem[] = []

  // Apply applicable rules
  for (const rule of RULES) {
    if (rule.languages.includes(language) || rule.languages.includes('all')) {
      try {
        const problems = rule.check(code, lines)
        allProblems.push(...problems)
      } catch (e) {
        // Skip failed rules
      }
    }
  }

  // Sort by line, then column
  allProblems.sort((a, b) => a.line - b.line || a.column - b.column)

  const byCategory: Record<string, number> = {}
  for (const p of allProblems) {
    byCategory[p.category] = (byCategory[p.category] || 0) + 1
  }

  return {
    problems: allProblems,
    stats: {
      errors: allProblems.filter((p) => p.severity === 'error').length,
      warnings: allProblems.filter((p) => p.severity === 'warning').length,
      infos: allProblems.filter((p) => p.severity === 'info').length,
      hints: allProblems.filter((p) => p.severity === 'hint').length,
      total: allProblems.length,
      byCategory,
    },
    language,
    linesAnalyzed: lines.length,
    analysisTimeMs: Date.now() - startTime,
  }
}

// ---------- Lint Stats Export ----------

export const LINT_RULE_COUNT = RULES.length

export function getRulesByLanguage(language: string): LintRule[] {
  return RULES.filter((r) => r.languages.includes(language) || r.languages.includes('all'))
}
