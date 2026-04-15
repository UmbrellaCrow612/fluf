import { inject, Injectable, signal } from "@angular/core";
import { shellInformation } from "../../../../gen/type";
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
  public readonly shellPidInfoMap = this._shellPidInfoMap.asReadonly();

  /**
   * Current active shell shown in the UI
   */
  private readonly _activeShellPid = signal(null);
  public readonly activeShellPid = this._activeShellPid.asReadonly();

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

      this._shellPidInfoMap.set(shellInformation.pid, shellInformation);
      this._emitChange();

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

      return result;
    } catch (error) {
      console.error("Failed to delete and kill shell ", pid, error);
      return false;
    }
  }

  public deleteAndKillAll() {
    for (const pid of this._shellPidInfoMap().keys()) {
      this.deleteAndKill(pid);
    }
  }

  public setActiveShell(pid: number) {
    this.activeShellPid = pid;
  }

  public getActiveShellPid(): number | null {
    return this.activeShellPid;
  }
}
