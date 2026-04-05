import { computed, Injectable, Signal, signal } from "@angular/core";

/**
 * Represents which pane elements from the sidebar can be in an active state,
 * i.e., the elements that can be clicked to show their rendered component.
 */
export const EDITOR_SIDE_BAR_PANE_ELEMENTS = {
  FILE_EXPLORER: "file-explorer",
  SEARCH: "search",
  SOURCE_CONTROL: "source-control",
  RUN_AND_DEBUG: "run-and-debug",
  EXTENSIONS: "extensions",
} as const;

/**
 * Contains a list of valid editor side bar active pane elements
 */
export const EDITOR_VALID_SIDEBAR_PANES = new Set<editorSidebarPane>(
  Object.values(EDITOR_SIDE_BAR_PANE_ELEMENTS),
);

/**
 * Represents a valid value for the editor side bar pane element
 */
export type editorSidebarPane =
  | (typeof EDITOR_SIDE_BAR_PANE_ELEMENTS)[keyof typeof EDITOR_SIDE_BAR_PANE_ELEMENTS]
  | null;

/**
 * localStorage key used to persist the active sidebar pane
 */
const SIDEBAR_PANE_STORAGE_KEY = "editor-sidebar-pane";

/**
 * Manages the active pane displayed in the editor sidebar.
 *
 * Persists the active pane to localStorage on every change and restores
 * it on initialization. Invalid or missing persisted values fall back to null.
 *
 * @example
 * // Read current pane
 * const pane = this.editorSidebarPaneService.pane();
 *
 * // Change pane
 * this.editorSidebarPaneService.changePane('file-explorer');
 */
@Injectable({
  providedIn: "root",
})
export class EditorSidebarPaneService {
  private readonly _pane = signal<editorSidebarPane>(this.restoreState());

  /**
   * Exposes which pane is currently active/showing.
   * Emits `null` when no pane is active.
   *
   * @example
   *
   * // Usage in components
   * public activeElement = this.editorSidebarPaneService.pane;
   *
   * // Now you have a computed signal you can use in the typescript class code and also in the template UI
   */
  public readonly pane: Signal<editorSidebarPane> = computed(() =>
    this._pane(),
  );

  /**
   * Changes the active sidebar pane and persists the change to localStorage.
   *
   * - No-ops if the requested pane is already active.
   * - Resets to `null` and warns if `pane` is not a valid {@link editorSidebarPane} value.
   *
   * @param pane - The pane to activate, or `null` to deactivate all panes.
   */
  public changePane(pane: editorSidebarPane): void {
    const current = this._pane();

    if (current === pane) {
      return;
    }

    if (pane !== null && !EDITOR_VALID_SIDEBAR_PANES.has(pane)) {
      console.warn(
        `[EditorSidebarPaneService] Cannot set sidebar pane to invalid value: "${pane}"`,
      );
      return;
    }

    this._pane.set(pane);
    this.saveState(pane);
  }

  /**
   * Persists the given pane value to localStorage.
   * If `pane` is `null`, the stored entry is removed.
   *
   * @param pane - The pane value to persist.
   */
  private saveState(pane: editorSidebarPane): void {
    try {
      if (pane === null) {
        localStorage.removeItem(SIDEBAR_PANE_STORAGE_KEY);
      } else {
        localStorage.setItem(SIDEBAR_PANE_STORAGE_KEY, pane);
      }
    } catch (err) {
      console.warn(
        "[EditorSidebarPaneService] Failed to persist pane state",
        err,
      );
    }
  }

  /**
   * Reads and validates the persisted pane value from localStorage.
   * Returns `null` if nothing is stored or the stored value is invalid.
   *
   * @returns The restored {@link editorSidebarPane} value, or `null`.
   */
  private restoreState(): editorSidebarPane {
    try {
      const raw = localStorage.getItem(SIDEBAR_PANE_STORAGE_KEY);
      if (!raw) return null;

      const value = raw as editorSidebarPane;
      if (!EDITOR_VALID_SIDEBAR_PANES.has(value)) {
        console.warn(
          `[EditorSidebarPaneService] Discarding invalid persisted pane value: "${raw}"`,
        );
        return null;
      }

      return value;
    } catch (err) {
      console.warn(
        "[EditorSidebarPaneService] Failed to restore pane state",
        err,
      );
      return null;
    }
  }
}
