import { Injectable, signal, Signal, WritableSignal } from '@angular/core';
import {
  FileXBackHistoryItem,
  FileXCreateFileOrFolder,
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
  readonly backHistoryItems: WritableSignal<FileXBackHistoryItem[]> = signal<
    FileXBackHistoryItem[]
  >([]);

  /**
   * Used as a way to on change notify intrested parties that it should create a node in the directory display nodes of a node
   * that allows users to add a new node such as a file or folder similar to file explorers `new` button does. When you want to trigger this,
   * chnage the number to the defined list so indicate which type of node it should render.
   */
  readonly createFileOrFolderNewNode: WritableSignal<FileXCreateFileOrFolder> =
    signal<FileXCreateFileOrFolder>(0);
}
