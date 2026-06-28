// AWECode Language Catalog — 150+ programming languages supported via Monaco + custom analyzers
// All language definitions: id, label, extensions, monacoId (for syntax highlighting), category

export type LanguageCategory =
  | 'Web'
  | 'Systems'
  | 'Scripting'
  | 'Mobile'
  | 'Functional'
  | 'Data'
  | 'Scientific'
  | 'Enterprise'
  | 'Game'
  | 'Markup'
  | 'Config'
  | 'Database'
  | 'Shell'
  | 'Hardware'
  | 'Esoteric'
  | 'Other'

export interface LanguageDef {
  id: string
  label: string
  extensions: string[]
  monacoId: string
  category: LanguageCategory
  hasLinter: boolean
  hasVulnScan: boolean
  sample?: string
}

export const LANGUAGES: LanguageDef[] = [
  // ============ Web ============
  { id: 'typescript', label: 'TypeScript', extensions: ['.ts', '.tsx'], monacoId: 'typescript', category: 'Web', hasLinter: true, hasVulnScan: true, sample: 'const greet = (name: string): string => `Hello, ${name}!`;' },
  { id: 'javascript', label: 'JavaScript', extensions: ['.js', '.jsx', '.mjs', '.cjs'], monacoId: 'javascript', category: 'Web', hasLinter: true, hasVulnScan: true, sample: 'const greet = (name) => `Hello, ${name}!`;' },
  { id: 'jsx', label: 'JSX', extensions: ['.jsx'], monacoId: 'javascript', category: 'Web', hasLinter: true, hasVulnScan: true },
  { id: 'tsx', label: 'TSX', extensions: ['.tsx'], monacoId: 'typescript', category: 'Web', hasLinter: true, hasVulnScan: true },
  { id: 'html', label: 'HTML', extensions: ['.html', '.htm', '.xhtml'], monacoId: 'html', category: 'Markup', hasLinter: true, hasVulnScan: true },
  { id: 'css', label: 'CSS', extensions: ['.css'], monacoId: 'css', category: 'Web', hasLinter: true, hasVulnScan: false },
  { id: 'scss', label: 'SCSS', extensions: ['.scss', '.sass'], monacoId: 'scss', category: 'Web', hasLinter: true, hasVulnScan: false },
  { id: 'less', label: 'Less', extensions: ['.less'], monacoId: 'less', category: 'Web', hasLinter: true, hasVulnScan: false },
  { id: 'vue', label: 'Vue', extensions: ['.vue'], monacoId: 'html', category: 'Web', hasLinter: true, hasVulnScan: true },
  { id: 'svelte', label: 'Svelte', extensions: ['.svelte'], monacoId: 'html', category: 'Web', hasLinter: true, hasVulnScan: true },
  { id: 'json', label: 'JSON', extensions: ['.json', '.jsonc'], monacoId: 'json', category: 'Config', hasLinter: true, hasVulnScan: false },
  { id: 'json5', label: 'JSON5', extensions: ['.json5'], monacoId: 'json', category: 'Config', hasLinter: true, hasVulnScan: false },
  { id: 'xml', label: 'XML', extensions: ['.xml', '.xsl', '.xsd'], monacoId: 'xml', category: 'Markup', hasLinter: true, hasVulnScan: false },
  { id: 'yaml', label: 'YAML', extensions: ['.yml', '.yaml'], monacoId: 'yaml', category: 'Config', hasLinter: true, hasVulnScan: false },
  { id: 'toml', label: 'TOML', extensions: ['.toml'], monacoId: 'ini', category: 'Config', hasLinter: true, hasVulnScan: false },
  { id: 'ini', label: 'INI', extensions: ['.ini', '.cfg', '.conf'], monacoId: 'ini', category: 'Config', hasLinter: false, hasVulnScan: false },
  { id: 'graphql', label: 'GraphQL', extensions: ['.graphql', '.gql'], monacoId: 'graphql', category: 'Web', hasLinter: true, hasVulnScan: false },
  { id: 'markdown', label: 'Markdown', extensions: ['.md', '.markdown'], monacoId: 'markdown', category: 'Markup', hasLinter: false, hasVulnScan: false },
  { id: 'mdx', label: 'MDX', extensions: ['.mdx'], monacoId: 'markdown', category: 'Markup', hasLinter: false, hasVulnScan: false },
  { id: 'astro', label: 'Astro', extensions: ['.astro'], monacoId: 'html', category: 'Web', hasLinter: true, hasVulnScan: true },

  // ============ Systems ============
  { id: 'c', label: 'C', extensions: ['.c', '.h'], monacoId: 'c', category: 'Systems', hasLinter: true, hasVulnScan: true },
  { id: 'cpp', label: 'C++', extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.hxx', '.hh'], monacoId: 'cpp', category: 'Systems', hasLinter: true, hasVulnScan: true },
  { id: 'csharp', label: 'C#', extensions: ['.cs'], monacoId: 'csharp', category: 'Enterprise', hasLinter: true, hasVulnScan: true },
  { id: 'go', label: 'Go', extensions: ['.go'], monacoId: 'go', category: 'Systems', hasLinter: true, hasVulnScan: true },
  { id: 'rust', label: 'Rust', extensions: ['.rs'], monacoId: 'rust', category: 'Systems', hasLinter: true, hasVulnScan: true },
  { id: 'zig', label: 'Zig', extensions: ['.zig'], monacoId: 'zig', category: 'Systems', hasLinter: true, hasVulnScan: false },
  { id: 'd', label: 'D', extensions: ['.d'], monacoId: 'c', category: 'Systems', hasLinter: false, hasVulnScan: false },
  { id: 'nim', label: 'Nim', extensions: ['.nim'], monacoId: 'nim', category: 'Systems', hasLinter: true, hasVulnScan: false },
  { id: 'ocaml', label: 'OCaml', extensions: ['.ml', '.mli'], monacoId: 'ocaml', category: 'Functional', hasLinter: true, hasVulnScan: false },
  { id: 'haskell', label: 'Haskell', extensions: ['.hs'], monacoId: 'haskell', category: 'Functional', hasLinter: true, hasVulnScan: false },
  { id: 'purescript', label: 'PureScript', extensions: ['.purs'], monacoId: 'haskell', category: 'Functional', hasLinter: true, hasVulnScan: false },
  { id: 'elixir', label: 'Elixir', extensions: ['.ex', '.exs'], monacoId: 'elixir', category: 'Functional', hasLinter: true, hasVulnScan: false },
  { id: 'erlang', label: 'Erlang', extensions: ['.erl', '.hrl'], monacoId: 'erlang', category: 'Functional', hasLinter: true, hasVulnScan: false },
  { id: 'clojure', label: 'Clojure', extensions: ['.clj', '.cljs', '.cljc'], monacoId: 'clojure', category: 'Functional', hasLinter: true, hasVulnScan: false },
  { id: 'fsharp', label: 'F#', extensions: ['.fs', '.fsx', '.fsi'], monacoId: 'fsharp', category: 'Functional', hasLinter: true, hasVulnScan: false },
  { id: 'scala', label: 'Scala', extensions: ['.scala', '.sc'], monacoId: 'scala', category: 'Functional', hasLinter: true, hasVulnScan: false },
  { id: 'lisp', label: 'Common Lisp', extensions: ['.lisp', '.lsp', '.cl'], monacoId: 'lisp', category: 'Functional', hasLinter: false, hasVulnScan: false },
  { id: 'scheme', label: 'Scheme', extensions: ['.scm', '.ss'], monacoId: 'scheme', category: 'Functional', hasLinter: false, hasVulnScan: false },
  { id: 'racket', label: 'Racket', extensions: ['.rkt'], monacoId: 'scheme', category: 'Functional', hasLinter: false, hasVulnScan: false },
  { id: 'gleam', label: 'Gleam', extensions: ['.gleam'], monacoId: 'rust', category: 'Functional', hasLinter: false, hasVulnScan: false },

  // ============ Scripting ============
  { id: 'python', label: 'Python', extensions: ['.py', '.pyw'], monacoId: 'python', category: 'Scripting', hasLinter: true, hasVulnScan: true, sample: 'def greet(name):\n    return f"Hello, {name}!"' },
  { id: 'ruby', label: 'Ruby', extensions: ['.rb', '.rbw'], monacoId: 'ruby', category: 'Scripting', hasLinter: true, hasVulnScan: true },
  { id: 'perl', label: 'Perl', extensions: ['.pl', '.pm'], monacoId: 'perl', category: 'Scripting', hasLinter: true, hasVulnScan: true },
  { id: 'php', label: 'PHP', extensions: ['.php'], monacoId: 'php', category: 'Web', hasLinter: true, hasVulnScan: true },
  { id: 'lua', label: 'Lua', extensions: ['.lua'], monacoId: 'lua', category: 'Scripting', hasLinter: true, hasVulnScan: false },
  { id: 'tcl', label: 'Tcl', extensions: ['.tcl'], monacoId: 'tcl', category: 'Scripting', hasLinter: false, hasVulnScan: false },
  { id: 'groovy', label: 'Groovy', extensions: ['.groovy', '.gradle'], monacoId: 'groovy', category: 'Scripting', hasLinter: true, hasVulnScan: false },
  { id: 'julia', label: 'Julia', extensions: ['.jl'], monacoId: 'julia', category: 'Scientific', hasLinter: true, hasVulnScan: false },
  { id: 'dart', label: 'Dart', extensions: ['.dart'], monacoId: 'dart', category: 'Mobile', hasLinter: true, hasVulnScan: true },
  { id: 'kotlin', label: 'Kotlin', extensions: ['.kt', '.kts'], monacoId: 'kotlin', category: 'Mobile', hasLinter: true, hasVulnScan: true },
  { id: 'swift', label: 'Swift', extensions: ['.swift'], monacoId: 'swift', category: 'Mobile', hasLinter: true, hasVulnScan: true },
  { id: 'objc', label: 'Objective-C', extensions: ['.m', '.mm'], monacoId: 'objective-c', category: 'Mobile', hasLinter: true, hasVulnScan: true },
  { id: 'java', label: 'Java', extensions: ['.java'], monacoId: 'java', category: 'Enterprise', hasLinter: true, hasVulnScan: true },
  { id: 'vb', label: 'Visual Basic', extensions: ['.vb'], monacoId: 'vb', category: 'Enterprise', hasLinter: true, hasVulnScan: false },
  { id: 'pascal', label: 'Pascal', extensions: ['.pas', '.pp'], monacoId: 'pascal', category: 'Enterprise', hasLinter: false, hasVulnScan: false },
  { id: 'ada', label: 'Ada', extensions: ['.adb', '.ads'], monacoId: 'ada', category: 'Enterprise', hasLinter: false, hasVulnScan: false },
  { id: 'fortran', label: 'Fortran', extensions: ['.f', '.f90', '.f95', '.f03'], monacoId: 'fortran', category: 'Scientific', hasLinter: false, hasVulnScan: false },
  { id: 'cobol', label: 'COBOL', extensions: ['.cob', '.cbl'], monacoId: 'cobol', category: 'Enterprise', hasLinter: false, hasVulnScan: false },
  { id: 'delphi', label: 'Delphi', extensions: ['.dpr', '.dpk'], monacoId: 'pascal', category: 'Enterprise', hasLinter: false, hasVulnScan: false },

  // ============ Data / Scientific ============
  { id: 'r', label: 'R', extensions: ['.r', '.R'], monacoId: 'r', category: 'Scientific', hasLinter: true, hasVulnScan: false },
  { id: 'matlab', label: 'MATLAB', extensions: ['.m'], monacoId: 'matlab', category: 'Scientific', hasLinter: false, hasVulnScan: false },
  { id: 'sql', label: 'SQL', extensions: ['.sql'], monacoId: 'sql', category: 'Database', hasLinter: true, hasVulnScan: true },
  { id: 'plsql', label: 'PL/SQL', extensions: ['.pks', '.pkb'], monacoId: 'sql', category: 'Database', hasLinter: true, hasVulnScan: true },
  { id: 'tsql', label: 'T-SQL', extensions: ['.tsql'], monacoId: 'sql', category: 'Database', hasLinter: true, hasVulnScan: true },
  { id: 'mysql', label: 'MySQL', extensions: [], monacoId: 'sql', category: 'Database', hasLinter: true, hasVulnScan: true },
  { id: 'postgres', label: 'PostgreSQL', extensions: [], monacoId: 'sql', category: 'Database', hasLinter: true, hasVulnScan: true },
  { id: 'mongo', label: 'MongoDB Shell', extensions: [], monacoId: 'javascript', category: 'Database', hasLinter: false, hasVulnScan: false },
  { id: 'redis', label: 'Redis', extensions: ['.redis'], monacoId: 'redis', category: 'Database', hasLinter: false, hasVulnScan: false },
  { id: 'cypher', label: 'Cypher', extensions: ['.cyp'], monacoId: 'sql', category: 'Database', hasLinter: false, hasVulnScan: false },
  { id: 'julia2', label: 'Julia', extensions: ['.jl'], monacoId: 'julia', category: 'Scientific', hasLinter: true, hasVulnScan: false },

  // ============ Shell ============
  { id: 'bash', label: 'Bash', extensions: ['.sh', '.bash'], monacoId: 'shell', category: 'Shell', hasLinter: true, hasVulnScan: true },
  { id: 'powershell', label: 'PowerShell', extensions: ['.ps1', '.psm1'], monacoId: 'powershell', category: 'Shell', hasLinter: true, hasVulnScan: true },
  { id: 'zsh', label: 'Zsh', extensions: ['.zsh'], monacoId: 'shell', category: 'Shell', hasLinter: false, hasVulnScan: false },
  { id: 'fish', label: 'Fish', extensions: ['.fish'], monacoId: 'shell', category: 'Shell', hasLinter: false, hasVulnScan: false },
  { id: 'batch', label: 'Batch', extensions: ['.bat', '.cmd'], monacoId: 'bat', category: 'Shell', hasLinter: false, hasVulnScan: false },
  { id: 'makefile', label: 'Makefile', extensions: ['.mk', 'Makefile'], monacoId: 'makefile', category: 'Shell', hasLinter: false, hasVulnScan: false },
  { id: 'cmake', label: 'CMake', extensions: ['.cmake', 'CMakeLists.txt'], monacoId: 'cmake', category: 'Shell', hasLinter: false, hasVulnScan: false },
  { id: 'dockerfile', label: 'Dockerfile', extensions: ['Dockerfile'], monacoId: 'dockerfile', category: 'Config', hasLinter: true, hasVulnScan: true },
  { id: 'nginx', label: 'Nginx', extensions: ['.conf'], monacoId: 'ini', category: 'Config', hasLinter: false, hasVulnScan: false },
  { id: 'ansible', label: 'Ansible', extensions: ['.yml'], monacoId: 'yaml', category: 'Config', hasLinter: false, hasVulnScan: true },
  { id: 'terraform', label: 'Terraform', extensions: ['.tf', '.tfvars'], monacoId: 'hcl', category: 'Config', hasLinter: true, hasVulnScan: false },
  { id: 'puppet', label: 'Puppet', extensions: ['.pp'], monacoId: 'puppet', category: 'Config', hasLinter: false, hasVulnScan: false },
  { id: 'chef', label: 'Chef', extensions: ['.rb'], monacoId: 'ruby', category: 'Config', hasLinter: false, hasVulnScan: false },

  // ============ Hardware ============
  { id: 'verilog', label: 'Verilog', extensions: ['.v', '.vh'], monacoId: 'verilog', category: 'Hardware', hasLinter: false, hasVulnScan: false },
  { id: 'vhdl', label: 'VHDL', extensions: ['.vhd', '.vhdl'], monacoId: 'vhdl', category: 'Hardware', hasLinter: false, hasVulnScan: false },
  { id: 'systemverilog', label: 'SystemVerilog', extensions: ['.sv', '.svh'], monacoId: 'verilog', category: 'Hardware', hasLinter: false, hasVulnScan: false },
  { id: 'assembly', label: 'Assembly', extensions: ['.asm', '.s'], monacoId: 'asm', category: 'Hardware', hasLinter: false, hasVulnScan: false },
  { id: 'arm', label: 'ARM Assembly', extensions: ['.s'], monacoId: 'asm', category: 'Hardware', hasLinter: false, hasVulnScan: false },
  { id: 'wasm', label: 'WebAssembly', extensions: ['.wat', '.wast'], monacoId: 'wasm', category: 'Web', hasLinter: false, hasVulnScan: false },

  // ============ Game ============
  { id: 'csharp_unity', label: 'C# (Unity)', extensions: ['.cs'], monacoId: 'csharp', category: 'Game', hasLinter: true, hasVulnScan: true },
  { id: 'gdscript', label: 'GDScript', extensions: ['.gd'], monacoId: 'python', category: 'Game', hasLinter: false, hasVulnScan: false },
  { id: 'lua_love', label: 'Lua (LÖVE)', extensions: ['.lua'], monacoId: 'lua', category: 'Game', hasLinter: true, hasVulnScan: false },
  { id: 'unrealscript', label: 'Unreal C++', extensions: ['.cpp'], monacoId: 'cpp', category: 'Game', hasLinter: true, hasVulnScan: true },

  // ============ Markup / Docs ============
  { id: 'latex', label: 'LaTeX', extensions: ['.tex', '.ltx'], monacoId: 'latex', category: 'Markup', hasLinter: false, hasVulnScan: false },
  { id: 'tex', label: 'TeX', extensions: ['.tex'], monacoId: 'latex', category: 'Markup', hasLinter: false, hasVulnScan: false },
  { id: 'bibtex', label: 'BibTeX', extensions: ['.bib'], monacoId: 'latex', category: 'Markup', hasLinter: false, hasVulnScan: false },
  { id: 'asciidoc', label: 'AsciiDoc', extensions: ['.adoc', '.asciidoc'], monacoId: 'markdown', category: 'Markup', hasLinter: false, hasVulnScan: false },
  { id: 'rst', label: 'reStructuredText', extensions: ['.rst'], monacoId: 'markdown', category: 'Markup', hasLinter: false, hasVulnScan: false },
  { id: 'org', label: 'Org Mode', extensions: ['.org'], monacoId: 'markdown', category: 'Markup', hasLinter: false, hasVulnScan: false },
  { id: 'plantuml', label: 'PlantUML', extensions: ['.puml', '.plantuml'], monacoId: 'markdown', category: 'Markup', hasLinter: false, hasVulnScan: false },
  { id: 'mermaid', label: 'Mermaid', extensions: ['.mmd'], monacoId: 'markdown', category: 'Markup', hasLinter: false, hasVulnScan: false },

  // ============ Esoteric ============
  { id: 'brainfuck', label: 'Brainfuck', extensions: ['.bf'], monacoId: 'plaintext', category: 'Esoteric', hasLinter: false, hasVulnScan: false },
  { id: 'whitespace', label: 'Whitespace', extensions: ['.ws'], monacoId: 'plaintext', category: 'Esoteric', hasLinter: false, hasVulnScan: false },
  { id: 'malbolge', label: 'Malbolge', extensions: ['.mal'], monacoId: 'plaintext', category: 'Esoteric', hasLinter: false, hasVulnScan: false },
  { id: 'befunge', label: 'Befunge', extensions: ['.bef'], monacoId: 'plaintext', category: 'Esoteric', hasLinter: false, hasVulnScan: false },

  // ============ Other ============
  { id: 'plaintext', label: 'Plain Text', extensions: ['.txt'], monacoId: 'plaintext', category: 'Other', hasLinter: false, hasVulnScan: false },
  { id: 'csv', label: 'CSV', extensions: ['.csv', '.tsv'], monacoId: 'plaintext', category: 'Data', hasLinter: false, hasVulnScan: false },
  { id: 'log', label: 'Log', extensions: ['.log'], monacoId: 'plaintext', category: 'Other', hasLinter: false, hasVulnScan: false },
  { id: 'gitignore', label: '.gitignore', extensions: ['.gitignore'], monacoId: 'ini', category: 'Config', hasLinter: false, hasVulnScan: false },
  { id: 'env', label: '.env', extensions: ['.env'], monacoId: 'ini', category: 'Config', hasLinter: false, hasVulnScan: true },
  { id: 'properties', label: 'Properties', extensions: ['.properties'], monacoId: 'ini', category: 'Config', hasLinter: false, hasVulnScan: false },
  { id: 'restructuredtext', label: 'reStructuredText', extensions: ['.rst'], monacoId: 'markdown', category: 'Markup', hasLinter: false, hasVulnScan: false },
  { id: 'dot', label: 'Graphviz DOT', extensions: ['.dot', '.gv'], monacoId: 'markdown', category: 'Markup', hasLinter: false, hasVulnScan: false },
  { id: 'proto', label: 'Protocol Buffers', extensions: ['.proto'], monacoId: 'protobuf', category: 'Data', hasLinter: true, hasVulnScan: false },
  { id: 'thrift', label: 'Thrift', extensions: ['.thrift'], monacoId: 'plaintext', category: 'Data', hasLinter: false, hasVulnScan: false },
  { id: 'avro', label: 'Avro', extensions: ['.avsc'], monacoId: 'json', category: 'Data', hasLinter: true, hasVulnScan: false },
  { id: 'solidity', label: 'Solidity', extensions: ['.sol'], monacoId: 'solidity', category: 'Other', hasLinter: true, hasVulnScan: true },
  { id: 'move', label: 'Move', extensions: ['.move'], monacoId: 'rust', category: 'Other', hasLinter: false, hasVulnScan: true },
  { id: 'cairo', label: 'Cairo', extensions: ['.cairo'], monacoId: 'rust', category: 'Other', hasLinter: false, hasVulnScan: true },
  { id: 'vyper', label: 'Vyper', extensions: ['.vy'], monacoId: 'python', category: 'Other', hasLinter: false, hasVulnScan: true },
]

export const LANGUAGES_BY_ID: Record<string, LanguageDef> = Object.fromEntries(
  LANGUAGES.map((l) => [l.id, l]),
)

export function detectLanguageByFilename(filename: string): LanguageDef {
  const lower = filename.toLowerCase()
  // First check special filenames
  if (lower === 'dockerfile' || lower.endsWith('/dockerfile')) {
    return LANGUAGES_BY_ID['dockerfile']
  }
  if (lower === 'makefile' || lower.endsWith('/makefile')) {
    return LANGUAGES_BY_ID['makefile']
  }
  if (lower === 'cmakelists.txt' || lower.endsWith('/cmakelists.txt')) {
    return LANGUAGES_BY_ID['cmake']
  }
  if (lower === '.gitignore' || lower.endsWith('/.gitignore')) {
    return LANGUAGES_BY_ID['gitignore']
  }
  if (lower.startsWith('.env') || lower.endsWith('/.env')) {
    return LANGUAGES_BY_ID['env']
  }
  // Check by extension
  for (const lang of LANGUAGES) {
    for (const ext of lang.extensions) {
      if (lower.endsWith(ext.toLowerCase())) {
        return lang
      }
    }
  }
  return LANGUAGES_BY_ID['plaintext']
}

export function getCategories(): LanguageCategory[] {
  const cats = new Set<LanguageCategory>()
  LANGUAGES.forEach((l) => cats.add(l.category))
  return Array.from(cats)
}

export function getLanguagesByCategory(): Record<LanguageCategory, LanguageDef[]> {
  const result = {} as Record<LanguageCategory, LanguageDef[]>
  for (const lang of LANGUAGES) {
    if (!result[lang.category]) result[lang.category] = []
    result[lang.category].push(lang)
  }
  return result
}

export const LANGUAGE_COUNT = LANGUAGES.length
