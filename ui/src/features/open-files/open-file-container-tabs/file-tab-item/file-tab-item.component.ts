import { Component, computed, inject, input } from '@angular/core';
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
export class FileTabItemComponent {
  private readonly appContext = inject(ContextService);

  fileNode = input.required<fileNode>();

  isActive = computed(() => {
    let current = this.appContext.currentOpenFileInEditor();
    return current?.path === this.fileNode().path;
  });

  tabItemClicked() {
    this.appContext.currentOpenFileInEditor.set(this.fileNode());

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

    const currentActiveNode = this.appContext.currentOpenFileInEditor();
    const files = this.appContext.openFiles() ?? [];

    removeFileIfExists(files, this.fileNode());
    this.appContext.openFiles.set(structuredClone(files)); // dfo this becuase of js refrence bs

    if (currentActiveNode?.path === this.fileNode().path) {
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

        this.appContext.currentOpenFileInEditor.set(files[0]);
      } else {
        this.appContext.currentOpenFileInEditor.set(null);
        this.appContext.update('editorMainActiveElement', null);
      }
    }
  }
}
