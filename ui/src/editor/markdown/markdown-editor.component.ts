import {
  Component,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { ContextService } from '../app-context/app-context.service';
import { applyMarkdownClasses, isMarkdownFile, markdownToHtml } from './helper';
import { getElectronApi } from '../../utils';

/**
 * Is rendered when the main editor element is markdown and the given file is a markdown file
 */
@Component({
  selector: 'app-markdown-editor',
  imports: [],
  templateUrl: './markdown-editor.component.html',
  styleUrl: './markdown-editor.component.css',
})
export class MarkdownEditorComponent implements OnInit {
  private readonly contextService = inject(ContextService);
  private readonly api = getElectronApi();

  private readonly container =
    viewChild<ElementRef<HTMLDivElement>>('markdown_container');
  loading = signal(false);
  error = signal<string | null>(null);

  async ngOnInit() {
    await this.init();
  }

  async init() {
    console.log('Markdown editor init');
    try {
      this.loading.set(true);
      this.error.set(null);

      let div = this.container()?.nativeElement;
      if (!div) {
        this.error.set('No markdown container div ');
        return;
      }

      let activeFileNode = this.contextService.currentOpenFileInEditor();
      if (!activeFileNode) {
        this.error.set('No file');
        return;
      }

      if (!isMarkdownFile(activeFileNode.path)) {
        this.error.set('File is not a markdown file');
        return;
      }

      let fileContent = await this.api.fsApi.readFile(activeFileNode.path);
      let markdownHtml = await markdownToHtml(fileContent);

      div.innerHTML = markdownHtml;
      applyMarkdownClasses(div);
    } catch (error) {
      console.error('Failed to load markdown editor ', error);
    } finally {
      this.loading.set(false);
    }
  }
}
