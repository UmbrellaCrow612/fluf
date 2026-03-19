import { effect, Injectable, signal } from '@angular/core';
import { EditorAppContext } from './type';

const LOCAL_STORAGE_KEY = 'editor-app-context';

/**
 * Central state management service for the editor application.
 *
 * Maintains application-wide state using Angular signals and automatically
 * persists state to localStorage for session continuity across reloads.
 *
 * @remarks
 * This is a base service that should not depend on other services to avoid
 * circular dependencies. All state is restored from localStorage on initialization.
 *
 * @example
 * // Access current state
 * const currentFile = this.editorState.currentOpenFileInEditor();
 *
 * // Update state
 * this.editorState.sideBarActiveElement.set('explorer');
 */
@Injectable({
  providedIn: 'root',
})
export class EditorStateService {
  /**
   * Exposes sideBarActiveElement signal
   */
  public readonly sideBarActiveElement = signal<
    EditorAppContext['sideBarActiveElement']
  >(this.restoreField('sideBarActiveElement', null));

  /**
   * Exposes directoryFileNodes signal
   */
  public readonly directoryFileNodes = signal<
    EditorAppContext['directoryFileNodes']
  >(this.restoreField('directoryFileNodes', null));

  /**
   * Exposes selectedDirectoryPath signal
   */
  public readonly selectedDirectoryPath = signal<
    EditorAppContext['selectedDirectoryPath']
  >(this.restoreField('selectedDirectoryPath', null));

  /**
   * Exposes fileExplorerActiveFileOrFolder signal
   */
  public readonly fileExplorerActiveFileOrFolder = signal<
    EditorAppContext['fileExplorerActiveFileOrFolder']
  >(this.restoreField('fileExplorerActiveFileOrFolder', null));

  /**
   * Exposes openFiles signal
   */
  public readonly openFiles = signal<EditorAppContext['openFiles']>(
    this.restoreField('openFiles', null),
  );

  /**
   * Exposes currentOpenFileInEditor signal
   */
  public readonly currentOpenFileInEditor = signal<
    EditorAppContext['currentOpenFileInEditor']
  >(this.restoreField('currentOpenFileInEditor', null));

  /**
   * Exposes displayFileEditorBottom signal
   */
  public readonly displayFileEditorBottom = signal<
    EditorAppContext['displayFileEditorBottom']
  >(this.restoreField('displayFileEditorBottom', null));

  /**
   * Exposes fileEditorBottomActiveElement signal
   */
  public readonly editorBottomActiveElement = signal<
    EditorAppContext['editorBottomActiveElement']
  >(this.restoreField('editorBottomActiveElement', null));

  /**
   * Exposes the editorMainActiveElement signal
   */
  public readonly editorMainActiveElement = signal<
    EditorAppContext['editorMainActiveElement']
  >(this.restoreField('editorMainActiveElement', null));

  /**
   * Exposes editorTheme signal
   */
  public readonly editorTheme = signal<EditorAppContext['editorTheme']>(
    this.restoreField('editorTheme', null),
  );

  constructor() {
    effect(() => {
      const snapshot = this.getSnapShot();
      this.persist(snapshot);
    });
  }

  /**
   * Reads the signals and then saves them
   */
  private persist(data: EditorAppContext) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('[ContextService] Failed to persist context', err);
    }
  }

  public getSnapShot(): EditorAppContext {
    return {
      sideBarActiveElement: this.sideBarActiveElement(),
      currentOpenFileInEditor: this.currentOpenFileInEditor(),
      directoryFileNodes: this.directoryFileNodes(),
      displayFileEditorBottom: this.displayFileEditorBottom(),
      editorMainActiveElement: this.editorMainActiveElement(),
      editorBottomActiveElement: this.editorBottomActiveElement(),
      fileExplorerActiveFileOrFolder: this.fileExplorerActiveFileOrFolder(),
      openFiles: this.openFiles(),
      selectedDirectoryPath: this.selectedDirectoryPath(),
      editorTheme: this.editorTheme(),
    };
  }

  /**
   * Resets the state of all fields to their default
   */
  public reset() {
    this.sideBarActiveElement.set(null);
    this.directoryFileNodes.set(null);
    this.selectedDirectoryPath.set(null);
    this.fileExplorerActiveFileOrFolder.set(null);
    this.openFiles.set(null);
    this.currentOpenFileInEditor.set(null);
    this.displayFileEditorBottom.set(null);
    this.editorBottomActiveElement.set(null);
    this.editorMainActiveElement.set(null);
    this.editorTheme.set(null);
  }

  /**
   * Restore the state of a given field
   * @param key The specific field to restore
   * @param fallback A fallback value if it's invalid
   * @returns Value
   */
  private restoreField<K extends keyof EditorAppContext>(
    key: K,
    fallback: EditorAppContext[K],
  ): EditorAppContext[K] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return fallback;

      const saved = JSON.parse(raw) as Partial<EditorAppContext>;
      return saved[key] ?? fallback;
    } catch {
      return fallback;
    }
  }
}
