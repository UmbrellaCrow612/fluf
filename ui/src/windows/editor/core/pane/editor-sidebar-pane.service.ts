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
 * How long {@link EditorSidebarPaneService.changePane} will wait for a pane
 * to call {@link EditorSidebarPaneService.resolvePane} before rejecting.
 */
const PANE_RENDER_TIMEOUT_MS = 5_000;

/**
 * Manages the active pane displayed in the editor sidebar.
 *
 * Persists the active pane to localStorage on every change and restores
 * it on initialization. Invalid or missing persisted values fall back to `null`.
 *
 * ### Render-acknowledgement contract
 * {@link changePane} returns a `Promise<void>` that only resolves once the
 * newly activated pane component calls {@link resolvePane} (typically from
 * `ngAfterViewInit`). If no acknowledgement arrives within
 * {@link PANE_RENDER_TIMEOUT_MS} milliseconds the promise rejects.
 * Calling {@link changePane} again before the current promise settles
 * immediately rejects the superseded promise with the string `'superseded'`.
 *
 * @example
 * // Activate a pane and wait for it to render
 * await this.editorSidebarPaneService.changePane('file-explorer');
 *
 * // Read the currently active pane
 * const pane = this.editorSidebarPaneService.pane();
 */
@Injectable({
  providedIn: "root",
})
export class EditorSidebarPaneService {
  /**
   * Holds the current pane signal
   */
  private readonly _pane = signal<editorSidebarPane>(this.restoreState());

  /**
   * Resolve function of the currently pending {@link changePane} promise.
   * `null` when no promise is in flight.
   */
  private _pendingResolve: (() => void) | null = null;

  /**
   * Reject function of the currently pending {@link changePane} promise.
   * `null` when no promise is in flight.
   */
  private _pendingReject: ((reason?: unknown) => void) | null = null;

  /**
   * Handle for the render-timeout timer started by {@link changePane}.
   * Cleared by {@link _clearPending} whenever the promise settles.
   */
  private _pendingTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Exposes which pane is currently active/showing.
   * Emits `null` when no pane is active (i.e. the sidebar is collapsed).
   *
   * @example
   * // Bind in a component
   * protected readonly activePane = this.editorSidebarPaneService.pane;
   *
   * // Read imperatively
   * const current = this.editorSidebarPaneService.pane();
   */
  public readonly pane: Signal<editorSidebarPane> = computed(() =>
    this._pane(),
  );

  /**
   * Changes the active sidebar pane and persists the change to localStorage.
   *
   * Returns a `Promise<void>` that settles as follows:
   *
   * | Scenario | Settlement |
   * |---|---|
   * | `pane` equals the currently active pane | Resolves immediately |
   * | `pane` is `null` (close sidebar) | Resolves immediately |
   * | Pane calls {@link resolvePane} within {@link PANE_RENDER_TIMEOUT_MS} | Resolves |
   * | {@link PANE_RENDER_TIMEOUT_MS} elapses with no acknowledgement | Rejects with `Error` |
   * | {@link changePane} is called again before the promise settles | Rejects with `'superseded'` |
   * | `pane` is not a member of {@link EDITOR_VALID_SIDEBAR_PANES} | Rejects with `Error` |
   *
   * @param pane - The pane to activate, or `null` to close the sidebar.
   * @returns A promise that resolves once the activated pane has fully rendered.
   */
  public changePane(pane: editorSidebarPane): Promise<void> {
    const current = this._pane();

    if (current === pane) {
      return Promise.resolve();
    }

    if (pane !== null && !EDITOR_VALID_SIDEBAR_PANES.has(pane)) {
      console.warn(
        `[EditorSidebarPaneService] Cannot set sidebar pane to invalid value: "${pane}"`,
      );
      return Promise.reject(new Error(`Invalid pane: "${pane}"`));
    }

    // A pane was already pending — it will never render now, so reject it.
    this._clearPending("superseded");

    this._pane.set(pane);
    this.saveState(pane);

    // Closing the sidebar renders nothing, so no acknowledgement is expected.
    if (pane === null) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      this._pendingResolve = resolve;
      this._pendingReject = reject;

      this._pendingTimeout = setTimeout(() => {
        if (this._pendingReject) {
          this._pendingReject(
            new Error(
              `[EditorSidebarPaneService] Pane "${pane}" did not call resolvePane() within ${PANE_RENDER_TIMEOUT_MS}ms`,
            ),
          );
        }
        this._clearPending();
      }, PANE_RENDER_TIMEOUT_MS);
    });
  }

  /**
   * Notifies the service that the currently active pane has fully rendered.
   *
   * Pane components **must** call this method once their view is ready in order
   * to resolve the `Promise` returned by {@link changePane}. The conventional
   * place to do so is `ngAfterViewInit`:
   *
   * @example
   * ngAfterViewInit(): void {
   *   this.editorSidebarPaneService.resolvePane();
   * }
   *
   * This method is a no-op when no {@link changePane} promise is pending (e.g.
   * on the very first render driven by a restored localStorage value), so
   * components do not need to guard the call.
   */
  public resolvePane(): void {
    if (!this._pendingResolve) {
      return;
    }

    this._pendingResolve();
    this._clearPending();
  }

  /**
   * Settles and tears down any in-flight {@link changePane} promise.
   *
   * If `rejectReason` is provided the pending promise is rejected with that
   * value before state is cleared; otherwise only the timeout and stored
   * callbacks are discarded (the caller is responsible for having already
   * resolved/rejected the promise, as in {@link resolvePane}).
   *
   * @param rejectReason - Optional rejection value for the pending promise.
   */
  private _clearPending(rejectReason?: unknown): void {
    if (this._pendingTimeout !== null) {
      clearTimeout(this._pendingTimeout);
      this._pendingTimeout = null;
    }

    if (rejectReason !== undefined && this._pendingReject) {
      this._pendingReject(rejectReason);
    }

    this._pendingResolve = null;
    this._pendingReject = null;
  }

  /**
   * Persists the given pane value to localStorage.
   * Removes the stored entry when `pane` is `null`.
   *
   * Failures are caught and logged as warnings so that a degraded
   * localStorage environment (e.g. private browsing with storage blocked)
   * does not break pane switching.
   *
   * @param pane - The pane value to persist, or `null` to clear it.
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
   *
   * Returns `null` if nothing is stored, the stored value is not a member of
   * {@link EDITOR_VALID_SIDEBAR_PANES}, or localStorage is unavailable.
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
