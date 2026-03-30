import { Injectable } from "@angular/core";
import { normalize } from "../../../../lib/path";

/**
 * Holds specific files and there current version
 */
@Injectable({
  providedIn: "root",
})
export class EditorDocumentVersionService {
  private readonly docVersionMap = new Map<string, number>();

  /**
   * Get the current version of a document file path
   * @param filePath The documents file path
   * @returns The current version
   */
  getVersion(filePath: string): number {
    const norm = normalize(filePath);

    const version = this.docVersionMap.get(norm);

    if (typeof version !== "number") {
      this.docVersionMap.set(norm, 1);
      return 1;
    } else {
      return version;
    }
  }

  /**
   * Update the local stored version of a document path
   * @param filePath The document file path
   */
  updateVersion(filePath: string): void {
    const norm = normalize(filePath);

    let version = this.docVersionMap.get(norm);

    if (typeof version !== "number") {
      this.docVersionMap.set(norm, 1);
    } else {
      version += 1;
      this.docVersionMap.set(norm, version);
    }
  }
}
