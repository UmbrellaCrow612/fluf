import { voidCallback } from './../../../gen/type.d';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { getElectronApi } from '../../../utils';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IDisposable, Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { InMemoryContextService } from '../../app-context/app-in-memory-context.service';

@Component({
  selector: 'app-terminal-editor',
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './terminal-editor.component.html',
  styleUrl: './terminal-editor.component.css',
})
export class TerminalEditorComponent implements OnInit, OnDestroy {
  private readonly inMemoryAppContext = inject(InMemoryContextService);
  private readonly api = getElectronApi();

  constructor() {
    effect(async () => {
      let isEditorResize = this.inMemoryAppContext.isEditorResize();
      if (isEditorResize && this.fitAddon && this.terminal) {
        this.fitAddon.fit();

        await this.api.shellApi.resize(
          this.currentActiveShellId()!,
          this.terminal.cols,
          this.terminal.rows
        );
      }
    });

    effect(async () => {
      this.inMemoryAppContext.currentActiveShellId();

      await this.initShell();
    });
  }

  private terminal: Terminal | null = null;
  private fitAddon: FitAddon | null = null;
  private dispose: IDisposable | null = null;

  currentActiveShellId = computed(() =>
    this.inMemoryAppContext.currentActiveShellId()
  );

  error: string | null = null;
  isLoading = false;

  changeunSub: voidCallback | null = null;
  exitUnSub: voidCallback | null = null;

  async ngOnInit() {
    await this.initShell();
  }

  ngOnDestroy() {
    this.cleanupTerminal();
  }

  private cleanupTerminal() {
    if (this.changeunSub) {
      this.changeunSub();
      this.changeunSub = null;
    }
    if (this.exitUnSub) {
      this.exitUnSub();
      this.exitUnSub = null;
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

    if (!this.currentActiveShellId()) {
      this.error = 'No active terminal selected.';
      this.isLoading = false;
      return;
    }

    this.changeunSub = this.api.shellApi.onChange(
      this.currentActiveShellId()!,
      (chunk) => {
        this.terminal?.write(chunk);
      }
    );

    this.exitUnSub = this.api.shellApi.onExit(
      this.currentActiveShellId()!,
      () => {
        let shells = this.inMemoryAppContext.shells() ?? [];

        let filtered = shells.filter((x) => x !== this.currentActiveShellId());
        this.inMemoryAppContext.shells.set(structuredClone(filtered));

        if (filtered.length > 0) {
          let next = filtered[0];
          this.inMemoryAppContext.currentActiveShellId.set(next);
        } else {
          this.inMemoryAppContext.currentActiveShellId.set(null);
        }
      }
    );

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
    this.terminal.focus();

    this.dispose = this.terminal.onData((data) => {
      if (!this.currentActiveShellId()) return;

      this.api.shellApi.write(this.currentActiveShellId()!, data);
    });
  }
}
