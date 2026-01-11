import { EditorView } from "codemirror";

/**
 * Exposes the code mirror code editor theme extension
 */
export const codeEditorTheme = EditorView.theme(
  {
    '&': {
      color: 'var(--code-editor-text)',
      backgroundColor: 'var(--code-editor-bg)',
      height: '100%',
      overflow: 'auto',
      fontFamily: 'var(--code-editor-font-family)',
      fontSize: 'var(--code-editor-font-size)',
    },

    /* Scroll area */
    '.cm-scroller': {
      overflow: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor:
        'var(--code-editor-scrollbar-thumb) var(--code-editor-scrollbar-track)',
    },
    '.cm-scroller::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '.cm-scroller::-webkit-scrollbar-track': {
      background: 'var(--code-editor-scrollbar-track)',
    },
    '.cm-scroller::-webkit-scrollbar-thumb': {
      backgroundColor: 'var(--code-editor-scrollbar-thumb)',
      borderRadius: '4px',
    },
    '.cm-scroller::-webkit-scrollbar-thumb:hover': {
      backgroundColor: 'var(--code-editor-scrollbar-thumb-hover)',
    },

    /* Text + cursor */
    '.cm-content': {
      caretColor: 'var(--code-editor-cursor)',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: 'var(--code-editor-cursor)',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'var(--code-editor-selection-bg)',
    },

    /* Lines */
    '.cm-content, .cm-line': {
      padding: '0 8px',
    },
    '.cm-activeLine': {
      backgroundColor: 'var(--code-editor-active-line-bg)',
    },

    /* Gutter */
    '.cm-gutters': {
      backgroundColor: 'var(--code-editor-gutter-bg)',
      color: 'var(--code-editor-line-number)',
      borderRight: '1px solid var(--code-editor-gutter-border)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--code-editor-active-line-bg)',
      color: 'var(--code-editor-line-number-active)',
    },
  },
  { dark: true },
);
