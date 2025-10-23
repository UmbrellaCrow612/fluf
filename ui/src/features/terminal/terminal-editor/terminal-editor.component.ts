import {
  Component,
  DestroyRef,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ContextService } from '../../app-context/app-context.service';
import { getElectronApi } from '../../../utils';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IDisposable, Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

type UnsubscribeCallback = () => void;

@Component({
  selector: 'app-terminal-editor',
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './terminal-editor.component.html',
  styleUrl: './terminal-editor.component.css',
})
export class TerminalEditorComponent implements OnInit, OnDestroy {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = getElectronApi();
  private readonly zone = inject(NgZone);
  private readonly terminal = new Terminal();
  private readonly fitAddon = new FitAddon();
  private dispose: IDisposable | null = null;

  currentActiveShell: shellInformation | null = null;
  currentActiveShellId: string | null = null;

  error: string | null = null;
  isLoading = false;

  unsSub: UnsubscribeCallback | null = null;

  async ngOnInit() {
    const init = this.appContext.getSnapshot();

    // Initial setup
    this.currentActiveShellId = init.currentActiveShellId;
    this.currentActiveShell =
      init.shells?.find((x) => x.id == this.currentActiveShellId) ?? null;

    await this.initShell();

    this.appContext.autoSub(
      'currentActiveShellId',
      async (ctx) => {
        this.currentActiveShellId = ctx.currentActiveShellId;
        this.currentActiveShell =
          ctx.shells?.find((x) => x.id == this.currentActiveShellId) ?? null;

        await this.initShell();
      },
      this.destroyRef
    );
  }

  ngOnDestroy() {
    if (this.unsSub) {
      this.unsSub();
    }
  }

  /**
   * Loads and binds ui to the terminal thats active and other state
   */
  async initShell() {
    this.error = null;
    this.isLoading = true;

    if (this.unsSub) {
      this.unsSub();
    }
    if(this.dispose){
      this.dispose.dispose()
    }

    if (!this.currentActiveShell || !this.currentActiveShellId) {
      this.error = 'No active terminal selected.';
      this.isLoading = false;
      return;
    }

    const alive = await this.api.isShellActive(
      undefined,
      this.currentActiveShellId
    );

    if (!alive) {
      this.error =
        'The selected terminal process is no longer running. Please create a new one.';
      this.isLoading = false;
      this.removeCurrentFromCtx();
      return;
    }

    this.unsSub = this.api.onShellChange(this.currentActiveShellId, (data) => {
      this.zone.run(() => {
        this.currentActiveShell?.history.push(data.chunk);
        this.terminal.write(data.chunk);

        this.updateCurrentInCtxDebounced();
      });
    });

    this.isLoading = false;

    this.renderXterm();
  }

  /**
   * Call after shell dose exist
   */
  private renderXterm() {
    // wait a bit for div to appear after angular dose condtional @if checks
    setTimeout(() => {
      let container = document.getElementById('xterm_container');
      if (!container) {
        this.error = 'Could not find terminal container';
        return;
      }
      this.terminal.loadAddon(this.fitAddon);

      this.terminal.open(container);
      this.fitAddon.fit();

      this.terminal.write(this.currentActiveShell?.history.join('\n') ?? '');

      this.dispose = this.terminal.onData(async (data) => {
        if (!this.currentActiveShellId) return;

        await this.api.writeToShell(undefined, this.currentActiveShellId, data);
      });
    }, 200);
  }

  /**
   * Remove the current shell from ctx and render next one
   */
  private removeCurrentFromCtx() {
    let init = this.appContext.getSnapshot();

    let updated =
      init.shells?.filter((x) => x.id != this.currentActiveShellId) ?? [];
    let nextActiveId =
      init.shells?.length != undefined && init.shells.length > 0
        ? init.shells[0].id
        : null;

    this.appContext.update('shells', updated);
    this.appContext.update('currentActiveShellId', nextActiveId);
  }

  /**
   * Update glob state of current shell when it changes
   */
  private updateCurrentInCtx() {
    let shells = this.appContext.getSnapshot().shells;

    if (!shells) return;

    let indexOf = shells.findIndex((x) => x.id == this.currentActiveShellId);

    if (indexOf >= 0) {
      shells[indexOf] = this.currentActiveShell!;
      this.appContext.update('shells', shells);
    }
  }

  private updateCurrentInCtxDebouncedTimeout: any = null;
  private updateCurrentInCtxDebounced(delay = 200) {
    if (this.updateCurrentInCtxDebouncedTimeout) {
      clearTimeout(this.updateCurrentInCtxDebouncedTimeout);
    }
    this.updateCurrentInCtxDebouncedTimeout = setTimeout(() => {
      this.updateCurrentInCtx();
    }, delay);
  }
}
