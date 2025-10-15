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
};

export type ContextSubKey =
  | 'side-bar-active-element'
  | 'selected-directory-folder-path'
  | 'directory-file-nodes'
  | 'active-file-folder';

export type SubCallBack = (ctx: AppContext) => void;
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
  update<K extends keyof AppContext>(key: K, value: AppContext[K]) {
    this._ctx[key] = value;
    this.saveState();
    this.notify(key);
  }

  /**
   * Notify all subscribers for a specific AppContext field
   */
  private notify<K extends keyof AppContext>(key: K) {
    const callbacks = this.subscriptions.get(key);
    if (callbacks) {
      let ctx = this.getSnapshot();
      for (const callback of callbacks) {
        callback(ctx);
      }
    }
  }

  getSnapshot(): AppContext {
    return structuredClone(this._ctx);
  }
}
