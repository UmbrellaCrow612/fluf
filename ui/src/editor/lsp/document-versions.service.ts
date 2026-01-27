import { Injectable } from '@angular/core';

/**
 * Used a way to track specific documents by there file path and there current edit version, persist it in memeory.
 */
@Injectable({
  providedIn: 'root',
})
export class DocumentVersionsService {
  /**
   * Exposes all the documents and there current version
   * - `Key` - file's path
   * - `Value` the version
   */
  readonly docs: Map<string, number> = new Map();
}
