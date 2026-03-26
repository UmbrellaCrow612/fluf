import { Diagnostic as VSCodeDiagnostic } from "vscode-languageserver-protocol";
import { Diagnostic as CMDiagnostic } from "@codemirror/lint";
import { EditorState } from "@codemirror/state";

enum DiagnosticSeverity {
  Error = 1,
  Warning = 2,
  Information = 3,
  Hint = 4,
}

/**
 * Converts a VSCode/LSP Diagnostic to a CodeMirror Diagnostic.
 *
 * @param vsDiag   - The VSCode/LSP diagnostic to convert
 * @param state    - The CodeMirror EditorState, used to map line/character positions to offsets
 * @returns A CodeMirror Diagnostic, or null if the position is out of range
 */
export function vscodeToCodeMirrorDiagnostic(
  vsDiag: VSCodeDiagnostic,
  state: EditorState,
): CMDiagnostic | null {
  const { range, severity, message, source } = vsDiag;

  // CodeMirror lines are 1-based; VSCode lines are 0-based
  const fromLine = state.doc.line(range.start.line + 1);
  const toLine = state.doc.line(range.end.line + 1);

  const from = fromLine.from + range.start.character;
  const to = toLine.from + range.end.character;

  // Guard against positions outside the document
  if (from < 0 || to > state.doc.length || from > to) {
    return null;
  }

  return {
    from,
    to,
    message,
    source,
    severity: mapSeverity(severity),
  };
}

function mapSeverity(severity?: DiagnosticSeverity): CMDiagnostic["severity"] {
  switch (severity) {
    case DiagnosticSeverity.Error:
      return "error";
    case DiagnosticSeverity.Warning:
      return "warning";
    case DiagnosticSeverity.Information:
      return "info";
    case DiagnosticSeverity.Hint:
      return "hint";
    default:
      return "error"; // LSP spec says omitted == client decides; error is the safest default
  }
}
