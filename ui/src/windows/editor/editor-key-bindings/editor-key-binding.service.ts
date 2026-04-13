import { inject, Injectable } from "@angular/core";
import { KeyMaster } from "umbr-key-master";
import { EditorDisplayBottomService } from "../core/panes/bottom/editor-display-bottom.service";
import { EditorWorkspaceService } from "../core/workspace/editor-workspace.service";

/**
 * Central configuration for all out key binding logic editor wide
 */
@Injectable({
  providedIn: "root",
})
export class EditorKeyBindingService {
  private readonly keyMaster = new KeyMaster();
  private readonly editorDisplayBottomService = inject(
    EditorDisplayBottomService,
  );
  private readonly editorWorkspaceService = inject(EditorWorkspaceService);

  /**
   * Initlizes key bindings for the editor application
   */
  public initKeyBindings = async () => {
    try {
      this.keyMaster.add(["Control", "j"], () => {
        this.editorDisplayBottomService.logicalOr();
      });

      this.keyMaster.add(["Control", "s"], () => {
        this.editorWorkspaceService.triggerControlSave();
      });
    } catch (error) {
      console.error("Failed to init key bindings ", error);
    }
  };
}
