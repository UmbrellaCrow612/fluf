import { Injectable } from '@angular/core';

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
export class EditorDirtyFilesTrackerService {}
