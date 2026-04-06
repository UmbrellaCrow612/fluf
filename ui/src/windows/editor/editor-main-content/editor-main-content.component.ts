import {
  Component,
  computed,
  effect,
  inject,
  Signal,
  Type,
  untracked,
} from "@angular/core";
import { EditorMainContentManagerComponent } from "../editor-main-content-manager/editor-main-content-manager.component";
import { EditorSidebarComponent } from "../editor-sidebar/editor-sidebar.component";
import { EditorStateService } from "../core/state/editor-state.service";
import { NgComponentOutlet } from "@angular/common";
import { Renderable } from "../../../lib/ng-component-outlet/type";
import { Resizer } from "umbr-resizer-two";
import { EditorFileExplorerComponent } from "../editor-file-explorer/editor-file-explorer.component";
import { useEffect } from "../../../lib/useEffect";
import { EditorSelectDirectoryComponent } from "../editor-select-directory/editor-select-directory.component";
import { EditorInMemoryStateService } from "../core/state/editor-in-memory-state.service";
import {
  EDITOR_SIDE_BAR_PANE_ELEMENTS,
  EditorSidebarPaneService,
} from "../core/panes/editor-sidebar-pane.service";
import { EditorWorkspaceService } from "../core/services/editor-workspace.service";

/**
 * Handles rendering the main central bit of the editor this contains side bar, visual editor and other stuff
 */
@Component({
  selector: "app-editor-main-content",
  imports: [
    EditorMainContentManagerComponent,
    EditorSidebarComponent,
    NgComponentOutlet,
  ],
  templateUrl: "./editor-main-content.component.html",
  styleUrl: "./editor-main-content.component.css",
})
export class EditorMainContentComponent {
  private readonly editorStateService = inject(EditorStateService);
  private readonly editorInMemoryStateService = inject(
    EditorInMemoryStateService,
  );
  private readonly editorSidebarPaneService = inject(EditorSidebarPaneService);
  private readonly editorWorkspaceService = inject(EditorWorkspaceService);

  private resizer: Resizer | null = null;
  private sharedHandleStyles: Record<string, string> = {
    width: "6px",
    cursor: "col-resize",
  };

  private renderResizeHandleTimeout: NodeJS.Timeout | null = null;

  constructor() {
    useEffect(
      (_, should) => {
        if (should) {
          this.renderResizeHandle();
        } else {
          this.disposeResizer();
        }
      },
      [this.shouldRenderSideBarComponent],
    );
  }

  /**
   * Renders the resize handle between two elements disposihnhg of previous one
   */
  private renderResizeHandle = () => {
    if (this.renderResizeHandleTimeout) {
      clearTimeout(this.renderResizeHandleTimeout);
    }

    this.renderResizeHandleTimeout = setTimeout(() => {
      console.log("[EditorMainContentComponent] resize handle render");
      let mainContentContainerElement: HTMLDivElement | null =
        document.getElementById(
          "editor_main_content_wrapper",
        ) as HTMLDivElement | null;
      if (!mainContentContainerElement) {
        throw new Error("editor_main_content_container not found");
      }

      if (this.resizer) {
        this.resizer.dispose();
        this.resizer = null;
      }

      this.resizer = new Resizer(
        {
          container: mainContentContainerElement,
          classNames: ["resize_handle_base"],
          direction: "horizontal",
          handleStyles: this.sharedHandleStyles,
          minFlex: 0.3,
          storageKey: "editor_main_content_component_resize_handle_key",
        },
        {
          onBeginDrag: () => {
            this.editorInMemoryStateService.editorResize.update((x) => x + 1);
          },
          onDrag: () => {
            this.editorInMemoryStateService.editorResize.update((x) => x + 1);
          },
          onDragFinished: (flexValues) => {
            this.editorInMemoryStateService.editorResize.update((x) => x + 1);
          },
          onDragPastMin: (side, pixelsPast) => {
            if (side === "left" && pixelsPast > 200) {
              console.log(
                "[onDragPastMin] unrendering side bar component as it went past 200 pixels",
              );
              this.disposeResizer();

              this.editorSidebarPaneService.activatePane(null);
            }
          },
        },
      );

      this.editorInMemoryStateService.editorResize.update((x) => x + 1);
    });
  };

  private disposeResizer = () => {
    this.resizer?.dispose();
    this.resizer = null;
    this.editorInMemoryStateService.editorResize.update((x) => x + 1);
  };

  /**
   * Determins if the side bar component should be rendered if a specific component to render is present, also removes or add handle
   */
  public shouldRenderSideBarComponent: Signal<boolean> = computed(() => {
    let should = this.editorSidebarPaneService.pane() !== null;
    return should;
  });

  /**
   * Keep track if user has select a directory
   */
  private hasSelectedDirectory: Signal<boolean> = computed(() => {
    const selectedDir = this.editorWorkspaceService.workspace();
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
          this.editorSidebarPaneService.pane() ===
            EDITOR_SIDE_BAR_PANE_ELEMENTS.FILE_EXPLORER &&
          this.hasSelectedDirectory()
        );
      }),
    },
    {
      component: EditorSelectDirectoryComponent,
      condition: computed(() => {
        const hasSelected = this.hasSelectedDirectory();
        return !hasSelected;
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
