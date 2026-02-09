import { Injectable, signal, Signal, WritableSignal } from '@angular/core';
import {
  FileXBackHistoryItem,
  FileXForwardHistoryItem,
  FileXInMemoryData,
} from '../types';
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
      backHistoryItems: this.backHistoryItems(),
      forwardHistoryItems: this.forwardHistoryItems(),
    };
  }

  /**
   * Exposes the current selected items - updates to this signal will propigate to those intrested.
   */
  readonly selectedItems: WritableSignal<fileNode[]> = signal<fileNode[]>([]);

  /**
   * Exposes the forward history for specific tabs - updates to this signal will propigate to those intrested.
   */
  readonly forwardHistoryItems: WritableSignal<FileXForwardHistoryItem[]> =
    signal<FileXForwardHistoryItem[]>([]);

  /**
   * Exposes back history items for speciic tabs - updates to this signal will propigate to those intrested.
   */
  readonly backHistoryItems: WritableSignal<FileXBackHistoryItem[]> =
    signal<FileXBackHistoryItem[]>([]);
}
