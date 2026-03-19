import {
  Component,
  computed,
  inject,
  OnInit,
  Signal,
  signal,
} from '@angular/core';
import { EditorTerminalTabItemComponent } from '../editor-terminal-tab-item/editor-terminal-tab-item.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditorStateService } from '../editor-state/editor-state.service';
import { getElectronApi } from '../../../utils';
import { EditorInMemoryContextService } from '../editor-state/editor-in-memory-context.service';

/**
 * Holds the active tabs and allows crud operations on them
 */
@Component({
  selector: 'app-editor-terminal-tabs',
  imports: [
    EditorTerminalTabItemComponent,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './editor-terminal-tabs.component.html',
  styleUrl: './editor-terminal-tabs.component.css',
})
export class EditorTerminalTabsComponent {
  private readonly editorStateService = inject(EditorStateService);
  private readonly editorInMemoryContextService = inject(
    EditorInMemoryContextService,
  );
  private readonly electronApi = getElectronApi();

  /**
   * Holds state for creating terminal
   */
  public readonly isCreatingTerminal = signal(false);

  /**
   * Keeps track of all the active shell PID's
   */
  public readonly activeShells: Signal<number[]> = computed(
    () => this.editorInMemoryContextService.shells() ?? [],
  );

  /**
   * Creats a new terminal in the selected directory path or default path if it not defined
   */
  public async createNewTerminal() {
    try {
      this.isCreatingTerminal.set(true);

      let directory: string | null =
        this.editorStateService.selectedDirectoryPath();
      if (!directory || !(await this.electronApi.fsApi.exists(directory))) {
        directory = await this.electronApi.pathApi.getDefaultProfilePath();
      }

      const pid = await this.electronApi.shellApi.create(directory);
      if (pid === -1) {
        console.error('Failed to create terminal at directory ', directory);
        return;
      }

      const currentShellPids = this.editorInMemoryContextService.shells() ?? [];
      currentShellPids.push(pid);
      this.editorInMemoryContextService.shells.set(
        structuredClone(currentShellPids),
      );

      this.editorInMemoryContextService.currentActiveShellId.set(pid);
    } catch (error) {
      console.error('Failed to create terminal ', error);
    } finally {
      this.isCreatingTerminal.set(false);
    }
  }
}
