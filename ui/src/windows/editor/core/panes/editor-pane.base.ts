import { computed, Signal, signal } from "@angular/core";

/**
 * How long {@link EditorPaneServiceBase.changePane} will wait for a pane
 * to call {@link EditorPaneServiceBase.resolvePane} before rejecting.
 */
const PANE_RENDER_TIMEOUT_MS = 5_000;

/**
 * Abstract base class for editor pane services.
 *
 * Provides signal-based active-pane tracking, localStorage persistence, and a
 * render-acknowledgement contract via {@link changePane} / {@link resolvePane}.
 *
 * ### Implementing a new pane service
 * 1. Extend this class with the concrete pane union type as the type parameter.
 * 2. Pass the valid-panes `Set` and the localStorage key to `super()`.
 * 3. Decorate the subclass with `@Injectable({ providedIn: 'root' })`.
 *
 * @example
 * \@Injectable({ providedIn: 'root' })
 * export class EditorSidebarPaneService extends EditorPaneServiceBase<editorSidebarPane> {
 *   constructor() {
 *     super(EDITOR_VALID_SIDEBAR_PANES, 'editor-sidebar-pane');
 *   }
 * }
 *
 * @typeParam T - The union of valid pane string literals for the panel, plus `null`.
 */
export abstract class EditorPaneServiceBase<T extends string> {
  /**
   * Holds the current pane signal.
   */
  private readonly _pane = signal<T | null>(this._restoreState());

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
   * Emits `null` when no pane is active (i.e. the panel is collapsed).
   *
   * @example
   * // Bind in a component
   * protected readonly activePane = this.paneService.pane;
   *
   * // Read imperatively
   * const current = this.paneService.pane();
   */
  public readonly pane: Signal<T | null> = computed(() => this._pane());

  /**
   * @param _validPanes  - Set of all valid pane values for this panel.
   * @param _storageKey  - localStorage key under which the active pane is persisted.
   */
  protected constructor(
    private readonly _validPanes: ReadonlySet<T>,
    private readonly _storageKey: string,
  ) {}

  /**
   * Changes the active pane and persists the change to localStorage.
   *
   * Returns a `Promise<void>` that settles as follows:
   *
   * | Scenario | Settlement |
   * |---|---|
   * | `pane` equals the currently active pane | Resolves immediately |
   * | `pane` is `null` (close panel) | Resolves immediately |
   * | Pane calls {@link resolvePane} within {@link PANE_RENDER_TIMEOUT_MS} | Resolves |
   * | {@link PANE_RENDER_TIMEOUT_MS} elapses with no acknowledgement | Rejects with `Error` |
   * | {@link changePane} is called again before the promise settles | Rejects with `'superseded'` |
   * | `pane` is not a member of the valid-panes `Set` | Rejects with `Error` |
   *
   * @param pane - The pane to activate, or `null` to close the panel.
   * @returns A promise that resolves once the activated pane has fully rendered.
   */
  public changePane(pane: T | null): Promise<void> {
    const current = this._pane();

    if (current === pane) {
      return Promise.resolve();
    }

    if (pane !== null && !this._validPanes.has(pane)) {
      const label = this.constructor.name;
      console.warn(`[${label}] Cannot set pane to invalid value: "${pane}"`);
      return Promise.reject(new Error(`Invalid pane: "${pane}"`));
    }

    // A pane was already pending — it will never render now, so reject it.
    this._clearPending("superseded");

    this._pane.set(pane);
    this._saveState(pane);

    // Closing the panel renders nothing, so no acknowledgement is expected.
    if (pane === null) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      this._pendingResolve = resolve;
      this._pendingReject = reject;

      this._pendingTimeout = setTimeout(() => {
        if (this._pendingReject) {
          const label = this.constructor.name;
          this._pendingReject(
            new Error(
              `[${label}] Pane "${pane}" did not call resolvePane() within ${PANE_RENDER_TIMEOUT_MS}ms`,
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
   *   this.paneService.resolvePane();
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
  private _saveState(pane: T | null): void {
    try {
      if (pane === null) {
        localStorage.removeItem(this._storageKey);
      } else {
        localStorage.setItem(this._storageKey, pane);
      }
    } catch (err) {
      console.warn(
        `[${this.constructor.name}] Failed to persist pane state`,
        err,
      );
    }
  }

  /**
   * Reads and validates the persisted pane value from localStorage.
   *
   * Returns `null` if nothing is stored, the stored value is not a member of
   * the valid-panes `Set`, or localStorage is unavailable.
   *
   * @returns The restored pane value, or `null`.
   */
  private _restoreState(): T | null {
    try {
      const raw = localStorage.getItem(this._storageKey);
      if (!raw) return null;

      const value = raw as T;
      if (!this._validPanes.has(value)) {
        console.warn(
          `[${this.constructor.name}] Discarding invalid persisted pane value: "${raw}"`,
        );
        return null;
      }

      return value;
    } catch (err) {
      console.warn(
        `[${this.constructor.name}] Failed to restore pane state`,
        err,
      );
      return null;
    }
  }
}
