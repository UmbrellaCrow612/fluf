import { Injectable } from "@angular/core";
import { normalize } from "../../../../lib/path";
import { languageId } from "../../../../gen/type";

/**
 * Keeps track of specific LSP's and if they are started and ready
 */
@Injectable({
  providedIn: "root",
})
export class EditorLanguageServerProtocolLifecycleTracker {
  /**
   * Keeps track of specific LSP and if it is ready
   */
  private readonly lspMap = new Map<languageId, boolean>();

  /**
   * Check ig a given lsp is ready or not
   * @param languageId The lsp
   * @returns If the LSP is ready
   */
  public isReady(languageId: languageId): boolean {
    const value = this.lspMap.get(languageId);
    if (typeof value === "undefined") {
      this.lspMap.set(languageId, false);
      return false;
    }

    return value;
  }

  /**
   * Mark a specific lsp as ready
   * @param languageId The lsp
   */
  public markReady(languageId: languageId): void {
    this.lspMap.set(languageId, true);
  }
}
