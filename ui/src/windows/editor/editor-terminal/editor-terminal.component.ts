import { Component, computed, inject, Signal } from '@angular/core';
import { EditorTerminalTabsComponent } from '../editor-terminal-tabs/editor-terminal-tabs.component';
import { EditorTerminalPaneComponent } from '../editor-terminal-pane/editor-terminal-pane.component';
import { EditorInMemoryContextService } from '../editor-context/editor-in-memory-context.service';

/**
 * Renders the terminal component which handles terminal sessions and displays a UI to interact with live sessions
 */
@Component({
  selector: 'app-editor-terminal',
  imports: [EditorTerminalTabsComponent, EditorTerminalPaneComponent],
  templateUrl: './editor-terminal.component.html',
  styleUrl: './editor-terminal.component.css',
})
export class EditorTerminalComponent {
  private readonly editorInMemoryContextService = inject(
    EditorInMemoryContextService,
  );

  /**
   * Keep trackl of the current active shell PID
   */
  public readonly currentActiveShellPid: Signal<number | null> = computed(() =>
    this.editorInMemoryContextService.currentActiveShellId(),
  );
}
