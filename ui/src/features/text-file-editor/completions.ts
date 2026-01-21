import { CompletionContext } from '@codemirror/autocomplete';

function lspPositionToOffset(
  doc: any,
  pos: { line: number; character: number },
): number {
  const line = doc.line(pos.line + 1); // LSP is 0-based, CM is 1-based
  return line.from + pos.character;
}

function mapLspKindToCmType(kind?: number): string {
  switch (kind) {
    case 2:
      return 'method';
    case 3:
      return 'function';
    case 6:
      return 'variable';
    case 7:
      return 'class';
    case 9:
      return 'module'; // Go imports
    case 10:
      return 'property';
    case 14:
      return 'keyword';
    case 21:
      return 'constant';
    default:
      return 'text';
  }
}

export function mapLspItemToCmOption(item: any, context: CompletionContext) {
  const doc = context.state.doc;

  let from = context.pos;
  let to = context.pos;

  if (item.textEdit) {
    from = lspPositionToOffset(doc, item.textEdit.range.start);
    to = lspPositionToOffset(doc, item.textEdit.range.end);
  }

  return {
    label: item.label,
    type: mapLspKindToCmType(item.kind),
    detail: item.detail,
    boost: item.preselect ? 99 : undefined,

    apply: (view: any) => {
      const changes: any[] = [];

      // main edit
      if (item.textEdit) {
        changes.push({
          from,
          to,
          insert: item.textEdit.newText,
        });
      } else {
        changes.push({
          from,
          to,
          insert: item.insertText ?? item.label,
        });
      }

      // additionalTextEdits (imports!)
      if (item.additionalTextEdits) {
        for (const edit of item.additionalTextEdits) {
          changes.push({
            from: lspPositionToOffset(doc, edit.range.start),
            to: lspPositionToOffset(doc, edit.range.end),
            insert: edit.newText,
          });
        }
      }

      view.dispatch({ changes });
    },
  };
}
