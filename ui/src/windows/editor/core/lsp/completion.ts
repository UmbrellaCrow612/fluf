import { CompletionResult, Completion } from "@codemirror/autocomplete";
import {
  CompletionList,
  CompletionItem,
  InsertTextFormat,
} from "vscode-languageserver-types";

// Maps LSP CompletionItemKind to CodeMirror completion types
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

// Resolves the insert text for a completion item, respecting list defaults
function resolveInsertText(item: CompletionItem, list: CompletionList): string {
  if (item.textEdit) {
    return item.textEdit.newText;
  }
  return item.insertText ?? item.label;
}

// Resolves commit characters, merging list defaults with item-level overrides
function resolveCommitCharacters(
  item: CompletionItem,
  list: CompletionList,
): string[] | undefined {
  if (item.commitCharacters) {
    return item.commitCharacters;
  }
  if (list.itemDefaults?.commitCharacters) {
    return list.itemDefaults.commitCharacters;
  }
  return undefined;
}

// Resolves documentation string from either a string or MarkupContent
function resolveDocumentation(item: CompletionItem): string | undefined {
  if (!item.documentation) return undefined;
  if (typeof item.documentation === "string") return item.documentation;
  return item.documentation.value; // MarkupContent
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

  return {
    label: item.label,
    displayLabel: item.label,
    detail: item.detail,
    info: resolveDocumentation(item),
    type: mapLSPKind(item.kind),
    apply: isSnippet
      ? stripSnippetSyntax(insertText) // CodeMirror doesn't natively support LSP snippets
      : insertText,
    commitCharacters,
    // Use sortText for boost — lower sortText = higher priority
    boost: item.sortText ? -item.sortText.charCodeAt(0) : 0,
  };
}

// Strips LSP snippet placeholders like ${1:foo}, $1, ${1|a,b|} -> plain text
// For full snippet support you'd need a snippet plugin instead
function stripSnippetSyntax(snippet: string): string {
  return snippet
    .replace(/\$\{(\d+):([^}]*)\}/g, "$2") // ${1:placeholder} -> placeholder
    .replace(/\$\{(\d+)\|[^|]*\|[^}]*\}/g, "") // ${1|a,b,c|} -> ""
    .replace(/\$\{\d+\}/g, "") // ${1} -> ""
    .replace(/\$\d+/g, ""); // $1  -> ""
}

export function lspCompletionListToCodeMirror(
  list: CompletionList,
  from: number,
): CompletionResult {
  return {
    from,
    options: list.items.map((item) => mapLSPCompletionItem(item, list)),
    // If LSP says the list is incomplete, force re-query on every keystroke
    // Otherwise cache results and let CodeMirror filter them
    validFor: list.isIncomplete ? () => false : /^\w*$/,
    // Propagate list-level commit characters to all items that don't have their own
    commitCharacters: list.itemDefaults?.commitCharacters,
  };
}
