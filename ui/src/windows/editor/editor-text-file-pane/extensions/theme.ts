import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';

/**
 * Custom theme using your CSS tokens
 */
export const textFilePaneThemeExtension: Extension = EditorView.theme(
  {
    '&': {
      color: 'var(--code-editor-text)',
      backgroundColor: 'var(--code-editor-bg)',
    },
    '.cm-content': {
      caretColor: 'var(--code-editor-cursor)',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: 'var(--code-editor-cursor)',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'var(--code-editor-selection-bg)',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--code-editor-gutter-bg)',
      color: 'var(--code-editor-line-number)',
      border: 'none',
    },
  },
  { dark: true },
);
