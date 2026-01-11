import { EditorView } from "codemirror";
import { FlufDiagnostic } from "../diagnostic/type";
import { JSONRpcNotification } from "../../gen/type";
import { CodeMirrorSeverity } from "./type";

/**
 * Converts a JSON RPC Notification into a list of FlufDiagnostics.
 * * @param view - The CodeMirror EditorView instance
 * @param notification - The JSONRpcNotification object
 * @returns An array of FlufDiagnostic objects
 */
export const convertRpcToFlufDiagnostics = (
  view: EditorView,
  notification: JSONRpcNotification,
): FlufDiagnostic[] => {
  const params = notification.params;
  if (!params || !params.diagnostics) return [];

  return params.diagnostics.map((diag) => {
    // LSP Severity mapping:
    // 1: Error, 2: Warning, 3: Information, 4: Hint
    const severityMap: Record<number, CodeMirrorSeverity> = {
      1: 'error',
      2: 'warning',
      3: 'info',
      4: 'hint',
    };

    const { start, end } = diag.range;

    // LSP is 0-indexed. CodeMirror's .line() method is 1-indexed.
    // We get the line's start position and add the character offset.
    const from = view.state.doc.line(start.line + 1).from + start.character;
    const to = view.state.doc.line(end.line + 1).from + end.character;

    return {
      from,
      to,
      severity: severityMap[diag.severity] || 'info',
      message: diag.message,
      source: diag.source || 'lsp',
      // Fluf specific fields (preserving the 0-indexed LSP format for metadata)
      startLine: start.line,
      startColumn: start.character,
      endLine: end.line,
      endColumn: end.character,
    };
  });
};
