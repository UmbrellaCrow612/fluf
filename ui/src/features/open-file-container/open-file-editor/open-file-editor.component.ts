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

  /**
   * The code mirrow view instace
   */
  codeMirrorView: EditorView | null = null;

  /**
   * Runs when code mirrow view changes 
   */
  updateListner = EditorView.updateListener.of((x) => {

    // todo add debouce 
    // after debouce add it to new doc state
    // on ctrl s
    // call save
    console.log(x.state.changes.toString())
  });

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
        this.updateListner,
        EditorView.theme(
          {
            /* ====== Root Editor ====== */
            '&': {
              color: '#ddd',
              backgroundColor: '#1b1b1b',
              height: '100%',
              overflow: 'auto',
              fontFamily: '"Fira Code", Consolas, monospace',
              fontSize: '14px',
            },

            /* ====== Scroller (scrollbar styles) ====== */
            '.cm-scroller': {
              overflow: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: '#555 #222',
            },
            '.cm-scroller::-webkit-scrollbar': {
              width: '6px',
              height: '6px',
            },
            '.cm-scroller::-webkit-scrollbar-track': {
              background: '#222',
              borderRadius: '3px',
            },
            '.cm-scroller::-webkit-scrollbar-thumb': {
              backgroundColor: '#555',
              borderRadius: '3px',
              border: '1px solid #333',
            },
            '.cm-scroller::-webkit-scrollbar-thumb:hover': {
              backgroundColor: '#777',
            },

            /* ====== Editor Content ====== */
            '.cm-content': {
              caretColor: '#66d9ef',
            },
            '.cm-content, .cm-line': {
              padding: '0 8px',
            },

            /* ====== Selection and Cursor ====== */
            '&.cm-focused .cm-cursor': {
              borderLeftColor: '#66d9ef',
            },
            '&.cm-focused .cm-selectionBackground, ::selection': {
              backgroundColor: 'rgba(102, 217, 239, 0.25)',
            },

            /* ====== Gutter (line numbers) ====== */
            '.cm-gutters': {
              backgroundColor: '#1a1a1a',
              color: '#777',
              borderRight: '1px solid #333',
            },
            '.cm-gutterElement': {
              padding: '0 6px',
            },

            /* ====== Active Line Highlight ====== */
            '.cm-activeLine': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            },
            '.cm-activeLineGutter': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#bbb',
            },
          },
          { dark: true }
        ),
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
