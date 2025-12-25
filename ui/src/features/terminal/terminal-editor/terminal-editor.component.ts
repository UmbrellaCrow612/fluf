import { voidCallback } from './../../../gen/type.d';
import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  untracked,
} from '@angular/core';
import { getElectronApi } from '../../../utils';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IDisposable, Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { InMemoryContextService } from '../../app-context/app-in-memory-context.service';
import { SerializeAddon } from '@xterm/addon-serialize';

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
  private serializeAddon: SerializeAddon | null = null;
  private dispose: IDisposable | null = null;

  currentActiveShellId = computed(() =>
    this.inMemoryAppContext.currentActiveShellId()
  );
  terminalBuffer = computed(() => this.inMemoryAppContext.terminalBuffers());

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

    this.fitAddon = null;
    this.serializeAddon = null;

    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = null;
    }
  }

  private saveTerminalBuffer() {
    let pid = this.currentActiveShellId();
    if (!pid) return;

    let map = structuredClone(this.terminalBuffer());

    map.set(pid, this.serializeAddon?.serialize() ?? '');

    this.inMemoryAppContext.terminalBuffers.set(map);
  }

  private getStoredTerminalBuffer(): string {
    let pid = this.currentActiveShellId();
    if (!pid) return '';

    let content = untracked(() => this.terminalBuffer().get(pid)) ?? '';

    return content;
  }

  /**
   * Loads and binds ui to the terminal thats active and other state
   */
  async initShell() {
    this.error = null;
    this.isLoading = true;

    console.log("Render shell")

    this.cleanupTerminal();

    if (!this.currentActiveShellId()) {
      this.error = 'No active terminal selected.';
      this.isLoading = false;
      return;
    }

    this.changeunSub = this.api.shellApi.onChange(
      this.currentActiveShellId()!,
      (chunk) => {
        this.terminal?.write(chunk, () => {
          this.saveTerminalBuffer();
        });
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
    this.serializeAddon = new SerializeAddon();

    this.terminal.loadAddon(this.fitAddon);
    this.terminal.loadAddon(this.serializeAddon);

    this.terminal.open(container);

    this.fitAddon.fit();

    this.api.shellApi.resize(
      this.currentActiveShellId()!,
      this.terminal.cols,
      this.terminal.rows
    );

    let storedBuffer = this.getStoredTerminalBuffer();
    if (storedBuffer) {
      this.terminal.clear();
      this.terminal.write(storedBuffer);
    }

    this.terminal.focus();

    this.dispose = this.terminal.onData((data) => {
      if (!this.currentActiveShellId()) return;

      this.api.shellApi.write(this.currentActiveShellId()!, data);
    });
  }
}
