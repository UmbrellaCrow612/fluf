import { Injectable } from "@angular/core";
import { normalize } from "../../../../lib/path";
import { languageId, voidCallback } from "../../../../gen/type";

/**
 * Holds specific LSP and changes that are in queue / buffer that will be sent when it becomes ready
 */
@Injectable({
  providedIn: "root",
})
export class EditorPendingChangesQueueService {
  /**
   * Specific lsp and a list of functions to call which will send the changes to the LSP
   */
  private readonly pendingChangesMap = new Map<languageId, voidCallback[]>();

  /**
   * Add a callback to call when the lsp becomes ready
   * @param callback The callback which has the logic to send the change to the backend LSP
   */
  public addChangeCallback(callback: voidCallback): void {}
  /**
   * Run all the stored pending change callbacks for the given lsp
   * @param languageId The lsp
   */
  public runChangeCallbacks(languageId: languageId): void {
    const callbacks = this.pendingChangesMap.get(languageId);
    if (!callbacks) {
      return;
    }

    for (const callback of callbacks) {
      console.error("ran cb");
      callback();
    }

    this.pendingChangesMap.delete(languageId);
  }
}
