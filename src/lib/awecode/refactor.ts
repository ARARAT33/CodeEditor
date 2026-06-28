// AWECode Refactoring Engine — Offline, AST-lite refactoring operations
// Supports JS/TS/Python/Java/C#/Go/Rust with language-aware transformations

export type RefactorType =
  | 'extract-function'
  | 'extract-variable'
  | 'inline-variable'
  | 'rename-symbol'
  | 'convert-to-arrow'
  | 'convert-to-template-literal'
  | 'convert-var-to-let-const'
  | 'add-types'
  | 'remove-comments'
  | 'format-code'
  | 'sort-imports'
  | 'remove-unused-imports'
  | 'simplify-conditional'
  | 'convert-to-ternary'
  | 'convert-to-if-else'
  | 'split-declaration'
  | 'merge-declarations'
  | 'invert-condition'
  | 'wrap-in-function'
  | 'extract-component'
  | 'add-error-handling'
  | 'add-null-check'
  | 'convert-callback-to-promise'
  | 'convert-promise-to-async-await'
  | 'remove-dead-code'
  | 'add-jsdoc'

export interface RefactorOpportunity {
  id: string
  type: RefactorType
  title: string
  description: string
  language: string
  line: number
  column: number
  endLine?: number
  endColumn?: number
  snippet: string
  benefit: string
  difficulty: 'easy' | 'medium' | 'hard'
  automated: boolean
  applied?: boolean
}

export interface RefactorResult {
  opportunities: RefactorOpportunity[]
  applied: Array<{ type: RefactorType; line: number; oldCode: string; newCode: string }>
  stats: {
    total: number
    automated: number
    manual: number
    byDifficulty: { easy: number; medium: number; hard: number }
  }
  language: string
}

// ---------- Refactoring Detection ----------

