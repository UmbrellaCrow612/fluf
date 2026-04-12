import { inject, Injectable } from "@angular/core";
import { EditorWorkspaceService } from "../workspace/editor-workspace.service";
import { EditorOpenFilesService } from "../../editor-open-files/services/editor-open-files.service";
import { EditorFileExplorerService } from "../../editor-file-explorer/services/editor-file-explorer.service";

/**
 * Used to hydrate all editor application wide services that need hydration to be hydrated beofre the app starts
 */
@Injectable({
  providedIn: "root",
})
export class EditorHydrationService {
  private readonly editorWorkspaceService = inject(EditorWorkspaceService);
  private readonly editorOpenFilesService = inject(EditorOpenFilesService);
  private readonly editorFileExplorerService = inject(
    EditorFileExplorerService,
  );

  /**
   * Attempts to hydrate all services
   */
  public async hydrate(): Promise<void> {
    await Promise.all([
      this.trySafeHydrate(() => this.editorWorkspaceService.hydrate()),
      this.trySafeHydrate(() => this.editorOpenFilesService.hydrate()),
      this.trySafeHydrate(() => this.editorFileExplorerService.hydrate()),
    ]);
  }

  /**
   * Attempts to call hydrate in safe way
   * @param callback The hydrate function call
   */
  private async trySafeHydrate(callback: () => void | Promise<void>) {
    try {
      await callback();
    } catch (error) {
      console.error("[EditorHydrationService] Failed to rehydrate:", error);
    }
  }
}
