import { EditorView, ViewUpdate } from '@codemirror/view';
import {
  DiagnosticSeverity,
  Position,
  PublishDiagnosticsParams,
  Range,
  TextDocumentContentChangeEvent,
} from 'vscode-languageserver-protocol';
import { Diagnostic } from '@codemirror/lint';
import { Text as codeMirrorText } from '@codemirror/state';

/**
 * Converts CodeMirror view updates to LSP TextDocumentContentChangeEvent array.
 * Iterates through all changes in the update and converts them to LSP-compatible format.
 */
export function codeMirrorEditToJsonRpcEdits(
  update: ViewUpdate,
): TextDocumentContentChangeEvent[] {
  if (!update.docChanged) {
    return [];
  }

  const changes: TextDocumentContentChangeEvent[] = [];
  const doc = update.startState.doc;

  update.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
    // Convert absolute positions to line/character positions
    const startLine = doc.lineAt(fromA);
    const endLine = doc.lineAt(toA);

    const range: Range = {
      start: {
        line: startLine.number - 1, // LSP is 0-indexed
        character: fromA - startLine.from,
      },
      end: {
        line: endLine.number - 1,
        character: toA - endLine.from,
      },
    };

    changes.push({
      range,
      rangeLength: toA - fromA,
      text: inserted.toString(),
    });
  }, true);

  return changes;
}

/**
 * Converts LSP Position (line/character) to CodeMirror absolute position.
 */
function lspPositionToOffset(doc: codeMirrorText, position: Position): number {
  const line = doc.line(position.line + 1); // CodeMirror lines are 1-indexed
  return line.from + position.character;
}

/**
 * Converts LSP DiagnosticSeverity to CodeMirror severity string.
 */
function lspSeverityToCodeMirror(
  severity?: DiagnosticSeverity,
): 'error' | 'warning' | 'info' {
  switch (severity) {
    case DiagnosticSeverity.Error:
      return 'error';
    case DiagnosticSeverity.Warning:
      return 'warning';
    case DiagnosticSeverity.Information:
    case DiagnosticSeverity.Hint:
    default:
      return 'info';
  }
}

/**
 * Converts LSP PublishDiagnosticsParams to CodeMirror diagnostics array.
 *
 * @param params - The LSP diagnostic parameters
 * @param view - The CodeMirror EditorView instance
 * @returns Array of CodeMirror diagnostics
 */
export function lspDiagnosticsToCodeMirror(
  params: PublishDiagnosticsParams,
  view: EditorView,
): Diagnostic[] {
  const doc = view.state.doc;
  const cmDiagnostics: Diagnostic[] = [];

  for (const diagnostic of params.diagnostics) {
    try {
      const from = lspPositionToOffset(doc, diagnostic.range.start);
      const to = lspPositionToOffset(doc, diagnostic.range.end);

      // Build the diagnostic message with source if available
      let message = diagnostic.message;
      if (diagnostic.source) {
        message = `[${diagnostic.source}] ${message}`;
      }
      if (diagnostic.code) {
        message = `${message} (${diagnostic.code})`;
      }

      const cmDiagnostic: Diagnostic = {
        from,
        to,
        severity: lspSeverityToCodeMirror(diagnostic.severity),
        message,
      };

      // Add actions if codeDescription is available
      if (diagnostic.codeDescription?.href) {
       
      }

      cmDiagnostics.push(cmDiagnostic);
    } catch (error) {
      console.error('Failed to convert LSP diagnostic:', diagnostic, error);
      // Skip diagnostics that can't be converted (e.g., invalid positions)
    }
  }

  return cmDiagnostics;
}
