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
   * Exposes the signal for refreshDirectory in the ctx - used to react to / compute the value of this field throughout the app
   */
  readonly refreshDirectory =
    signal<EditorInMemoryState["refreshDirectory"]>(0);

  /**
   * Exposes signal for isCreateFileOrFolderActive
   */
  readonly isCreateFileOrFolderActive =
    signal<EditorInMemoryState["isCreateFileOrFolderActive"]>(null);

  /**
   * Exposes signal editorResize
   */
  readonly editorResize = signal<EditorInMemoryState["editorResize"]>(0);

  /**
   * Exposes shells signal
   */
  readonly shells = signal<EditorInMemoryState["shells"]>(null);

  /**
   * Exposes currentActiveShellId signal
   */
  readonly currentActiveShellId =
    signal<EditorInMemoryState["currentActiveShellId"]>(null);

  /**
   * Exposes terminalBuffers signal
   */
  readonly terminalBuffers = signal<EditorInMemoryState["terminalBuffers"]>(
    new Map(),
  );

  /**
   * Exposes createTerminal signal
   */
  readonly createTerminal = signal<EditorInMemoryState["createTerminal"]>(0);

  /**
   * Exposes showCommandPalette signal
   */
  readonly showCommandPalette =
    signal<EditorInMemoryState["showCommandPalette"]>(false);

  /**
   * Exposes resetEditorBottomPanelDragHeight signal
   */
  readonly resetEditorBottomPanelDragHeight =
    signal<EditorInMemoryState["resetEditorBottomPanelDragHeight"]>(0);

  /**
   * Exposes controlSaveCount signal
   */
  public readonly controlSaveCount =
    signal<EditorInMemoryState["controlSaveCount"]>(0);

  /**
   * Exposes selectedLineAndColumn signal
   */
  public readonly selectedLineAndColumn =
    signal<EditorInMemoryState["selectedLineAndColumn"]>(null);

  /**
   * Exposes gitBlameLineInformation signal
   */
  public readonly gitBlameLineInformation =
    signal<EditorInMemoryState["gitBlameLineInformation"]>(null);
}
