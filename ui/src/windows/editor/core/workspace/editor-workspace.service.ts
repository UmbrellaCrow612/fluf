import { inject, Injectable, signal } from "@angular/core";
import { getElectronApi } from "../../../../shared/electron";
import { ApplicationLocalStorageService } from "../../../../shared/services/application-local-storage.service";
import { normalize } from "../../../../lib/path";
import { fileNode } from "../../../../gen/type";

const WORKSPACE_KEY = "editor-workspace";
const WORKSPACE_DOCUMENT_KEY = "editor-workspace-document";
const WORKSPACE_AUTO_SAVE_KEY = "editor-workspace-auto-save";

/**
 * Manages the workspace in the editor i.e selected directory
 */
@Injectable({
  providedIn: "root",
})
export class EditorWorkspaceService {
  private readonly electronApi = getElectronApi();
  private readonly applicationLocalStorageService = inject(
    ApplicationLocalStorageService,
  );

  /**
   * Backing signal
   */
  private readonly _workspace = signal<string | null>(null);

  /**
   * Readonly signal with latest workspace
   */
  public readonly workspace = this._workspace.asReadonly();

  /**
   * Backing signal
   */
  private readonly _document = signal<fileNode | null>(null);

  /**
   * Readonly signal with the latest document in workspace
   */
  public readonly document = this._document.asReadonly();

  /**
   * Backing signal for auto save
   */
  private readonly _autoSave = signal<boolean | null>(null);

  /**
   * Readonly signal for if auto save is on
   */
  public readonly autoSave = this._autoSave.asReadonly();

  /**
   * Backing signal for control save
   */
  private readonly _controlSave = signal(0);

  /**
   * Readonly signal when control save is triggered any number above 0 means it is triggered
   */
  public readonly controlSave = this._controlSave.asReadonly();

  /**
   * Backing signal to if the directory should be refreshed
   */
  private readonly _refresh = signal(0);

  /**
   * Readonly signal to indicate if it should refresh
   */
  public readonly refresh = this._refresh.asReadonly();

  /**
   * Backing signal for resizing the editor in the workspace
   */
  private readonly _resize = signal(0);

  /**
   * Readonly signal when the editor is resized
   */
  public readonly resize = this._resize.asReadonly();

  /**
   * Trigger a control save
   */
  public triggerControlSave(): void {
    this._controlSave.update((x) => x + 1);
  }

  /**
   * Hydrates the workspace and document from persisted storage.
   * Call this once during app initialisation instead of relying on the constructor.
   */
  public async hydrate(): Promise<void> {
    try {
      await Promise.all([
        this.hydrateWorkspace(),
        this.hydrateDocument(),
        this.hydrateAutoSave(),
      ]);
    } catch (error) {
      console.error("[EditorWorkspaceService] Failed to rehydrate: ", error);
    }
  }

  /**
   * Hydrates auto save value
   */
  private async hydrateAutoSave() {
    try {
      await this.setAutoSave(
        this.applicationLocalStorageService.get<boolean | null>(
          WORKSPACE_AUTO_SAVE_KEY,
        ),
      );
    } catch (error) {
      console.error(
        "[EditorWorkspaceService] Failed to hydrate auto save ",
        error,
      );
    }
  }

  /**
   * Set the auto save value
   * @param value The value fo set auto save to
   */
  private async setAutoSave(value: boolean | null): Promise<void> {
    const type = typeof value;
    if (type !== "boolean") {
      this._autoSave.set(false);
      this.saveAutoSave(value);
      return;
    }

    this._autoSave.set(value);
    this.saveAutoSave(value);
  }

  /**
   * Persist the auto save value
   * @param value The value
   */
  private saveAutoSave(value: boolean | null) {
    this.applicationLocalStorageService.set(WORKSPACE_AUTO_SAVE_KEY, value);
  }

  /**
   * Rehydrate the saved document
   */
  private async hydrateDocument(): Promise<void> {
    try {
      await this.setDocument(
        this.applicationLocalStorageService.get<fileNode | null>(
          WORKSPACE_DOCUMENT_KEY,
        ),
      );
    } catch (error) {
      console.error(
        "[EditorWorkspaceService] Failed to rehydrate document:",
        error,
      );
    }
  }

  /**
   * Trigger a refresh
   */
  public refreshWorkspace() {
    this._refresh.update((x) => x + 1);
  }

