import {
  Component,
  ElementRef,
  input,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { useEffect } from '../../../lib/useEffect';
import { shellPid } from '../../../gen/type';
import { Terminal } from '@xterm/xterm';
import { getElectronApi } from '../../../utils';

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
  private readonly electronApi = getElectronApi()


  /**
   * The specific shell PID to show the UI for in the panel
   */
  public readonly shellPid = input.required<shellPid | null>();


  /**
   * Holds the xterm terminal object instace
   */
  private terminal: Terminal | null = null;

  /**
   * Holds a refrence to the template div in which xterm will be rendered in
   */
  private readonly terminalTargetContainer = viewChild<
    ElementRef<HTMLDivElement>
  >('xtermContainerTarget');

  /**
   * Holds any error state for creating xterm
   */
  public readonly createTerminalError = signal<string | null>(null);

  constructor() {
    useEffect(
      (_, pid) => {
        if (!pid) {
          this.cleanUpState('No PID');
          return;
        }

        this.attachToPane(pid);
      },
      [this.shellPid],
    );
  }

  public ngOnDestroy() {
    this.cleanUpState('ngOnDestroy');
  }

  /**
   * Listens to the PID given and creates a Xterm UI for the given PID listening to changes and reflecting them in the UI, as well as removing the previous instance
   * @param pid The PID to listen to
   */
  private attachToPane(pid: shellPid): void {
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

      const shell = this.electronApi.shellApi. // ap9i tpo get shell info row cols etc

    } catch (error: any) {
      console.error('Failed to attach xterm terminal to UI ', error);
      this.createTerminalError.set(
        `Failed to attach xterm terminal to UI ${error?.message}`,
      );
    }
  }

  /**
   * Cleans up previous xterm instace and other cleanup work
   */
  private cleanUpState(from: string) {
    console.log('[EditorTerminalPaneComponent] cleanup ran from ', from);

    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = null;
    }
  }
}
