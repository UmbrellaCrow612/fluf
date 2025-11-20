import { DestroyRef, Injectable } from '@angular/core';
import {
  AppContext,
  AppContextCallback,
} from './type';


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
    selectedDirectoryPath: null,
    directoryFileNodes: null,
    fileExplorerActiveFileOrFolder: null,
    openFiles: null,
    currentOpenFileInEditor: null,
    displayFileEditorBottom: null,
    fileEditorBottomActiveElement: null,
    shells: null,
    currentActiveShellId: null,
  };

  private subscriptions = new Map<keyof AppContext, Set<AppContextCallback>>();

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
    callback: AppContextCallback
  ): voidCallback {
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
    callback: AppContextCallback,
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
