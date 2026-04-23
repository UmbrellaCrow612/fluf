import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from "@angular/core";
import { useEffect } from "../../../lib/useEffect";
import { voidCallback } from "../../../gen/type";
import { IDisposable, ITheme, Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { EditorInMemoryStateService } from "../core/state/editor-in-memory-state.service";
import { SerializeAddon } from "@xterm/addon-serialize";
import { EditorBottomPaneService } from "../core/panes/bottom/editor-bottom-pane.service";
import { EditorTerminalService } from "../core/terminal/editor-terminal.service";
import { EditorWorkspaceService } from "../core/workspace/editor-workspace.service";

/**
 * Renders the actual interact / xterm UI for the current active shell ID
 */
@Component({
  selector: "app-editor-terminal-pane",
  imports: [],
  templateUrl: "./editor-terminal-pane.component.html",
  styleUrl: "./editor-terminal-pane.component.css",
})
export class EditorTerminalPaneComponent implements OnDestroy, AfterViewInit {
  private readonly editorBottomPaneService = inject(EditorBottomPaneService);
  private readonly editorTerminalService = inject(EditorTerminalService);
  private readonly editorWorkspaceService = inject(EditorWorkspaceService);

  public ngAfterViewInit() {
    this.editorBottomPaneService.resolvePane();
  }

  /**
   * Holds any error state for creating xterm
   */
  public readonly createTerminalError = signal<string | null>(null);

  /**
   * Holds the current active shell
   */
  public readonly shellPid = this.editorTerminalService.activeShellPid;

  /**
   * Holds the xterm terminal object instace
   */
  private terminal: Terminal | null = null;

  /**
   * Holds he xterm addon used for fitting the xterm container
   */
  private fitAddon: FitAddon | null = null;

  /**
   * Holds the xterm serliaze addon for saving and restoring the buffer for the given terminal
   */
  private serializeAddon: SerializeAddon | null = null;

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
  >("xtermContainerTarget");

  constructor() {
    useEffect(
      async (_, pid) => {
        if (!pid) {
          this.cleanUpState("No PID");
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
      [this.editorWorkspaceService.resize],
    );
  }

  public ngOnDestroy() {
    this.cleanUpState("ngOnDestroy");
  }

  /**
   * Listens to the PID given and creates a Xterm UI for the given PID listening to changes and reflecting them in the UI, as well as removing the previous instance
   * @param pid The PID to listen to
   */
  private async attachToPane(pid: number): Promise<void> {
    console.log(
      "[EditorTerminalPaneComponent] attach to pane ran for pid: ",
      pid,
    );

    this.cleanUpState("attachToPane");
    this.createTerminalError.set(null);

    try {
      const container = this.terminalTargetContainer()?.nativeElement;
      if (!container) {
        throw new Error("Could not find container element to attach xterm to");
      }

      const isAlive = await this.editorTerminalService.isShellAlive(pid);
      if (!isAlive) {
        throw new Error(`Shell with PID ${pid} no longer alive`);
      }

      const shellInformation = this.editorTerminalService
        .shellPidInfoMap()
        .get(pid);
      if (!shellInformation) {
        throw new Error("Could not find shell to attach in map");
      }

      const theme = this.buildXtermThemeFromCss();
      const fontFamily =
        this.getCssVariable("--code-editor-font-family").replace(/"/g, "") ||
        '"Fira Code", Consolas, monospace';
      const fontSize =
        parseInt(this.getCssVariable("--code-editor-font-size"), 10) || 14;

      const xterm = new Terminal({
        cols: shellInformation.cols,
        rows: shellInformation.rows,
        theme,
        fontFamily,
        fontSize,
      });

      this.terminal = xterm;

      this.fitAddon = new FitAddon();
      this.serializeAddon = new SerializeAddon();

      this.terminal.loadAddon(this.fitAddon);
      this.terminal.loadAddon(this.serializeAddon);

      this.serializeAddon.activate(this.terminal);

      window.addEventListener("resize", this.onResizeEvent);

      this.terminalDisposes.push(
        this.terminal.onData((data) => {
          this.editorTerminalService.writeToShell(pid, data);
        }),
      );

      this.terminalDisposes.push(
        this.terminal.onResize(({ cols, rows }) => {
          this.editorTerminalService.resizeShell(pid, cols, rows);
        }),
      );

      this.ptyDisposes.push(
        this.editorTerminalService.onShellChange(pid, (_, chunk) => {
          if (!this.terminal) {
            console.error(
              "Data sent from backend could not be written to UI xterm instace as it is null",
            );
            return;
          }

          this.terminal.write(chunk, () => {
            const serlized = this.serializeAddon?.serialize();
            if (!serlized) {
              console.error(
                "Data could not be serlized as the serlize addon is null for PID: ",
                pid,
              );
              return;
            }
          });
        }),
      );

      this.ptyDisposes.push(
        this.editorTerminalService.onShellExit(pid, () => {
          this.removeTerminalFromDataStore(pid);
        }),
      );

      this.terminal.open(container);

      this.fitAddon.fit();
      setTimeout(() => {
        this.fitAddon?.fit();
      }, 4);
    } catch (error: any) {
      console.error("Failed to attach xterm terminal to UI ", error);
      this.createTerminalError.set(
        `Failed to attach xterm terminal to UI ${error?.message}`,
      );
      this.cleanUpState("Error attachToPane");
    }
  }

  /**
   * Helper to read a CSS variable value from :root
   */
  private getCssVariable(variableName: string): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim();
  }

  /**
   * Builds an xterm.js theme object from CSS custom properties
   */
  private buildXtermThemeFromCss(): ITheme {
    return {
      // Core colors
      background: this.getCssVariable("--xterm-background"),
      foreground: this.getCssVariable("--xterm-foreground"),
      cursor: this.getCssVariable("--xterm-cursor"),
      cursorAccent: this.getCssVariable("--xterm-cursor-accent"),
      selectionBackground: this.getCssVariable("--xterm-selection"),

      // ANSI colors
      black: this.getCssVariable("--xterm-black"),
      red: this.getCssVariable("--xterm-red"),
      green: this.getCssVariable("--xterm-green"),
      yellow: this.getCssVariable("--xterm-yellow"),
      blue: this.getCssVariable("--xterm-blue"),
      magenta: this.getCssVariable("--xterm-magenta"),
      cyan: this.getCssVariable("--xterm-cyan"),
      white: this.getCssVariable("--xterm-white"),

      // Bright ANSI colors
      brightBlack: this.getCssVariable("--xterm-bright-black"),
      brightRed: this.getCssVariable("--xterm-bright-red"),
      brightGreen: this.getCssVariable("--xterm-bright-green"),
      brightYellow: this.getCssVariable("--xterm-bright-yellow"),
      brightBlue: this.getCssVariable("--xterm-bright-blue"),
      brightMagenta: this.getCssVariable("--xterm-bright-magenta"),
      brightCyan: this.getCssVariable("--xterm-bright-cyan"),
      brightWhite: this.getCssVariable("--xterm-bright-white"),
    };
  }

  /**
   * Removes the given terminal shell from the in memeory data and trys to set the next avialable shell pid
   * @param pid The Shell to remove
   */
  private removeTerminalFromDataStore(pid: number): void {
    console.log("[EditorTerminalPaneComponent] remove ran");

    try {
      this.editorTerminalService.deleteAndKill(pid);
    } catch (error) {
      console.log("Failed to remove pid: ", pid, error);
    }
  }

  /**
   * Runs logic to reszie the terminal
   */
  private onResizeEvent = () => {
    if (this.terminal && this.fitAddon) {
      this.fitAddon.fit();

      setTimeout(() => {
        this.fitAddon?.fit();
      }, 4);
      console.log("[EditorTerminalPaneComponent] terminal resize ran");
    }
  };

  /**
   * Cleans up previous xterm instace, addons and other cleanup needed
   */
  private cleanUpState(from: string) {
    console.log("[EditorTerminalPaneComponent] cleanup ran from ", from);

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
    if (this.fitAddon) {
      this.fitAddon.dispose();
      this.fitAddon = null;
    }
    if (this.serializeAddon) {
      this.serializeAddon.dispose();
      this.serializeAddon = null;
    }

    window.removeEventListener("resize", this.onResizeEvent);
  }
}
