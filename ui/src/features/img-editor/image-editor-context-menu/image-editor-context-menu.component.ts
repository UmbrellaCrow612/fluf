import { Component, inject, OnInit } from '@angular/core';
import { InMemoryContextService } from '../../app-context/app-in-memory-context.service';
import { getElectronApi } from '../../../utils';

@Component({
  selector: 'app-image-editor-context-menu',
  imports: [],
  templateUrl: './image-editor-context-menu.component.html',
  styleUrl: './image-editor-context-menu.component.css',
})
export class ImageEditorContextMenuComponent implements OnInit {
  private readonly inMemoryContextService = inject(InMemoryContextService);
  private readonly api = getElectronApi();
  private fileNode: fileNode | null = null;

  error: string | null = null;

  ngOnInit(): void {
    this.error = null;

    this.fileNode = this.inMemoryContextService.getSnapShot()
      .currentActiveContextMenu?.data as fileNode;

    if (!this.fileNode.path) {
      this.error = 'Data invalid';
    }
  }

  async copyImgToClipBoard() {
    if (!this.fileNode) {
      this.error = 'Data invalid';
      return;
    }

    let suc = await this.api.writeImageToClipboard(
      undefined,
      this.fileNode.path
    );
    if (!suc) {
      this.error = 'Failed to copy image';
    } else {
      this.inMemoryContextService.update("currentActiveContextMenu", null)
    }
  }
}