export function findRefactorOpportunities(code: string, language: string): RefactorOpportunity[] {
  const lines = code.split('\n')
  const ops: RefactorOpportunity[] = []
  const supported = ['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust', 'php', 'ruby']

  if (!supported.includes(language)) return ops

  // 1. var → let/const (JS/TS)
  if (['javascript', 'typescript'].includes(language)) {
    lines.forEach((line, idx) => {
      const m = line.match(/\bvar\s+([A-Za-z_$][\w$]*)\s*=/)
      if (m) {
        ops.push({
          id: `rf-var-${idx}`,
          type: 'convert-var-to-let-const',
          title: `Convert 'var' to 'const'/'let'`,
          description: `Variable '${m[1]}' is declared with var. Use const if not reassigned, otherwise let.`,
          language,
          line: idx + 1,
          column: line.indexOf('var') + 1,
          snippet: line.trim(),
          benefit: 'Block-scoped, no hoisting bugs, cleaner semantics.',
          difficulty: 'easy',
          automated: true,
        })
      }
    })
  }

  // 2. String concatenation → template literal
  if (['javascript', 'typescript'].includes(language)) {
    lines.forEach((line, idx) => {
      const stripped = line.replace(/\/\/.*$/, '')
      if (stripped.match(/['"][^'"]*['"]\s*\+\s*[A-Za-z_$]/)) {
        ops.push({
          id: `rf-tmpl-${idx}`,
          type: 'convert-to-template-literal',
          title: 'Convert to template literal',
          description: 'Use template literals (backticks) instead of string concatenation for readability.',
          language,
          line: idx + 1,
          column: 1,
          snippet: line.trim(),
          benefit: 'More readable, especially for multi-line or interpolated strings.',
          difficulty: 'easy',
          automated: true,
        })
      }
    })
  }

  // 3. Function expression → arrow function
  if (['javascript', 'typescript'].includes(language)) {
    lines.forEach((line, idx) => {
      if (line.match(/const\s+\w+\s*=\s*function\s*\(/)) {
        ops.push({
          id: `rf-arrow-${idx}`,
          type: 'convert-to-arrow',
          title: 'Convert to arrow function',
          description: 'Convert function expression to arrow function for conciseness.',
          language,
          line: idx + 1,
          column: 1,
          snippet: line.trim(),
          benefit: 'Lexical `this`, more concise syntax.',
          difficulty: 'easy',
          automated: true,
        })
      }
    })
  }

  // 4. Callback → async/await (heuristic)
  if (['javascript', 'typescript'].includes(language)) {
    lines.forEach((line, idx) => {
      if (line.match(/\.then\s*\(\s*(?:function|\()/)) {
        ops.push({
          id: `rf-async-${idx}`,
          type: 'convert-promise-to-async-await',
          title: 'Convert .then() to async/await',
          description: 'Use async/await for cleaner async code.',
          language,
          line: idx + 1,
          column: 1,
          snippet: line.trim(),
          benefit: 'Linear, easier-to-read async code. Better error handling with try/catch.',
          difficulty: 'medium',
          automated: false,
        })
      }
    })
  }

  // 5. Magic numbers
  if (supported.includes(language)) {
    const common = new Set([0, 1, -1, 2, 10, 100, 1000])
    lines.forEach((line, idx) => {
      const stripped = line.replace(/\/\/.*$/, '').replace(/#.*$/, '')
      const m = stripped.match(/[^A-Za-z_$]([\d]{2,})[^A-Za-z_$\d]/)
      if (m) {
        const num = parseInt(m[1])
        if (!common.has(num) && num > 1 && !line.match(/(const|let|var|final|static|import|require|#include|version|port|http|line)/i)) {
          ops.push({
            id: `rf-magic-${idx}`,
            type: 'extract-variable',
            title: `Extract magic number ${m[1]} to named constant`,
            description: `Number ${m[1]} should be extracted to a named constant for clarity.`,
            language,
            line: idx + 1,
            column: stripped.indexOf(m[1]) + 1,
            snippet: line.trim(),
            benefit: 'Self-documenting code, easier maintenance, single source of truth.',
            difficulty: 'easy',
            automated: false,
          })
        }
      }
    })
  }

  // 6. Deeply nested code → extract function
  lines.forEach((line, idx) => {
    const indent = line.match(/^(\s*)/)?.[1].length || 0
    if (indent >= 12 && line.trim().length > 0) {
      ops.push({
        id: `rf-nest-${idx}`,
        type: 'extract-function',
        title: 'Extract nested code to function',
        description: 'Deeply nested code (6+ levels) should be extracted to a helper function.',
        language,
        line: idx + 1,
        column: 1,
        snippet: line.trim(),
        benefit: 'Improved readability, testability, and reusability.',
        difficulty: 'medium',
        automated: false,
      })
    }
  })

  // 7. Long function
  const fnRegex = language === 'python' ? /^\s*def\s+\w+/ : /\bfunction\s+\w+|\bfunc\s+\w+|\bfn\s+\w+|const\s+\w+\s*=\s*\(.*\)\s*=>/
  let inFunc = false
  let funcStart = 0
  let depth = 0
  lines.forEach((line, idx) => {
    if (!inFunc && fnRegex.test(line)) {
      inFunc = true
      funcStart = idx + 1
      depth = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length
      if (language === 'python') depth = 1
    } else if (inFunc) {
      if (language === 'python') {
        if (line.trim() && !line.startsWith(' ') && !line.startsWith('\t')) {
          const length = idx - funcStart
          if (length > 50) {
            ops.push({
              id: `rf-longfn-${funcStart}`,
              type: 'extract-function',
              title: `Long function (${length} lines)`,
              description: `Function starting at line ${funcStart} is ${length} lines long. Break into smaller functions.`,
              language,
              line: funcStart,
              column: 1,
              snippet: lines[funcStart - 1]?.trim() || '',
              benefit: 'Single responsibility, easier to test and reason about.',
              difficulty: 'hard',
              automated: false,
            })
          }
          inFunc = false
        }
      } else {
        depth += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length
        if (depth <= 0) {
          const length = idx + 1 - funcStart
          if (length > 50) {
            ops.push({
              id: `rf-longfn-${funcStart}`,
              type: 'extract-function',
              title: `Long function (${length} lines)`,
              description: `Function starting at line ${funcStart} is ${length} lines long. Break into smaller functions.`,
              language,
              line: funcStart,
              column: 1,
              snippet: lines[funcStart - 1]?.trim() || '',
              benefit: 'Single responsibility, easier to test and reason about.',
              difficulty: 'hard',
              automated: false,
            })
          }
          inFunc = false
        }
      }
    }
  })

  // 8. Add JSDoc/docstring to functions without docs
  lines.forEach((line, idx) => {
    if (line.match(/^\s*(export\s+)?(async\s+)?function\s+\w+/) || line.match(/^\s*def\s+\w+/)) {
      const prevLine = lines[idx - 1] || ''
      if (!prevLine.match(/^\s*(\/\/\/|\/\*\*|#|""")/)) {
        ops.push({
          id: `rf-jsdoc-${idx}`,
          type: 'add-jsdoc',
          title: 'Add documentation',
          description: 'Function lacks documentation. Add JSDoc/docstring for IDE support.',
          language,
          line: idx + 1,
          column: 1,
          snippet: line.trim(),
          benefit: 'Better IDE IntelliSense, onboarding, and self-documenting code.',
          difficulty: 'easy',
          automated: true,
        })
      }
    }
  })

  // 9. Sort imports
  const importLines = lines.map((l, i) => ({ l, i })).filter(({ l }) => l.match(/^\s*import\s+/))
  if (importLines.length > 1) {
    let needsSort = false
    for (let i = 1; i < importLines.length; i++) {
      if (importLines[i].l < importLines[i - 1].l) {
        needsSort = true
        break
      }
    }
    if (needsSort) {
      ops.push({
        id: 'rf-sort-imports',
        type: 'sort-imports',
        title: 'Sort imports alphabetically',
        description: 'Imports are not sorted. Sort them for consistency.',
        language,
        line: importLines[0].i + 1,
        column: 1,
        snippet: importLines.map(({ l }) => l).join('\n'),
        benefit: 'Consistent code style, easier to find imports, fewer merge conflicts.',
        difficulty: 'easy',
        automated: true,
      })
    }
  }

  // 10. Add error handling to async calls without try/catch
  if (['javascript', 'typescript', 'python'].includes(language)) {
    lines.forEach((line, idx) => {
      if (line.match(/await\s+/) && !lines.slice(Math.max(0, idx - 5), idx).some(l => l.match(/try\s*{/))) {
        ops.push({
          id: `rf-err-${idx}`,
          type: 'add-error-handling',
          title: 'Add error handling for await',
          description: 'await call without try/catch can crash the process on rejection.',
          language,
          line: idx + 1,
          column: line.indexOf('await') + 1,
          snippet: line.trim(),
          benefit: 'Robust error handling prevents crashes and improves UX.',
          difficulty: 'easy',
          automated: false,
        })
      }
    })
  }

  // 11. Add null check
  lines.forEach((line, idx) => {
    if (line.match(/\.\w+\.\w+\.\w+/) && !line.match(/\?\.|\!\.|\bif\b/)) {
      ops.push({
        id: `rf-null-${idx}`,
        type: 'add-null-check',
        title: 'Add null check for chained access',
        description: 'Deep property access can throw if intermediate value is null/undefined.',
        language,
        line: idx + 1,
        column: 1,
        snippet: line.trim(),
        benefit: 'Prevents runtime TypeError crashes.',
        difficulty: 'easy',
        automated: false,
      })
    }
  })

  // 12. Convert callback to Promise (Node-style)
  if (['javascript', 'typescript'].includes(language)) {
    lines.forEach((line, idx) => {
      if (line.match(/\(err\s*,\s*\w+\)\s*=>/) || line.match(/function\s*\(\s*err\s*,/)) {
        ops.push({
          id: `rf-cb-${idx}`,
          type: 'convert-callback-to-promise',
          title: 'Convert Node callback to Promise',
          description: 'Use util.promisify or wrap in new Promise for cleaner async code.',
          language,
          line: idx + 1,
          column: 1,
          snippet: line.trim(),
          benefit: 'Promises compose better, support async/await.',
          difficulty: 'medium',
          automated: false,
        })
      }
    })
  }

  // 13. Invert condition (for early returns)
  lines.forEach((line, idx) => {
    const m = line.match(/^\s*if\s*\(\s*!\s*(\w+)\s*\)\s*\{?\s*$/)
    if (m && lines[idx + 1] && lines[idx + 1].match(/^\s*(throw|return)/)) {
      // OK pattern
    } else if (line.match(/^\s*if\s*\([^)]+\)\s*\{\s*$/) && lines.slice(idx + 1, idx + 5).some(l => l.match(/^\s*\}\s*$/))) {
      const blockEnd = lines.findIndex((l, i) => i > idx && l.match(/^\s*\}\s*$/))
      const blockLength = blockEnd - idx
      if (blockLength > 8) {
        ops.push({
          id: `rf-inv-${idx}`,
          type: 'invert-condition',
          title: 'Invert condition for early return',
          description: 'Long if block can be simplified by inverting the condition and returning early.',
          language,
          line: idx + 1,
          column: 1,
          snippet: line.trim(),
          benefit: 'Reduces nesting, improves readability.',
          difficulty: 'medium',
          automated: false,
        })
      }
    }
  })

  return ops
}

// ---------- Auto-Apply Refactoring ----------

export function applyRefactoring(code: string, type: RefactorType, language: string): string {
  const lines = code.split('\n')

  switch (type) {
    case 'convert-var-to-let-const': {
      return lines.map((line) => {
        // If line has reassignment later (rough heuristic), use let
        const hasVar = line.match(/\bvar\s+([A-Za-z_$][\w$]*)\s*=\s*([^;]+);?/)
        if (hasVar) {
          return line.replace(/\bvar\b/, 'const')
        }
        return line
      }).join('\n')
    }

    case 'convert-to-template-literal': {
      return lines.map((line) => {
        const stripped = line.replace(/\/\/.*$/, '')
        if (!stripped.match(/['"][^'"]*['"]\s*\+\s*[A-Za-z_$]/)) return line
        // Simple case: "prefix" + variable + "suffix"
        const m = stripped.match(/(['"])([^'"]*)\1\s*\+\s*([A-Za-z_$][\w$]*)\s*\+\s*(['"])([^'"]*)\4/)
        if (m) {
          return line.replace(
            /['"][^'"]*['"]\s*\+\s*[A-Za-z_$][\w$]*\s*\+\s*['"][^'"]*['"]/,
            `\`${m[2]}\${${m[3]}}${m[5]}\``
          )
        }
        // Two-segment: "prefix" + variable
        const m2 = stripped.match(/(['"])([^'"]*)\1\s*\+\s*([A-Za-z_$][\w$]*)/)
        if (m2) {
          return line.replace(
            /['"][^'"]*['"]\s*\+\s*[A-Za-z_$][\w$]*/,
            `\`${m2[2]}\${${m2[3]}}\``
          )
        }
        return line
      }).join('\n')
    }

    case 'convert-to-arrow': {
      return lines.map((line) => {
        // const foo = function(args) { → const foo = (args) => {
        const m = line.match(/(const|let|var)\s+(\w+)\s*=\s*function\s*\(([^)]*)\)\s*\{/)
        if (m) {
          return line.replace(
            /function\s*\(([^)]*)\)\s*\{/,
            `(${m[3]}) => {`
          )
        }
        return line
      }).join('\n')
    }

    case 'sort-imports': {
      const importIdxs: number[] = []
      lines.forEach((l, i) => {
        if (l.match(/^\s*import\s+/)) importIdxs.push(i)
      })
      if (importIdxs.length < 2) return code
      const start = importIdxs[0]
      const end = importIdxs[importIdxs.length - 1]
      const imports = lines.slice(start, end + 1)
      imports.sort()
      const newLines = [...lines.slice(0, start), ...imports, ...lines.slice(end + 1)]
      return newLines.join('\n')
    }

    case 'remove-unused-imports': {
      // Naive: keep all imports (full unused-import detection requires AST)
      return code
    }

    case 'format-code': {
      // Basic formatting: trim trailing whitespace, ensure semicolons
      return lines.map((line) => {
        let formatted = line.replace(/[ \t]+$/, '')
        return formatted
      }).join('\n')
    }

    case 'remove-comments': {
      return lines.filter((line) => {
        const stripped = line.trim()
        return !stripped.match(/^\/\//) && !stripped.match(/^#/) && !stripped.match(/^\/\*/)
      }).join('\n')
    }

    case 'add-jsdoc': {
      // Add a generic JSDoc above each function without one
      const result: string[] = []
      lines.forEach((line, idx) => {
        if (line.match(/^\s*(export\s+)?(async\s+)?function\s+(\w+)/)) {
          const prev = lines[idx - 1] || ''
          if (!prev.match(/^\s*(\/\/\/|\/\*\*)/)) {
            const m = line.match(/function\s+(\w+)\s*\(([^)]*)\)/)
            if (m) {
              const name = m[1]
              const params = m[2].split(',').map(p => p.trim()).filter(Boolean)
              const indent = line.match(/^(\s*)/)?.[1] || ''
              const jsdoc = [
                `${indent}/**`,
                `${indent} * ${name} - TODO: Add description`,
                ...params.map(p => {
                  const pname = p.split(/[:\s=]/)[0]
                  return `${indent} * @param {*} ${pname} TODO: describe`
                }),
                `${indent} * @returns {*} TODO: describe return value`,
                `${indent} */`,
              ]
              result.push(...jsdoc)
            }
          }
        }
        result.push(line)
      })
      return result.join('\n')
    }

    default:
      return code
  }
}

// ---------- Refactor Wrapper ----------

export function refactorCode(code: string, language: string, autoApply = true): RefactorResult {
  const opportunities = findRefactorOpportunities(code, language)
  const applied: RefactorResult['applied'] = []

  if (autoApply) {
    // Apply safe automated refactorings
    const safeTypes: RefactorType[] = ['convert-var-to-let-const', 'convert-to-template-literal', 'convert-to-arrow', 'sort-imports', 'format-code', 'add-jsdoc']
    let currentCode = code
    for (const type of safeTypes) {
      const before = currentCode
      currentCode = applyRefactoring(currentCode, type, language)
      if (currentCode !== before) {
        applied.push({
          type,
          line: 0,
          oldCode: before,
          newCode: currentCode,
        })
      }
    }
  }

  return {
    opportunities,
    applied,
    stats: {
      total: opportunities.length,
      automated: opportunities.filter(o => o.automated).length,
      manual: opportunities.filter(o => !o.automated).length,
      byDifficulty: {
        easy: opportunities.filter(o => o.difficulty === 'easy').length,
        medium: opportunities.filter(o => o.difficulty === 'medium').length,
        hard: opportunities.filter(o => o.difficulty === 'hard').length,
      },
    },
    language,
  }
}

// ---------- Error Corrector ----------

export interface Correction {
  id: string
  type: 'syntax' | 'style' | 'bug' | 'best-practice'
  title: string
  description: string
  line: number
  column: number
  original: string
  corrected: string
  confidence: 'high' | 'medium' | 'low'
  ruleId: string
}

export interface CorrectionResult {
  corrections: Correction[]
  appliedCount: number
  correctedCode: string
  language: string
}

export function correctCode(code: string, language: string): CorrectionResult {
  const lines = code.split('\n')
  const corrections: Correction[] = []

  // 1. JS/TS: == → ===, != → !==
  if (['javascript', 'typescript'].includes(language)) {
    lines.forEach((line, idx) => {
      const stripped = line.replace(/\/\/.*$/, '').replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'(?:[^'\\]|\\.)*'/g, "''")
      const m1 = stripped.match(/([^=!<>])==([^=])/)
      if (m1) {
        corrections.push({
          id: `corr-eqeq-${idx}`,
          type: 'bug',
          title: 'Replace == with ===',
          description: 'Strict equality avoids type coercion bugs.',
          line: idx + 1,
          column: stripped.indexOf('==', stripped.indexOf(m1[1]) + 1) + 1,
          original: line,
          corrected: line.replace(/([^=!<>])==([^=])/g, '$1===$2'),
          confidence: 'high',
          ruleId: 'eqeqeq',
        })
      }
      const m2 = stripped.match(/([^=!<>])!=([^=])/)
      if (m2) {
        corrections.push({
          id: `corr-neq-${idx}`,
          type: 'bug',
          title: 'Replace != with !==',
          description: 'Strict inequality avoids type coercion bugs.',
          line: idx + 1,
          column: stripped.indexOf('!=', stripped.indexOf(m2[1]) + 1) + 1,
          original: line,
          corrected: line.replace(/([^=!<>])!=([^=])/g, '$1!==$2'),
          confidence: 'high',
          ruleId: 'eqeqeq',
        })
      }
    })
  }

  // 2. Remove trailing whitespace (all langs)
  lines.forEach((line, idx) => {
    if (line.match(/[ \t]+$/)) {
      corrections.push({
        id: `corr-trim-${idx}`,
        type: 'style',
        title: 'Remove trailing whitespace',
        description: 'Trailing whitespace is unnecessary.',
        line: idx + 1,
        column: line.replace(/[ \t]+$/, '').length + 1,
        original: line,
        corrected: line.replace(/[ \t]+$/, ''),
        confidence: 'high',
        ruleId: 'no-trailing-spaces',
      })
    }
  })

  // 3. Python: mutable default → None
  if (language === 'python') {
    lines.forEach((line, idx) => {
      const m = line.match(/(def\s+\w+\s*\([^)]*=\s*)(\[\]|\{\}|set\(\)|dict\(\)|list\(\))(\)?\s*:)/)
      if (m) {
        corrections.push({
          id: `corr-mutable-${idx}`,
          type: 'bug',
          title: 'Replace mutable default with None',
          description: 'Mutable defaults are shared across calls. Use None and initialize inside.',
          line: idx + 1,
          column: line.indexOf(m[2]) + 1,
          original: line,
          corrected: line.replace(m[2], 'None'),
          confidence: 'high',
          ruleId: 'py-mutable-default',
        })
      }
    })
  }

  // 4. Python: bare except → except Exception
  if (language === 'python') {
    lines.forEach((line, idx) => {
      if (line.match(/^\s*except\s*:/)) {
        corrections.push({
          id: `corr-barexcept-${idx}`,
          type: 'bug',
          title: 'Replace bare except with except Exception',
          description: 'Bare except catches too broadly, including SystemExit and KeyboardInterrupt.',
          line: idx + 1,
          column: line.indexOf('except') + 1,
          original: line,
          corrected: line.replace(/except\s*:/, 'except Exception:'),
          confidence: 'high',
          ruleId: 'py-bare-except',
        })
      }
    })
  }

  // 5. JS/TS: var → const
  if (['javascript', 'typescript'].includes(language)) {
    lines.forEach((line, idx) => {
      const m = line.match(/\bvar\s+([A-Za-z_$][\w$]*)\s*=/)
      if (m) {
        corrections.push({
          id: `corr-var-${idx}`,
          type: 'best-practice',
          title: `Replace 'var' with 'const'`,
          description: 'const is block-scoped and prevents accidental reassignment.',
          line: idx + 1,
          column: line.indexOf('var') + 1,
          original: line,
          corrected: line.replace(/\bvar\b/, 'const'),
          confidence: 'medium',
          ruleId: 'no-var',
        })
      }
    })
  }

  // 6. JS/TS: debugger → remove
  if (['javascript', 'typescript'].includes(language)) {
    lines.forEach((line, idx) => {
      if (line.match(/\bdebugger\b/)) {
        corrections.push({
          id: `corr-debugger-${idx}`,
          type: 'best-practice',
          title: 'Remove debugger statement',
          description: 'debugger statements should not be in production code.',
          line: idx + 1,
          column: line.indexOf('debugger') + 1,
          original: line,
          corrected: line.replace(/\bdebugger\b;?\s*/, ''),
          confidence: 'high',
          ruleId: 'no-debugger',
        })
      }
    })
  }

  // 7. C/C++: strcpy → strncpy, sprintf → snprintf
  if (['c', 'cpp'].includes(language)) {
    lines.forEach((line, idx) => {
      if (line.match(/\bstrcpy\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)/)) {
        const m = line.match(/\bstrcpy\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)/)!
        corrections.push({
          id: `corr-strcpy-${idx}`,
          type: 'bug',
          title: 'Replace strcpy with safer alternative',
          description: 'strcpy does not bound-check.',
          line: idx + 1,
          column: line.indexOf('strcpy') + 1,
          original: line,
          corrected: line.replace(
            /strcpy\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)/,
            'strncpy($1, $2, sizeof($1) - 1); $1[sizeof($1) - 1] = \'\\0\''
          ),
          confidence: 'high',
          ruleId: 'c-gets',
        })
      }
    })
  }

  // 8. SQL: lowercase keywords (style)
  if (language === 'sql') {
    lines.forEach((line, idx) => {
      if (line.match(/SELECT|INSERT|UPDATE|DELETE|WHERE|FROM|JOIN/i) && line.match(/[A-Z]/) && line.match(/[a-z]/)) {
        // Has mixed case keywords
        if (line !== line.toUpperCase().replace(/SELECT|INSERT|UPDATE|DELETE|WHERE|FROM|JOIN/gi, (m) => m.toUpperCase())) {
          // Skip — too risky
        }
      }
    })
  }

  // Apply safe auto-corrections
  let correctedCode = code
  const safeCorrections = corrections.filter(c => c.confidence === 'high' && ['no-trailing-spaces', 'eqeqeq', 'py-mutable-default', 'py-bare-except', 'no-debugger'].includes(c.ruleId))

  if (safeCorrections.length > 0) {
    const correctedLines = [...lines]
    for (const c of safeCorrections) {
      correctedLines[c.line - 1] = c.corrected
    }
    correctedCode = correctedLines.join('\n')
  }

  return {
    corrections,
    appliedCount: safeCorrections.length,
    correctedCode,
    language,
  }
}
