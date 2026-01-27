import { Component, effect, inject, OnInit } from '@angular/core';
import { FileXContextService } from '../file-x-context/file-x-context.service';

@Component({
  selector: 'app-file-x-directory-content',
  imports: [],
  templateUrl: './file-x-directory-content.component.html',
  styleUrl: './file-x-directory-content.component.css',
})
export class FileXDirectoryContentComponent {
  private readonly fileXCtx = inject(FileXContextService);

  constructor() {
    effect(() => {
      this.displayDirectoryContent();
    });
  }

  isLoading = false;
  error: string | null = null;

  items = [];

  private displayDirectoryContent() {
    try {
      this.isLoading = true;
      this.error = null;
      let path = this.fileXCtx.currentActiveDirectoryTab();
      if (!path) {
        this.error = 'No selected directory';
        return;
      }
    } catch (error) {
      console.error(error);
      this.error = 'Failed to load';
    } finally {
      this.isLoading = false;
    }
  }
}
