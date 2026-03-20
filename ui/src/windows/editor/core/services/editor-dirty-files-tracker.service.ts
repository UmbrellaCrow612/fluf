import { Injectable, signal } from '@angular/core';
import { ChangeSet } from '@codemirror/state';
import { normalizePath } from '../../../../shared/path-uri-helpers';

/**
 * Tracks files with unsaved changes in the editor.
 *
 * Maintains a registry of files that have been modified through the UI
 * but not yet persisted, enabling features like "unsaved changes" indicators,
 * save-all functionality, and dirty state management.
 *
 * @example
 * // Mark a file as dirty when edited
 * tracker.markDirty(fileId, content);
 *
 * // Check if any files have unsaved changes
 * const hasChanges = tracker.hasDirtyFiles();
 */
@Injectable({
  providedIn: 'root',
})
export class EditorDirtyFilesTrackerService {
  /**
   * Contains a specific file path normalized and a list of change sets applied to it in a stack as they come in
   */
  public readonly fileChangeMap = new Map<string, ChangeSet[]>();

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
    const map = this.fileChangeMap;
    const changes = map.get(normalizedPath);
    if (!changes) {
      return false;
    }

    return changes.length > 0;
  }

  /**
   * Add changes to the stack of changes of a file
   * @param filePath The file path
   * @param change The change set
   */
  public addChange(filePath: string, change: ChangeSet): void {
    const normalizedPath = normalizePath(filePath);
    const map = this.fileChangeMap;

    const changes = map.get(normalizedPath);
    if (changes) {
      changes.push(change);
    } else {
      map.set(normalizedPath, [change]);
    }

    this.fileChangeMapChangedCount.update((x) => x + 1);
  }
}
