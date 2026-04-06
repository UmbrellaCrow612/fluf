import { effect, Injectable, signal } from "@angular/core";
import { EditorState } from "./type";

const LOCAL_STORAGE_KEY = "editor-app-context";

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
  providedIn: "root",
})
export class EditorStateService {
  /**
   * Exposes fileExplorerActiveFileOrFolder signal
   */
  public readonly fileExplorerActiveFileOrFolder = signal<
    EditorState["fileExplorerActiveFileOrFolder"]
  >(this.restoreField("fileExplorerActiveFileOrFolder", null));

  /**
   * Exposes currentOpenFileInEditor signal
   */
  public readonly currentOpenFileInEditor = signal<
    EditorState["currentOpenFileInEditor"]
  >(this.restoreField("currentOpenFileInEditor", null));

  /**
   * Exposes the editorMainActiveElement signal
   */
  public readonly editorMainActiveElement = signal<
    EditorState["editorMainActiveElement"]
  >(this.restoreField("editorMainActiveElement", null));

  /**
   * Exposes editorTheme signal
   */
  public readonly editorTheme = signal<EditorState["editorTheme"]>(
    this.restoreField("editorTheme", null),
  );

  /**
   * Exposes auto save signal
   */
  public readonly autoSave = signal<EditorState["autoSave"]>(
    this.restoreField("autoSave", false),
  );

  /**
   * Exposes scrollToDefinitionLocation signal
   */
  public readonly scrollToDefinitionLocation = signal<
    EditorState["scrollToDefinitionLocation"]
  >(this.restoreField("scrollToDefinitionLocation", null));

  constructor() {
    effect(() => {
      const snapshot = this.getSnapShot();
      this.persist(snapshot);
    });
  }

  /**
   * Reads the signals and then saves them
   */
  private persist(data: EditorState) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn("[ContextService] Failed to persist context", err);
    }
  }

  public getSnapShot(): EditorState {
    return {
      currentOpenFileInEditor: this.currentOpenFileInEditor(),
      editorMainActiveElement: this.editorMainActiveElement(),
      fileExplorerActiveFileOrFolder: this.fileExplorerActiveFileOrFolder(),
      editorTheme: this.editorTheme(),
      autoSave: this.autoSave(),
      scrollToDefinitionLocation: this.scrollToDefinitionLocation(),
    };
  }

  /**
   * Resets the state of all fields to their default
   */
  public reset() {
    this.fileExplorerActiveFileOrFolder.set(null);
    this.currentOpenFileInEditor.set(null);
    this.editorMainActiveElement.set(null);
    this.editorTheme.set(null);
    this.autoSave.set(false);
    this.scrollToDefinitionLocation.set(null);
  }

  /**
   * Restore the state of a given field
   * @param key The specific field to restore
   * @param fallback A fallback value if it's invalid
   * @returns Value
   */
  private restoreField<K extends keyof EditorState>(
    key: K,
    fallback: EditorState[K],
  ): EditorState[K] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return fallback;

      const saved = JSON.parse(raw) as Partial<EditorState>;
      return saved[key] ?? fallback;
    } catch {
      return fallback;
    }
  }
}
