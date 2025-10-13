import { DestroyRef, Injectable } from '@angular/core';
import { sideBarActiveElement } from './type';

export type AppContext = {
  sideBarActiveElement: sideBarActiveElement;
  fileExplorerOpenedNodes: Array<fileNode> | null;
  selectedDirectoryFolderPath: string | null;
  activeFileOpen: fileNode | null;
};

export type ContextSubKey =
  | 'side-bar-active-element'
  | 'file-explorer-opene-nodes'
  | 'selected-director-folder-path'
  | 'active-open-file';

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
    fileExplorerOpenedNodes: null,
    selectedDirectoryFolderPath: null,
    activeFileOpen: null,
  };

  private subscriptions = new Map<ContextSubKey, Set<SubCallBack>>();

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
      // Save shallow copy to avoid circular refs
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this._ctx));
    } catch (err) {
      console.warn('[ContextService] Failed to save context', err);
    }
  }

  /**
   * Subscribe to a specific application context key and run some logic
   */
  private sub(key: ContextSubKey, callback: SubCallBack): UnsubscribeFn {
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
  autoSub(
    key: ContextSubKey,
    callback: SubCallBack,
    destroyRef: DestroyRef
  ): void {
    const unsubscribe = this.sub(key, callback);
    destroyRef.onDestroy(unsubscribe);
  }

  /**
   * Update part of the application context and notify subscribers
   */
  update<K extends keyof AppContext>(
    key: K,
    value: AppContext[K],
    event: ContextSubKey
  ) {
    this._ctx[key] = value;

    this.saveState();
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
   * Get a snapshot of the current context
   */
  get context(): AppContext {
    return { ...this._ctx };
  }

  /**
   * Clear context and localStorage
   */
  clear() {
    this._ctx = {
      sideBarActiveElement: null,
      fileExplorerOpenedNodes: null,
      selectedDirectoryFolderPath: null,
      activeFileOpen: null,
    };
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    this.notify('side-bar-active-element');
    this.notify('file-explorer-opene-nodes');
    this.notify('selected-director-folder-path');
    this.notify('active-open-file');
  }
}
