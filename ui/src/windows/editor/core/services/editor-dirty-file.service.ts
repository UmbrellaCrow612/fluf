import { Injectable, signal, Signal } from '@angular/core';
import { voidCallback } from '../../../../gen/type';
import { normalizePath } from '../../../../shared/path-uri-helpers';

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
  providedIn: 'root',
})
export class EditorDirtyFileService {
  /** Internal map tracking the dirty state of each file by normalized path. */
  private readonly fileDirtyMap = new Map<string, boolean>();

  /** Internal map storing registered callbacks for each file's dirty state changes. */
  private readonly fileCallbackMap = new Map<
    string,
    Set<EditorDirtyFileChangeCallback>
  >();

  /**
   * Notifies all registered callbacks for a specific file about its current dirty state.
   * @param filePath - The file path to notify callbacks for (will be normalized).
   * @returns A promise that resolves when all callbacks have been invoked.
   */
  private async notify(filePath: string): Promise<void> {
    const path = normalizePath(filePath);
    const callbacks = this.fileCallbackMap.get(path) ?? [];
    const isDirty = this.fileDirtyMap.get(path) ?? false;

    for (const callback of callbacks) {
      await callback(isDirty);
    }
  }

  /**
   * Marks a file as dirty (unsaved changes) and notifies registered callbacks.
   * @param filePath - The path of the file to mark as dirty.
   */
  public markDirty(filePath: string): void {
    const path = normalizePath(filePath);
    this.fileDirtyMap.set(path, true);
    this.notify(path);
  }

  /**
   * Marks a file as clean (saved) and notifies registered callbacks.
   * @param filePath - The path of the file to mark as clean.
   */
  public markClean(filePath: string): void {
    const path = normalizePath(filePath);
    this.fileDirtyMap.set(path, false);
    this.notify(path);
  }

  /**
   * Checks if a file is currently marked as dirty.
   * @param filePath - The path of the file to check.
   * @returns `true` if the file has unsaved changes, `false` otherwise.
   */
  public isDirty(filePath: string): boolean {
    const path = normalizePath(filePath);
    return this.fileDirtyMap.get(path) ?? false;
  }

  /**
   * Registers a callback to be invoked when the dirty state of a specific file changes.
   *
   * @param filePath - The path of the file to monitor for dirty state changes.
   * @param callback - The function to call when the dirty state changes. Receives the new dirty state.
   * @returns A void callback that can be invoked to unregister the listener.
   */
  public onDirtyChange(
    filePath: string,
    callback: EditorDirtyFileChangeCallback,
  ): voidCallback {
    const normPath = normalizePath(filePath);

    if (this.fileCallbackMap.has(normPath)) {
      this.fileCallbackMap.get(normPath)?.add(callback);
    } else {
      this.fileCallbackMap.set(normPath, new Set([callback]));
    }

    return () => {
      this.fileCallbackMap.get(normPath)?.delete(callback);
    };
  }

  /**
   * Marks all tracked files as either dirty or clean and notifies all registered callbacks.
   * Useful for operations like "mark all as saved" or "mark all as modified".
   *
   * @param isDirty - The dirty state to apply to all tracked files.
   * @returns A promise that resolves when all notifications have been processed.
   */
  public async markAll(isDirty: boolean): Promise<void> {
    const trackedPaths = Array.from(this.fileDirtyMap.keys());

    for (const path of trackedPaths) {
      this.fileDirtyMap.set(path, isDirty);
    }

    const notificationPromises = trackedPaths.map((path) => this.notify(path));
    await Promise.all(notificationPromises);
  }
}
