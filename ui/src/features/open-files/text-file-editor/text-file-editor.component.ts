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
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';

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

  private getLanguageExtension(ext: string) {
    switch (ext.toLowerCase()) {
      case 'html':
        return html();
      case 'css':
        return css();
      case 'js':
      case 'mjs':
      case 'cjs':
        return javascript();
      default:
        return []; // No highlighting fallback
    }
  }

  private theme = EditorView.theme(
    {
      '&': {
        color: '#e0e0e0',
        backgroundColor: '#1a1c20',
        height: '100%',
        overflow: 'auto',
        fontFamily: '"Fira Code", Consolas, monospace',
        fontSize: '14px',
      },

      /* Scroll area */
      '.cm-scroller': {
        overflow: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: '#3f444a #1a1c20',
      },
      '.cm-scroller::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '.cm-scroller::-webkit-scrollbar-track': {
        background: '#1a1c20',
      },
      '.cm-scroller::-webkit-scrollbar-thumb': {
        backgroundColor: '#3f444a',
        borderRadius: '4px',
      },
      '.cm-scroller::-webkit-scrollbar-thumb:hover': {
        backgroundColor: '#50555c',
      },

      /* Text + cursor */
      '.cm-content': {
        caretColor: '#80CBC4',
      },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: '#80CBC4',
      },
      '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: 'rgba(128, 203, 196, 0.25)',
      },

      /* Lines */
      '.cm-content, .cm-line': {
        padding: '0 8px',
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
      },

      /* Gutter */
      '.cm-gutters': {
        backgroundColor: '#1a1c20',
        color: '#59626e',
        borderRight: '1px solid #2a2e35',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'rgba(255,255,255,0.05)',
        color: '#aab2bf',
      },
    },
    { dark: true }
  );

  private saveTimeout: any;
  onSaveEvent() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.handleSave();
    }, 200);
  }

  private async handleSave() {
    console.log('Auto save fired off');
    if (!this.openFileNode || !this.savedState) {
      console.error('Handle save');
      return;
    }
    await this.api.writeToFile(
      undefined,
      this.openFileNode.path,
      this.savedState.doc.toString()
    );
  }

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
      this.onSaveEvent();
    }

    if (
      update.transactions.some(
        (tr) => tr.isUserEvent('undo') || tr.isUserEvent('redo')
      )
    ) {
      this.savedState = update.state;
      this.onSaveEvent();
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

        await this.displayFile();
      },
      this.destroyRef
    );
  }

  private renderCodeMirror() {
    const container = this.codeMirrorContainer()?.nativeElement;
    if (!container) return;

    const fileExtension = this.openFileNode?.extension ?? '';

    const language = this.getLanguageExtension(fileExtension);

    // If saved state exists, reuse it
    if (this.savedState) {
      this.codeMirrorView = new EditorView({
        parent: container,
        state: this.savedState,
      });
      return;
    }

    const startState = EditorState.create({
      doc: this.stringContent,
      extensions: [basicSetup, this.updateListener, this.theme, language],
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
