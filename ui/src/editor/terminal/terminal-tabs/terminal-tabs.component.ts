import { Component, computed, effect, inject } from '@angular/core';
import { TerminalTabItemComponent } from '../terminal-tab-item/terminal-tab-item.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { EditorContextService } from '../../app-context/editor-context.service';
import { getElectronApi } from '../../../utils';
import { InMemoryContextService } from '../../app-context/editor-in-memory-context.service';

@Component({
  selector: 'app-terminal-tabs',
  imports: [
    TerminalTabItemComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltip,
  ],
  templateUrl: './terminal-tabs.component.html',
  styleUrl: './terminal-tabs.component.css',
})
export class TerminalTabsComponent {
  private readonly inMemoryContextService = inject(InMemoryContextService);
  private readonly contextService = inject(EditorContextService);
  private readonly api = getElectronApi();

  constructor() {
    let previousValue = this.inMemoryContextService.createTerminal();

    effect(() => {
      const currentValue = this.inMemoryContextService.createTerminal();

      // Only create terminal if the value actually changed (not on init)
      if (currentValue !== previousValue) {
        this.createNewTerminal();
        previousValue = currentValue;
      }
    });
  }

  shells = computed(() => this.inMemoryContextService.shells());

  dir = computed(() => this.contextService.selectedDirectoryPath());

  async createNewTerminal() {
    if (!this.dir()) return;

    let pid = await this.api.shellApi.create(this.dir()!);

    if (pid === -1) {
      console.error('failed to create terminal shell');
      return;
    }

    let shells = this.shells() ?? [];
    shells.unshift(pid);

    this.inMemoryContextService.shells.set(structuredClone(shells)); // for js compute refrence to be diffrent
    this.inMemoryContextService.currentActiveShellId.set(pid);
  }
}
