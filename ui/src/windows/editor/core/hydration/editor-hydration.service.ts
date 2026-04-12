import { inject, Injectable } from "@angular/core";
import { EditorWorkspaceService } from "../workspace/editor-workspace.service";

/**
 * Used to hydrate all editor application wide services that need hydration to be hydrated beofre the app starts
 */
@Injectable({
  providedIn: "root",
})
export class EditorHydrationService {
  private readonly editorWorkspaceService = inject(EditorWorkspaceService);

  /**
   * Attempts to hydrate all services
   */
  public async hydrate(): Promise<void> {
    await Promise.all([
      this.trySafeHydrate(() => this.editorWorkspaceService.hydrate()),
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
