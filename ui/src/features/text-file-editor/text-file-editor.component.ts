import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  viewChild,
} from '@angular/core';
import { basicSetup } from 'codemirror';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { ContextService } from '../app-context/app-context.service';
import { getElectronApi } from '../../utils';
import { InMemoryContextService } from '../app-context/app-in-memory-context.service';
import { LanguageServer } from '../language/type';
import { LanguageService } from '../language/language.service';

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
  private readonly languageService = inject(LanguageService);

  private getLanguageExtension(ext: string) {
    switch (ext.toLowerCase()) {
      case 'html':
        return html();
      case 'css':
        return css();
      case 'js':
      case 'mjs':
      case 'cjs':
      case 'ts':
        return javascript();
      default:
        return []; // No highlighting fallback
    }
  }

  /** Callback to unsub reacting to language server changes */
  private serverUnSub: voidCallback | null = null;

  private getLanguageServer(extension: string): LanguageServer | null {
    switch (extension) {
      case 'js':
      case 'mjs':
      case 'cjs':
      case 'ts':
        return 'js/ts';

      default:
        console.log('Unsuported language server for file');
        return null;
    }
  }
  private languageServer: LanguageServer | null = null;

  private initLangServer(fileNode: fileNode | null) {
    if (!fileNode) {
      console.warn('No file selected cannot start language server');
      return;
    }

    if (this.serverUnSub) {
      this.serverUnSub();
    }

    this.languageServer = this.getLanguageServer(fileNode.extension);
    if (!this.languageServer) {
      console.warn('No language server found for ' + fileNode.extension);
      return;
    }

    this.serverUnSub = this.languageService.onResponse(
      this.onLanguageServerResponse,
      this.languageServer
    );

    console.log('Language server started for ' + this.languageServer);
  }
  /**
   * Define custom logic to run when the server responds such as adding intlisense warnings etc
   */
  private onLanguageServerResponse: serverResponseCallback = (data) => {
    // todo add diagnotics to the UI
    console.log(data);
  };
  /** Incremented every time a request is sent to language service */
  private requestSequenceNumber = 0;

  /** Runs when doc changes and you want to send it to server for checks */
  private sendServerMessage = () => {
    if (this.languageServer && this.openFileNode) {
      this.requestSequenceNumber = this.requestSequenceNumber + 1;

      switch (this.languageServer) {
        case 'js/ts':
          this.languageService.sendMessage(
            {
              seq: this.requestSequenceNumber,
              type: 'request',
              command: 'updateOpen',
              arguments: {
                openFiles: [
                  {
                    file: this.openFileNode?.path,
                    fileContent: this.stringContent,
                  },
                ],
              },
            },
            this.languageServer
          );
          break;

        default:
          break;
      }
    }
  };

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
    this.stringContent = update.state.doc.toString();

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

    this.sendServerMessage();
  });

  openFileNode: fileNode | null = null;
  error: string | null = null;
  isLoading = false;
  stringContent = '';

  async ngOnInit() {
    this.openFileNode = this.appContext.getSnapshot().currentOpenFileInEditor;

    await this.displayFile();
    this.initLangServer(this.openFileNode);

    this.destroyRef.onDestroy(() => {
      if (this.serverUnSub) {
        this.serverUnSub();
      }
    });
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
        this.initLangServer(this.openFileNode);
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

      this.stringContent = this.savedState.doc.toString();
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
