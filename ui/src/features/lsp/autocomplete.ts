import { EditorView } from "@codemirror/view";
import { Completion } from "@codemirror/autocomplete";

/**
 * Convert LSP completion response to CodeMirror completions
 * @param view The editor view
 * @param lspResponse The LSP response message
 */
export function lspCompletionToCodeMirrorCompletions(
  view: EditorView,
  lspResponse: any
): Completion[] {
  if (!lspResponse?.result?.items) {
    return [];
  }

  const items = lspResponse.result.items;

  return items.map((item: any) => {
    const completion: Completion = {
      label: item.label,
      type: mapLspKindToCodeMirror(item.kind),
      detail: item.detail,
      info: item.documentation?.value || item.documentation,
      apply: item.textEdit?.newText || item.label,
    };

    // If there's a text edit with a range, we need to calculate the
    // from/to positions in the document
    if (item.textEdit?.range) {
      const range = item.textEdit.range;
      const doc = view.state.doc;
      
      const from = doc.line(range.start.line + 1).from + range.start.character;
      const to = doc.line(range.end.line + 1).from + range.end.character;
      
      completion.apply = item.textEdit.newText;
      // Store the range for potential use
      (completion as any).from = from;
      (completion as any).to = to;
    }

    // Add boost based on sortText or preselect
    if (item.preselect) {
      completion.boost = 99;
    } else if (item.sortText) {
      // Lower sortText should have higher boost
      const sortValue = parseInt(item.sortText);
      if (!isNaN(sortValue)) {
        completion.boost = 100 - sortValue;
      }
    }

    return completion;
  });
}

/**
 * Map LSP CompletionItemKind to CodeMirror completion types
 */
function mapLspKindToCodeMirror(kind: number): string {
  const kindMap: { [key: number]: string } = {
    1: "text",
    2: "method",
    3: "function",
    4: "constructor",
    5: "field",
    6: "variable",
    7: "class",
    8: "interface",
    9: "module",
    10: "property",
    11: "unit",
    12: "value",
    13: "enum",
    14: "keyword",
    15: "snippet",
    16: "color",
    17: "file",
    18: "reference",
    19: "folder",
    20: "enum-member",
    21: "constant",
    22: "struct",
    23: "event",
    24: "operator",
    25: "type-parameter",
  };

  return kindMap[kind] || "text";
}