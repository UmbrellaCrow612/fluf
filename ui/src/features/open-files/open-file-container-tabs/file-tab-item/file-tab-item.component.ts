import { Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContextService } from '../../../app-context/app-context.service';
import { removeFileIfExists } from '../../../file-explorer/utils';
import { hasImageExtension } from '../../../img-editor/utils';
import { hasDocumentExtension } from '../../../document-editor/utils';
import { fileNode } from '../../../../gen/type';

@Component({
  selector: 'app-file-tab-item',
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './file-tab-item.component.html',
  styleUrl: './file-tab-item.component.css',
})
export class FileTabItemComponent implements OnInit {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);

  fileNode = input.required<fileNode>();
  isActive = false;

  ngOnInit(): void {
    let ctx = this.appContext.getSnapshot();
    this.isActive = ctx.currentOpenFileInEditor?.path === this.fileNode().path;

    this.appContext.autoSub(
      'currentOpenFileInEditor',
      (ctx) => {
        this.isActive =
          ctx.currentOpenFileInEditor?.path === this.fileNode().path;
      },
      this.destroyRef
    );
  }

  tabItemClicked() {
    this.appContext.update('currentOpenFileInEditor', this.fileNode());

    let isImg = hasImageExtension(this.fileNode().extension);
    if (isImg) {
      this.appContext.update('editorMainActiveElement', 'image-editor');
      return;
    }

    let isDoc = hasDocumentExtension(this.fileNode().extension);
    if (isDoc) {
      this.appContext.update('editorMainActiveElement', 'document-editor');
      return;
    }

    this.appContext.update('editorMainActiveElement', 'text-file-editor');
  }

  removeTabItem(event: MouseEvent) {
    event.stopPropagation();

    const ctx = this.appContext.getSnapshot();
    const files = ctx.openFiles ?? [];

    removeFileIfExists(files, this.fileNode());
    this.appContext.update('openFiles', files);

    if (ctx.currentOpenFileInEditor?.path === this.fileNode().path) {
      if (files.length > 0) {
        let isImg = hasImageExtension(files[0].extension);
        if (isImg) {
          this.appContext.update('editorMainActiveElement', 'image-editor');
        }

        let isDoc = hasDocumentExtension(files[0].extension);
        if (isDoc) {
          this.appContext.update('editorMainActiveElement', 'document-editor');
        }

        if (!isDoc && !isImg) {
          this.appContext.update('editorMainActiveElement', 'text-file-editor');
        }

        this.appContext.update('currentOpenFileInEditor', files[0]);
      } else {
        this.appContext.update('currentOpenFileInEditor', null);
        this.appContext.update('editorMainActiveElement', null);
      }
    }
  }
}
