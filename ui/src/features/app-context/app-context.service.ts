import { DestroyRef, Injectable } from '@angular/core';
import { sideBarActiveElement } from './type';

export type AppContext = {
  /**
   * Current active sidebat element
   */
  sideBarActiveElement: sideBarActiveElement;

  /**
   * List of nodes read from the selected directory
   */
  directoryFileNodes: Array<fileNode> | null;

  /**
   * Folder path selected in editor
   */
  selectedDirectoryFolderPath: string | null;

  /**
   * The current focused / last clicked or last edited file (from editor) in the file explorer tree
   */
  fileExplorerActiveFileOrFolder: fileNode | null;

  /**
   * Represents when a file extiro creator is active or not
   */
  isCreateFileOrFolderActive: boolean | null;

  /**
   * Inidicates if it should refresh / re read nodes and update the current nodes with updated folder nodes - keep expanded state and adds / removes children
   * based on new state
   */
  refreshDirectoryFolderNodes: boolean | null;

  /**
   * Indicates that the right click context menu on a file explorer item should be displayed - think of this as simpley a trigger
   * you push values to and the context menu will react when you want to display or hide it
   */
  displayFileEplorerContextMenu: boolean | null;

  /**
   * The node to process the context menu for, the trigger node the context menu was opened for
   */
  fileExplorerContextMenufileNode: fileNode | null;

  /**
   * Set this before showing the node as to where it was clicked for file explorer context menu to show from the trigger area
   */
  fileExplorerContextMenuClickPosition: { x: number; y: number } | null;
};

export type SubCallBack = (ctx: AppContext) => void | Promise<void>;
export type UnsubscribeFn = () => void;

const LOCAL_STORAGE_KEY = 'app-context';

/**
 * Service that provides access to application context, persists it,
 * and allows subscribing to changes.
 */
@Injectable({
  providedIn: 'root',
})
export class ContextService {
  private _ctx: AppContext = {
    sideBarActiveElement: null,
    selectedDirectoryFolderPath: null,
    directoryFileNodes: null,
    fileExplorerActiveFileOrFolder: null,
    isCreateFileOrFolderActive: null,
    refreshDirectoryFolderNodes: null,
    displayFileEplorerContextMenu: null,
    fileExplorerContextMenufileNode: null,
    fileExplorerContextMenuClickPosition: null,
  };

  private subscriptions = new Map<keyof AppContext, Set<SubCallBack>>();

  constructor() {
    this.restoreState();
  }

  /**
   * Restore persisted context from localStorage
   */
  private restoreState() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw) as Partial<AppContext>;
      this._ctx = { ...this._ctx, ...saved };
      console.log('[ContextService] Restored state from localStorage');
    } catch (err) {
      console.warn('[ContextService] Failed to restore context', err);
    }
  }

  /**
   * Persist the current context state to localStorage
   */
  private saveState() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this._ctx));
    } catch (err) {
      console.warn('[ContextService] Failed to save context', err);
    }
  }

  /**
   * Subscribe to changes for a specific AppContext field
   */
  sub<K extends keyof AppContext>(
    key: K,
    callback: SubCallBack
  ): UnsubscribeFn {
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }

    const set = this.subscriptions.get(key)!;
    set.add(callback);

    return () => set.delete(callback);
  }

  /**
   * Subscribe and automatically unsubscribe when the provided DestroyRef is destroyed
   */
  autoSub<K extends keyof AppContext>(
    key: K,
    callback: SubCallBack,
    destroyRef: DestroyRef
  ): void {
    const unsubscribe = this.sub(key, callback);
    destroyRef.onDestroy(unsubscribe);
  }

  /**
   * Update part of the application context and notify subscribers
   */
  async update<K extends keyof AppContext>(key: K, value: AppContext[K]) {
    this._ctx[key] = value;
    this.saveState();
    await this.notify(key);
  }

  /**
   * Notify all subscribers for a specific AppContext field
   */
  private async notify<K extends keyof AppContext>(key: K) {
    const callbacks = this.subscriptions.get(key);
    if (!callbacks || callbacks.size === 0) return;

    const ctx = this.getSnapshot();

    // Run all callbacks concurrently, safely catch errors
    const promises = Array.from(callbacks).map(async (callback) => {
      try {
        await callback(ctx);
      } catch (err) {
        console.warn(
          `[ContextService] Error in callback for "${String(key)}":`,
          err
        );
      }
    });

    // Wait for all async callbacks to complete (optional)
    await Promise.all(promises);
  }

  getSnapshot(): AppContext {
    return structuredClone(this._ctx);
  }
}
