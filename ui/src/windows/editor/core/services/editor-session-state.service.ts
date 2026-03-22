import { Injectable } from '@angular/core';
import { EditorView } from '@codemirror/view';
import { EditorState, Extension } from '@codemirror/state';
import { historyField } from '@codemirror/commands';
import { normalizePath } from '../../../../shared/path-uri-helpers';

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
 * Holds editor view session state for a given file these contain the edit history cursour position etc
 */
@Injectable({
  providedIn: 'root',
})
export class EditorSessionStateService {
  /**
   * Maximum number of cached states to prevent memory leaks
   */
  private readonly MAX_CACHED_STATES = 10;

  /**
   * Cache of editor states by file path
   * Preserves history, selection, and scroll position
   */
  private readonly stateCache = new Map<string, CachedEditorState>();

  public restoreChace(
    filePath: string,
    container: HTMLDivElement,
    getExtensions: () => Extension[],
  ): EditorView | null {
    const path = normalizePath(filePath);

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

  public setChace(filePath: string, entry: CachedEditorState) {
    const path = normalizePath(filePath);
    this.stateCache.set(path, entry);
    this.enforceCahceLimit();
  }

  private enforceCahceLimit() {
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
      console.log(`[EditorSessionStateService] Evicted cached state for: ${oldestPath}`);
    }
  }
}
