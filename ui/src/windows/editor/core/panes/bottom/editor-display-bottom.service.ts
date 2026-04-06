import { computed, inject, Injectable, signal } from "@angular/core";
import { ApplicationLocalStorageService } from "../../../../../shared/services/application-local-storage.service";

const LOCAL_STORAGE_KEY = "editor-display-bottom";

/**
 * Manages whether the editor bottom component itself is rendered.
 *
 * State is persisted to and restored from `localStorage` via
 * {@link ApplicationLocalStorageService}, so the user's preference survives
 * page reloads.
 */
@Injectable({
  providedIn: "root",
})
export class EditorDisplayBottomService {
  /** Backing signal holding the current display state. */
  private readonly _value = signal(false);

  private readonly applicationLocalStorageService = inject(
    ApplicationLocalStorageService,
  );

  constructor() {
    this._value.set(
      this.applicationLocalStorageService.get<boolean>(LOCAL_STORAGE_KEY) ??
        false,
    );
  }

  /**
   * Readonly computed signal that reflects whether the editor bottom
   * component should be displayed.
   *
   * Subscribe in templates or effects:
   * ```ts
   * effect(() => console.log(this.editorDisplayBottomService.display()));
   * ```
   */
  public readonly display = computed(() => this._value());

  /**
   * Hides the editor bottom component and persists the preference to
   * `localStorage`.
   */
  public hide(): void {
    this._value.set(false);
    this.applicationLocalStorageService.set<boolean>(LOCAL_STORAGE_KEY, false);
  }

  /**
   * Shows the editor bottom component and persists the preference to
   * `localStorage`.
   */
  public show(): void {
    this._value.set(true);
    this.applicationLocalStorageService.set<boolean>(LOCAL_STORAGE_KEY, true);
  }

  /**
   * Toggles the display state and persists the new value to `localStorage`.
   *
   * Reads the current signal value and flips it — `true` becomes `false`
   * and vice versa.
   */
  public logicalOr(): void {
    const next = !this._value();
    this._value.set(next);
    this.applicationLocalStorageService.set<boolean>(LOCAL_STORAGE_KEY, next);
  }
}
