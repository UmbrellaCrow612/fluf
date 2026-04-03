import { Injectable } from "@angular/core";
import { normalize } from "../../../../lib/path";

/**
 * Keeps track of which files are currently open in the editor.
 * Mirrors the LSP document lifecycle — a document is considered open
 * from the point `opened()` is called until `close()` is called.
 */
@Injectable({
  providedIn: "root",
})
export class EditorDocumentOpenTrackerService {
  private readonly documentOpenMap = new Map<string, boolean>();

  /**
   * Mark a document as open. Should be called once per file when it is
   * first opened — do NOT call again on re-focus or tab switch.
   * Corresponds to LSP `textDocument/didOpen`.
   * @param filePath The path of the document being opened
   */
  public opened(filePath: string): void {
    this.documentOpenMap.set(normalize(filePath), true);
  }

  /**
   * Mark a document as closed. Should be called when the file is fully
   * closed (e.g. tab closed), not just when switching away from it.
   * Corresponds to LSP `textDocument/didClose`.
   * @param filePath The path of the document being closed
   */
  public close(filePath: string): void {
    this.documentOpenMap.delete(normalize(filePath));
  }

  /**
   * Check if a document is currently open in the editor.
   * @param filePath The path of the document to check
   * @returns `true` if the document is open, `false` otherwise
   */
  public isOpend(filePath: string): boolean {
    const value = this.documentOpenMap.get(normalize(filePath));
    if (typeof value === "undefined") {
      return false;
    }
    return value;
  }
}
