import { Component, computed, inject, Signal, Type } from "@angular/core";
import { EditorOpenFilesComponent } from "../editor-open-files/editor-open-files.component";
import { NgComponentOutlet } from "@angular/common";
import { Renderable } from "../../../lib/ng-component-outlet/type";
import { EditorMainContentBottomComponent } from "../editor-main-content-bottom/editor-main-content-bottom.component";
import { Resizer } from "umbr-resizer-two";
import { useEffect } from "../../../lib/useEffect";
import { EditorInMemoryStateService } from "../core/state/editor-in-memory-state.service";
import { EditorMainContentEmptyComponent } from "../editor-main-content-empty/editor-main-content-empty.component";
import { EditorImagePaneComponent } from "../editor-image-pane/editor-image-pane.component";
import { EditorPdfPaneComponent } from "../editor-pdf-pane/editor-pdf-pane.component";
import { EditorVideoPaneComponent } from "../editor-video-pane/editor-video-pane.component";
import { EditorAudioPaneComponent } from "../editor-audio-pane/editor-audio-pane.component";
import { EditorMarkdownPaneComponent } from "../editor-markdown-pane/editor-markdown-pane.component";
import { EditorPlainTextPaneComponent } from "../editor-plain-text-pane/editor-plain-text-pane.component";
import { EditorDisplayBottomService } from "../core/panes/bottom/editor-display-bottom.service";
import { EditorOpenFilesService } from "../editor-open-files/services/editor-open-files.service";
import {
  EDITOR_MAIN_PANE_ELEMENTS,
  EditorMainPaneService,
} from "../core/panes/editor-main-pane.service";

/**
 * Handles which component to render based on editor state such as PDF viwer component, core editor, markdown etc, open files and the bottom section which contains
 * stuff like the terminal problems etc
 */
@Component({
  selector: "app-editor-main-content-manager",
  imports: [
    EditorOpenFilesComponent,
    NgComponentOutlet,
    EditorMainContentBottomComponent,
  ],
  templateUrl: "./editor-main-content-manager.component.html",
  styleUrl: "./editor-main-content-manager.component.css",
})
export class EditorMainContentManagerComponent {
  private readonly editorInMemoryStateService = inject(
    EditorInMemoryStateService,
  );
  private readonly editorDisplayBottomService = inject(
    EditorDisplayBottomService,
  );
  private readonly editorOpenFilesService = inject(EditorOpenFilesService);
  private readonly editorMainPaneService = inject(EditorMainPaneService);

  private resizer: Resizer | null = null;
  private resizerTimeout: NodeJS.Timeout | undefined = undefined;

  constructor() {
    useEffect(
      (_, should) => {
        console.log(
          "[EditorMainContentManagerComponent] MainContentManagerResizer effect ran",
        );
        if (should) {
          this.renderResizer();
        } else {
          this.disposeResizer();
        }
      },
      [this.editorDisplayBottomService.display],
    );
  }

  private renderResizer = () => {
    clearTimeout(this.resizerTimeout);

    this.resizerTimeout = setTimeout(() => {
      const container = document.getElementById(
        "editor_main_content_manager_central_container",
      ) as HTMLDivElement;

      if (!container) {
        throw new Error(
          "Cannot render resizer as container is missing from DOM",
        );
      }

      this.resizer = new Resizer(
        {
          container,
          classNames: ["resize_handle_base"],
          direction: "vertical",
          handleStyles: {
            height: "6px",
            cursor: "row-resize",
          },
          minFlex: 0.3,
          storageKey: "editor_main_content_manager_component_resizer_key",
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
        },
      );

      this.editorInMemoryStateService.editorResize.update((x) => x + 1);
    }, 10);
  };

  private disposeResizer = () => {
    this.resizer?.dispose();
    this.resizer = null;
    clearTimeout(this.resizerTimeout);
    this.editorInMemoryStateService.editorResize.update((x) => x + 1);
  };

  /**
   * Keeps track of if there are no open files in the editor
   */
  private noFilesOpen: Signal<boolean> = computed(() => {
    const openFiles = this.editorOpenFilesService.nodes();
    if (!openFiles) {
      return true;
    }

    return openFiles.length === 0;
  });

  /**
   * Indicates if we should render the component that displays all current open files in the editor
   */
  public shouldRenderOpenFiles: Signal<boolean> = computed(() => {
    let files = this.editorOpenFilesService.nodes();
    return Array.isArray(files) && files.length > 0;
  });

  /**
   * Indicates if it should rende the bottom section of the editor which contains stuff like terminal etc
   */
  public shouldRenderBottomSection: Signal<boolean> = computed(() => {
    let should = this.editorDisplayBottomService.display();
    return should;
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
        () => this.editorMainPaneService.pane() === null || this.noFilesOpen(),
      ),
    },
    {
      component: EditorImagePaneComponent,
      condition: computed(
        () =>
          this.editorMainPaneService.pane() ===
          EDITOR_MAIN_PANE_ELEMENTS.IMAGE_EDITOR,
      ),
    },
    {
      component: EditorPdfPaneComponent,
      condition: computed(
        () =>
          this.editorMainPaneService.pane() ===
          EDITOR_MAIN_PANE_ELEMENTS.PDF_EDITOR,
      ),
    },
    {
      component: EditorVideoPaneComponent,
      condition: computed(
        () =>
          this.editorMainPaneService.pane() ===
          EDITOR_MAIN_PANE_ELEMENTS.VIDEO_EDITOR,
      ),
    },
    {
      component: EditorAudioPaneComponent,
      condition: computed(
        () =>
          this.editorMainPaneService.pane() ===
          EDITOR_MAIN_PANE_ELEMENTS.AUDIO_EDITOR,
      ),
    },
    {
      component: EditorMarkdownPaneComponent,
      condition: computed(
        () =>
          this.editorMainPaneService.pane() ===
          EDITOR_MAIN_PANE_ELEMENTS.MARKDOWN_EDITOR,
      ),
    },
    {
      component: EditorPlainTextPaneComponent,
      condition: computed(
        () =>
          this.editorMainPaneService.pane() ===
          EDITOR_MAIN_PANE_ELEMENTS.PLAIN_TEXT_FILE_EDITOR,
      ),
    },
  ];
}
