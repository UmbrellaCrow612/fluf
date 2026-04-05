import { Injectable } from "@angular/core";
import { getElectronApi } from "../../../../shared/electron";
import { normalize } from "../../../../lib/path";
import { inject } from "@angular/core/primitives/di";
import { EditorDocumentSavingService } from "./editor-document-saving.service";

/**
 * Holds files and their current draft content that is not yet saved.
 */
@Injectable({
  providedIn: "root",
})
export class EditorDocumentDraftService {
  private readonly electronApi = getElectronApi();
  private readonly editorDocumentSavingService = inject(
    EditorDocumentSavingService,
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
    this.fileDraftMap.set(normalize(filePath), content);
  }

  /**
   * Gets a specific file's draft content.
   * @param filePath - The file path.
   * @returns The draft content or undefined if no draft exists.
   */
  public getDraft(filePath: string): string | undefined {
    return this.fileDraftMap.get(normalize(filePath));
  }

  /**
   * Checks if a file has a draft.
   * @param filePath - The file path.
   * @returns Whether the given file has unsaved draft.
   */
  public hasDraft(filePath: string): boolean {
    return this.fileDraftMap.has(normalize(filePath));
  }

  /**
   * Removes a draft for a given file.
   * @param filePath - The file path.
   * @returns Whether a draft was actually deleted.
   */
  public removeDraft(filePath: string): boolean {
    return this.fileDraftMap.delete(normalize(filePath));
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
   * @param multiSave If this transaction is part of a multi save
   * @returns Whether it could save the draft as the new content of the file path.
   */
  public async saveDraft(
    filePath: string,
    multiSave: boolean,
  ): Promise<boolean> {
    try {
      if (!multiSave) {
        this.editorDocumentSavingService.setSaving(true);
      }

      const normalizedPath = normalize(filePath);
      const draft = this.fileDraftMap.get(normalizedPath);
      if (!draft) {
        console.warn("No draft found for file path ", filePath);
        return false;
      }

      const success = await this.electronApi.fsApi.write(normalizedPath, draft);
      if (!success) {
        console.error("Failed to write to file path ", filePath, draft);
        return false;
      }

      this.removeDraft(normalizedPath);
      return true;
    } catch (error) {
      console.error("Failed to save draft for file path:", filePath, error);
      return false;
    } finally {
      if (!multiSave) {
        this.editorDocumentSavingService.setSaving(false);
      }
    }
  }

  /**
   * Attempts to save all drafts.
   */
  public async saveDrafts(): Promise<void> {
    try {
      this.editorDocumentSavingService.setSaving(true);

      for (const filePath of this.fileDraftMap.keys()) {
        const success = await this.saveDraft(filePath, true);
        if (!success) {
          console.error("Failed to save draft for file path:", filePath);
        }
      }
    } catch (error) {
      console.error("Failed to save drafts ", error);
    } finally {
      this.editorDocumentSavingService.setSaving(false);
    }
  }
}
