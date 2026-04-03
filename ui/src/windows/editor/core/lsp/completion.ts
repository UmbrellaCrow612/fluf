import { CompletionResult, Completion } from "@codemirror/autocomplete";
import {
  CompletionList,
  CompletionItem,
  InsertTextFormat,
  TextEdit,
} from "vscode-languageserver-types";
import { EditorView } from "@codemirror/view";
import { TransactionSpec } from "@codemirror/state";

function mapLSPKind(kind?: number): string {
  const map: Record<number, string> = {
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
    20: "enum",
    21: "constant",
    22: "class",
    23: "namespace",
    24: "text",
    25: "type",
  };
  return map[kind ?? 1] ?? "text";
}

function resolveInsertText(item: CompletionItem, list: CompletionList): string {
  if (item.textEdit) return item.textEdit.newText;
  return item.insertText ?? item.label;
}

function resolveCommitCharacters(
  item: CompletionItem,
  list: CompletionList,
): string[] | undefined {
  if (item.commitCharacters) return item.commitCharacters;
  if (list.itemDefaults?.commitCharacters)
    return list.itemDefaults.commitCharacters;
  return undefined;
}

function resolveDocumentation(item: CompletionItem): string | undefined {
  if (!item.documentation) return undefined;
  if (typeof item.documentation === "string") return item.documentation;
  return item.documentation.value;
}

function stripSnippetSyntax(snippet: string): string {
  return snippet
    .replace(/\$\{(\d+):([^}]*)\}/g, "$2")
    .replace(/\$\{(\d+)\|[^|]*\|[^}]*\}/g, "")
    .replace(/\$\{\d+\}/g, "")
    .replace(/\$\d+/g, "");
}

/**
 * Converts an LSP Position to a CodeMirror document offset.
 */
function lspPositionToOffset(
  doc: import("@codemirror/state").Text,
  line: number,
  character: number,
): number {
  // LSP lines are 0-based; CodeMirror lines are 1-based
  const cmLine = doc.line(line + 1);
  return cmLine.from + character;
}

/**
 * Converts an LSP TextEdit to a CodeMirror change spec.
 */
function lspTextEditToChangeSpec(
  doc: import("@codemirror/state").Text,
  edit: TextEdit,
): { from: number; to: number; insert: string } {
  return {
    from: lspPositionToOffset(
      doc,
      edit.range.start.line,
      edit.range.start.character,
    ),
    to: lspPositionToOffset(doc, edit.range.end.line, edit.range.end.character),
    insert: edit.newText,
  };
}

function mapLSPCompletionItem(
  item: CompletionItem,
  list: CompletionList,
): Completion {
  const insertText = resolveInsertText(item, list);
  const commitCharacters = resolveCommitCharacters(item, list);
  const isSnippet =
    (item.insertTextFormat ?? list.itemDefaults?.insertTextFormat) ===
    InsertTextFormat.Snippet;

  const resolvedText = isSnippet ? stripSnippetSyntax(insertText) : insertText;
  const hasAdditionalEdits = !!item.additionalTextEdits?.length;

  // If there are additionalTextEdits we must use a function so we can
  // dispatch them as a second transaction after the main completion.
  const apply: Completion["apply"] = hasAdditionalEdits
    ? (view: EditorView, completion: Completion, from: number, to: number) => {
        // 1. Apply the primary text edit
        view.dispatch({
          changes: { from, to, insert: resolvedText },
          userEvent: "input.complete",
        });

        // 2. Apply additionalTextEdits in a separate transaction.
        //    These are sorted in reverse document order so that earlier
        //    offsets are not invalidated by later insertions.
        const additionalChanges = [...item.additionalTextEdits!]
          .sort((a, b) => {
            // Sort descending by position so we apply bottom-up
            const lineDiff = b.range.start.line - a.range.start.line;
            if (lineDiff !== 0) return lineDiff;
            return b.range.start.character - a.range.start.character;
          })
          .map((edit) => lspTextEditToChangeSpec(view.state.doc, edit));

        if (additionalChanges.length > 0) {
          const tx: TransactionSpec = {
            changes: additionalChanges,
            userEvent: "input.complete.additional",
          };
          view.dispatch(tx);
        }
      }
    : resolvedText; // plain string fast-path when no additional edits

  return {
    label: item.label,
    displayLabel: item.label,
    detail: item.detail,
    info: resolveDocumentation(item),
    type: mapLSPKind(item.kind),
    apply,
    commitCharacters,
    boost: item.sortText ? -item.sortText.charCodeAt(0) : 0,
  };
}

export function lspCompletionListToCodeMirror(
  list: CompletionList,
  from: number,
): CompletionResult {
  return {
    from,
    options: list.items.map((item) => mapLSPCompletionItem(item, list)),
    validFor: list.isIncomplete ? () => false : /^\w*$/,
    commitCharacters: list.itemDefaults?.commitCharacters,
  };
}
