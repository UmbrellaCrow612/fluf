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

  isLoading = signal(false);
  error = signal<string | null>(null);
  items = signal<fileNode[]>([]);

  private async displayDirectoryContent() {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      let path = this.fileXCtx.currentActiveDirectory();
      if (!path) {
        this.error.set('No selected directory');
        return;
      }

      let res = await this.api.fsApi.readDir(path);
      this.items.set(res);
    } catch (error) {
      console.error(error);
      this.error.set('Failed to load');
    } finally {
      this.isLoading.set(false);
    }
  }
}
