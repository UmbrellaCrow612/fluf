import { computed, inject, Injectable, signal } from "@angular/core";
import { getElectronApi } from "../../../../shared/electron";
import { ApplicationLocalStorageService } from "../../../../shared/services/application-local-storage.service";
import { normalize } from "../../../../lib/path";

const LOCAL_STORAGE_KEY = "editor-workspace";

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
    this._workspace.set(
      this.applicationLocalStorageService.get<string | null>(LOCAL_STORAGE_KEY),
    );
    const workspace = this._workspace();
    this.setWorkspace(workspace);
  }

  /**
   * Backing signal
   */
  private readonly _workspace = signal<string | null>(null);

  /**
   * Readonly signal with latest workspace
   */
  public readonly workspace = computed(() => this._workspace());

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
      return;
    }

    const normalized = await this.electronApi.pathApi.normalize(workspace);
    this._workspace.set(normalized);

    this.applicationLocalStorageService.set<string>(
      LOCAL_STORAGE_KEY,
      normalized,
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
