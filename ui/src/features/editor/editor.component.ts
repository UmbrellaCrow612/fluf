import {
  sideBarActiveElement,
  editorMainActiveElement,
} from './../app-context/type';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  inject,
  Injector,
  OnDestroy,
  OnInit,
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
import { TextFileEditorComponent } from '../open-files/text-file-editor/text-file-editor.component';
import { ImageEditorComponent } from '../img-editor/image-editor.component';
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

  private isDirectoryBeingWatched = false;
  private unSub: unSub | null = null;
  private selectedDir = this.appContext.getSnapshot().selectedDirectoryPath;
  private mainEditorActiveElement: editorMainActiveElement | null = null;

  /**
   * Used to indicate if it should show bottom which contains terminal etc
   */
  showBottom = false;

  /**
   * Indicates if it should show the tabs of open file component
   */
  showOpenFileTabs = false;

  /**
   * List of all components that can be rendered in the side bar
   */
  sideBarElements: {
    /** The component class to render */
    component: Type<any>;

    /**
     * Callback that runs the conditions to render the component
     */
    condition: () => boolean;
  }[] = [
    {
      component: FileExplorerComponent,
      condition: () => {
        return (
          this.sideBarActivateElement == 'file-explorer' &&
          typeof this.selectedDir == 'string'
        );
      },
    },
    {
      component: SideSearchComponent,
      condition: () => {
        return (
          this.sideBarActivateElement == 'search' &&
          typeof this.selectedDir == 'string'
        );
      },
    },
    {
      component: SideFolderSearchComponent,
      condition: () => {
        return (
          this.sideBarActivateElement == 'search-folders' &&
          typeof this.selectedDir == 'string'
        );
      },
    },
    {
      component: SideGitComponent,
      condition: () => {
        return (
          this.sideBarActivateElement == 'source-control' &&
          typeof this.selectedDir == 'string'
        );
      },
    },
    {
      component: SideFileSearchComponent,
      condition: () => {
        return (
          this.sideBarActivateElement == 'search-files' &&
          typeof this.selectedDir == 'string'
        );
      },
    },
    {
      component: SelectDirectoryComponent,
      condition: () => {
        return !this.selectedDir;
      },
    },
  ];

  /**
   * Gets the side bar element to render
   */
  get sideBarElementCompo(): Type<any> | undefined {
    return this.sideBarElements.find((x) => x.condition())?.component;
  }

  /**
   * List of components that will be rendered as the main compponent
   */
  mainComponents: { component: Type<any>; codition: () => boolean }[] = [
    {
      codition: () => {
        return this.mainEditorActiveElement == 'text-file-editor';
      },
      component: TextFileEditorComponent,
    },
    {
      component: ImageEditorComponent,
      codition: () => {
        return this.mainEditorActiveElement == 'image-editor';
      },
    },
  ];

  get mainCompToRender(): Type<any> {
    return (
      this.mainComponents.find((x) => x.codition())?.component ??
      EditorHomePageComponent
    );
  }

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

  isLeftActive = false;
  sideBarActivateElement: sideBarActiveElement = null;

  isContextMenuActive: boolean | null = null;

  async ngOnInit() {
    let init = this.appContext.getSnapshot();

    // set stored state
    this.isLeftActive = init.sideBarActiveElement != null;
    this.sideBarActivateElement = init.sideBarActiveElement;
    this.showOpenFileTabs =
      init.openFiles && init.openFiles.length > 0 ? true : false;
    this.showBottom = init.displayFileEditorBottom ? true : false;
    this.mainEditorActiveElement = init.editorMainActiveElement;

    // if dir selected watch it
    if (init.selectedDirectoryPath) {
      this.isDirectoryBeingWatched = true;
      this.unSub = await this.api.onDirectoryChange(
        init.selectedDirectoryPath,
        (_) => {
          this.inMemoryContextService.update('refreshDirectory', true);
        }
      );
    }

    // subs
    this.keyService.autoSub(
      {
        callback: (ctx) => {
          this.appContext.update(
            'displayFileEditorBottom',
            !ctx.displayFileEditorBottom
          );
        },
        keys: ['Control', 'j'],
      },
      this.destroyRef
    );
    this.appContext.autoSub(
      'editorMainActiveElement',
      (ctx) => {
        this.mainEditorActiveElement = ctx.editorMainActiveElement;
      },
      this.destroyRef
    );
    this.appContext.autoSub(
      'openFiles',
      (ctx) => {
        this.showOpenFileTabs =
          ctx.openFiles && ctx.openFiles.length > 0 ? true : false;
      },
      this.destroyRef
    );
    this.appContext.autoSub(
      'displayFileEditorBottom',
      (ctx) => {
        this.showBottom = ctx.displayFileEditorBottom ? true : false;
      },
      this.destroyRef
    );
    this.appContext.autoSub(
      'sideBarActiveElement',
      (ctx) => {
        this.isLeftActive = ctx.sideBarActiveElement != null;
        this.sideBarActivateElement = ctx.sideBarActiveElement;
      },
      this.destroyRef
    );
    this.inMemoryContextService.autoSub(
      'currentActiveContextMenu',
      (ctx) => {
        this.isContextMenuActive = ctx.currentActiveContextMenu != null;
      },
      this.destroyRef
    );
    this.appContext.autoSub(
      'selectedDirectoryPath',
      async (ctx) => {
        this.selectedDir = ctx.selectedDirectoryPath;

        if (!this.isDirectoryBeingWatched && ctx.selectedDirectoryPath) {
          this.isDirectoryBeingWatched = true;
          this.unSub = await this.api.onDirectoryChange(
            ctx.selectedDirectoryPath,
            (_) => {
              this.inMemoryContextService.update('refreshDirectory', true);
            }
          );
        }
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
