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
import { ResizerTwo } from 'umbr-resizer-two';
import { HotKeyService } from '../hotkeys/hot-key.service';
import { EditorHomePageComponent } from './editor-home-page/editor-home-page.component';
import { OpenFileContainerTabsComponent } from '../open-files/open-file-container-tabs/open-file-container-tabs.component';
import { OpenFileContainerBottomComponent } from '../open-files/open-file-container-bottom/open-file-container-bottom.component';
import { ImageEditorComponent } from '../img-editor/image-editor.component';
import { DocumentEditorComponent } from '../document-editor/document-editor.component';
import { TextFileEditorComponent } from '../text-file-editor/text-file-editor.component';
import { Renderable } from '../ngComponentOutlet/type';
import { CommandPaletteComponent } from '../command-palette/command-palette.component';
import { voidCallback } from '../../gen/type';
import { ThemeService } from '../theme/theme.service';
import { cssVar } from '../theme/type';
import { MarkdownEditorComponent } from '../markdown/markdown-editor.component';

@Component({
  selector: 'app-editor',
  imports: [
    TopBarComponent,
    SideBarComponent,
    NgComponentOutlet,
    ContextMenuComponent,
    OpenFileContainerTabsComponent,
    OpenFileContainerBottomComponent,
    CommandPaletteComponent,
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
  private readonly themeService = inject(ThemeService);

  constructor() {
    effect(async () => {
      let dirPath = this.appContext.selectedDirectoryPath();

      console.log('Directory path changed ' + dirPath);
      if (dirPath) {
        console.log('Directory being watched ' + dirPath);
        if (this.unSub) {
          this.unSub();
        }
        this.unSub = this.api.fsApi.onChange(dirPath, (event) => {
          if (event.eventType == 'change' || event.eventType == 'rename') {
            this.inMemoryContextService.refreshDirectory.update((p) => p + 1);
            console.log('Directory changed ' + dirPath);
          }
        });
      }
    });
  }

  private unSub: voidCallback | null = null;
  private selectedDir = computed(() => this.appContext.selectedDirectoryPath());
  private mainEditorActiveElement = computed(() =>
    this.appContext.editorMainActiveElement()
  );

  /**
   * Indicates if the cmd palette should be rendered or not
   */
  isCommandPaletteActive = computed(() =>
    this.inMemoryContextService.showCommandPalette()
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
    {
      component: MarkdownEditorComponent,
      condition: computed(
        () => this.mainEditorActiveElement() === 'markdown-editor'
      ),
    },
  ];

  mainCompToRender: Signal<Type<any>> = computed(() => {
    return (
      this.mainComponents.find((x) => x.condition())?.component ??
      EditorHomePageComponent
    );
  });

  private resizer: ResizerTwo | null = null;
  private mainResizer: ResizerTwo | null = null;

  isLeftActive = computed(() => this.appContext.sideBarActiveElement() != null);

  async ngOnInit() {
    // set editor theme
    try {
      let theme = this.appContext.editorTheme();
      if (theme) {
        let object = JSON.parse(theme) as cssVar[];
        this.themeService.set(object);
        console.log('Set theme from saved state');
      }
    } catch (error) {
      console.error('Failed to set editor theme' + error);
    }

    this.keyService.master.add(['Control', 'j'], () => {
      this.appContext.displayFileEditorBottom.set(!this.showBottom());
      console.log('Hot key control j ran');
    });

    this.keyService.master.add(['Control', 'p'], () => {
      this.inMemoryContextService.showCommandPalette.update((x) => !x);
      console.log('Hot key control p ran');
    });
  }

  ngAfterViewInit(): void {
    // Load saved flex values from localStorage
    const sideResizerKey = 'editor_side_resizer';
    const mainResizerKey = 'editor_main_resizer';

    let sideFlex = { firstChild: 1, secondChild: 1 };
    let mainFlex = { firstChild: 1, secondChild: 1 };

    try {
      const savedSide = localStorage.getItem(sideResizerKey);
      if (savedSide) sideFlex = JSON.parse(savedSide);

      const savedMain = localStorage.getItem(mainResizerKey);
      if (savedMain) mainFlex = JSON.parse(savedMain);
    } catch (e) {
      console.error('Failed to parse saved resizer values', e);
    }

    const sideContainer = document.getElementById('editor_resize_container');
    if (sideContainer) {
      this.resizer = new ResizerTwo({
        container: sideContainer as HTMLDivElement,
        direction: 'horizontal',
        initalFlex: sideFlex,
        minFlex: { firstChild: 0.4, secondChild: 0.4 },
        handleStyles: {
          width: '6px',
          background: '--bg-primary',
          boxShadow: '--shadow-md',
          cursor: 'col-resize',
        },
      });

      this.resizer.on(() => {
        const values = this.resizer!.getFlexValues();
        localStorage.setItem(sideResizerKey, JSON.stringify(values));
      });
    }

    const mainContainer = document.getElementById('main_resize_container');
    if (mainContainer) {
      this.mainResizer = new ResizerTwo({
        container: mainContainer as HTMLDivElement,
        direction: 'vertical',
        initalFlex: mainFlex,
        minFlex: { firstChild: 0.4, secondChild: 0.4 },
        handleStyles: {
          height: '6px',
          background: '--bg-primary',
          boxShadow: '--shadow-md',
          cursor: 'row-resize',
        },
      });

      this.mainResizer.on(() => {
        const values = this.mainResizer!.getFlexValues();
        localStorage.setItem(mainResizerKey, JSON.stringify(values));
      });
    }
  }

  ngOnDestroy() {
    if (this.unSub) {
      this.unSub();
    }
  }
}
