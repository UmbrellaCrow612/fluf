import {
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { EditorContextService } from '../editor-context/editor-context.service';
import { getElectronApi } from '../../../utils';
import { useEffect } from '../../../lib/useEffect';
import { fileNode } from '../../../gen/type';
import { marked } from 'marked';

/**
 * Shows a preview of a markdown file if the current node is a markdown and it's in preview mode
 */
@Component({
  selector: 'app-editor-markdown-pane',
  imports: [],
  templateUrl: './editor-markdown-pane.component.html',
  styleUrl: './editor-markdown-pane.component.css',
})
export class EditorMarkdownPaneComponent {
  private readonly editorContextService = inject(EditorContextService);
  private readonly electronApi = getElectronApi();

  /**
   * The current active node in the UI
   */
  public readonly activeNode = computed(() =>
    this.editorContextService.currentOpenFileInEditor(),
  );

  /**
   * Holds loading state
   */
  public readonly isLoading = signal(false);

  /**
   * Holds error state
   */
  public readonly error = signal<string | null>(null);

  /**
   * Target container
   */
  private readonly markdownTargetContainer = viewChild<
    ElementRef<HTMLDivElement>
  >('markdownTargetContainer');

  constructor() {
    useEffect(
      async (_, node) => {
        if (!node) {
          this.error.set(`No file selected`);
          return;
        }

        await this.showMarkdownPreviewPane(node);
      },
      [this.activeNode],
    );
  }

  /**
   * Show a file in markdown preview
   * @param node The file to show
   */
  private async showMarkdownPreviewPane(node: fileNode) {
    this.error.set(null);
    this.isLoading.set(true);

    try {
      const container = this.markdownTargetContainer()?.nativeElement;
      if (!container) {
        throw new Error('Could not find main container');
      }

      if (node.extension.toLowerCase().trim() !== '.md') {
        throw new Error('File is not a markdown file');
      }

      if (node.isDirectory) {
        throw new Error('Cannot render a folder');
      }

      const norm = await this.electronApi.pathApi.normalize(node.path);
      const fileContent = await this.electronApi.fsApi.readFile(norm);
      let innerHTML = await marked.parse(fileContent);
      container.classList.add('markdown-body');
      container.innerHTML = innerHTML;
    } catch (error: any) {
      console.error('Failed to load file ', error);
      this.error.set(`Failed to load file ${error?.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }
}
