import { Injectable } from "@angular/core";

/**
 * Keeps track if saving a document content to backend is happeing so you can stop actions in the editor while it is saving
 */
@Injectable({
  providedIn: "root",
})
export class EditorDocumentSavingService {
  private saving = false;

  /**
   * If any documnet is in a saving state
   * @returns If a document is in saving state i.e should jnot close process until it finishes
   */
  public isSaving(): boolean {
    return this.saving;
  }

  /**
   * Change the saving state
   * @param value The new saving state
   */
  public setSaving(value: boolean): void {
    this.saving = value;
  }
}
