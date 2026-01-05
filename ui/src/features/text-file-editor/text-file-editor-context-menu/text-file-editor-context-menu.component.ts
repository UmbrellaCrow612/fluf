import { Component, computed, inject, OnInit, Signal } from '@angular/core';
import { InMemoryContextService } from '../../app-context/app-in-memory-context.service';
import { fileNode, voidCallback } from '../../../gen/type';
import { isMarkdownFile } from '../../markdown/helper';
import { ContextService } from '../../app-context/app-context.service';

/**
 * Local type for this component used to render the list of items in the context menu
 */
type item = {
  /**
   * The text to display
   */
  label: string;

  /**
   * Computed signal
   */
  condition: Signal<boolean>;

  /**
   * Logic to run on click
   */
  action: voidCallback;
};

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
  private readonly contextService = inject(ContextService)

  loading = false;
  error: string | null = null;
  data: fileNode | null =
    this.inMemoryContextService.currentActiveContextMenu()?.data ?? null;

  items: item[] = [
    {
      label: 'Open markdown preview',
      condition: computed(() => {
        let menu = this.inMemoryContextService.currentActiveContextMenu();
        let node = menu?.data as fileNode;
        if ('path' in node && isMarkdownFile(node.path)) {
          return true;
        }

        return false;
      }),
      action: () => {
        this.contextService.editorMainActiveElement.set("markdown-preview")
      },
    },
  ];

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
