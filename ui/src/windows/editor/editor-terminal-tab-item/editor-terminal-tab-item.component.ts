import {
  Component,
  computed,
  inject,
  input,
  signal,
  Signal,
} from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EditorTerminalService } from "../core/terminal/editor-terminal.service";
import { shellInformation } from "../../../gen/type";

@Component({
  selector: "app-editor-terminal-tab-item",
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: "./editor-terminal-tab-item.component.html",
  styleUrl: "./editor-terminal-tab-item.component.css",
})
export class EditorTerminalTabItemComponent {
  private readonly editorTerminalService = inject(EditorTerminalService);

  /**
   * Text to render in the tab item
   */
  public readonly label = input.required<string>();

  /**
   * Holds the PID of the shell that is being rendered
   */
  public readonly shellInformation = input.required<shellInformation>();

  /**
   * Keeps track if the given terminal tab item is the active one
   */
  public readonly isActive: Signal<boolean> = computed(
    () =>
      this.editorTerminalService.activeShellPid() ===
      this.shellInformation().pid,
  );

  /**
   * How long it takes for the parent tooltip to show
   */
  public readonly tooltipShowDelay = signal(750);

  /**
   * Keeps track if the child is being hovered if so then the tooltip for parent will not be shown
   */
  public readonly isHoveringChild = signal(false);

  /**
   * Keeps track of when the shell is being deleted / removed
   */
  public readonly isDeletingShell = signal(false);

  /**
   * Runs when the child is hovered
   */
  public childHovered() {
    this.isHoveringChild.set(true);
  }

  /**
   * Runs when the child hover mouse leaves
   */
  public childHoverLeave() {
    this.isHoveringChild.set(false);
  }

  /**
   * Makes the active shell pid this shell
   */
  public selectTerminal() {
    try {
      if (this.isActive()) {
        return;
      }

      const shellInfo = this.shellInformation();
      this.editorTerminalService.setActiveShell(shellInfo.pid);
    } catch (error) {
      console.error("Failed to set shell as active: ", error);
    }
  }

  /**
   * Attempts to delete / stop the current shell and then set the next avaible shell PID as active if the one being deleted is the active one
   */
  public async deleteShell(event: Event) {
    event.stopPropagation();

    if (this.isDeletingShell()) {
      return;
    }

    try {
      this.isDeletingShell.set(true);

      const succ = await this.editorTerminalService.deleteAndKill(
        this.shellInformation().pid,
      );
      if (!succ) {
        throw new Error("Could not delete shell");
      }
    } catch (error) {
      console.error("Failed to delete shell ", error);
    } finally {
      this.isDeletingShell.set(false);
    }
  }
}
