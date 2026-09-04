import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { json } from '@codemirror/lang-json'
import { bracketMatching, defaultHighlightStyle, foldGutter, syntaxHighlighting } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, placeholder as placeholderExt } from '@codemirror/view'
import { useEffect, useRef } from 'react'

// Matches this app's CSS variables (see index.css) so the editor blends in
// with both the light and dark theme instead of shipping its own palette.
const theme = EditorView.theme({
  '&': {
    fontSize: '13px',
    color: 'var(--text-h)',
    backgroundColor: 'var(--code-bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
  },
  '.cm-content': {
    fontFamily: 'var(--mono)',
    caretColor: 'var(--text-h)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--code-bg)',
    color: 'var(--text)',
    border: 'none',
    borderRight: '1px solid var(--border)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--accent-bg)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--accent-bg)',
  },
  '&.cm-focused': {
    outline: 'none',
    borderColor: 'var(--accent)',
    boxShadow: '0 0 0 3px var(--accent-bg)',
  },
  '.cm-foldPlaceholder': {
    background: 'var(--accent-bg)',
    border: 'none',
    color: 'var(--accent)',
    padding: '0 6px',
    borderRadius: '4px',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
})

function buildExtensions(getOnChange, placeholderText) {
  return [
    lineNumbers(),
    foldGutter(),
    history(),
    bracketMatching(),
    json(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    EditorView.lineWrapping,
    theme,
    ...(placeholderText ? [placeholderExt(placeholderText)] : []),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) getOnChange()(update.state.doc.toString())
    }),
  ]
}

// A JSON text editor with VSCode-style code folding: a gutter with
// triangles that collapse/expand each `{...}`/`[...]` block in place, on
// top of the real JSON text (quotes, commas, syntax highlighting all
// stay) rather than a reformatted tree view.
export default function JsonCodeEditor({ value, onChange, height = '320px', placeholder }) {
  const containerRef = useRef(null)
  const viewRef = useRef(null)
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: buildExtensions(() => onChangeRef.current, placeholder),
      }),
      parent: containerRef.current,
    })
    viewRef.current = view
    return () => view.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- editor created once; `value` synced separately below
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
    }
  }, [value])

  return <div className="json-code-editor" style={{ height }} ref={containerRef} />
}
