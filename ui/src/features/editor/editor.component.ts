import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnDestroy,
  OnInit,
  Signal,
  Type,
} from '@angular/core';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { ContextService } from '../app-context/app-context.service';
import { FileExplorerComponent } from '../file-explorer/file-explorer.component';
import { getElectronApi } from '../../utils';
import { SideSearchComponent } from '../side-search/side-search.component';
import { SideFolderSearchComponent } from '../side-folder-search/side-folder-search.component';
import { SideGitComponent } from '../side-git/side-git.component';
import { NgComponentOutlet } from '@angular/common';
import { SelectDirectoryComponent } from '../file-explorer/select-directory/select-directory.component';
import { SideFileSearchComponent } from '../side-file-search/side-file-search.component';
import { ContextMenuComponent } from '../context-menu/context-menu.component';
import { InMemoryContextService } from '../app-context/app-in-memory-context.service';
import Resizer from 'umbr-resizer-two';
import { HotKeyService } from '../hotkeys/hot-key.service';
import { EditorHomePageComponent } from './editor-home-page/editor-home-page.component';
import { OpenFileContainerTabsComponent } from '../open-files/open-file-container-tabs/open-file-container-tabs.component';
import { OpenFileContainerBottomComponent } from '../open-files/open-file-container-bottom/open-file-container-bottom.component';
import { ImageEditorComponent } from '../img-editor/image-editor.component';
import { DocumentEditorComponent } from '../document-editor/document-editor.component';
import { TextFileEditorComponent } from '../text-file-editor/text-file-editor.component';
import { Renderable } from '../ngComponentOutlet/type';
type unSub = () => Promise<void>;

@Component({
  selector: 'app-editor',
  imports: [
    TopBarComponent,
    SideBarComponent,
    NgComponentOutlet,
    ContextMenuComponent,
    OpenFileContainerTabsComponent,
    OpenFileContainerBottomComponent,
  ],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css',
})
export class EditorComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly appContext = inject(ContextService);
  private readonly inMemoryContextService = inject(InMemoryContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = getElectronApi();
  private readonly keyService = inject(HotKeyService);

  constructor() {
    effect(async () => {
      if (
        !this.isDirectoryBeingWatched &&
        this.appContext.selectedDirectoryPath()
      ) {
        this.isDirectoryBeingWatched = true;
        this.unSub = await this.api.onDirectoryChange(
          this.appContext.selectedDirectoryPath()!,
          (_) => {
            this.inMemoryContextService.refreshDirectory.update((p) => p + 1);
          }
        );
      }
    });
  }

  private isDirectoryBeingWatched = false;
  private unSub: unSub | null = null;
  private selectedDir = computed(() => this.appContext.selectedDirectoryPath());
  private mainEditorActiveElement = computed(() =>
    this.appContext.editorMainActiveElement()
  );

  /** Checks if it should show ctx */
  isContextMenuActive = computed(
    () => this.inMemoryContextService.currentActiveContextMenu() != null
  );

  /**
   * Used to indicate if it should show bottom which contains terminal etc
   */
  showBottom = computed(() =>
    this.appContext.displayFileEditorBottom() ? true : false
  );

  /**
   * Indicates if it should show the tabs of open file component
   */
  showOpenFileTabs = computed(() => {
    let openFiles = this.appContext.openFiles();
    return openFiles && openFiles.length > 0 ? true : false;
  });

  /**
   * List of all components that can be rendered in the side bar
   */
  sideBarElements: Renderable[] = [
    {
      component: FileExplorerComponent,
      condition: computed(() => {
        return (
          this.appContext.sideBarActiveElement() == 'file-explorer' &&
          typeof this.selectedDir() == 'string'
        );
      }),
    },
    {
      component: SideSearchComponent,
      condition: computed(() => {
        return (
          this.appContext.sideBarActiveElement() == 'search' &&
          typeof this.selectedDir() == 'string'
        );
      }),
    },
    {
      component: SideFolderSearchComponent,
      condition: computed(() => {
        return (
          this.appContext.sideBarActiveElement() == 'search-folders' &&
          typeof this.selectedDir() == 'string'
        );
      }),
    },
    {
      component: SideGitComponent,
      condition: computed(() => {
        return (
          this.appContext.sideBarActiveElement() == 'source-control' &&
          typeof this.selectedDir() == 'string'
        );
      }),
    },
    {
      component: SideFileSearchComponent,
      condition: computed(() => {
        return (
          this.appContext.sideBarActiveElement() == 'search-files' &&
          typeof this.selectedDir() == 'string'
        );
      }),
    },
    {
      component: SelectDirectoryComponent,
      condition: computed(() => {
        return !this.selectedDir();
      }),
    },
  ];

  activeSideBarComponent = computed(() => {
    return this.sideBarElements.find((e) => e.condition())?.component ?? null;
  });

  /**
   * List of components that will be rendered as the main compponent
   */
  mainComponents: Renderable[] = [
    {
      condition: computed(
        () => this.mainEditorActiveElement() === 'text-file-editor'
      ),
      component: TextFileEditorComponent,
    },
    {
      component: ImageEditorComponent,
      condition: computed(
        () => this.mainEditorActiveElement() === 'image-editor'
      ),
    },
    {
      component: DocumentEditorComponent,
      condition: computed(
        () => this.mainEditorActiveElement() === 'document-editor'
      ),
    },
  ];

  mainCompToRender: Signal<Type<any>> = computed(() => {
    return (
      this.mainComponents.find((x) => x.condition())?.component ??
      EditorHomePageComponent
    );
  });

  private resizer = new Resizer({
    direction: 'horizontal',
    minFlex: 0.2,
    handleStyles: {
      width: '6px',
      background: 'linear-gradient(to bottom,rgb(19, 18, 18),rgb(20, 20, 20))',
      boxShadow: 'inset 0 0 2px #000, 0 0 4px rgba(0,0,0,0.4)',
    },
  });

  private mainResizer = new Resizer({
    direction: 'vertical',
    minFlex: 0.2,
    handleStyles: {
      height: '6px',
      background: 'linear-gradient(to bottom,rgb(19, 18, 18),rgb(20, 20, 20))',
      boxShadow: 'inset 0 0 2px #000, 0 0 4px rgba(0,0,0,0.4)',
    },
  });

  isLeftActive = computed(() => this.appContext.sideBarActiveElement() != null);

  async ngOnInit() {
    // if dir selected watch it
    if (this.selectedDir()) {
      this.isDirectoryBeingWatched = true;
      this.unSub = await this.api.onDirectoryChange(
        this.selectedDir()!,
        (_) => {
          this.inMemoryContextService.refreshDirectory.update((p) => p + 1);
        }
      );
    }

    // subs
    this.keyService.autoSub(
      {
        callback: (ctx) => {
          this.appContext.displayFileEditorBottom.set(!this.showBottom());
        },
        keys: ['Control', 'j'],
      },
      this.destroyRef
    );
  }

  ngAfterViewInit(): void {
    this.resizer.observe(
      document.getElementById('editor_resize_container') as HTMLDivElement
    );
    this.mainResizer.observe(
      document.getElementById('main_resize_container') as HTMLDivElement
    );
  }

  async ngOnDestroy() {
    if (this.unSub) {
      await this.unSub();
    }
  }
}
