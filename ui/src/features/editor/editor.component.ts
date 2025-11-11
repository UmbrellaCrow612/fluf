import { ResizerTwo } from 'umbr-resizer-two';
import { sideBarActiveElement } from './../app-context/type';
import {
  afterNextRender,
  AfterViewInit,
  Component,
  DestroyRef,
  inject,
  Injector,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { ContextService } from '../app-context/app-context.service';
import { FileExplorerComponent } from '../file-explorer/file-explorer.component';
import { FileExplorerContextMenuComponent } from '../file-explorer/file-explorer-context-menu/file-explorer-context-menu.component';
import { OpenFileContainerComponent } from '../open-file-container/open-file-container.component';
import { getElectronApi } from '../../utils';
import { SideSearchComponent } from '../side-search/side-search.component';
import { SideFolderSearchComponent } from '../side-folder-search/side-folder-search.component';
import { SideGitComponent } from "../side-git/side-git.component";
type unSub = () => Promise<void>;

@Component({
  selector: 'app-editor',
  imports: [
    TopBarComponent,
    SideBarComponent,
    FileExplorerComponent,
    FileExplorerContextMenuComponent,
    OpenFileContainerComponent,
    SideSearchComponent,
    SideFolderSearchComponent,
    SideGitComponent
],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css',
})
export class EditorComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = getElectronApi();
  private readonly injector = inject(Injector);
  private addedResizer = false;

  private isDirectoryBeingWatched = false;
  private unSub: unSub | null = null;

  private resizer = new ResizerTwo({
    direction: 'horizontal',
    minFlex: 0.2,
    handleStyles: {
      width: '6px',
      background: 'linear-gradient(to bottom,rgb(19, 18, 18),rgb(20, 20, 20))',
      boxShadow: 'inset 0 0 2px #000, 0 0 4px rgba(0,0,0,0.4)',
    },
  });

  isLeftActive = false;
  sideBarActivateElement: sideBarActiveElement = null;

  isFileExplorerContextMenuActive: boolean | null = null;

  async ngOnInit() {
    let init = this.appContext.getSnapshot();

    // set stored state
    this.isLeftActive = init.sideBarActiveElement != null;
    this.sideBarActivateElement = init.sideBarActiveElement;

    // if dir selected watch it
    if (init.selectedDirectoryPath) {
      this.isDirectoryBeingWatched = true;
      this.unSub = await this.api.onDirectoryChange(
        init.selectedDirectoryPath,
        (_) => {
          this.appContext.update('refreshDirectory', true);
        }
      );
    }

    // subs
    this.appContext.autoSub(
      'sideBarActiveElement',
      (ctx) => {
        this.isLeftActive = ctx.sideBarActiveElement != null;
        this.sideBarActivateElement = ctx.sideBarActiveElement;

        afterNextRender(
          () => {
            this.updateResizer();
          },
          { injector: this.injector }
        );
      },
      this.destroyRef
    );
    this.appContext.autoSub(
      'displayFileExplorerContextMenu',
      (ctx) => {
        this.isFileExplorerContextMenuActive =
          ctx.displayFileExplorerContextMenu;
      },
      this.destroyRef
    );
    this.appContext.autoSub(
      'selectedDirectoryPath',
      async (ctx) => {
        if (!this.isDirectoryBeingWatched && ctx.selectedDirectoryPath) {
          this.isDirectoryBeingWatched = true;
          this.unSub = await this.api.onDirectoryChange(
            ctx.selectedDirectoryPath,
            (_) => {
              this.appContext.update('refreshDirectory', true);
            }
          );
        }
      },
      this.destroyRef
    );
  }

  ngAfterViewInit(): void {
    this.updateResizer();
  }

  private updateResizer(): void {
    const target = document.getElementById('editor_resize_container');

    if (!target) {
      console.error('Could not find editor_resize_container');
      return;
    }

    if (this.addedResizer) {
      this.resizer.remove()
    }

    if (this.isLeftActive) {
      this.resizer.add(target);
      this.addedResizer = true;
    } else {
      this.resizer.remove();
      this.addedResizer = false;
    }
  }

  async ngOnDestroy() {
    this.resizer.remove();

    if (this.unSub) {
      await this.unSub();
    }
  }
}
