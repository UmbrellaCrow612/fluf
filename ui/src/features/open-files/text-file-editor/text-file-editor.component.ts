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
import { EditorState } from '@codemirror/state';
import { InMemoryContextService } from '../../app-context/app-in-memory-context.service';

@Component({
  selector: 'app-text-file-editor',
  imports: [],
  templateUrl: './text-file-editor.component.html',
  styleUrl: './text-file-editor.component.css',
})
export class TextFileEditorComponent implements OnInit {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = getElectronApi();
  private readonly codeMirrorContainer = viewChild<ElementRef<HTMLDivElement>>(
    'code_mirror_container'
  );
  private readonly inMemory = inject(InMemoryContextService);

  /**
   * Dynamic theme extension
   */
  private theme = EditorView.theme(
    {
      '&': {
        color: '#ddd',
        backgroundColor: '#1b1b1b',
        height: '100%',
        overflow: 'auto',
        fontFamily: '"Fira Code", Consolas, monospace',
        fontSize: '14px',
      },
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
      '.cm-content': {
        caretColor: '#66d9ef',
      },
      '.cm-content, .cm-line': {
        padding: '0 8px',
      },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: '#66d9ef',
      },
      '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: 'rgba(102, 217, 239, 0.25)',
      },
      '.cm-gutters': {
        backgroundColor: '#1a1a1a',
        color: '#777',
        borderRight: '1px solid #333',
      },
      '.cm-gutterElement': {
        padding: '0 6px',
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: '#bbb',
      },
    },
    { dark: true }
  );

  /**
   * Local state of the currently opened file (not global)
   */
  savedState: EditorState | null = null;

  codeMirrorView: EditorView | null = null;

  /**
   * Keeps state updated whenever doc changes
   */
  updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      this.savedState = update.state;
    }
  });

  openFileNode: fileNode | null = null;
  error: string | null = null;
  isLoading = false;
  stringContent = '';

  async ngOnInit() {
    this.openFileNode = this.appContext.getSnapshot().currentOpenFileInEditor;

    if (this.openFileNode) {
      await this.displayFile();
    }

    // when unreding save last state of current file
    this.destroyRef.onDestroy(() => {
      if (this.codeMirrorView && this.openFileNode) {
        const latestState = this.codeMirrorView.state;

        const map = this.inMemory.getSnapShot().savedEditorStates;
        map.set(this.openFileNode.path, latestState);
        this.inMemory.update('savedEditorStates', map);
      }
    });

    this.appContext.autoSub(
      'currentOpenFileInEditor',
      async (ctx) => {
        // 1. Save current file state before switching
        if (this.openFileNode && this.savedState) {
          const map = this.inMemory.getSnapShot().savedEditorStates;
          map.set(this.openFileNode.path, this.savedState);
          this.inMemory.update('savedEditorStates', map);
        }

        // 2. Switch file
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
    const container = this.codeMirrorContainer()?.nativeElement;
    if (!container) return;

    // 1. Load previously saved state for this file, if exists
    if (this.savedState) {
      this.codeMirrorView = new EditorView({
        parent: container,
        state: this.savedState, // IMPORTANT: do not re-apply extensions
      });
      return;
    }

    // 2. Create new state FROM SCRATCH
    const startState = EditorState.create({
      doc: this.stringContent,
      extensions: [basicSetup, this.updateListener, this.theme],
    });

    this.codeMirrorView = new EditorView({
      parent: container,
      state: startState,
    });
  }

  private disposeCodeMirror() {
    this.codeMirrorView?.destroy();
    this.codeMirrorView = null;
  }

  private async displayFile() {
    this.error = null;
    this.isLoading = true;
    this.disposeCodeMirror();

    if (!this.openFileNode) {
      this.error = 'Could not read file';
      this.isLoading = false;
      return;
    }

    // -- Load saved state per file --
    const map = this.inMemory.getSnapShot().savedEditorStates;
    this.savedState = map.get(this.openFileNode.path) ?? null;

    // If file was never edited, load fresh content
    if (!this.savedState) {
      this.stringContent = await this.api.readFile(
        undefined,
        this.openFileNode.path
      );
    }

    this.appContext.update('fileExplorerActiveFileOrFolder', this.openFileNode);
    this.isLoading = false;

    this.renderCodeMirror();
  }
}
