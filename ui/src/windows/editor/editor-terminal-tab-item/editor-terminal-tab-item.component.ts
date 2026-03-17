import {
  Component,
  computed,
  inject,
  input,
  signal,
  Signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditorInMemoryContextService } from '../editor-context/editor-in-memory-context.service';
import { getElectronApi } from '../../../utils';

@Component({
  selector: 'app-editor-terminal-tab-item',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './editor-terminal-tab-item.component.html',
  styleUrl: './editor-terminal-tab-item.component.css',
})
export class EditorTerminalTabItemComponent {
  private readonly editorInMemoryContextService = inject(
    EditorInMemoryContextService,
  );
  private readonly electronApi = getElectronApi();

  /**
   * Text to render in the tab item
   */
  public readonly label = input.required<string>();

  /**
   * Holds the PID of the shell that is being rendered
   */
  public readonly shellPid = input.required<number>();

  /**
   * Keeps track if the given terminal tab item is the active one
   */
  public readonly isActive: Signal<boolean> = computed(
    () =>
      this.editorInMemoryContextService.currentActiveShellId() ===
      this.shellPid(),
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
    const shellPid = this.shellPid();

    try {
      if (this.isActive()) {
        return;
      }

      this.editorInMemoryContextService.currentActiveShellId.set(shellPid);
    } catch (error) {
      console.error('Failed to set shell as active: ', shellPid);
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

      const shellPid = this.shellPid();
      const deleted = await this.electronApi.shellApi.kill(shellPid);
      if (!deleted) {
        console.error('Failed to delete shell with pid: ', shellPid);
        return;
      }

      this.updateInMemeoryDataOnDelete();
    } catch (error) {
      console.error('Failed to delete shell ', error);
    } finally {
      this.isDeletingShell.set(false);
    }
  }

  /**
   * Updates the in memeory data structures to remove the deleted shell PID
   */
  private updateInMemeoryDataOnDelete(): void {
    const shellPids = this.editorInMemoryContextService.shells() ?? [];
    const pidToRemove: number = this.shellPid();
    const filteredShellPids = shellPids.filter((n) => n !== pidToRemove);

    if (this.isActive()) {
      const nextAvailableShellPid = filteredShellPids[0] ?? null;
      this.editorInMemoryContextService.currentActiveShellId.set(
        nextAvailableShellPid,
      );
    }

    this.editorInMemoryContextService.shells.set(
      structuredClone(filteredShellPids),
    );
  }
}
