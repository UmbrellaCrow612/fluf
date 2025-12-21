import { effect, Injectable, signal } from '@angular/core';
import { AppContext } from './type';

const LOCAL_STORAGE_KEY = 'app-context';

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
export class ContextService {
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

  getSnapShot(): AppContext {
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
    };
  }

  /**
   * Restore the state of a given field
   * @param key The specific field to restore
   * @param fallback A fallback value if it's invalid
   * @returns Value
   */
  private restoreField<K extends keyof AppContext>(
    key: K,
    fallback: AppContext[K]
  ): AppContext[K] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return fallback;

      const saved = JSON.parse(raw) as Partial<AppContext>;
      return saved[key] ?? fallback;
    } catch {
      return fallback;
    }
  }

  /**
   * Exposes sideBarActiveElement signal
   */
  readonly sideBarActiveElement = signal<AppContext['sideBarActiveElement']>(
    this.restoreField('sideBarActiveElement', null)
  );

  /**
   * Exposes directoryFileNodes signal
   */
  readonly directoryFileNodes = signal<AppContext['directoryFileNodes']>(
    this.restoreField('directoryFileNodes', null)
  );

  /**
   * Exposes selectedDirectoryPath signal
   */
  readonly selectedDirectoryPath = signal<AppContext['selectedDirectoryPath']>(
    this.restoreField('selectedDirectoryPath', null)
  );

  /**
   * Exposes fileExplorerActiveFileOrFolder signal
   */
  readonly fileExplorerActiveFileOrFolder = signal<
    AppContext['fileExplorerActiveFileOrFolder']
  >(this.restoreField('fileExplorerActiveFileOrFolder', null));

  /**
   * Exposes openFiles signal
   */
  readonly openFiles = signal<AppContext['openFiles']>(
    this.restoreField('openFiles', null)
  );

  /**
   * Exposes currentOpenFileInEditor signal
   */
  readonly currentOpenFileInEditor = signal<
    AppContext['currentOpenFileInEditor']
  >(this.restoreField('currentOpenFileInEditor', null));

  /**
   * Exposes displayFileEditorBottom signal
   */
  readonly displayFileEditorBottom = signal<
    AppContext['displayFileEditorBottom']
  >(this.restoreField('displayFileEditorBottom', null));

  /**
   * Exposes fileEditorBottomActiveElement signal
   */
  readonly fileEditorBottomActiveElement = signal<
    AppContext['fileEditorBottomActiveElement']
  >(this.restoreField('fileEditorBottomActiveElement', null));

  /**
   * Exposes the editorMainActiveElement signal
   */
  readonly editorMainActiveElement = signal<
    AppContext['editorMainActiveElement']
  >(this.restoreField('editorMainActiveElement', null));
}
