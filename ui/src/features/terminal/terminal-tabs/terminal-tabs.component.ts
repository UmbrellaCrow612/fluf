import { Component, computed, inject } from '@angular/core';
import { TerminalTabItemComponent } from '../terminal-tab-item/terminal-tab-item.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ContextService } from '../../app-context/app-context.service';
import { getElectronApi } from '../../../utils';

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
  private readonly appContext = inject(ContextService);
  private readonly api = getElectronApi();

  shells = computed(() => this.appContext.shells());

  async createNewTerminal() {
    let newTerm = await this.api.createShell(
      undefined,
      this.appContext.selectedDirectoryPath()!
    );

    if (newTerm) {
      let shells = this.shells() ?? [];
      shells.unshift(newTerm);

      this.appContext.shells.set(structuredClone(shells)); // for js compute refrence to be diffrent
      this.appContext.update('currentActiveShellId', newTerm.id);
    }
  }
}
