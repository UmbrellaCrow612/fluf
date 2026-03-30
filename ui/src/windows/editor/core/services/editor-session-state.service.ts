import { Injectable } from '@angular/core';
import { EditorView } from '@codemirror/view';
import { EditorState, Extension } from '@codemirror/state';
import { historyField } from '@codemirror/commands';
import { normalize } from '../../../../lib/path';

/**
 * Cached editor state including CodeMirror state and UI state
 */
interface CachedEditorState {
  /** Serialized CodeMirror state (includes history, selection, doc) */
  editorStateJSON: any;
  /** Scroll position */
  scrollTop: number;
  /** Scroll left */
  scrollLeft: number;
  /** Timestamp of last access */
  lastAccessed: number;
}

/**
 * Service responsible for managing editor session state persistence.
 *
 * @description
 * This service caches CodeMirror editor states (including edit history, cursor position,
 * selection, and scroll position) to preserve user context when switching between files.
 * It implements an LRU (Least Recently Used) cache eviction policy to prevent memory leaks
 * by limiting the maximum number of cached states.
 *
 * @example
 * // Cache current state before switching files
 * const state = view.state.toJSON({ history: historyField });
 * sessionStateService.setCache('/path/to/file.ts', {
 *   editorStateJSON: state,
 *   scrollTop: view.scrollDOM.scrollTop,
 *   scrollLeft: view.scrollDOM.scrollLeft,
 *   lastAccessed: Date.now()
 * });
 *
 * // Restore state when returning to file
 * const view = sessionStateService.restoreCache(
 *   '/path/to/file.ts',
 *   containerElement,
 *   () => [basicSetup, javascript()]
 * );
 *
 * @see {@link https://codemirror.net/docs/guide/#state-persistence CodeMirror State Persistence}
 * @see EditorFileStateService
 * @see EditorDirtyFileService
 */
@Injectable({
  providedIn: 'root',
})
export class EditorSessionStateService {
  /**
   * Maximum number of cached states to prevent memory leaks.
   * When exceeded, the least recently accessed state is evicted.
   * @default 10
   * @readonly
   */
  private readonly MAX_CACHED_STATES = 10;

  /**
   * Cache of editor states keyed by normalized file path.
   * Preserves history, selection, and scroll position between file switches.
   * @private
   */
  private readonly stateCache = new Map<string, CachedEditorState>();

  /**
   * Restores a cached editor state for the given file path.
   *
   * @param filePath - The file path to restore state for
   * @param container - The DOM element to mount the EditorView into
   * @param getExtensions - Factory function returning CodeMirror extensions for the new state
   * @returns The restored EditorView instance, or null if no cache exists or restoration fails
   *
   * @description
   * Attempts to deserialize the cached CodeMirror state and create a new EditorView.
   * Updates the `lastAccessed` timestamp on successful restore.
   * Scroll position is restored asynchronously via requestAnimationFrame to ensure
   * the DOM is fully rendered.
   *
   * @remarks
   * Returns null if:
   * - No cached state exists for the file path
   * - The container element is null/undefined
   * - State deserialization fails (logs error to console)
   *
   * @example
   * const view = this.sessionStateService.restoreCache(
   *   filePath,
   *   this.editorContainer.nativeElement,
   *   () => this.getEditorExtensions()
   * );
   * if (view) {
   *   this.editorView = view;
   * } else {
   *   // Create new editor instance
   * }
   */
  public restoreCache(
    filePath: string,
    container: HTMLDivElement,
    getExtensions: () => Extension[],
  ): EditorView | null {
    const path = normalize(filePath);

    const cached = this.stateCache.get(path);
    if (!cached) return null;

    cached.lastAccessed = Date.now();

    if (!container) return null;

    try {
      const state = EditorState.fromJSON(
        cached.editorStateJSON,
        {
          extensions: getExtensions(),
        },
        {
          history: historyField,
        },
      );

      const view = new EditorView({
        state,
        parent: container,
      });

      requestAnimationFrame(() => {
        view.scrollDOM.scrollTop = cached.scrollTop;
        view.scrollDOM.scrollLeft = cached.scrollLeft;
      });

      return view;
    } catch (error) {
      console.error(
        '[EditorSessionStateService] Failed to restore cached state:',
        error,
      );
      return null;
    }
  }

  /**
   * Caches an editor state for the given file path.
   *
   * @param filePath - The file path to cache state for (will be normalized)
   * @param entry - The cached editor state containing serialized state and UI metadata
   *
   * @description
   * Stores the editor state in the cache and enforces the maximum cache size limit.
   * If the cache exceeds {@link MAX_CACHED_STATES}, the least recently accessed
   * entry is automatically evicted.
   *
   * @remarks
   * The file path is normalized before caching to ensure consistent lookup
   * regardless of path format variations.
   *
   * @example
   * this.sessionStateService.setCache(filePath, {
   *   editorStateJSON: this.editorView.state.toJSON({ history: historyField }),
   *   scrollTop: this.editorView.scrollDOM.scrollTop,
   *   scrollLeft: this.editorView.scrollDOM.scrollLeft,
   *   lastAccessed: Date.now()
   * });
   */
  public setCache(filePath: string, entry: CachedEditorState) {
    const path = normalize(filePath);
    this.stateCache.set(path, entry);
    this.enforceCacheLimit();
  }

  /**
   * Enforces the maximum cache size limit using LRU eviction.
   *
   * @private
   * @description
   * Iterates through all cached states to find the least recently accessed entry
   * and removes it when the cache size exceeds {@link MAX_CACHED_STATES}.
   * Logs evictions to the console for debugging purposes.
   *
   * @remarks
   * This method is called automatically after every {@link setCache} operation.
   * Time complexity is O(n) where n is the number of cached states.
   */
  private enforceCacheLimit() {
    if (this.stateCache.size <= this.MAX_CACHED_STATES) return;

    let oldestPath: string | null = null;
    let oldestTime = Infinity;

    for (const [path, state] of this.stateCache.entries()) {
      if (state.lastAccessed < oldestTime) {
        oldestTime = state.lastAccessed;
        oldestPath = path;
      }
    }

    if (oldestPath) {
      this.stateCache.delete(oldestPath);
      console.log(
        `[EditorSessionStateService] Evicted cached state for: ${oldestPath}`,
      );
    }
  }

  /**
   * Clears all cached editor states.
   *
   * @description
   * Removes all entries from the state cache. Useful when resetting the editor
   * environment or handling application-level state clearing.
   *
   * @example
   * // Clear all cached states on project switch
   * this.sessionStateService.clearCache();
   */
  public clearCache(): void {
    this.stateCache.clear();
    console.log('[EditorSessionStateService] Cache cleared');
  }

  /**
   * Removes a specific file's cached state.
   *
   * @param filePath - The file path to remove from cache
   * @returns True if an entry was removed, false otherwise
   *
   * @description
   * Deletes a specific cached state by file path. Useful when a file is closed
   * or deleted and its state should no longer be preserved.
   *
   * @example
   * // Remove cache when file is closed
   * this.sessionStateService.removeCache(filePath);
   */
  public removeCache(filePath: string): boolean {
    const path = normalize(filePath);
    return this.stateCache.delete(path);
  }

  /**
   * Checks if a cached state exists for the given file path.
   *
   * @param filePath - The file path to check
   * @returns True if a cached state exists, false otherwise
   */
  public hasCache(filePath: string): boolean {
    return this.stateCache.has(normalize(filePath));
  }

  /**
   * Gets the number of currently cached states.
   *
   * @returns The size of the state cache
   */
  public getCacheSize(): number {
    return this.stateCache.size;
  }
}
