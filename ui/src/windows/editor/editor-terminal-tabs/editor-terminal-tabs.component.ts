import { Component, inject, signal } from "@angular/core";
import { EditorTerminalTabItemComponent } from "../editor-terminal-tab-item/editor-terminal-tab-item.component";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EditorTerminalService } from "../core/terminal/editor-terminal.service";

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
  private readonly editorTerminalService = inject(EditorTerminalService);

  /**
   * Holds state for creating terminal
   */
  public readonly isCreatingTerminal = signal(false);

  /**
   * Keeps track of all the active shell PID's
   */
  public readonly activeShells = this.editorTerminalService.shellPidInfoMap;

  /**
   * Creats a new terminal in the selected directory path or default path if it not defined
   */
  public async createNewTerminal() {
    try {
      this.isCreatingTerminal.set(true);

      const res = await this.editorTerminalService.createShell(); // tood allow dropdown select specific shell when creating
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
