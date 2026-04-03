import { Injectable } from "@angular/core";
import { languageId } from "../../../../gen/type";
import { normalize } from "../../../../lib/path";

/**
 * Service that manages language ID mappings for editor documents.
 * Associates file paths with their corresponding LSP language identifiers.
 */
@Injectable({
  providedIn: "root",
})
export class EditorDocumentLanguageIdService {
  private readonly documentLanguageIdMap = new Map<string, languageId>();

  /**
   * Retrieves the language ID for a given file path.
   * @param filePath - The path to the file
   * @returns The language ID if found, undefined otherwise
   */
  getLanguageId(filePath: string): languageId | undefined {
    return this.documentLanguageIdMap.get(normalize(filePath));
  }

  /**
   * Sets or updates the language ID for a given file path.
   * @param filePath - The path to the file
   * @param languageId - The language ID to associate with the file
   */
  setLanguageId(filePath: string, languageId: languageId): void {
    this.documentLanguageIdMap.set(normalize(filePath), languageId);
  }

  /**
   * Removes the language ID mapping for a given file path.
   * @param filePath - The path to the file
   */
  removeLanguageId(filePath: string): void {
    this.documentLanguageIdMap.delete(normalize(filePath));
  }
}
