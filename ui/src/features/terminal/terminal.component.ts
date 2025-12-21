import { Component, computed, inject } from '@angular/core';
import { TerminalTabsComponent } from './terminal-tabs/terminal-tabs.component';
import { TerminalEditorComponent } from './terminal-editor/terminal-editor.component';
import { InMemoryContextService } from '../app-context/app-in-memory-context.service';

@Component({
  selector: 'app-terminal',
  imports: [TerminalTabsComponent, TerminalEditorComponent],
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.css',
})
export class TerminalComponent {
  private readonly inMemoryContextService = inject(InMemoryContextService);

  showTerminalEditor = computed(() => {
    let shells = this.inMemoryContextService.shells();
    return (
      shells?.find(
        (x) => x === this.inMemoryContextService.currentActiveShellId()
      ) != null
    );
  });
}
