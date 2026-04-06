import {
  Component,
  computed,
  inject,
  OnInit,
  Signal,
  signal,
} from "@angular/core";
import { EditorTerminalTabItemComponent } from "../editor-terminal-tab-item/editor-terminal-tab-item.component";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EditorStateService } from "../core/state/editor-state.service";
import { getElectronApi } from "../../../shared/electron";
import { EditorInMemoryStateService } from "../core/state/editor-in-memory-state.service";
import { EditorWorkspaceService } from "../core/workspace/editor-workspace.service";

/**
 * Holds the active tabs and allows crud operations on them
 */
@Component({
  selector: "app-editor-terminal-tabs",
  imports: [
    EditorTerminalTabItemComponent,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: "./editor-terminal-tabs.component.html",
  styleUrl: "./editor-terminal-tabs.component.css",
})
export class EditorTerminalTabsComponent {
  private readonly editorStateService = inject(EditorStateService);
  private readonly editorInMemoryStateService = inject(
    EditorInMemoryStateService,
  );
  private readonly electronApi = getElectronApi();
  private readonly editorWorkspaceService = inject(EditorWorkspaceService);

  /**
   * Holds state for creating terminal
   */
  public readonly isCreatingTerminal = signal(false);

  /**
   * Keeps track of all the active shell PID's
   */
  public readonly activeShells: Signal<number[]> = computed(
    () => this.editorInMemoryStateService.shells() ?? [],
  );

  /**
   * Creats a new terminal in the selected directory path or default path if it not defined
   */
  public async createNewTerminal() {
    try {
      this.isCreatingTerminal.set(true);

      let directory: string | null = this.editorWorkspaceService.workspace();
      if (!directory || !(await this.electronApi.fsApi.exists(directory))) {
        directory = await this.electronApi.pathApi.getDefaultProfilePath();
      }

      const pid = await this.electronApi.shellApi.create(directory);
      if (pid === -1) {
        console.error("Failed to create terminal at directory ", directory);
        return;
      }

      const currentShellPids = this.editorInMemoryStateService.shells() ?? [];
      currentShellPids.push(pid);
      this.editorInMemoryStateService.shells.set(
        structuredClone(currentShellPids),
      );

      this.editorInMemoryStateService.currentActiveShellId.set(pid);
    } catch (error) {
      console.error("Failed to create terminal ", error);
    } finally {
      this.isCreatingTerminal.set(false);
    }
  }
}
