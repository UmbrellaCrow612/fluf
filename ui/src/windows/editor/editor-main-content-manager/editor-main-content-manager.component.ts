import {
  Component,
  computed,
  effect,
  inject,
  Signal,
  Type,
} from '@angular/core';
import { EditorContextService } from '../editor-context/editor-context.service';
import { EditorOpenFilesComponent } from '../editor-open-files/editor-open-files.component';
import { NgComponentOutlet } from '@angular/common';
import { Renderable } from '../ngComponentOutlet/type';
import { EditorMainContentBottomComponent } from '../editor-main-content-bottom/editor-main-content-bottom.component';
import { Resizer } from 'umbr-resizer-two';
import { useEffect } from '../../../lib/useEffect';
import { EditorInMemoryContextService } from '../editor-context/editor-in-memory-context.service';
import { EditorMainContentEmptyComponent } from '../editor-main-content-empty/editor-main-content-empty.component';

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
  private readonly editorInMemoryContextService = inject(
    EditorInMemoryContextService,
  );

  private resizer: Resizer | null = null;
  private resizerTimeout: NodeJS.Timeout | undefined = undefined;

  constructor() {
    useEffect(
      (_, should) => {
        console.log(
          '[EditorMainContentManagerComponent] MainContentManagerResizer effect ran',
        );
        if (should) {
          this.renderResizer();
        } else {
          this.disposeResizer();
        }
      },
      [this.editorContextService.displayFileEditorBottom],
      {
        debugName: 'MainContentManagerResizer',
      },
    );
  }

  private renderResizer = () => {
    clearTimeout(this.resizerTimeout);

    this.resizerTimeout = setTimeout(() => {
      const container = document.getElementById(
        'editor_main_content_manager_central_container',
      ) as HTMLDivElement;

      if (!container) {
        throw new Error(
          'Cannot render resizer as container is missing from DOM',
        );
      }

      this.resizer = new Resizer(
        {
          container,
          classNames: ['resize_handle_base'],
          direction: 'vertical',
          handleStyles: {
            height: '6px',
            cursor: 'row-resize',
          },
          minFlex: 0.3,
          storageKey: 'editor_main_content_manager_component_resizer_key',
        },
        {
          onBeginDrag: () => {
            this.editorInMemoryContextService.editorResize.update((x) => x + 1);
          },
          onDrag: () => {
            this.editorInMemoryContextService.editorResize.update((x) => x + 1);
          },
          onDragFinished: (flexValues) => {
            this.editorInMemoryContextService.editorResize.update((x) => x + 1);
          },
        },
      );

      this.editorInMemoryContextService.editorResize.update((x) => x + 1);
    }, 10);
  };

  private disposeResizer = () => {
    this.resizer?.dispose();
    this.resizer = null;
    clearTimeout(this.resizerTimeout);
    this.editorInMemoryContextService.editorResize.update((x) => x + 1);
  };

  /**
   * Keeps track of if there are no open files in the editor
   */
  private noFilesOpen: Signal<boolean> = computed(() => {
    const openFiles = this.editorContextService.openFiles();
    if (!openFiles) {
      return true;
    }

    return openFiles.length === 0;
  });

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

  private mainContentRenderableComponents: Renderable[] = [
    {
      component: EditorMainContentEmptyComponent,
      condition: computed(
        () =>
          this.editorContextService.editorMainActiveElement() === null ||
          this.noFilesOpen(),
      ),
    },
  ];
}
