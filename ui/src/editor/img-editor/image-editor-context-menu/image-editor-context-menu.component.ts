import { Component, computed, inject, OnInit } from '@angular/core';
import { InMemoryContextService } from '../../app-context/editor-in-memory-context.service';
import { getElectronApi } from '../../../utils';
import { fileNode } from '../../../gen/type';

@Component({
  selector: 'app-image-editor-context-menu',
  imports: [],
  templateUrl: './image-editor-context-menu.component.html',
  styleUrl: './image-editor-context-menu.component.css',
})
export class ImageEditorContextMenuComponent implements OnInit {
  private readonly inMemoryContextService = inject(InMemoryContextService);
  private readonly api = getElectronApi();

  private data = computed(
    () =>
      this.inMemoryContextService.currentActiveContextMenu()?.data as fileNode,
  );

  error: string | null = null;

  ngOnInit(): void {
    this.error = null;

    if (!this.data) {
      this.error = 'Data invalid';
      return;
    }

    if (!this.data()?.path) {
      this.error = 'Data invalid';
      return;
    }
  }

  async copyImgToClipBoard() {
    if (!this.data) {
      this.error = 'Data invalid';
      return;
    }

    let suc = await this.api.clipboardApi.writeImage(this.data().path);
    if (!suc) {
      this.error = 'Failed to copy image';
    } else {
      this.inMemoryContextService.currentActiveContextMenu.set(null);
    }
  }
}
