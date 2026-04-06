import { AfterViewInit, Component, inject, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { getElectronApi } from "../../../shared/electron";
import { EditorStateService } from "../core/state/editor-state.service";
import { EditorSidebarPaneService } from "../core/panes/editor-sidebar-pane.service";
import { EditorWorkspaceService } from "../core/services/editor-workspace.service";

/**
 * Shown when there isnt any select directory and allows users to select a directory
 */
@Component({
  selector: "app-editor-select-directory",
  imports: [MatButtonModule],
  templateUrl: "./editor-select-directory.component.html",
  styleUrl: "./editor-select-directory.component.css",
})
export class EditorSelectDirectoryComponent implements AfterViewInit {
  private readonly electronApi = getElectronApi();
  private readonly editorStateService = inject(EditorStateService);
  private readonly editorSidebarPaneService = inject(EditorSidebarPaneService);
  private readonly editorWorkspaceService = inject(EditorWorkspaceService);

  public ngAfterViewInit() {
    this.editorSidebarPaneService.resolvePane();
  }

  /**
   * Holds state when user is choosing a directory
   */
  public isSelecting = signal(false);

  /**
   * Holds error state when selecting a directory
   */
  public selectionError = signal<string | null>(null);

  /**
   * Attempts to select a directory
   */
  public async selectDirectory() {
    try {
      this.isSelecting.set(true);
      this.selectionError.set(null);

      const value = await this.electronApi.fsApi.selectFolder();
      if (value.canceled) {
        this.selectionError.set(`Canceled selection`);
        return;
      }

      const dir = value.filePaths[0];
      if (!dir) {
        this.selectionError.set(`No directory path`);
        return;
      }

      const exists = await this.electronApi.fsApi.exists(dir);
      if (!exists) {
        this.selectionError.set(`Directory not found`);
        return;
      }

      await this.editorWorkspaceService.changeWorkspace(dir);
    } catch (error: any) {
      console.error("Failed to select directory ", error);
      this.selectionError.set(`Failed to select directory ${error?.message}`);
    } finally {
      this.isSelecting.set(false);
    }
  }
}
