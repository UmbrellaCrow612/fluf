import { voidCallback } from './../../../gen/type.d';
import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
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
export class TerminalEditorComponent implements OnDestroy {
  private readonly inMemoryAppContext = inject(InMemoryContextService);
  private readonly api = getElectronApi();

  constructor() {
    effect(async () => {
      let pid = this.inMemoryAppContext.currentActiveShellId();

      if (pid !== this.previousPid) {
        await this.initShell();
        this.previousPid = pid;
      }
    });

    effect(() => {
      let _ = this.inMemoryAppContext.editorResize();

      if (this.terminal && this.fitAddon) {
        this.fitAddon.fit();
      }
    });
  }

  private previousPid: number | null = null;
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
    untracked(() => {
      let pid = this.currentActiveShellId();
      if (!pid) return;

      let map = structuredClone(this.terminalBuffer());

      map.set(pid, this.serializeAddon?.serialize() ?? '');

      this.inMemoryAppContext.terminalBuffers.set(map);
    });
  }

  private getStoredTerminalBuffer(): string {
    let content = '';

    untracked(() => {
      let pid = this.currentActiveShellId();
      if (!pid) return '';

      content = this.terminalBuffer().get(pid) ?? '';

      return content;
    });

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

    const pid = this.currentActiveShellId();

    if (!pid) {
      this.error = 'No active terminal selected.';
      this.isLoading = false;
      return;
    }

    this.changeunSub = this.api.shellApi.onChange(pid, (chunk) => {
      this.terminal?.write(chunk, () => {
        this.saveTerminalBuffer();
      });
    });

    this.exitUnSub = this.api.shellApi.onExit(pid, () => {
      untracked(() => {
        let shells = this.inMemoryAppContext.shells() ?? [];

        let filtered = shells.filter((x) => x !== this.currentActiveShellId());
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
      this.renderXterm(pid);
    }, 4);
  }

  getCssVar = (varName: string): string => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
  };

  /**
   * Call this when shell exists and is alive to render xterm
   * @param pid The shell's PID to render
   */
  private renderXterm(pid: number) {
    let container = document.getElementById('xterm_container');
    if (!container) {
      this.error = 'Could not find terminal container';
      return;
    }

    container.innerHTML = '';

    this.terminal = new Terminal({
      theme: {
        background: this.getCssVar('--xterm-background'),
        foreground: this.getCssVar('--xterm-foreground'),
        cursor: this.getCssVar('--xterm-cursor'),
        cursorAccent: this.getCssVar('--xterm-cursor-accent'),
        selectionBackground: this.getCssVar('--xterm-selection'),
        black: this.getCssVar('--xterm-black'),
        red: this.getCssVar('--xterm-red'),
        green: this.getCssVar('--xterm-green'),
        yellow: this.getCssVar('--xterm-yellow'),
        blue: this.getCssVar('--xterm-blue'),
        magenta: this.getCssVar('--xterm-magenta'),
        cyan: this.getCssVar('--xterm-cyan'),
        white: this.getCssVar('--xterm-white'),
        brightBlack: this.getCssVar('--xterm-bright-black'),
        brightRed: this.getCssVar('--xterm-bright-red'),
        brightGreen: this.getCssVar('--xterm-bright-green'),
        brightYellow: this.getCssVar('--xterm-bright-yellow'),
        brightBlue: this.getCssVar('--xterm-bright-blue'),
        brightMagenta: this.getCssVar('--xterm-bright-magenta'),
        brightCyan: this.getCssVar('--xterm-bright-cyan'),
        brightWhite: this.getCssVar('--xterm-bright-white'),
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      cursorBlink: true,
    });

    this.fitAddon = new FitAddon();
    this.serializeAddon = new SerializeAddon();

    this.terminal.loadAddon(this.fitAddon);
    this.terminal.loadAddon(this.serializeAddon);

    this.terminal.open(container);
    this.fitAddon.fit();

    this.api.shellApi.resize(pid, this.terminal.cols, this.terminal.rows);

    let storedBuffer = this.getStoredTerminalBuffer();
    if (storedBuffer) {
      this.terminal.clear();
      this.terminal.write(storedBuffer);
    }

    this.terminal.focus();

    this.dispose = this.terminal.onData((data) => {
      if (!pid) return;

      this.api.shellApi.write(pid, data);
    });
  }
}
