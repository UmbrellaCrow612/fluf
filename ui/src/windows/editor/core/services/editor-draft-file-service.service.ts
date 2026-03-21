import { inject, Injectable } from '@angular/core';
import { normalizePath } from '../../../../shared/path-uri-helpers';
import { EditorDirtyFilesTrackerService } from './editor-dirty-files-tracker.service';
import { getElectronApi } from '../../../../shared/electron';
import { useEffect } from '../../../../lib/useEffect';
import { EditorInMemoryStateService } from '../state/editor-in-memory-state.service';

/**
 * Holds files and their current draft content that is not yet saved.
 */
@Injectable({
  providedIn: 'root',
})
export class EditorDraftFileService {
  private readonly editorDirtyFilesTrackerService = inject(
    EditorDirtyFilesTrackerService,
  );
  private readonly electronApi = getElectronApi();
  private readonly editorInMemoryStateService = inject(
    EditorInMemoryStateService,
  );

  /**
   * Holds a file path and its draft content.
   */
  private readonly fileDraftMap = new Map<string, string>();

  /**
   * Sets a specific file's draft content.
   * @param filePath - The path to the file.
   * @param content - The current draft content.
   */
  public setDraft(filePath: string, content: string): void {
    this.fileDraftMap.set(normalizePath(filePath), content);
  }

  /**
   * Gets a specific file's draft content.
   * @param filePath - The file path.
   * @returns The draft content or undefined if no draft exists.
   */
  public getDraft(filePath: string): string | undefined {
    return this.fileDraftMap.get(normalizePath(filePath));
  }

  /**
   * Checks if a file has a draft.
   * @param filePath - The file path.
   * @returns Whether the given file has unsaved draft.
   */
  public hasDraft(filePath: string): boolean {
    return this.fileDraftMap.has(normalizePath(filePath));
  }

  /**
   * Removes a draft for a given file.
   * @param filePath - The file path.
   * @returns Whether a draft was actually deleted.
   */
  public removeDraft(filePath: string): boolean {
    return this.fileDraftMap.delete(normalizePath(filePath));
  }

  /**
   * Gets all drafts for bulk operations (e.g., Save All).
   * @returns Iterable of [filePath, content] pairs.
   */
  public getAllDrafts(): IterableIterator<[string, string]> {
    return this.fileDraftMap.entries();
  }

  /**
   * Gets the count of unsaved files.
   * @returns Number of files with pending changes.
   */
  public getDraftCount(): number {
    return this.fileDraftMap.size;
  }

  /**
   * Clears all drafts (e.g., after successful bulk save).
   */
  public clearAllDrafts(): void {
    this.fileDraftMap.clear();
  }

  /**
   * Attempts to save the current draft for the file if it exists.
   * @param filePath - The path to the file.
   * @returns Whether it could save the draft as the new content of the file path.
   */
  public async saveDraft(filePath: string): Promise<boolean> {
    try {
      const normalizedPath = normalizePath(filePath);
      const draft = this.fileDraftMap.get(normalizedPath);
      if (!draft) {
        return false;
      }

      const success = await this.electronApi.fsApi.write(normalizedPath, draft);
      if (!success) {
        return false;
      }

      this.removeDraft(normalizedPath);
      this.editorDirtyFilesTrackerService.markAsClean(normalizedPath);

      return true;
    } catch (error) {
      console.error('Failed to save draft for file path:', filePath, error);
      return false;
    }
  }

  /**
   * Attempts to save all drafts.
   */
  public async saveDrafts(): Promise<void> {
    for (const filePath of this.fileDraftMap.keys()) {
      const success = await this.saveDraft(filePath);
      if (!success) {
        console.error('Failed to save draft for file path:', filePath);
      }
    }
  }

  /**
   * Sets up an effect that listens for the save shortcut (Ctrl+S) signal
   * and saves all drafts when triggered.
   * @returns A cleanup function to destroy the effect.
   */
  public setupSaveShortcutHandler() {
    return useEffect(
      async (_, count) => {
        if (count > 0) {
          await this.saveDrafts();
        }
      },
      [this.editorInMemoryStateService.controlSaveCount],
    );
  }
}
