import { Component, computed, inject, Signal } from "@angular/core";
import { fileNode } from "../../../gen/type";
import { EditorStateService } from "../core/state/editor-state.service";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EditorOpenFileItemComponent } from "../editor-open-file-item/editor-open-file-item.component";
import { EditorOpenFilesService } from "./services/editor-open-files.service";

/**
 * Displays all open files in the editor as clickable buttons and switch current view between them
 */
@Component({
  selector: "app-editor-open-files",
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    EditorOpenFileItemComponent,
  ],
  templateUrl: "./editor-open-files.component.html",
  styleUrl: "./editor-open-files.component.css",
})
export class EditorOpenFilesComponent {
  private readonly editorOpenFilesService = inject(EditorOpenFilesService);

  /**
   * Keeps track current open files in the editor
   */
  public readonly currentOpenFiles: Signal<fileNode[]> =
    this.editorOpenFilesService.nodes;
}
