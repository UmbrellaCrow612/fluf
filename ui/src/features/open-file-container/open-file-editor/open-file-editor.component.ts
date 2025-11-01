import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  viewChild,
} from '@angular/core';
import { ContextService } from '../../app-context/app-context.service';
import { getElectronApi } from '../../../utils';
import { basicSetup } from 'codemirror';
import { EditorView } from '@codemirror/view';

@Component({
  selector: 'app-open-file-editor',
  imports: [],
  templateUrl: './open-file-editor.component.html',
  styleUrl: './open-file-editor.component.css',
})
export class OpenFileEditorComponent implements OnInit {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = getElectronApi();
  private readonly codeMirrorContainer = viewChild<ElementRef<HTMLDivElement>>(
    'code_mirror_container'
  );

  codeMirrorView: EditorView | null = null;

  /**
   * The current file to show in the editor
   */
  openFileNode: fileNode | null = null;
  error: string | null = null;
  isLoading = false;

  stringContent = '';

  async ngOnInit() {
    this.openFileNode = this.appContext.getSnapshot().currentOpenFileInEditor;
    if (this.openFileNode) {
      await this.displayFile();
    }

    this.appContext.autoSub(
      'currentOpenFileInEditor',
      async (ctx) => {
        this.disposeCodeMirror();
        this.openFileNode = ctx.currentOpenFileInEditor;
        if (this.openFileNode) {
          await this.displayFile();
        }
      },
      this.destroyRef
    );
  }

  private renderCodeMirror() {
    this.codeMirrorView = new EditorView({
      doc: this.stringContent,
      parent: this.codeMirrorContainer()?.nativeElement,
      extensions: [
        basicSetup,
        EditorView.theme({
          '&': {
            height: '100%',
            overflow: 'auto',
          },
          '.cm-scroller': {
            overflow: 'auto',
          },
        }),
      ],
    });
  }

  private disposeCodeMirror() {
    if (this.codeMirrorView) {
      this.codeMirrorView?.destroy();
    }

    this.codeMirrorView = null;
  }

  private async displayFile() {
    this.error = null;
    this.isLoading = true;
    this.disposeCodeMirror();

    if (!this.openFileNode) {
      this.error = `Could not read file`;
      this.isLoading = false;
      return;
    }

    this.stringContent = await this.api.readFile(
      undefined,
      this.openFileNode?.path
    );
    this.appContext.update('fileExplorerActiveFileOrFolder', this.openFileNode);

    this.isLoading = false;

    this.renderCodeMirror();
  }
}
