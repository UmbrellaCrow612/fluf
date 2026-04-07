import { inject, Injectable, signal } from "@angular/core";
import { getElectronApi } from "../../../../shared/electron";
import { ApplicationLocalStorageService } from "../../../../shared/services/application-local-storage.service";
import { normalize } from "../../../../lib/path";
import { fileNode } from "../../../../gen/type";

const WORKSPACE_KEY = "editor-workspace";
const WORKSPACE_DOCUMENT_KEY = "editor-workspace-document";

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

  constructor() {
    this.rehydrateWorkspace();
    this.rehydrateDocument();
  }

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
   * Rehydrate the saved document
   */
  private async rehydrateDocument() {
    await this.setDocument(
      this.applicationLocalStorageService.get<fileNode | null>(
        WORKSPACE_DOCUMENT_KEY,
      ),
    );
  }

  /**
   * Change the current document shown in the workspace
   * @param document The document
   */
  public async changeDocument(document: fileNode | null): Promise<void> {
    const current = this._document();
    if (
      current &&
      document &&
      normalize(document.path) === normalize(current.path)
    ) {
      return;
    }

    await this.setDocument(document);
  }

  /**
   * Set the given document as the new document in the workspace
   * @param document The document
   */
  private async setDocument(document: fileNode | null): Promise<void> {
    const valid = await this.isValidDocument(document);
    if (!valid || !document) {
      this._document.set(null);
      this.saveDocument(null);
      return;
    }

    this._document.set(document);
    this.saveDocument(document);
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

    const exists = await this.electronApi.fsApi.exists(document.path);
    if (!exists) {
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
  private async rehydrateWorkspace(): Promise<void> {
    await this.setWorkspace(
      this.applicationLocalStorageService.get<string | null>(WORKSPACE_KEY),
    );
  }

  /**
   * Change the workspace folder
   * @param workspace The new workspace folder
   */
  public async changeWorkspace(workspace: string | null): Promise<void> {
    const current = this._workspace();
    if (workspace && current && normalize(current) === normalize(workspace)) {
      return;
    }

    await this.setWorkspace(workspace);
  }

  /**
   * Validates the workspace folder
   * @param workspace The workspace folder
   */
  private async setWorkspace(workspace: string | null): Promise<void> {
    const valid = await this.isValidWorkspace(workspace);
    if (!valid || !workspace) {
      this._workspace.set(null);
      this.saveWorkspace(null);
      return;
    }

    const normalized = await this.electronApi.pathApi.normalize(workspace);
    this.saveWorkspace(normalized);

    this._workspace.set(normalized);
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

    const type = typeof workspace;
    if (type !== "string") {
      return false;
    }

    const exists = await this.electronApi.fsApi.exists(workspace);
    if (!exists) {
      return false;
    }

    return true;
  }
}
