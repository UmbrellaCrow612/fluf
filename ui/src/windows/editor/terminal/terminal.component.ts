import { Component, computed, inject, OnDestroy, OnInit } from '@angular/core';
import { TerminalTabsComponent } from './terminal-tabs/terminal-tabs.component';
import { TerminalEditorComponent } from './terminal-editor/terminal-editor.component';
import { EditorInMemoryContextService } from '../editor-context/editor-in-memory-context.service';

@Component({
  selector: 'app-terminal',
  imports: [TerminalTabsComponent, TerminalEditorComponent],
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.css',
})
export class TerminalComponent implements OnInit, OnDestroy {
  private readonly inMemoryContextService = inject(
    EditorInMemoryContextService,
  );

  ngOnInit() {
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onResize);
  }

  /** Runs when the window resizes  */
  private onResize = () => {
    console.log('terminal rezied ran');
    this.inMemoryContextService.editorResize.update((x) => x + 1);
  };

  showTerminalEditor = computed(() => {
    let shells = this.inMemoryContextService.shells();
    return (
      shells?.find(
        (x) => x === this.inMemoryContextService.currentActiveShellId(),
      ) != null
    );
  });
}
