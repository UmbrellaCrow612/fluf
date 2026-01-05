import { Component, inject, OnInit } from '@angular/core';
import { InMemoryContextService } from '../../app-context/app-in-memory-context.service';
import { fileNode } from '../../../gen/type';

/**
 * Is rendered when the text file editor is open and a user requests a context menu within it via a right click
 */
@Component({
  selector: 'app-text-file-editor-context-menu',
  imports: [],
  templateUrl: './text-file-editor-context-menu.component.html',
  styleUrl: './text-file-editor-context-menu.component.css',
})
export class TextFileEditorContextMenuComponent implements OnInit {
  private readonly inMemoryContextService = inject(InMemoryContextService);

  loading = false;
  error: string | null = null;
  data: fileNode | null =
    this.inMemoryContextService.currentActiveContextMenu()?.data ?? null;

  ngOnInit(): void {
    try {
      this.loading = true;
      this.error = null;

      if (!this.data) {
        this.error = 'No data passed';
        return;
      }

      if (!this.data.path) {
        this.error = 'File node not passed';
        return;
      }
    } catch (error) {
      console.error('Failed to load text file editor ctx menu ', error);
    } finally {
      this.loading = false;
    }
  }
}
