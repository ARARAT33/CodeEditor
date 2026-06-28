'use client'

import { useEffect, useRef } from 'react'
import Editor, { Monaco } from '@monaco-editor/react'

export interface CodeEditorProps {
  value: string
  language: string // our language id
  monacoLanguage: string // monaco language id
  theme?: 'vs-dark' | 'light' | 'awe-dark' | 'awe-light'
  onChange?: (value: string) => void
  onMount?: (editor: any, monaco: Monaco) => void
  fontSize?: number
  readOnly?: boolean
  path?: string
}

export function CodeEditor({
  value,
  monacoLanguage,
  theme = 'awe-dark',
  onChange,
  onMount,
  fontSize = 14,
  readOnly = false,
  path,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Monaco | null>(null)

  const handleMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Register custom themes
    monaco.editor.defineTheme('awe-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c084fc' },
        { token: 'string', foreground: '86efac' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'regexp', foreground: 'f97316' },
        { token: 'type', foreground: '60a5fa' },
        { token: 'class', foreground: 'fde047' },
        { token: 'function', foreground: '7dd3fc' },
        { token: 'variable', foreground: 'e5e7eb' },
        { token: 'constant', foreground: 'fb923c' },
        { token: 'operator', foreground: 'f472b6' },
        { token: 'delimiter', foreground: '9ca3af' },
      ],
      colors: {
        'editor.background': '#0a0a0a',
        'editor.foreground': '#e5e7eb',
        'editorLineNumber.foreground': '#404040',
        'editorLineNumber.activeForeground': '#a78bfa',
        'editor.lineHighlightBackground': '#1a1a1a',
        'editor.selectionBackground': '#5b21b655',
        'editor.inactiveSelectionBackground': '#5b21b633',
        'editorCursor.foreground': '#a78bfa',
        'editorGutter.background': '#0a0a0a',
        'editorGutter.modifiedBackground': '#fbbf24',
        'editorGutter.addedBackground': '#86efac',
        'editorGutter.deletedBackground': '#fca5a5',
        'editorWhitespace.foreground': '#262626',
        'editorIndentGuide.background': '#1f1f1f',
        'editorIndentGuide.activeBackground': '#404040',
        'editorWidget.background': '#0f0f0f',
        'editorWidget.border': '#262626',
        'editorSuggestWidget.background': '#0f0f0f',
        'editorSuggestWidget.selectedBackground': '#5b21b644',
        'editorSuggestWidget.highlightForeground': '#a78bfa',
        'editorHoverWidget.background': '#0f0f0f',
        'editorHoverWidget.border': '#262626',
        'scrollbarSlider.background': '#26262680',
        'scrollbarSlider.hoverBackground': '#404040aa',
        'scrollbarSlider.activeBackground': '#525252aa',
        'minimap.background': '#0a0a0a',
      },
    })

    monaco.editor.defineTheme('awe-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: '7c3aed' },
        { token: 'string', foreground: '059669' },
        { token: 'number', foreground: 'd97706' },
        { token: 'function', foreground: '0284c7' },
        { token: 'type', foreground: '2563eb' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#18181b',
        'editorLineNumber.foreground': '#d4d4d8',
        'editorLineNumber.activeForeground': '#7c3aed',
        'editor.lineHighlightBackground': '#faf5ff',
        'editor.selectionBackground': '#ede9fe',
        'editorCursor.foreground': '#7c3aed',
      },
    })

    monaco.editor.setTheme(theme)

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.Ctrl | monaco.KeyCode.KeyS, () => {
      // Prevent default browser save
    })

    onMount?.(editor, monaco)
  }

  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(theme)
    }
  }, [theme])

  return (
    <Editor
      value={value}
      path={path}
      language={monacoLanguage}
      onChange={(v) => onChange?.(v || '')}
      onMount={handleMount}
      theme={theme}
      loading={<div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading editor…</div>}
      options={{
        fontSize,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontLigatures: true,
        minimap: { enabled: true, maxColumn: 80, renderCharacters: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        cursorStyle: 'line-thin',
        renderLineHighlight: 'all',
        renderWhitespace: 'selection',
        renderControlCharacters: false,
        roundedSelection: true,
        tabSize: 2,
        insertSpaces: true,
        detectIndentation: true,
        wordWrap: 'on',
        wordWrapColumn: 100,
        wrappingIndent: 'indent',
        autoIndent: 'advanced',
        formatOnPaste: true,
        formatOnType: true,
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        quickSuggestions: { other: true, comments: false, strings: true },
        parameterHints: { enabled: true },
        hover: { enabled: true, delay: 200 },
        links: true,
        colorDecorators: true,
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: 'active', indentation: true },
        stickyScroll: { enabled: true },
        inlineSuggest: { enabled: true },
        readOnly,
        automaticLayout: true,
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
          verticalScrollbarSize: 12,
          horizontalScrollbarSize: 12,
          useShadows: false,
        },
        padding: { top: 16, bottom: 16 },
        lineNumbersMinChars: 4,
        glyphMargin: true,
        folding: true,
        showFoldingControls: 'mouseover',
        unfoldOnClickAfterEndOfLine: true,
        contextmenu: true,
        mouseWheelZoom: true,
        multiCursorModifier: 'ctrlCmd',
        selectionClipboard: true,
        codeLens: true,
        lightbulb: { enabled: true },
        tabCompletion: 'on',
        suggest: {
          showWords: true,
          showSnippets: true,
          showClasses: true,
          showFunctions: true,
          showVariables: true,
          showModules: true,
          showProperties: true,
          showEvents: true,
          showOperators: true,
          showUnits: true,
          showValues: true,
          showConstants: true,
          showEnums: true,
          showEnumMembers: true,
          showKeywords: true,
          showColors: true,
          showFiles: true,
          showReferences: true,
          showFolders: true,
          showTypeParameters: true,
          showIssues: true,
          showUsers: true,
          insertMode: 'insert',
          filterGraceful: true,
          snippetsPreventQuickSuggestions: false,
          localityBonus: true,
          shareSuggestSelections: true,
          showStatusBar: true,
          preview: true,
          previewMode: 'subwordSmart',
        },
      }}
    />
  )
}
