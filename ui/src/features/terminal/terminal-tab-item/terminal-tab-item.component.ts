import { Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContextService } from '../../app-context/app-context.service';
import { getElectronApi } from '../../../utils';

@Component({
  selector: 'app-terminal-tab-item',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './terminal-tab-item.component.html',
  styleUrl: './terminal-tab-item.component.css',
})
export class TerminalTabItemComponent implements OnInit {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = getElectronApi();

  /**
   * Label of the terminal session
   */
  shell = input.required<shellInformation>();

  /**
   * Indicates if the current terminal is the active one
   */
  isActive: boolean = false;

  ngOnInit(): void {
    let init = this.appContext.getSnapshot();

    this.isActive = init.currentActiveShellId === this.shell().id;

    this.appContext.autoSub(
      'currentActiveShellId',
      (ctx) => {
        this.isActive = ctx.currentActiveShellId === this.shell().id;
      },
      this.destroyRef
    );
  }

  shellClicked() {
    this.appContext.update('currentActiveShellId', this.shell().id);
  }

  async killShell(event: Event) {
    event.stopPropagation();

    let res = await this.api.killShellById(undefined, this.shell().id);
    console.log(res);

    let init = this.appContext.getSnapshot();

    let updatedShells =
      init?.shells?.filter((t) => t.id !== this.shell().id) ?? [];

    if (updatedShells.length > 0) {
      let newActiveTerminalId = updatedShells[0].id;
      this.appContext.update('currentActiveShellId', newActiveTerminalId);
    } else {
      this.appContext.update('currentActiveShellId', null);
    }
    this.appContext.update('shells', updatedShells);
  }
}
