import {
  Component,
  ElementRef,
  inject,
  input,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { useEffect } from '../../../lib/useEffect';
import { shellPid, voidCallback } from '../../../gen/type';
import { IDisposable, Terminal } from '@xterm/xterm';
import { getElectronApi } from '../../../utils';
import { FitAddon } from '@xterm/addon-fit';
import { EditorInMemoryContextService } from '../editor-context/editor-in-memory-context.service';

/**
 * Renders the actual interact / xterm UI for the current active shell ID
 */
@Component({
  selector: 'app-editor-terminal-pane',
  imports: [],
  templateUrl: './editor-terminal-pane.component.html',
  styleUrl: './editor-terminal-pane.component.css',
})
export class EditorTerminalPaneComponent implements OnDestroy {
  private readonly electronApi = getElectronApi();
  private readonly editorInMemoryContextService = inject(
    EditorInMemoryContextService,
  );

  /**
   * The specific shell PID to show the UI for in the panel
   */
  public readonly shellPid = input.required<shellPid | null>();

  /**
   * Holds any error state for creating xterm
   */
  public readonly createTerminalError = signal<string | null>(null);

  /**
   * Holds the xterm terminal object instace
   */
  private terminal: Terminal | null = null;

  /**
   * Holds he xterm addon used for fitting the xterm container
   */
  private fitAddon: FitAddon | null = null;

  /**
   * Contains a list of xterm dispose functions that are called on cleanup
   */
  private terminalDisposes: IDisposable[] = [];

  /**
   * Contains cleanup functions need to be called from the backend
   */
  private ptyDisposes: voidCallback[] = [];

  /**
   * Holds a refrence to the template div in which xterm will be rendered in
   */
  private readonly terminalTargetContainer = viewChild<
    ElementRef<HTMLDivElement>
  >('xtermContainerTarget');

  constructor() {
    useEffect(
      async (_, pid) => {
        if (!pid) {
          this.cleanUpState('No PID');
          return;
        }

        await this.attachToPane(pid);
      },
      [this.shellPid],
    );

    useEffect(
      (_, count) => {
        if (count > 0) {
          this.onResizeEvent();
        }
      },
      [this.editorInMemoryContextService.editorResize],
    );
  }

  public ngOnDestroy() {
    this.cleanUpState('ngOnDestroy');
  }

  /**
   * Listens to the PID given and creates a Xterm UI for the given PID listening to changes and reflecting them in the UI, as well as removing the previous instance
   * @param pid The PID to listen to
   */
  private async attachToPane(pid: shellPid): Promise<void> {
    console.log(
      '[EditorTerminalPaneComponent] attach to pane ran for pid: ',
      pid,
    );

    this.cleanUpState('attachToPane');

    this.createTerminalError.set(null);

    try {
      const container = this.terminalTargetContainer()?.nativeElement;
      if (!container) {
        throw new Error('Could not find container element to attach xterm to');
      }

      const isAlive = await this.electronApi.shellApi.isAlive(pid);
      if (!isAlive) {
        throw new Error(`Shell with PID ${pid} no longer alive`);
      }

      const { cols, rows } =
        await this.electronApi.shellApi.getInformation(pid);

      const xterm = new Terminal({
        cols,
        rows,
      });
      this.terminal = xterm;
      this.fitAddon = new FitAddon();

      this.terminal.loadAddon(this.fitAddon);

      window.addEventListener('resize', this.onResizeEvent);

      this.terminalDisposes.push(
        this.terminal.onData((data) => {
          this.electronApi.shellApi.write(pid, data);
        }),
      );

      this.terminalDisposes.push(
        this.terminal.onResize(({ cols, rows }) => {
          this.electronApi.shellApi.resize(pid, cols, rows);
        }),
      );

      this.ptyDisposes.push(
        this.electronApi.shellApi.onChange(pid, (_, chunk) => {
          this.terminal?.write(chunk);
        }),
      );

      this.ptyDisposes.push(
        this.electronApi.shellApi.onExit(pid, () => {
          this.removeTerminalFromDataStore(pid);
        }),
      );

      this.terminal.open(container);
      this.fitAddon.fit();
    } catch (error: any) {
      console.error('Failed to attach xterm terminal to UI ', error);
      this.createTerminalError.set(
        `Failed to attach xterm terminal to UI ${error?.message}`,
      );

      this.cleanUpState('Error attachToPane');
    }
  }

  /**
   * Removes the given terminal shell from the in memeory data and trys to set the next avialable shell pid
   * @param pid The Shell to remove
   */
  private removeTerminalFromDataStore(pid: number): void {
    console.log('[EditorTerminalPaneComponent] remove ran');

    try {
      const shellPids = this.editorInMemoryContextService.shells() ?? [];
      const pidToRemove = pid;
      const filteredShellPids = shellPids.filter((n) => n !== pidToRemove);
      const nextAviableShellPid = filteredShellPids[0] ?? null;

      this.editorInMemoryContextService.currentActiveShellId.set(
        nextAviableShellPid,
      );

      this.editorInMemoryContextService.shells.set(
        structuredClone(filteredShellPids),
      );
    } catch (error) {
      console.log('Failed to remove pid: ', pid, error);
    }
  }

  /**
   * Runs logic to reszie the terminal
   */
  private onResizeEvent = () => {
    if (this.terminal && this.fitAddon) {
      this.fitAddon.fit();
      console.log('[EditorTerminalPaneComponent] terminal resize ran');
    }
  };

  /**
   * Cleans up previous xterm instace and other cleanup work
   */
  private cleanUpState(from: string) {
    console.log('[EditorTerminalPaneComponent] cleanup ran from ', from);

    this.terminalDisposes.forEach((x) => {
      x.dispose();
    });
    this.terminalDisposes = [];

    this.ptyDisposes.forEach((dispose) => {
      dispose();
    });
    this.ptyDisposes = [];

    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = null;
    }

    window.removeEventListener('resize', this.onResizeEvent);
  }
}
