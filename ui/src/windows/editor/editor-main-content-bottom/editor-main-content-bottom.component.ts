import { Component, computed, inject, Signal, Type } from '@angular/core';
import { EditorMainContentBottomFrameComponent } from '../editor-main-content-bottom-frame/editor-main-content-bottom-frame.component';
import { Renderable } from '../ngComponentOutlet/type';
import { EditorStateService } from '../core/state/editor-state.service';
import { NgComponentOutlet } from '@angular/common';
import { EditorTerminalComponent } from '../editor-terminal/editor-terminal.component';
import { EditorMainContentBottomEmptyComponent } from '../editor-main-content-bottom-empty/editor-main-content-bottom-empty.component';

/**
 * Represents the bottom section of the main content which contains stuff like the terminal etc, manages which one to show
 */
@Component({
  selector: 'app-editor-main-content-bottom',
  imports: [EditorMainContentBottomFrameComponent, NgComponentOutlet],
  templateUrl: './editor-main-content-bottom.component.html',
  styleUrl: './editor-main-content-bottom.component.css',
})
export class EditorMainContentBottomComponent {
  private readonly editorStateService = inject(EditorStateService);

  /**
   * Holds list of components that can be rendered as the main content of this component
   */
  private renderableComponents: Renderable[] = [
    {
      component: EditorTerminalComponent,
      condition: computed(() => {
        return (
          this.editorStateService.editorBottomActiveElement() === 'terminal'
        );
      }),
    },
    {
      component: EditorMainContentBottomEmptyComponent,
      condition: computed(() => {
        return !this.editorStateService.editorBottomActiveElement();
      }),
    },
  ];

  /**
   * Holds which component to render in the UI
   */
  public readonly componentToRender: Signal<Type<any> | null> = computed(() => {
    const match = this.renderableComponents.find((x) => x.condition());
    return match?.component ?? null;
  });
}
