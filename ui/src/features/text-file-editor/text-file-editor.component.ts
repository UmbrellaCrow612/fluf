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
import { EditorState, StateEffect, StateField } from '@codemirror/state';
import { linter, Diagnostic, setDiagnosticsEffect } from '@codemirror/lint';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { ContextService } from '../app-context/app-context.service';
import { getElectronApi } from '../../utils';
import { InMemoryContextService } from '../app-context/app-in-memory-context.service';
import { LanguageServer } from '../language/type';
import { LanguageService } from '../language/language.service';
import { mapTypescriptDiagnosticToCodeMirrorDiagnostic } from './typescript';

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

  /**
   * Contains a map of file paths and then a map of ecific types of diagnostics like error, warning suggestion keys then the diagnostics
   */
  private fileAndDiagnostics = new Map<
    /** file path is key */ string,
    Map<tsServerOutputEvent, Diagnostic[]>
  >();

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

  /**
   * Get the specific ;language server needed for the file based on it's extension
   * @param extension The file extension
   * @returns Lang server or null
   */
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

  /**
   * Launch the language server - AFTER - rendering the UI for the given node in the UI
   * @param fileNode The current open file node in the editor view
   */
  private initLangServer(fileNode: fileNode | null) {
    if (!fileNode) {
      console.warn('No file selected cannot start language server');
      return;
    }

    if (!this.codeMirrorView) {
      console.warn('No code mirror view init');
      return;
    }

    if (this.serverUnSub) {
      this.serverUnSub(); // unsub from previous lang server
    }

    this.languageServer = this.getLanguageServer(fileNode.extension);
    if (!this.languageServer) {
      console.warn('No language server found for ' + fileNode.extension);
      return;
    }

    // todo make it generic

    this.serverUnSub = this.api.tsServer.onResponse((mess) => {
      if (!this.codeMirrorView) {
        console.warn('No code mirrror view');
        return;
      }

      let mapped = mapTypescriptDiagnosticToCodeMirrorDiagnostic(
        [mess],
        this.codeMirrorView.state
      );

      if (!this.fileAndDiagnostics.has(fileNode.path)) {
        let specificDiagnoticMap = new Map<tsServerOutputEvent, Diagnostic[]>();

        specificDiagnoticMap.set(mess.event, mapped);

        this.fileAndDiagnostics.set(
          this.openFileNode!.path,
          specificDiagnoticMap
        );
      } else {
        let map = this.fileAndDiagnostics.get(fileNode.path);
        map?.set(mess.event, mapped); // basically overide previous "syntaxDiag" or others new ones that come in
      }
    });

    console.log('Language server started for ' + this.languageServer);
  }

  /** Runs when the editor dose edits */
  private sendServerMessage = () => {
    if (!this.languageServer || !this.openFileNode) return;

    switch (this.languageServer) {
      case 'js/ts':
        this.api.tsServer.editFile(this.openFileNode.path, this.stringContent);
        break;

      default:
        console.warn('unkown server ' + this.languageServer);
        break;
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
    if (!this.openFileNode) {
      console.error('Handle save no file node');
      return;
    }

    await this.api.writeToFile(
      undefined,
      this.openFileNode.path,
      this.stringContent
    );
  }

  codeMirrorView: EditorView | null = null;

  /**
   * Keeps state updated whenever doc changes
   */
  updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      this.stringContent = update.state.doc.toString();
      this.onSaveEvent();
      this.sendServerMessage();
    }
  });

  openFileNode: fileNode | null =
    this.appContext.getSnapshot().currentOpenFileInEditor;
  error: string | null = null;
  isLoading = false;
  stringContent = '';

  async ngOnInit() {
    await this.displayFile();
    this.initLangServer(this.openFileNode);

    this.destroyRef.onDestroy(() => {
      if (this.serverUnSub) {
        this.serverUnSub();
      }
    });

    this.appContext.autoSub(
      'currentOpenFileInEditor',
      async (ctx) => {
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

    const startState = EditorState.create({
      doc: this.stringContent,
      extensions: [
        basicSetup,
        this.updateListener,
        this.theme,
        language,
        this.linter,
      ],
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

    this.stringContent = await this.api.readFile(
      undefined,
      this.openFileNode.path
    );

    this.appContext.update('fileExplorerActiveFileOrFolder', this.openFileNode);
    this.isLoading = false;

    // todo change
    this.api.tsServer.openFile(this.openFileNode.path, this.stringContent);

    this.renderCodeMirror();
  }

  // linter

  private linter = linter((view) => {
    if (!this.openFileNode) {
      console.error('Linter ran no open file node');
      return [];
    }

    let d = this.fileAndDiagnostics.get(this.openFileNode.path);
    if (!d) return [];

    return d.get('semanticDiag') ?? [];
  });
}
