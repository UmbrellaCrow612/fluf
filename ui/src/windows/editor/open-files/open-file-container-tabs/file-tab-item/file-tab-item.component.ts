import { Component, computed, inject, input } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditorContextService } from '../../../editor-context/editor-context.service';
import { removeNodeIfExists } from '../../../file-explorer/fileNode';
import { EditorInMemoryContextService } from '../../../editor-context/editor-in-memory-context.service';
import { OpenNodeInEditor } from '../../../file-explorer/helper';
import { normalizeElectronPath } from '../../../path/utils';
import { getLanguageId } from '../../../lsp/utils';
import { getElectronApi } from '../../../../../utils';
import { fileNode } from '../../../../../gen/type';

@Component({
  selector: 'app-file-tab-item',
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './file-tab-item.component.html',
  styleUrl: './file-tab-item.component.css',
})
export class FileTabItemComponent {
  private readonly appContext = inject(EditorContextService);
  private readonly inMemoryContextService = inject(EditorInMemoryContextService);
  private readonly api = getElectronApi();

  fileNode = input.required<fileNode>();

  private readonly workSpaceFolder = computed(() =>
    this.appContext.selectedDirectoryPath(),
  );

  isActive = computed(() => {
    let current = this.appContext.currentOpenFileInEditor();
    return current?.path === this.fileNode().path;
  });

  errorCount = computed(() => {
    const normalizedPath = normalizeElectronPath(this.fileNode().path);

    let diagnostics = Array.from(
      this.inMemoryContextService.problems().get(normalizedPath)?.values() ??
        [],
    ).flat();

    return diagnostics.length;
  });

  hasErrors = computed(() => {
    return this.errorCount() > 0;
  });

  tabItemClicked() {
    OpenNodeInEditor(this.fileNode(), this.appContext);
  }

  removeTabItem(event: MouseEvent) {
    event.stopPropagation();

    let langId = getLanguageId(this.fileNode().extension);
    let wsf = this.workSpaceFolder();
    let fp = this.fileNode().path;

    if (langId && wsf && fp) {
      this.api.lspClient.didCloseTextDocument(wsf, langId, fp);
    }

    const currentActiveNode = this.appContext.currentOpenFileInEditor();
    const files = this.appContext.openFiles() ?? [];

    removeNodeIfExists(files, this.fileNode());
    this.appContext.openFiles.set(structuredClone(files)); // dfo this becuase of js refrence bs

    if (currentActiveNode?.path === this.fileNode().path) {
      // try to open next node
      if (files.length > 0) {
        let next = files[0];
        OpenNodeInEditor(next, this.appContext);
      } else {
        this.appContext.currentOpenFileInEditor.set(null);
        this.appContext.editorMainActiveElement.set(null);
      }
    }
  }
}
