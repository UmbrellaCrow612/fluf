import { Component, computed, inject, OnInit, Signal } from '@angular/core';
import { EditorInMemoryContextService } from '../../editor-context/editor-in-memory-context.service';
import { isMarkdownFile } from '../../markdown/helper';
import { EditorContextService } from '../../editor-context/editor-context.service';
import { fileNode, voidCallback } from '../../../../gen/type';
import { ApplicationContextMenuService } from '../../../../app/context-menu/application-context-menu.service';

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
  private readonly inMemoryContextService = inject(
    EditorInMemoryContextService,
  );
  private readonly contextService = inject(EditorContextService);
  private readonly applicationContextMenuService = inject(
    ApplicationContextMenuService,
  );

  loading = false;
  error: string | null = null;
  data: fileNode | null =
    this.applicationContextMenuService.getContextMenuData() ?? null;

  items: item[] = [
    {
      label: 'Open markdown preview',
      condition: computed(() => {
        let node = this.data as fileNode;
        if ('path' in node && isMarkdownFile(node.path)) {
          return true;
        }

        return false;
      }),
      action: () => {
        this.contextService.editorMainActiveElement.set('markdown-editor');
        this.applicationContextMenuService.close();
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
