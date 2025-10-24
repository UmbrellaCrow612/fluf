import {
  Component,
  DestroyRef,
  inject,
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

  private terminal: Terminal | null = null;
  private fitAddon: FitAddon | null = null;
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

    this.appContext.autoSub(
      'isEditorResize',
      async (ctx) => {
        if (ctx.isEditorResize && this.fitAddon && this.terminal) {
          this.fitAddon.fit();
          await this.api.resizeShell(undefined, this.currentActiveShellId!, {
            cols: this.terminal.cols,
            rows: this.terminal.rows,
          });
        }
      },
      this.destroyRef
    );
  }

  ngOnDestroy() {
    this.cleanupTerminal();
  }

  private cleanupTerminal() {
    if (this.unsSub) {
      this.unsSub();
      this.unsSub = null;
    }
    if (this.dispose) {
      this.dispose.dispose();
      this.dispose = null;
    }
    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = null;
    }
    this.fitAddon = null;
  }

  /**
   * Loads and binds ui to the terminal thats active and other state
   */
  async initShell() {
    this.error = null;
    this.isLoading = true;

    this.cleanupTerminal();

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
      this.currentActiveShell?.history.push(data.chunk);
      this.terminal?.write(data.chunk);

      this.updateCurrentInCtxDebounced();
    });

    this.isLoading = false;

    this.renderXterm();
  }

  /**
   * Call this when shell exists and is alive to render xterm
   */
  private renderXterm() {
    let container = document.getElementById('xterm_container');
    if (!container) {
      this.error = 'Could not find terminal container';
      return;
    }

    container.innerHTML = '';

    this.terminal = new Terminal();
    this.fitAddon = new FitAddon();

    this.terminal.loadAddon(this.fitAddon);
    this.terminal.open(container);

    requestAnimationFrame(async () => {
      this.fitAddon?.fit();
      await this.api.resizeShell(undefined, this.currentActiveShellId!, {
        cols: this.terminal?.cols ?? 80,
        rows: this.terminal?.rows ?? 24,
      });
    });

    this.terminal.write(this.currentActiveShell?.history.join('') ?? '');

    this.dispose = this.terminal.onData(async (data) => {
      if (!this.currentActiveShellId) return;

      await this.api.writeToShell(undefined, this.currentActiveShellId, data);

      // Detect clear screen escape codes
      if (
        data.includes('\x1b[2J') ||
        data.includes('\x1b[3J') ||
        data.includes('\x1b[H\x1b[2J')
      ) {
        await this.api.writeToShell(undefined, this.currentActiveShellId, '\r');
      }
    });
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
