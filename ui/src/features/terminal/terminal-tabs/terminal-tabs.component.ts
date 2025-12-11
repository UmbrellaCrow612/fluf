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
import { shellInformation } from '../../../gen/type';

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

  shells: shellInformation[] | null = null;

  ngOnInit(): void {
    this.shells = this.appContext.getSnapshot().shells;

    this.appContext.autoSub(
      'shells',
      (ctx) => {
        this.shells = ctx.shells;
      },
      this.destroyRef
    );
  }

  async createNewTerminal() {
    let ctx = this.appContext.getSnapshot();

    let newTerm = await this.api.createShell(
      undefined,
      ctx.selectedDirectoryPath!
    );

    if (newTerm) {
      let shells = ctx.shells ?? [];
      shells.unshift(newTerm);

      this.appContext.update('shells', shells);
      this.appContext.update('currentActiveShellId', newTerm.id);
    }
  }
}
