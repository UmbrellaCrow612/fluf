import { EditorView } from 'codemirror';
import { Diagnostic, linter, setDiagnostics } from '@codemirror/lint';

// Method 1: Using setDiagnostics (recommended for external sources)
export function applyExternalDiagnostics(
  view: EditorView,
  diagnostics: Diagnostic[],
) {
  view.dispatch(setDiagnostics(view.state, diagnostics));
}