import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { SideBarRenderComponent } from '../side-bar-render/side-bar-render.component';
import { OpenFileContainerComponent } from '../open-file-container/open-file-container.component';
import {
  ContextService,
  UnsubscribeFn,
} from '../app-context/app-context.service';

@Component({
  selector: 'app-shell',
  imports: [
    TopBarComponent,
    SideBarComponent,
    SideBarRenderComponent,
    OpenFileContainerComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent implements OnInit, OnDestroy {
  private readonly _appCtx = inject(ContextService);

  isSideBarRenderActive = false;
  private unSub: UnsubscribeFn | null = null;

  sideBarRenderFlex = 1;
  openFileContainerFlex = 4;

  private minFlex = 0.5;
  private maxFlex = 6;

  private isResizing = false;
  private startX = 0;
  private startSideBarFlex = 0;
  private startOpenFileFlex = 0;

  ngOnInit(): void {
    this.unSub = this._appCtx.sub('side-bar-active-element', (ctx) => {
      if (ctx.sideBarActiveElement) {
        this.isSideBarRenderActive = true;
      } else {
        this.isSideBarRenderActive = false;
      }
    });
  }
  ngOnDestroy(): void {
    if (this.unSub) {
      this.unSub();
    }
  }

  resizerMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.isResizing = true;
    this.startX = event.clientX;
    this.startSideBarFlex = this.sideBarRenderFlex;
    this.startOpenFileFlex = this.openFileContainerFlex;

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  private onMouseMove = (event: MouseEvent) => {
    if (!this.isResizing) return;
  
    const container = document.querySelector('.page_shell');
    if (!container) return;
  
    const containerWidth = container.clientWidth;
    const deltaX = event.clientX - this.startX;
  
    const totalFlex = this.startSideBarFlex + this.startOpenFileFlex;
    const flexRatio = deltaX / containerWidth * totalFlex;
  
    let newSideBarFlex = this.startSideBarFlex + flexRatio;
    let newOpenFileFlex = this.startOpenFileFlex - flexRatio;
  
    newSideBarFlex = Math.min(Math.max(newSideBarFlex, this.minFlex), this.maxFlex);
    newOpenFileFlex = Math.min(Math.max(newOpenFileFlex, this.minFlex), this.maxFlex);
  
    this.sideBarRenderFlex = newSideBarFlex;
    this.openFileContainerFlex = newOpenFileFlex;
  };
  

  private onMouseUp = () => {
    this.isResizing = false;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };
}
