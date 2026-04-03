import { computed, Injectable, signal, Signal } from "@angular/core";
import { voidCallback } from "../../../../gen/type";
import { normalize } from "../../../../lib/path";

/**
 * Shape of the callback that runs when a dirty file change happens.
 */
export type EditorDirtyFileChangeCallback = (
  isDirty: boolean,
) => void | Promise<void>;

/**
 * Service for tracking dirty (unsaved) states of files in the editor.
 * Uses a Map-based callback system for reactive updates on individual file dirty states.
 */
@Injectable({
  providedIn: "root",
})
export class EditorDocumentDirtyService {
  /** Internal map tracking the dirty state of each file by normalized path. */
  private readonly fileDirtyMap = new Map<string, boolean>();
  /** Updating emits change event via computed signals */
  private readonly change = signal(0);
  /** Emits change event */
  private readonly emitChange = () => this.change.update((x) => x + 1);

  /**
   * Public signal to subscribe to when dirty state changes
   */
  public readonly valueChanged: Signal<number> = computed(() => this.change());

  /**
   * Marks a file as dirty (unsaved changes) and notifies registered callbacks.
   * @param filePath - The path of the file to mark as dirty.
   */
  public markDirty(filePath: string): void {
    const path = normalize(filePath);
    this.fileDirtyMap.set(path, true);
    this.emitChange();
  }

  /**
   * Marks a file as clean (saved) and notifies registered callbacks.
   * @param filePath - The path of the file to mark as clean.
   */
  public markClean(filePath: string): void {
    const path = normalize(filePath);
    this.fileDirtyMap.set(path, false);
    this.emitChange();
  }

  /**
   * Checks if a file is currently marked as dirty.
   * @param filePath - The path of the file to check.
   * @returns `true` if the file has unsaved changes, `false` otherwise.
   */
  public isDirty(filePath: string): boolean {
    const path = normalize(filePath);
    return this.fileDirtyMap.get(path) ?? false;
  }

  /**
   * Marks all tracked files as either dirty or clean and notifies all registered callbacks.
   * Useful for operations like "mark all as saved" or "mark all as modified".
   *
   * @param isDirty - The dirty state to apply to all tracked files.
   */
  public markAll(isDirty: boolean): void {
    const trackedPaths = Array.from(this.fileDirtyMap.keys());

    for (const path of trackedPaths) {
      this.fileDirtyMap.set(path, isDirty);
    }

    this.emitChange();
  }

  /**
   * Checks if any tracked file is currently marked as dirty.
   * @returns `true` if at least one file has unsaved changes, `false` otherwise.
   */
  public hasAnyDirty(): boolean {
    return Array.from(this.fileDirtyMap.values()).some((isDirty) => isDirty);
  }
}
