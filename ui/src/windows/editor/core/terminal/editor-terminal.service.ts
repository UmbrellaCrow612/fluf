import { inject, Injectable, signal } from "@angular/core";
import {
  shellChangeCallback,
  shellInformation,
  voidCallback,
} from "../../../../gen/type";
import { getElectronApi } from "../../../../shared/electron";
import { EditorWorkspaceService } from "../workspace/editor-workspace.service";

type createShellResult = {
  successed: boolean;
  reason?: string;
};

/**
 * Handles terminals and shells in the editor
 */
@Injectable({
  providedIn: "root",
})
export class EditorTerminalService {
  private readonly electronApi = getElectronApi();
  private readonly editorWorkspaceService = inject(EditorWorkspaceService);

  /**
   * Contains a specific PID of a shell and it's information
   */
  private readonly _shellPidInfoMap = signal(
    new Map<number, shellInformation>(),
  );
  /**
   * Readonyl signal for shells map
   */
  public readonly shellPidInfoMap = this._shellPidInfoMap.asReadonly();

  /**
   * Current active shell shown in the UI
   */
  private readonly _activeShellPid = signal<number | null>(null);
  /**
   * Readonly signal for active shell
   */
  public readonly activeShellPid = this._activeShellPid.asReadonly();

  /**
   * Create a shell
   * @param executable A path to a custom exe to run as the shell in the terminal UI
   * @param args Addtional arguments to pass to it
   * @returns Result object
   */
  public async createShell(
    executable?: string,
    args?: string[],
  ): Promise<createShellResult> {
    try {
      let directory = this.editorWorkspaceService.workspace();
      if (!directory) {
        directory = await this.electronApi.pathApi.getDefaultProfilePath();
      }

      const shellInformation = await this.electronApi.shellApi.create(
        directory,
        executable,
        args,
      );

      if (!shellInformation) {
        return {
          successed: false,
          reason: "Could not create shell",
        };
      }

      const map = this._shellPidInfoMap();
      map.set(shellInformation.pid, shellInformation);
      this._shellPidInfoMap.set(structuredClone(map));

      this._activeShellPid.set(shellInformation.pid);

      return {
        successed: true,
      };
    } catch (error: any) {
      console.error("Failed to create shell ", error);
      return {
        successed: false,
        reason: `Failed to create shell ${error?.message}`,
      };
    }
  }

  /**
   * Resize the backing shell process to change it's size
   * @param pid The shell process ID
   * @param col The new col numnber
   * @param row The new row number
   */
  public resizeShell(pid: number, col: number, row: number): void {
    this.electronApi.shellApi.resize(pid, col, row);
  }

  /**
   * Listen to when a shell changes
   * @param pid The shell process ID
   * @param callback The function to run
   * @returns Unsub callback
   */
  public onShellChange(
    pid: number,
    callback: shellChangeCallback,
  ): voidCallback {
    return this.electronApi.shellApi.onChange(pid, callback);
  }

  /**
   * Listen to when a shell exits
   * @param pid The shell process ID
   * @param callback The function to run
   * @returns Unsub callback
   */
  public onShellExit(pid: number, callback: voidCallback): voidCallback {
    return this.electronApi.shellApi.onExit(pid, callback);
  }

  /**
   * Write data to a shell process
   * @param pid The shell process ID
   * @param chunk The new data
   */
  public writeToShell(pid: number, chunk: string): void {
    this.electronApi.shellApi.write(pid, chunk);
  }

  /**
   * Delete a shell
   * @param pid The specific shell
   * @returns If it could or could not
   */
  public async deleteAndKill(pid: number): Promise<boolean> {
    try {
      const map = this._shellPidInfoMap();
      const info = map.get(pid);
      if (!info) {
        return true;
      }

      const result = await this.electronApi.shellApi.kill(pid);

      map.delete(pid);
      this._shellPidInfoMap.set(structuredClone(map));

      const arr = Array.from(map.keys());
      if (arr.length > 0) {
        const nextActivePid = arr[0];
        this.setActiveShell(nextActivePid);
      } else {
        this.setActiveShell(null);
      }

      return result;
    } catch (error) {
      console.error("Failed to delete and kill shell ", pid, error);
      return false;
    }
  }

  /**
   * Kill all shells
   */
  public deleteAndKillAll() {
    for (const pid of this._shellPidInfoMap().keys()) {
      this.deleteAndKill(pid);
    }

    this.setActiveShell(null);
  }

  /**
   * Change the active shell
   * @param pid The new value
   */
  public setActiveShell(pid: number | null) {
    this._activeShellPid.set(pid);
  }

  /**
   * Check if a shell is still active
   * @param pid The shell PID
   * @returns If it is or is not
   */
  public async isShellAlive(pid: number | null): Promise<boolean> {
    if (typeof pid === "number") {
      return await this.electronApi.shellApi.isAlive(pid);
    } else {
      return false;
    }
  }
}