  /**
   * Triggeres a resize event
   */
  public resized() {
    this._resize.update((x) => x + 1);
  }

  /**
   * Change the current document shown in the workspace
   * @param document The document
   */
  public async changeDocument(document: fileNode | null): Promise<void> {
    try {
      const current = this._document();
      if (
        current &&
        document &&
        normalize(document.path) === normalize(current.path)
      ) {
        return;
      }

      await this.setDocument(document);
    } catch (error) {
      console.error(
        "[EditorWorkspaceService] Failed to change document:",
        error,
      );
    }
  }

  /**
   * Set the given document as the new document in the workspace
   * @param document The document
   */
  private async setDocument(document: fileNode | null): Promise<void> {
    try {
      const valid = await this.isValidDocument(document);
      if (!valid || !document) {
        this._document.set(null);
        this.saveDocument(null);
        return;
      }

      this._document.set(document);
      this.saveDocument(document);
    } catch (error) {
      console.error("[EditorWorkspaceService] Failed to set document:", error);
      this._document.set(null);
      this.saveDocument(null);
    }
  }

  /**
   * Check if the document is valid
   * @param document The document
   * @returns If the document is valid
   */
  private async isValidDocument(document: fileNode | null): Promise<boolean> {
    if (!document) {
      return false;
    }

    if (typeof document !== "object") {
      return false;
    }

    try {
      const exists = await this.electronApi.fsApi.exists(document.path);
      if (!exists) {
        return false;
      }
    } catch (error) {
      console.error(
        "[EditorWorkspaceService] Failed to check if document exists:",
        document.path,
        error,
      );
      return false;
    }

    return true;
  }

  /**
   * Save the document between sessions
   * @param document The document
   */
  private saveDocument(document: fileNode | null): void {
    this.applicationLocalStorageService.set<fileNode | null>(
      WORKSPACE_DOCUMENT_KEY,
      document,
    );
  }

  /**
   * Rehydrate the saved workspace
   */
  private async hydrateWorkspace(): Promise<void> {
    try {
      await this.setWorkspace(
        this.applicationLocalStorageService.get<string | null>(WORKSPACE_KEY),
      );
    } catch (error) {
      console.error(
        "[EditorWorkspaceService] Failed to rehydrate workspace:",
        error,
      );
    }
  }

  /**
   * Change the workspace folder
   * @param workspace The new workspace folder
   */
  public async changeWorkspace(workspace: string | null): Promise<void> {
    try {
      const current = this._workspace();
      if (workspace && current && normalize(current) === normalize(workspace)) {
        return;
      }

      await this.setWorkspace(workspace);
    } catch (error) {
      console.error(
        "[EditorWorkspaceService] Failed to change workspace:",
        error,
      );
    }
  }

  /**
   * Validates the workspace folder
   * @param workspace The workspace folder
   */
  private async setWorkspace(workspace: string | null): Promise<void> {
    try {
      const valid = await this.isValidWorkspace(workspace);
      if (!valid || !workspace) {
        this._workspace.set(null);
        this.saveWorkspace(null);
        return;
      }

      const normalized = await this.electronApi.pathApi.normalize(workspace);
      this.saveWorkspace(normalized);
      this._workspace.set(normalized);
    } catch (error) {
      console.error("[EditorWorkspaceService] Failed to set workspace:", error);
      this._workspace.set(null);
      this.saveWorkspace(null);
    }
  }

  /**
   * Save the workspace value between sessions
   * @param value Value to persist between sessions
   */
  private saveWorkspace(value: string | null): void {
    this.applicationLocalStorageService.set<string | null>(
      WORKSPACE_KEY,
      value,
    );
  }

  /**
   * Validates a workspace is a valid value
   * @param workspace The workspace path
   * @returns Promise if the workspace is valid value
   */
  private async isValidWorkspace(workspace: string | null): Promise<boolean> {
    if (workspace === null) {
      return false;
    }

    if (typeof workspace !== "string") {
      return false;
    }

    try {
      const exists = await this.electronApi.fsApi.exists(workspace);
      if (!exists) {
        return false;
      }
    } catch (error) {
      console.error(
        "[EditorWorkspaceService] Failed to check if workspace exists:",
        workspace,
        error,
      );
      return false;
    }

    return true;
  }
}
