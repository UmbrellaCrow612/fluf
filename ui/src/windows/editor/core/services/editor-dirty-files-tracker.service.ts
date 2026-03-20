import { Injectable, signal } from '@angular/core';
import { ChangeSet } from '@codemirror/state';
import { normalizePath } from '../../../../shared/path-uri-helpers';

/**
 * Tracks files with unsaved changes in the editor.
 *
 * Maintains a registry of files that have been modified through the UI
 * but not yet persisted, enabling features like "unsaved changes" indicators,
 * save-all functionality, and dirty state management.
 */
@Injectable({
  providedIn: 'root',
})
export class EditorDirtyFilesTrackerService {
  /**
   * Contains a specific file path and if it is dirty
   */
  public readonly fileDirtyMap = new Map<string, boolean>();

  /**
   * Updates the count whenever the file map changes use this to subscrive to changes
   */
  public readonly fileChangeMapChangedCount = signal<number>(0);

  /**
   * Checks if a file path has any changes indicating it is dirty
   * @param filePath The file to check for
   * @returns If it has changes sets
   */
  public isDirty(filePath: string): boolean {
    const normalizedPath = normalizePath(filePath);
    const map = this.fileDirtyMap;
    const isDirty = map.get(normalizedPath);
    if (isDirty === undefined) {
      return false;
    }

    return isDirty;
  }

  /**
   * Marks a file as is dirty
   * @param filePath The file path
   */
  public markIsDirty(filePath: string): void {
    const normalizedPath = normalizePath(filePath);
    const map = this.fileDirtyMap;
    map.set(normalizedPath, true);

    this.fileChangeMapChangedCount.update((x) => x + 1);
  }

  /**
   * Marks a file as no longer dirty
   * @param filePath The file to clear the sotred changes for
   */
  public markAsClean(filePath: string): void {
    const norm = normalizePath(filePath);
    this.fileDirtyMap.set(norm, false);
    this.fileChangeMapChangedCount.update((x) => x + 1);
  }
}
