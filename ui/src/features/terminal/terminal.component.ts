import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { TerminalTabsComponent } from './terminal-tabs/terminal-tabs.component';
import { TerminalEditorComponent } from './terminal-editor/terminal-editor.component';
import { ContextService } from '../app-context/app-context.service';

@Component({
  selector: 'app-terminal',
  imports: [TerminalTabsComponent, TerminalEditorComponent],
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.css',
})
export class TerminalComponent implements OnInit {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);

  showTerminalEditor = false;

  ngOnInit(): void {
    let init = this.appContext.getSnapshot();

    this.showTerminalEditor =
      init.terminals?.find((x) => x.id == init.currentActiveTerminald) != null;

    this.appContext.autoSub(
      'currentActiveTerminald',
      (ctx) => {
        this.showTerminalEditor =
          ctx.terminals?.find((x) => x.id == ctx.currentActiveTerminald) !=
          null;
      },
      this.destroyRef
    );
  }
}
