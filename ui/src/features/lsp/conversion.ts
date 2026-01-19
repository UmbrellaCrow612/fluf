import { ViewUpdate } from '@codemirror/view';
import {
  Range,
  TextDocumentContentChangeEvent,
} from 'vscode-languageserver-protocol';

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
