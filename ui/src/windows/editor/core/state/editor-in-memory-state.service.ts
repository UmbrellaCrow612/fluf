import { Injectable, signal } from "@angular/core";
import { EditorInMemoryState } from "./type";

/**
 * Volatile state container for transient application data.
 *
 * Maintains ephemeral state that resets on page refresh, using signals
 * for reactive access across the application. Mirrors the structure of
 * persistent state but without localStorage backing.
 *
 * @remarks
 * This is a foundational service with no external dependencies to prevent
 * circular dependency issues. State is lost on application reload.
 *
 * @example
 * // Trigger directory refresh from any component
 * this.inMemoryState.refreshDirectory.update(n => n + 1);
 *
 * // React to command palette visibility
 * effect(() => {
 *   if (this.inMemoryState.showCommandPalette()) {
 *     // focus input
 *   }
 * });
 */
@Injectable({
  providedIn: "root",
})
export class EditorInMemoryStateService {
  /**
   * Exposes selectedLineAndColumn signal
   */
  public readonly selectedLineAndColumn =
    signal<EditorInMemoryState["selectedLineAndColumn"]>(null);
}
