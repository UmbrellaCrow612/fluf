import { Injectable, signal } from '@angular/core';
import { EditorInMemoryAppContext } from './type';

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
  providedIn: 'root',
})
export class EditorInMemoryStateService {
  /**
   * Exposes the signal for refreshDirectory in the ctx - used to react to / compute the value of this field throughout the app
   */
  readonly refreshDirectory =
    signal<EditorInMemoryAppContext['refreshDirectory']>(0);

  /**
   * Exposes problems signal
   */
  readonly problems = signal<EditorInMemoryAppContext['problems']>(new Map());

  /**
   * Exposes signal for isCreateFileOrFolderActive
   */
  readonly isCreateFileOrFolderActive =
    signal<EditorInMemoryAppContext['isCreateFileOrFolderActive']>(null);

  /**
   * Exposes signal editorResize
   */
  readonly editorResize = signal<EditorInMemoryAppContext['editorResize']>(0);

  /**
   * Exposes shells signal
   */
  readonly shells = signal<EditorInMemoryAppContext['shells']>(null);

  /**
   * Exposes currentActiveShellId signal
   */
  readonly currentActiveShellId =
    signal<EditorInMemoryAppContext['currentActiveShellId']>(null);

  /**
   * Exposes terminalBuffers signal
   */
  readonly terminalBuffers = signal<
    EditorInMemoryAppContext['terminalBuffers']
  >(new Map());

  /**
   * Exposes createTerminal signal
   */
  readonly createTerminal =
    signal<EditorInMemoryAppContext['createTerminal']>(0);

  /**
   * Exposes showCommandPalette signal
   */
  readonly showCommandPalette =
    signal<EditorInMemoryAppContext['showCommandPalette']>(false);

  /**
   * Exposes resetEditorBottomPanelDragHeight signal
   */
  readonly resetEditorBottomPanelDragHeight =
    signal<EditorInMemoryAppContext['resetEditorBottomPanelDragHeight']>(0);
}
