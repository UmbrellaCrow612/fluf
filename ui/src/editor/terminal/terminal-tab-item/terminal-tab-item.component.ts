import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { getElectronApi } from '../../../utils';
import { InMemoryContextService } from '../../app-context/editor-in-memory-context.service';

@Component({
  selector: 'app-terminal-tab-item',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './terminal-tab-item.component.html',
  styleUrl: './terminal-tab-item.component.css',
})
export class TerminalTabItemComponent {
  private readonly inMemoryContextService = inject(InMemoryContextService);
  private readonly api = getElectronApi();

  /**
   * The shell's PID
   */
  pid = input.required<number>();

  /**
   * Indicates if the current terminal is the active one
   */
  isActive = computed(
    () => this.inMemoryContextService.currentActiveShellId() === this.pid(),
  );

  shellClicked() {
    this.inMemoryContextService.currentActiveShellId.set(this.pid());
  }

  async killShell(event: Event) {
    event.stopPropagation();

    await this.api.shellApi.kill(this.pid());

    let shells = this.inMemoryContextService.shells() ?? [];
    let filtered = shells.filter((x) => x !== this.pid());

    this.inMemoryContextService.shells.set(structuredClone(filtered));

    if (filtered.length > 0) {
      let nextActive = filtered[0];
      this.inMemoryContextService.currentActiveShellId.set(nextActive);
    } else {
      this.inMemoryContextService.currentActiveShellId.set(null);
    }
  }
}
