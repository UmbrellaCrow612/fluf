import { EditorView } from "codemirror";
import { tsServerOutputBody } from "../../gen/type";
import { FlufDiagnostic } from "../diagnostic/type";
import { CodeMirrorSeverity } from "./type";

/**
 * Converts a TSServer output body into a list of FlufDiagnostics.
 * * @param view - The CodeMirror EditorView instance for coordinate conversion
 * @param body - The body object from tsserver output
 * @returns An array of FlufDiagnostic objects
 */
export const convertTsToFlufDiagnostics = (
  view: EditorView,
  body: tsServerOutputBody
): FlufDiagnostic[] => {
  if (!body.diagnostics) return [];

  return body.diagnostics.map((diag) => {
    // 1. Map TSServer categories to CodeMirror severities
    const severityMap: Record<string, CodeMirrorSeverity> = {
      suggestion: "hint",
      message: "info",
      warning: "warning", // Fallback if warning is present in other versions
      error: "error",
    };

    // 2. Convert Line/Offset to CodeMirror's absolute position (0-indexed)
    // TSServer uses 1-based indexing for lines and offsets.
    const from = view.state.doc.line(diag.start.line).from + (diag.start.offset - 1);
    const to = view.state.doc.line(diag.end.line).from + (diag.end.offset - 1);

    return {
      from,
      to,
      severity: severityMap[diag.category] || "info",
      message: diag.text,
      source: "tsserver",
      // Custom Fluf fields
      startLine: diag.start.line,
      startColumn: diag.start.offset,
      endLine: diag.end.line,
      endColumn: diag.end.offset,
      // Optional: Add a CSS class for unnecessary code (like unused imports)
      markClass: diag.reportsUnnecessary ? "cm-unnecessary" : undefined,
    };
  });
};