import {
  AfterViewInit,
  Component,
  computed,
  inject,
  Signal,
  Type,
} from '@angular/core';
import { EditorMainContentManagerComponent } from '../editor-main-content-manager/editor-main-content-manager.component';
import { EditorSidebarComponent } from '../editor-sidebar/editor-sidebar.component';
import { EditorContextService } from '../editor-context/editor-context.service';
import { NgComponentOutlet } from '@angular/common';
import { Renderable } from '../ngComponentOutlet/type';
import { FileExplorerComponent } from '../file-explorer/file-explorer.component';
import { SideSearchComponent } from '../side-search/side-search.component';
import { SideFolderSearchComponent } from '../side-folder-search/side-folder-search.component';
import { SideGitComponent } from '../side-git/side-git.component';
import { SideFileSearchComponent } from '../side-file-search/side-file-search.component';
import { SelectDirectoryComponent } from '../file-explorer/select-directory/select-directory.component';
import { Resizer, ResizerReOpenHandle } from 'umbr-resizer-two';
import { sideBarActiveElement } from '../editor-context/type';

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
export class EditorMainContentComponent implements AfterViewInit {
  private readonly editorContextService = inject(EditorContextService);

  private resizer: Resizer | null = null;
  private reopenHandle: ResizerReOpenHandle | null = null;
  /** When sidebar is unrendred due to collpase via dragging for re opening we just want to use the one that was active beofre */
  private inMemPreviousSideBarComponent: sideBarActiveElement | null = null;
  private sharedHandleStyles: Record<string, string> = {
    width: '6px',
    cursor: 'col-resize',
  };

  /**
   * Renders the re open handle when user collpased the left panel either by dragging or is undrendred i.e render when single element the main component
   */
  private renderRezierReOpenHandle() {
    if (this.reopenHandle) {
      this.reopenHandle.dispose();
    }

    console.log('[EditorMainContentComponent] re open handle render');
    let mainContentContainerElement: HTMLDivElement | null =
      document.getElementById(
        'editor_main_content_wrapper',
      ) as HTMLDivElement | null;
    if (!mainContentContainerElement) {
      throw new Error('editor_main_content_container not found');
    }
  }

  /**
   * Renders the resize handle between two elements disposihnhg of previous one
   */
  private renderResizeHandle() {
    if (!this.shouldRenderSideBarComponent()) {
      return;
    } // only render handle when there are two components

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
        minFlex: 0.3,
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
              '[onDragPastMin] unrendering side bar component as it went past 125 pixels',
            );
            this.resizer?.dispose();
            this.resizer = null;

            this.inMemPreviousSideBarComponent =
              this.editorContextService.sideBarActiveElement();
            this.editorContextService.sideBarActiveElement.set(null);
          }
        },
      },
    );
  }

  public ngAfterViewInit(): void {
    this.renderResizeHandle();
  }

  /**
   * Determins if the side bar component should be rendered if a specific component to render is present, also removes or add handle
   */
  public shouldRenderSideBarComponent: Signal<boolean> = computed(() => {
    let should = this.editorContextService.sideBarActiveElement() !== null;
    if (!should) {
      this.resizer?.dispose();
      this.resizer = null;
    } else {
      this.renderRezierReOpenHandle();
    }
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
      component: FileExplorerComponent,
      condition: computed(() => {
        return (
          this.editorContextService.sideBarActiveElement() == 'file-explorer' &&
          this.hasSelectedDirectory()
        );
      }),
    },
    {
      component: SideSearchComponent,
      condition: computed(() => {
        return (
          this.editorContextService.sideBarActiveElement() == 'search' &&
          this.hasSelectedDirectory()
        );
      }),
    },
    {
      component: SideFolderSearchComponent,
      condition: computed(() => {
        return (
          this.editorContextService.sideBarActiveElement() ==
            'search-folders' && this.hasSelectedDirectory()
        );
      }),
    },
    {
      component: SideGitComponent,
      condition: computed(() => {
        return (
          this.editorContextService.sideBarActiveElement() ==
            'source-control' && this.hasSelectedDirectory()
        );
      }),
    },
    {
      component: SideFileSearchComponent,
      condition: computed(() => {
        return (
          this.editorContextService.sideBarActiveElement() == 'search-files' &&
          this.hasSelectedDirectory()
        );
      }),
    },
    {
      component: SelectDirectoryComponent,
      condition: computed(() => {
        return !this.hasSelectedDirectory();
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
    this.renderResizeHandle();
    return componentToRender;
  });
}
