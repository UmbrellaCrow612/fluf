import { Component, inject, OnInit, signal } from "@angular/core";
import { EditorTerminalTabItemComponent } from "../editor-terminal-tab-item/editor-terminal-tab-item.component";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EditorTerminalService } from "../core/terminal/editor-terminal.service";
import { MatMenuModule } from "@angular/material/menu";
import { getElectronApi } from "../../../shared/electron";
import { shellExecutableInformation } from "../../../gen/type";

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
    MatMenuModule,
  ],
  templateUrl: "./editor-terminal-tabs.component.html",
  styleUrl: "./editor-terminal-tabs.component.css",
})
export class EditorTerminalTabsComponent implements OnInit {
  private readonly editorTerminalService = inject(EditorTerminalService);
  private readonly electronApi = getElectronApi();

  /**
   * Holds state for creating terminal
   */
  public readonly isCreatingTerminal = signal(false);

  /**
   * Keeps track of all the active shell PID's
   */
  public readonly activeShells = this.editorTerminalService.shellPidInfoMap;

  /**
   * List of spawnable shells
   */
  public readonly shellExecutableInformations = signal<
    shellExecutableInformation[]
  >([]);

  public ngOnInit() {
    void this.fetchAndSetSpawnableExeOptions();
  }

  /**
   * Fetches the spawnable shell exes
   */
  private async fetchAndSetSpawnableExeOptions() {
    try {
      const options =
        await this.electronApi.shellApi.getShellSpawnExecutables();
      this.shellExecutableInformations.set(options);
    } catch (error) {
      console.error("Failed to get shell options ", error);
    }
  }

  /**
   * Creats a new terminal in the selected directory path or default path if it not defined
   * @param [exe=undefined] Custom exe to spawn
   */
  public async createNewTerminal(exe: string | undefined = undefined) {
    try {
      this.isCreatingTerminal.set(true);

      const res = await this.editorTerminalService.createShell(exe); // tood allow dropdown select specific shell when creating
      if (!res.successed) {
        throw new Error(res.reason);
      }
    } catch (error) {
      console.error("Failed to create terminal ", error);
    } finally {
      this.isCreatingTerminal.set(false);
    }
  }
}
