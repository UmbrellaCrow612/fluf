import { Injectable } from '@angular/core';
import { sideBarActiveElement } from './type';

export type AppContext = {
  sideBarActiveElement: sideBarActiveElement;

  /**
   * List of files opened in the file explorer form the selected directory path - keeps track of it when it cloopases and re opens
   * without having to re read the dir
   */
  fileExplorerOpenedNodes: Array<fileNode> | null;

  /**
   * The folder path opened to edit files etc
   */
  selectedDirectoryFolderPath: string | null;
};

export type ContextSubKey =
  | 'side-bar-active-element'
  | 'file-explorer-opene-nodes'
  | 'selected-director-folder-path';
export type SubCallBack = (ctx: AppContext) => void;
export type UnsubscribeFn = () => void;

/**
 * Service that provides access to application context
 */
@Injectable({
  providedIn: 'root',
})
export class ContextService {
  private _ctx: AppContext = {
    sideBarActiveElement: null,
    fileExplorerOpenedNodes: null,
    selectedDirectoryFolderPath: null,
  };

  private subscriptions = new Map<ContextSubKey, Set<SubCallBack>>();

  /**
   * Subscribe to a specific application context key and run some logic
   * @param key The key event to subscribe to
   * @param callback The callback to register
   * @returns A function that unsubscribes this callback when called
   */
  sub(key: ContextSubKey, callback: SubCallBack): UnsubscribeFn {
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }

    const set = this.subscriptions.get(key)!;
    set.add(callback);

    // Return an unsubscribe function
    return () => {
      set.delete(callback);
    };
  }

  /**
   * Update part of the application context and notify subscribers
   * @param key The key in the context to update
   * @param value The new value for that key
   * @param event Optional event key to notify subscribers
   */
  update<K extends keyof AppContext>(
    key: K,
    value: AppContext[K],
    event: ContextSubKey
  ) {
    this._ctx[key] = value;
    this.notify(event);
  }

  /**
   * Notify all subscribers for a specific key
   */
  private notify(key: ContextSubKey) {
    const callbacks = this.subscriptions.get(key);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(this._ctx);
      }
    }
  }

  /**
   * Get the current context snapshot
   */
  get context(): AppContext {
    return { ...this._ctx };
  }
}
