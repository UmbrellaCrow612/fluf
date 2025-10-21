import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
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
export class TerminalTabsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly appContext = inject(ContextService);
  private readonly api = getElectronApi();

  terminals: terminalInformation[] | null = null;

  ngOnInit(): void {
    this.terminals = this.appContext.getSnapshot().terminals;

    this.appContext.autoSub(
      'terminals',
      (ctx) => {
        this.terminals = ctx.terminals;
      },
      this.destroyRef
    );
  }

  async createNewTerminal() {
    let ctx = this.appContext.getSnapshot();

    let newTerm = await this.api.createTerminal(
      undefined,
      ctx.selectedDirectoryPath!
    );

    if (newTerm) {
      let terms = ctx.terminals ?? [];
      terms.unshift(newTerm);

      this.appContext.update('terminals', terms);
      this.appContext.update('currentActiveTerminald', newTerm.id);
    }
  }
}
