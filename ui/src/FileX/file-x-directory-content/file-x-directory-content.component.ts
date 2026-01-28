import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { fileNode } from '../../gen/type';
import { getElectronApi } from '../../utils';
import { FileXContextService } from '../file-x-context/file-x-context.service';

@Component({
  selector: 'app-file-x-directory-content',
  imports: [],
  templateUrl: './file-x-directory-content.component.html',
  styleUrl: './file-x-directory-content.component.css',
})
export class FileXDirectoryContentComponent {
  private readonly api = getElectronApi();
  private readonly ctx = inject(FileXContextService);

  constructor() {
    effect(async () => {
      let dir = this.ctx.activeDirectory();
      await this.displayDirectoryContent(dir);
      console.log("FileXDirectoryContentComponent effect ran")
    });
  }

  isLoading = signal(false);
  error = signal<string | null>(null);
  items = signal<fileNode[]>([]);

  private async displayDirectoryContent(directory: string) {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      if (directory === '') {
        this.error.set('No active directory to render');
        return;
      }

      let items = await this.api.fsApi.readDir(directory);
      this.items.set(items);
    } catch (error) {
      console.error(error);
      this.error.set('Failed to get directory content');
    } finally {
      this.isLoading.set(false);
    }
  }
}
