import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { FileXContextService } from '../file-x-context/file-x-context.service';
import { fileNode } from '../../gen/type';
import { getElectronApi } from '../../utils';

@Component({
  selector: 'app-file-x-directory-content',
  imports: [],
  templateUrl: './file-x-directory-content.component.html',
  styleUrl: './file-x-directory-content.component.css',
})
export class FileXDirectoryContentComponent {
  private readonly fileXCtx = inject(FileXContextService);
  private readonly api = getElectronApi();

  constructor() {
    effect(async () => {
      await this.displayDirectoryContent();
    });
  }

  isLoading = false;
  error: string | null = null;

  items = signal<fileNode[]>([]);

  private async displayDirectoryContent() {
    try {
      this.isLoading = true;
      this.error = null;
      let path = this.fileXCtx.currentActiveDirectoryTab();
      if (!path) {
        this.error = 'No selected directory';
        return;
      }

      let res = await this.api.fsApi.readDir(path);
      this.items.set(res);
    } catch (error) {
      console.error(error);
      this.error = 'Failed to load';
    } finally {
      this.isLoading = false;
    }
  }
}
