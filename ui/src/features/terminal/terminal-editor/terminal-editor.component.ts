import { voidCallback } from './../../../gen/type.d';
import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  untracked,
  AfterViewInit,
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
export class TerminalEditorComponent implements AfterViewInit, OnDestroy {
  private readonly inMemoryAppContext = inject(InMemoryContextService);
  private readonly api = getElectronApi();
  private viewInitialized = false;

  constructor() {
    effect(async () => {
      let isEditorResize = this.inMemoryAppContext.isEditorResize();
      if (isEditorResize && this.fitAddon && this.terminal) {
        // Use setTimeout to ensure this happens after current rendering cycle
        setTimeout(() => {
          if (this.fitAddon && this.terminal) {
            this.fitAddon.fit();
            this.api.shellApi.resize(
              this.currentActiveShellId()!,
              this.terminal.cols,
              this.terminal.rows
            );
          }
        }, 0);
      }
    });

    effect(async () => {
      this.inMemoryAppContext.currentActiveShellId();

      if (this.viewInitialized) {
        console.log('Ran here');
        await this.initShell();
      }
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

  ngAfterViewInit() {
    this.viewInitialized = true;
    setTimeout(() => {
      this.initShell();
    }, 0);
  }

  ngOnDestroy() {
    this.viewInitialized = false;
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

    console.log('Render shell');

    this.cleanupTerminal();

    const shellPid = this.currentActiveShellId();

    if (!shellPid) {
      this.error = 'No active terminal selected.';
      this.isLoading = false;
      return;
    }

    this.changeunSub = this.api.shellApi.onChange(shellPid, (chunk) => {
      this.terminal?.write(chunk, () => {
        this.saveTerminalBuffer();
      });
    });

    this.exitUnSub = this.api.shellApi.onExit(shellPid, () => {
      untracked(() => {
        let shells = this.inMemoryAppContext.shells() ?? [];

        let filtered = shells.filter((x) => x !== shellPid);
        this.inMemoryAppContext.shells.set(structuredClone(filtered));

        if (filtered.length > 0) {
          let next = filtered[0];
          this.inMemoryAppContext.currentActiveShellId.set(next);
        } else {
          this.inMemoryAppContext.currentActiveShellId.set(null);
        }
      });
    });

    this.isLoading = false;

    setTimeout(() => {
      this.renderXterm();
    }, 0);
  }

  /**
   * Call this when shell exists and is alive to render xterm
   */
  private renderXterm() {
    let container = document.getElementById('xterm_container');
    if (!container) {
      this.error = 'Could not find terminal container';
      console.error('Terminal container not found');
      return;
    }

    container.innerHTML = '';

    this.terminal = new Terminal({
      theme: {
        background: getComputedStyle(document.documentElement)
          .getPropertyValue('--color-editor-background')
          .trim(),
        foreground: getComputedStyle(document.documentElement)
          .getPropertyValue('--color-text-primary')
          .trim(),
        cursor: getComputedStyle(document.documentElement)
          .getPropertyValue('--color-editor-cursor')
          .trim(),
      },
      fontFamily: getComputedStyle(document.documentElement)
        .getPropertyValue('--font-family-mono')
        .trim(),
      fontSize: 14,
    });

    this.fitAddon = new FitAddon();
    this.serializeAddon = new SerializeAddon();

    this.terminal.loadAddon(this.fitAddon);
    this.terminal.loadAddon(this.serializeAddon);

    this.terminal.open(container);

    // Use setTimeout to ensure terminal is fully mounted before fitting
    setTimeout(() => {
      if (!this.fitAddon || !this.terminal) return;

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
    }, 0);

    this.dispose = this.terminal.onData((data) => {
      if (!this.currentActiveShellId()) return;

      this.api.shellApi.write(this.currentActiveShellId()!, data);
    });
  }
}
