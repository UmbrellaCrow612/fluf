import { Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { FileXInMemoryData } from '../types';
import { fileNode } from '../../../gen/type';

/**
 * Represents data that does not need to be persisted between session but within the lifecycle of the app i.e until a refresh
 *
 * SHOULD NOT USE ANY OTHER SERVICE
 */
@Injectable({
  providedIn: 'root',
})
export class FileXInMemoryContextService {
  /**
   * A snapshot / current view of the data
   */
  getSnapShot(): FileXInMemoryData {
    return {
      selectedItems: this.selectedItems(),
    };
  }

  /**
   * Exposes the current selected items - updates to this signal will propigate to those intrested.
   */
  readonly selectedItems: WritableSignal<fileNode[]> = signal<fileNode[]>([]);
}
