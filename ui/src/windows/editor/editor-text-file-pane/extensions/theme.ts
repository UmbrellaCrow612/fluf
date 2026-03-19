import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';

/**
 * Custom theme using your CSS tokens
 */
export const textFilePaneThemeExtension: Extension = EditorView.theme(
  {
    // Main editor container
    '&': {
      backgroundColor: 'var(--code-editor-bg)',
      color: 'var(--code-editor-text)',
      fontFamily: 'var(--code-editor-font-family)',
      fontSize: 'var(--code-editor-font-size)',
      lineHeight: 'var(--code-editor-line-height)',
    },

    // Content area
    '.cm-content': {
      caretColor: 'var(--code-editor-cursor)',
      backgroundColor: 'var(--code-editor-bg)',
    },

    // Cursor/caret
    '&.cm-focused .cm-cursor': {
      borderLeftColor: 'var(--code-editor-cursor)',
    },

    // Selection
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: 'var(--code-editor-selection-bg)',
    },
    '.cm-selectionBackground': {
      backgroundColor: 'var(--code-editor-selection-bg)',
    },

    // Active line
    '.cm-activeLine': {
      backgroundColor: 'var(--code-editor-active-line-bg)',
    },

    // Gutter (line numbers)
    '.cm-gutters': {
      backgroundColor: 'var(--code-editor-gutter-bg)',
      color: 'var(--code-editor-line-number)',
      borderRight: '1px solid var(--code-editor-gutter-border)',
    },

    // Active line number
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--code-editor-active-line-bg)',
      color: 'var(--code-editor-line-number-active)',
    },

    // Scrollbar styling
    '.cm-scroller': {
      '&::-webkit-scrollbar': {
        width: '10px',
        height: '10px',
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: 'var(--code-editor-scrollbar-track)',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'var(--code-editor-scrollbar-thumb)',
        borderRadius: '5px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        backgroundColor: 'var(--code-editor-scrollbar-thumb-hover)',
      },
    },

    // Panels (search, etc.)
    '.cm-panels': {
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      borderTop: '1px solid var(--border-default)',
    },
    '.cm-panels.cm-panels-top': {
      borderBottom: '1px solid var(--border-default)',
      borderTop: 'none',
    },
    '.cm-search input': {
      backgroundColor: 'var(--bg-tertiary)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-default)',
      '&:focus': {
        borderColor: 'var(--border-focus)',
        outline: 'none',
      },
    },
    '.cm-search button': {
      backgroundColor: 'var(--bg-hover)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-default)',
      '&:hover': {
        backgroundColor: 'var(--bg-active)',
      },
    },

    // Tooltips/autocomplete
    '.cm-tooltip': {
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-default)',
      boxShadow: 'var(--shadow-md)',
    },
    '.cm-tooltip.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: 'var(--bg-selected)',
        color: 'var(--text-inverse)',
      },
    },

    // Matching brackets
    '.cm-matchingBracket': {
      backgroundColor: 'var(--bg-hover)',
      outline: '1px solid var(--border-focus)',
    },
    '.cm-nonmatchingBracket': {
      backgroundColor: 'var(--bg-error)',
      color: 'var(--text-error)',
    },

    // Placeholder
    '.cm-placeholder': {
      color: 'var(--text-tertiary)',
    },
  },
  { dark: true }
);