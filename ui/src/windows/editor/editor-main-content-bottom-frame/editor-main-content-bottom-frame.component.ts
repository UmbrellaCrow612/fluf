import { Component, computed, inject, signal, Signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EditorDisplayBottomService } from "../core/panes/bottom/editor-display-bottom.service";
import {
  EDITOR_BOTTOM_PANE_ELEMENT,
  editorBottomPane,
  EditorBottomPaneService,
} from "../core/panes/bottom/editor-bottom-pane.service";

/**
 * Shape each clickable button has
 */
type EditorBottomFrameCallToAction = {
  /**
   * Text to render inside the button
   */
  label: string;

  /**
   * Hover information
   */
  tooltip: string;

  /**
   * What element it will change top when clicked
   */
  pane: editorBottomPane;
};

/**
 * Shows the top section of the editor bottom containg our call to actions such as clicking terminal etc, and changing what we render inside of the main content
 * of editor bottom
 */
@Component({
  selector: "app-editor-main-content-bottom-frame",
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: "./editor-main-content-bottom-frame.component.html",
  styleUrl: "./editor-main-content-bottom-frame.component.css",
})
export class EditorMainContentBottomFrameComponent {
  private readonly editorDisplayBottomService = inject(
    EditorDisplayBottomService,
  );
  private readonly editorBottomPaneService = inject(EditorBottomPaneService);

  private readonly callToActionsArray: EditorBottomFrameCallToAction[] = [
    {
      label: "TERMINAL",
      tooltip: "Terminal",
      pane: EDITOR_BOTTOM_PANE_ELEMENT.TERMINAL,
    },
    {
      label: "PROBLEMS",
      tooltip: "Problems",
      pane: EDITOR_BOTTOM_PANE_ELEMENT.PROBLEMS,
    },
  ];
  /**
   * List of actions we render in the UI
   */
  public readonly callToActions: Signal<EditorBottomFrameCallToAction[]> =
    signal([...this.callToActionsArray]);

  /**
   * Keeps track of the active bottom element
   */
  public readonly activeBottomElement: Signal<editorBottomPane> =
    this.editorBottomPaneService.pane;

  /**
   * Select / change the editor bottom active lement to a new element
   * @param element The item to switch to
   */
  public selectEditorBottomElement(element: editorBottomPane): void {
    this.editorBottomPaneService.activatePaneAndWait(element);
  }

  /**
   * Closes the bottom panel i.e hides it from UI
   */
  public closeBottomPanel() {
    this.editorDisplayBottomService.hide();
  }
}
