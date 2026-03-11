import {
  Component,
  computed,
  effect,
  inject,
  Signal,
  Type,
  untracked,
} from '@angular/core';
import { EditorMainContentManagerComponent } from '../editor-main-content-manager/editor-main-content-manager.component';
import { EditorSidebarComponent } from '../editor-sidebar/editor-sidebar.component';
import { EditorContextService } from '../editor-context/editor-context.service';
import { NgComponentOutlet } from '@angular/common';
import { Renderable } from '../ngComponentOutlet/type';
import { Resizer } from 'umbr-resizer-two';
import { EditorFileExplorerComponent } from '../editor-file-explorer/editor-file-explorer.component';

/**
 * Handles rendering the main central bit of the editor this contains side bar, visual editor and other stuff
 */
@Component({
  selector: 'app-editor-main-content',
  imports: [
    EditorMainContentManagerComponent,
    EditorSidebarComponent,
    NgComponentOutlet,
  ],
  templateUrl: './editor-main-content.component.html',
  styleUrl: './editor-main-content.component.css',
})
export class EditorMainContentComponent {
  private readonly editorContextService = inject(EditorContextService);

  private resizer: Resizer | null = null;
  private sharedHandleStyles: Record<string, string> = {
    width: '6px',
    cursor: 'col-resize',
  };

  private renderResizeHandleTimeout: NodeJS.Timeout | null = null;

  constructor() {
    effect(() => {
      let should = this.shouldRenderSideBarComponent();

      if (should) {
        untracked(() => {
          this.renderResizeHandle();
        });
      } else {
        this.disposeResizer();
      }
    });
  }

  /**
   * Renders the resize handle between two elements disposihnhg of previous one
   */
  private renderResizeHandle = () => {
    if (this.renderResizeHandleTimeout) {
      clearTimeout(this.renderResizeHandleTimeout);
    }

    this.renderResizeHandleTimeout = setTimeout(() => {
      console.log('[EditorMainContentComponent] resize handle render');
      let mainContentContainerElement: HTMLDivElement | null =
        document.getElementById(
          'editor_main_content_wrapper',
        ) as HTMLDivElement | null;
      if (!mainContentContainerElement) {
        throw new Error('editor_main_content_container not found');
      }

      if (this.resizer) {
        this.resizer.dispose();
        this.resizer = null;
      }

      this.resizer = new Resizer(
        {
          container: mainContentContainerElement,
          classNames: ['resize_handle_base'],
          direction: 'horizontal',
          handleStyles: this.sharedHandleStyles,
          minFlex: 0.4,
          storageKey: 'editor_main_content_component_resize_handle_key',
        },
        {
          onBeginDrag: () => {
            console.log('[onBeginDrag]');
          },
          onDrag: (flexValues) => {
            // todo call resize terminal here other callbacks
          },
          onDragFinished: (flexValues) => {
            console.log(`[onDragFinished] ${flexValues}`);
          },
          onDragPastMin: (side, pixelsPast) => {
            if (side === 'left' && pixelsPast > 200) {
              console.log(
                '[onDragPastMin] unrendering side bar component as it went past 200 pixels',
              );
              this.disposeResizer();

              this.editorContextService.sideBarActiveElement.set(null);
            }
          },
        },
      );
    });
  };

  private disposeResizer = () => {
    this.resizer?.dispose();
    this.resizer = null;
  };

  /**
   * Determins if the side bar component should be rendered if a specific component to render is present, also removes or add handle
   */
  public shouldRenderSideBarComponent: Signal<boolean> = computed(() => {
    let should = this.editorContextService.sideBarActiveElement() !== null;
    return should;
  });

  /**
   * Keep track if user has select a directory
   */
  private hasSelectedDirectory: Signal<boolean> = computed(() => {
    const selectedDir = this.editorContextService.selectedDirectoryPath();
    return selectedDir !== null;
  });

  /**
   * List of all components that can be rendered in the side bar
   */
  private renderableSideBarElements: Renderable[] = [
    {
      component: EditorFileExplorerComponent,
      condition: computed(() => {
        return (
          this.editorContextService.sideBarActiveElement() === 'file-explorer'
        );
      }),
    },
  ];

  /**
   * Holds the current component to render for the side bar based on what is the active element
   */
  public sideBarComponentToRender: Signal<Type<any> | null> = computed(() => {
    const componentToRender =
      this.renderableSideBarElements.find((x) => x.condition())?.component ??
      null;
    return componentToRender;
  });
}
