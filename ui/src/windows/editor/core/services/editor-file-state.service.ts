import { inject, Injectable, Signal } from '@angular/core';
import { EditorDraftFileService } from './editor-draft-file-service.service';
import {
  EditorDirtyFileChangeCallback,
  EditorDirtyFileService,
} from './editor-dirty-file.service';
import { useEffect } from '../../../../lib/useEffect';
import { EditorInMemoryStateService } from '../state/editor-in-memory-state.service';

/**
 * Centralizes document state management by coordinating draft storage
 * and dirty file tracking. Provides a unified interface for tracking
 * document changes, checking unsaved status, and saving files.
 */
@Injectable({
  providedIn: 'root',
})
export class EditorFileStateService {
  private readonly draftService = inject(EditorDraftFileService);
  private readonly dirtyService = inject(EditorDirtyFileService);
  private readonly inMemoryState = inject(EditorInMemoryStateService);

  /**
   * Registers a document change with draft storage and dirty tracking.
   * Marks the file as dirty and stores the new content as a draft.
   * @param filePath - The normalized path of the modified file.
   * @param content - The new content/draft to store.
   */
  public trackChange(filePath: string, content: string): void {
    this.draftService.setDraft(filePath, content);
    this.dirtyService.markDirty(filePath);
  }

  /**
   * Checks if a document has unsaved changes.
   * @param filePath - The path to the file to check.
   * @returns `true` if the file has unsaved draft changes, otherwise `false`.
   */
  public isDirty(filePath: string): boolean {
    return this.dirtyService.isDirty(filePath);
  }

  /**
   * Listen to when a files dirty state changes
   * @param filePath The file to listen for dirty changes
   * @param callback The callback to run
   * @returns Unsub callback
   */
  public onDirtyChange(
    filePath: string,
    callback: EditorDirtyFileChangeCallback,
  ) {
    return this.dirtyService.onDirtyChange(filePath, callback);
  }

  /**
   * Gets the draft content for a document.
   * @param filePath - The path to the file.
   * @returns The draft content if it exists, otherwise `undefined`.
   */
  public getDraft(filePath: string): string | undefined {
    return this.draftService.getDraft(filePath);
  }

  /**
   * Saves the document to disk and clears the dirty/draft state.
   * @param filePath - The path to the file to save.
   * @returns A promise that resolves to `true` if the save was successful,
   *          or `false` if it failed or no draft existed.
   */
  public async save(filePath: string): Promise<boolean> {
    const success = await this.draftService.saveDraft(filePath);
    if (success) {
      this.dirtyService.markClean(filePath);
    }
    return success;
  }

  /**
   * Saves all documents that have unsaved changes.
   * Iterates through all drafts and attempts to save each one.
   * @returns A promise that resolves when all save operations are complete.
   */
  public async saveAll(): Promise<void> {
    await this.draftService.saveDrafts();
    await this.dirtyService.markAll(false);
  }

  /**
   * Reset a files state
   * @param filePath The files path
   */
  public reset(filePath: string): void {
    this.draftService.removeDraft(filePath);
    this.dirtyService.markClean(filePath);
  }

  /**
   * Check if any file has any dirty / edits that are unsaved
   * @returns IF any file has unsaved changes
   */
  public hasAnyDirty(): boolean {
    return this.dirtyService.hasAnyDirty();
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
          await this.saveAll();
        }
      },
      [this.inMemoryState.controlSaveCount],
    );
  }
}
