import { ViewUpdate } from "@codemirror/view";
import { TextDocumentContentChangeEvent } from "vscode-languageserver-protocol";

/**
 * Convert editor changes to LSP change set
 * @param update The view update
 * @returns List of LSP changes
 */
export function viewUpdateToLSPChanges(
  update: ViewUpdate,
): TextDocumentContentChangeEvent[] {
  const changes: TextDocumentContentChangeEvent[] = [];

  update.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
    const startLine = update.startState.doc.lineAt(fromA);
    const endLine = update.startState.doc.lineAt(toA);

    changes.push({
      range: {
        start: {
          line: startLine.number - 1,
          character: fromA - startLine.from,
        },
        end: {
          line: endLine.number - 1,
          character: toA - endLine.from,
        },
      },
      rangeLength: toA - fromA,
      text: inserted.toString(),
    });
  });

  return changes;
}
