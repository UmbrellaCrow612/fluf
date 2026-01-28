import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { fileNode } from '../../gen/type';
import { getElectronApi } from '../../utils';

@Component({
  selector: 'app-file-x-directory-content',
  imports: [],
  templateUrl: './file-x-directory-content.component.html',
  styleUrl: './file-x-directory-content.component.css',
})
export class FileXDirectoryContentComponent {
  private readonly api = getElectronApi();

  constructor() {
    effect(async () => {
      await this.displayDirectoryContent();
    });
  }

  isLoading = signal(false);
  error = signal<string | null>(null);
  items = signal<fileNode[]>([]);

  private async displayDirectoryContent() {}
}
