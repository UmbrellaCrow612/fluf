import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FileTabItemComponent } from './file-tab-item/file-tab-item.component';
import { ContextService } from '../../app-context/app-context.service';
import { fileNode } from '../../../gen/type';

@Component({
  selector: 'app-open-file-container-tabs',
  imports: [FileTabItemComponent],
  templateUrl: './open-file-container-tabs.component.html',
  styleUrl: './open-file-container-tabs.component.css',
})
export class OpenFileContainerTabsComponent implements OnInit {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);

  tabs: fileNode[] | null = null;

  ngOnInit(): void {
    let ctx = this.appContext.getSnapshot();
    this.tabs = ctx.openFiles;

    this.appContext.autoSub(
      'openFiles',
      (ctx) => {
        this.tabs = ctx.openFiles;
      },
      this.destroyRef
    );
  }
}
