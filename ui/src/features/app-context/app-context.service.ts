import { DestroyRef, Injectable } from '@angular/core';
import { fileEditorBottomActiveElement, sideBarActiveElement } from './type';

export type AppContext = {
  /**
   * Current active sidebar element
   */
  sideBarActiveElement: sideBarActiveElement;

  /**
   * List of nodes read from the selected directory
   */
  directoryFileNodes: Array<fileNode> | null;

  /**
   * Folder path selected in the editor
   */
  selectedDirectoryPath: string | null;

  /**
   * The current focused / last clicked or last edited file (from editor) in the file explorer tree
   */
  fileExplorerActiveFileOrFolder: fileNode | null;

  /**
   * Represents whether a file or folder creator is active
   */
  isCreateFileOrFolderActive: boolean | null;

  /**
   * Indicates if it should refresh / reread nodes and update the current nodes with updated folder nodes -
   * keeps expanded state and adds / removes children based on new state
   */
  refreshDirectory: boolean | null;

  /**
   * Indicates that the right-click context menu on a file explorer item should be displayed -
   * think of this as simply a trigger you push values to, and the context menu will react when you want to display or hide it
   */
  displayFileExplorerContextMenu: boolean | null;

  /**
   * The node to process the context menu for — the trigger node the context menu was opened for
   */
  fileExplorerContextMenuFileNode: fileNode | null;

  /**
   * Set this before showing the context menu to indicate where it was clicked in the file explorer
   */
  fileExplorerContextMenuClickPosition: { x: number; y: number } | null;

  /**
   * List of open files in the editor to show in the open file tab bar
   */
  openFiles: fileNode[] | null;

  /**
   * The current file being displayed in the text file editor
   */
  currentOpenFileInEditor: fileNode | null;

  /**
   * Indicates if it should show the file editor bottom section, which contains the terminal, problems, etc.
   */
  displayFileEditorBottom: boolean | null;

  /**
   * The current active element in the file editor bottom container
   */
  fileEditorBottomActiveElement: fileEditorBottomActiveElement | null;

  /**
   * List of all terminals
   */
  terminals: terminalInformation[] | null

  /**
   * The current active terminal to see output and input cmds in
   */
  currentActiveTerminald:string | null;
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
    selectedDirectoryPath: null,
    directoryFileNodes: null,
    fileExplorerActiveFileOrFolder: null,
    isCreateFileOrFolderActive: null,
    refreshDirectory: null,
    displayFileExplorerContextMenu: null,
    fileExplorerContextMenuFileNode: null,
    fileExplorerContextMenuClickPosition: null,
    openFiles: null,
    currentOpenFileInEditor: null,
    displayFileEditorBottom: null,
    fileEditorBottomActiveElement: null,
    terminals: null,
    currentActiveTerminald:null
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
