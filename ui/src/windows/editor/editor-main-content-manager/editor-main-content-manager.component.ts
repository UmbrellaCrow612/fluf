import { Component, computed, inject, Signal, Type } from '@angular/core';
import { EditorContextService } from '../editor-context/editor-context.service';
import { EditorOpenFilesComponent } from '../editor-open-files/editor-open-files.component';
import { NgComponentOutlet } from '@angular/common';
import { Renderable } from '../ngComponentOutlet/type';
import { EditorMainContentBottomComponent } from '../editor-main-content-bottom/editor-main-content-bottom.component';

/**
 * Handles which component to render based on editor state such as PDF viwer component, core editor, markdown etc, open files and the bottom section which contains
 * stuff like the terminal problems etc
 */
@Component({
  selector: 'app-editor-main-content-manager',
  imports: [
    EditorOpenFilesComponent,
    NgComponentOutlet,
    EditorMainContentBottomComponent,
  ],
  templateUrl: './editor-main-content-manager.component.html',
  styleUrl: './editor-main-content-manager.component.css',
})
export class EditorMainContentManagerComponent {
  private readonly editorContextService = inject(EditorContextService);

  /**
   * Indicates if we should render the component that displays all current open files in the editor
   */
  public shouldRenderOpenFiles: Signal<boolean> = computed(() => {
    let files = this.editorContextService.openFiles();
    return Array.isArray(files) && files.length > 0;
  });

  /**
   * Indicates if it should rende the bottom section of the editor which contains stuff like terminal etc
   */
  public shouldRenderBottomSection: Signal<boolean> = computed(() => {
    let should = this.editorContextService.displayFileEditorBottom();
    return typeof should === 'boolean' && should;
  });

  /**
   * Holds which component to render in the middle of the editor i.e code editor document editor etc
   */
  public mainContentComponentToRender: Signal<Type<any> | null> = computed(
    () => {
      let component =
        this.mainContentRenderableComponents.find((x) => x.condition())
          ?.component ?? null;
      return component;
    },
  );

  private mainContentRenderableComponents: Renderable[] = [];
}
