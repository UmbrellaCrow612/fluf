import { Component, computed, inject, signal, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditorStateService } from '../core/state/editor-state.service';
import { editorBottomActiveElement } from '../core/state/type';

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
  element: editorBottomActiveElement;
};

/**
 * Shows the top section of the editor bottom containg our call to actions such as clicking terminal etc, and changing what we render inside of the main content
 * of editor bottom
 */
@Component({
  selector: 'app-editor-main-content-bottom-frame',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './editor-main-content-bottom-frame.component.html',
  styleUrl: './editor-main-content-bottom-frame.component.css',
})
export class EditorMainContentBottomFrameComponent {
  private readonly editorStateService = inject(EditorStateService);

  private readonly callToActionsArray: EditorBottomFrameCallToAction[] = [
    { label: 'TERMINAL', tooltip: 'Terminal', element: 'terminal' },
    { label: 'PROBLEMS', tooltip: 'Problems', element: 'problems' },
  ];
  /**
   * List of actions we render in the UI
   */
  public readonly callToActions: Signal<EditorBottomFrameCallToAction[]> =
    signal([...this.callToActionsArray]);

  /**
   * Keeps track of the active bottom element
   */
  public readonly activeBottomElement: Signal<editorBottomActiveElement> =
    computed(() => {
      return this.editorStateService.editorBottomActiveElement();
    });

  /**
   * Select / change the editor bottom active lement to a new element
   * @param element The item to switch to
   */
  public selectEditorBottomElement(element: editorBottomActiveElement): void {
    this.editorStateService.editorBottomActiveElement.set(element);
  }

  /**
   * Closes the bottom panel i.e hides it from UI
   */
  public closeBottomPanel() {
    this.editorStateService.displayFileEditorBottom.set(null);
  }
}
