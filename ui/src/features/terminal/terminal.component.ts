import { Component, computed, inject } from '@angular/core';
import { TerminalTabsComponent } from './terminal-tabs/terminal-tabs.component';
import { TerminalEditorComponent } from './terminal-editor/terminal-editor.component';
import { ContextService } from '../app-context/app-context.service';

@Component({
  selector: 'app-terminal',
  imports: [TerminalTabsComponent, TerminalEditorComponent],
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.css',
})
export class TerminalComponent {
  private readonly appContext = inject(ContextService);

  showTerminalEditor = computed(() => {
    let shells = this.appContext.shells();
    // TODO change the below to use current active shell ID when we refactor it
    return shells?.find((x) => x.id == '1') != null;
  });
}
