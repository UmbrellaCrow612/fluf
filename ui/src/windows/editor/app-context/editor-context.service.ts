import { effect, Injectable, signal } from '@angular/core';
import { EditorAppContext } from './type';

const LOCAL_STORAGE_KEY = 'editor-app-context';

/**
 * Service that provides access to application context, persists it.
 *
 * Think of it as a central store that can be accessed from anywhere for application wide state
 *
 * SHOULD not use any other services as it's a base service
 */
@Injectable({
  providedIn: 'root',
})
export class EditorContextService {
  constructor() {
    effect(() => {
      this.persist();
    });
  }

  /**
   * Reads the signals and then saves them
   */
  private persist() {
    const snapshot = this.getSnapShot();
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
    } catch (err) {
      console.warn('[ContextService] Failed to persist context', err);
    }
  }

  getSnapShot(): EditorAppContext {
    return {
      sideBarActiveElement: this.sideBarActiveElement(),
      currentOpenFileInEditor: this.currentOpenFileInEditor(),
      directoryFileNodes: this.directoryFileNodes(),
      displayFileEditorBottom: this.displayFileEditorBottom(),
      editorMainActiveElement: this.editorMainActiveElement(),
      fileEditorBottomActiveElement: this.fileEditorBottomActiveElement(),
      fileExplorerActiveFileOrFolder: this.fileExplorerActiveFileOrFolder(),
      openFiles: this.openFiles(),
      selectedDirectoryPath: this.selectedDirectoryPath(),
      editorTheme: this.editorTheme(),
    };
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

  /**
   * Exposes sideBarActiveElement signal
   */
  readonly sideBarActiveElement = signal<EditorAppContext['sideBarActiveElement']>(
    this.restoreField('sideBarActiveElement', null),
  );

  /**
   * Exposes directoryFileNodes signal
   */
  readonly directoryFileNodes = signal<EditorAppContext['directoryFileNodes']>(
    this.restoreField('directoryFileNodes', null),
  );

  /**
   * Exposes selectedDirectoryPath signal
   */
  readonly selectedDirectoryPath = signal<EditorAppContext['selectedDirectoryPath']>(
    this.restoreField('selectedDirectoryPath', null),
  );

  /**
   * Exposes fileExplorerActiveFileOrFolder signal
   */
  readonly fileExplorerActiveFileOrFolder = signal<
    EditorAppContext['fileExplorerActiveFileOrFolder']
  >(this.restoreField('fileExplorerActiveFileOrFolder', null));

  /**
   * Exposes openFiles signal
   */
  readonly openFiles = signal<EditorAppContext['openFiles']>(
    this.restoreField('openFiles', null),
  );

  /**
   * Exposes currentOpenFileInEditor signal
   */
  readonly currentOpenFileInEditor = signal<
    EditorAppContext['currentOpenFileInEditor']
  >(this.restoreField('currentOpenFileInEditor', null));

  /**
   * Exposes displayFileEditorBottom signal
   */
  readonly displayFileEditorBottom = signal<
    EditorAppContext['displayFileEditorBottom']
  >(this.restoreField('displayFileEditorBottom', null));

  /**
   * Exposes fileEditorBottomActiveElement signal
   */
  readonly fileEditorBottomActiveElement = signal<
    EditorAppContext['fileEditorBottomActiveElement']
  >(this.restoreField('fileEditorBottomActiveElement', null));

  /**
   * Exposes the editorMainActiveElement signal
   */
  readonly editorMainActiveElement = signal<
    EditorAppContext['editorMainActiveElement']
  >(this.restoreField('editorMainActiveElement', null));

  /**
   * Exposes editorTheme signal
   */
  readonly editorTheme = signal<EditorAppContext['editorTheme']>(
    this.restoreField('editorTheme', null),
  );
}
