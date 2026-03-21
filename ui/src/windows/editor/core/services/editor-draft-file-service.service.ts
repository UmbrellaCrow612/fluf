import { Injectable } from '@angular/core';
import { normalizePath } from '../../../../shared/path-uri-helpers';

/**
 * Holds files and their current draft content that is not yet saved
 */
@Injectable({
  providedIn: 'root',
})
export class EditorDraftFileService {
  /**
   * Holds a file path and its draft content
   */
  private readonly fileDraftMap = new Map<string, string>();

  /**
   * Set a specific file's draft content
   * @param filePath The path to the file
   * @param content The current draft content
   */
  setDraft(filePath: string, content: string): void {
    this.fileDraftMap.set(normalizePath(filePath), content);
  }

  /**
   * Get a specific file's draft content
   * @param filePath The file path
   * @returns The draft content or undefined if no draft exists
   */
  getDraft(filePath: string): string | undefined {
    return this.fileDraftMap.get(normalizePath(filePath));
  }

  /**
   * Check if a file has a draft
   * @param filePath The file path
   * @returns If the given file has unsaved draft
   */
  hasDraft(filePath: string): boolean {
    return this.fileDraftMap.has(normalizePath(filePath));
  }

  /**
   * Remove a draft for a given file
   * @param filePath The file path
   * @returns Whether a draft was actually deleted
   */
  removeDraft(filePath: string): boolean {
    return this.fileDraftMap.delete(normalizePath(filePath));
  }

  /**
   * Get all drafts for bulk operations (e.g., Save All)
   * @returns Iterable of [filePath, content] pairs
   */
  getAllDrafts(): IterableIterator<[string, string]> {
    return this.fileDraftMap.entries();
  }

  /**
   * Get count of unsaved files
   * @returns Number of files with pending changes
   */
  getDraftCount(): number {
    return this.fileDraftMap.size;
  }

  /**
   * Clear all drafts (e.g., after successful bulk save)
   */
  clearAllDrafts(): void {
    this.fileDraftMap.clear();
  }
}
