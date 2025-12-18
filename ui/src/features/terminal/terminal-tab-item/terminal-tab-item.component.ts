import {
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContextService } from '../../app-context/app-context.service';
import { getElectronApi } from '../../../utils';
import { shellInformation } from '../../../gen/type';

@Component({
  selector: 'app-terminal-tab-item',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './terminal-tab-item.component.html',
  styleUrl: './terminal-tab-item.component.css',
})
export class TerminalTabItemComponent {
  private readonly appContext = inject(ContextService);
  private readonly api = getElectronApi();

  /**
   * Label of the terminal session
   */
  shell = input.required<shellInformation>();

  /**
   * Indicates if the current terminal is the active one
   */
  isActive = computed(
    () => this.appContext.currentActiveShellId() === this.shell().id
  );

  shellClicked() {
    this.appContext.currentActiveShellId.set(this.shell().id);
  }

  async killShell(event: Event) {
    event.stopPropagation();

    await this.api.killShellById(undefined, this.shell().id);

    let updatedShells =
      this.appContext.shells()?.filter((t) => t.id !== this.shell().id) ?? [];

    if (updatedShells.length > 0) {
      let newActiveTerminalId = updatedShells[0].id;
      this.appContext.currentActiveShellId.set(newActiveTerminalId);
    } else {
      this.appContext.currentActiveShellId.set(null);
    }
    this.appContext.shells.set(structuredClone(updatedShells)); // for js refrence to change so compute works
  }
}
