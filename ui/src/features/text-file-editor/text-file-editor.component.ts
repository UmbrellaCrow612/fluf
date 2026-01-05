import {
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  OnInit,
  viewChild,
} from '@angular/core';
import { basicSetup } from 'codemirror';
import { EditorView } from '@codemirror/view';
import { EditorState, Text } from '@codemirror/state';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { ContextService } from '../app-context/app-context.service';
import { getElectronApi } from '../../utils';
import { fileDiagnosticMap, LanguageServer } from '../lsp/type';
import { fileNode, voidCallback } from '../../gen/type';
import { applyExternalDiagnostics, externalDiagnosticsExtension } from './lint';
import { Completion } from '@codemirror/autocomplete';
import { server } from 'typescript';
import { InMemoryContextService } from '../app-context/app-in-memory-context.service';
import { LspService } from '../lsp/lsp.service';

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
  private readonly lspService = inject(LspService);
  private readonly inMemoryContextService = inject(InMemoryContextService);

  constructor() {
    effect(async () => {
      let node = this.appContext.currentOpenFileInEditor();

      await this.displayFile();
      this.initLangServer(node);
    });
  }

  /** Local copy of completions from the server */
  private completions: Completion[] = [];

  /**
   * Getv the syntax highlting extension for a given file extension
   * @param ext The files extension
   * @returns Code mirror lang extension for syntax highlting
   */
  private getLanguageExtension(ext: string) {
    switch (ext.toLowerCase()) {
      case '.html':
        return html();
      case '.css':
        return css();
      case '.js':
      case '.mjs':
      case '.cjs':
      case '.ts':
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
      case '.js':
      case '.mjs':
      case '.cjs':
      case '.ts':
        return 'js/ts';

      default:
        console.log('Unsuported language server for file');
        return null;
    }
  }

  private languageServer: LanguageServer | null = null;

  getDiagnosticsForFile(diagnosticMap: fileDiagnosticMap, filePath: string) {
    const fileDiagnostics = diagnosticMap.get(filePath);
    if (!fileDiagnostics) return [];

    const allDiagnostics = [];

    for (const diagnosticsArray of fileDiagnostics.values()) {
      allDiagnostics.push(...diagnosticsArray);
    }

    return allDiagnostics;
  }

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

    this.serverUnSub = this.lspService.OnResponse(
      this.languageServer,
      this.codeMirrorView.state,
      (diagnosticMap, completions) => {
        this.inMemoryContextService.problems.set(diagnosticMap);

        if (!this.openFileNode()) return;
        this.completions = completions;

        const originalPath = this.openFileNode()!.path;
        const normalizedPath = originalPath.replace(/\\/g, '/');

        let m = diagnosticMap.get(normalizedPath);

        if (!m) {
          return;
        }

        let all = this.getDiagnosticsForFile(diagnosticMap, normalizedPath);

        applyExternalDiagnostics(this.codeMirrorView!, all);
      }
    );

    console.log('Language server started for ' + this.languageServer);
  }

  private theme = EditorView.theme(
    {
      '&': {
        color: 'var(--code-editor-text)',
        backgroundColor: 'var(--code-editor-bg)',
        height: '100%',
        overflow: 'auto',
        fontFamily: 'var(--code-editor-font-family)',
        fontSize: 'var(--code-editor-font-size)',
      },

      /* Scroll area */
      '.cm-scroller': {
        overflow: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor:
          'var(--code-editor-scrollbar-thumb) var(--code-editor-scrollbar-track)',
      },
      '.cm-scroller::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '.cm-scroller::-webkit-scrollbar-track': {
        background: 'var(--code-editor-scrollbar-track)',
      },
      '.cm-scroller::-webkit-scrollbar-thumb': {
        backgroundColor: 'var(--code-editor-scrollbar-thumb)',
        borderRadius: '4px',
      },
      '.cm-scroller::-webkit-scrollbar-thumb:hover': {
        backgroundColor: 'var(--code-editor-scrollbar-thumb-hover)',
      },

      /* Text + cursor */
      '.cm-content': {
        caretColor: 'var(--code-editor-cursor)',
      },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: 'var(--code-editor-cursor)',
      },
      '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: 'var(--code-editor-selection-bg)',
      },

      /* Lines */
      '.cm-content, .cm-line': {
        padding: '0 8px',
      },
      '.cm-activeLine': {
        backgroundColor: 'var(--code-editor-active-line-bg)',
      },

      /* Gutter */
      '.cm-gutters': {
        backgroundColor: 'var(--code-editor-gutter-bg)',
        color: 'var(--code-editor-line-number)',
        borderRight: '1px solid var(--code-editor-gutter-border)',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'var(--code-editor-active-line-bg)',
        color: 'var(--code-editor-line-number-active)',
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
    }, 500);
  }

  private async handleSave() {
    console.log('Auto save fired off');
    if (!this.openFileNode()) {
      console.error('Handle save no file node');
      return;
    }

    await this.api.fsApi.write(
      this.openFileNode()!.path,
      this.stringContent.replace(/\n/g, '\r\n')
    );
  }

  codeMirrorView: EditorView | null = null;

  changeToRequest(
    doc: Text,
    fromA: number,
    toA: number,
    inserted: Text
  ): server.protocol.ChangeRequestArgs {
    const startLine = doc.lineAt(fromA);
    const endLine = doc.lineAt(toA);

    return {
      line: startLine.number,
      offset: fromA - startLine.from + 1,

      endLine: endLine.number,
      endOffset: toA - endLine.from + 1,

      insertString: inserted.length ? inserted.toString() : undefined,
      file: this.openFileNode()?.path!,
    };
  }

  /**
   * Keeps state updated whenever doc changes and run custom logic when it changes
   */
  updateListener = EditorView.updateListener.of((update) => {
    if (!this.openFileNode()) return;

    if (this.languageServer) {
      update.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
        const request = this.changeToRequest(
          update.startState.doc,
          fromA,
          toA,
          inserted
        );

        this.lspService.Edit(request, this.languageServer!);
        this.diagnosticsEvent();
      }, true);
    }

    if (update.docChanged) {
      this.stringContent = update.state.doc.toString();
      this.onSaveEvent();
    }
  });

  private diagTimeout: any;
  /**
   * Debounces the request to the Language Service for file errors (Geterr).
   * Only sends the request after the user has stopped typing for a set delay.
   */
  private diagnosticsEvent() {
    if (this.diagTimeout) {
      clearTimeout(this.diagTimeout);
    }

    this.diagTimeout = setTimeout(() => {
      if (!this.openFileNode() || !this.languageServer) return;

      this.lspService.Error(this.openFileNode()!.path, this.languageServer);
    }, 200);
  }

  openFileNode = computed(() => this.appContext.currentOpenFileInEditor());
  error: string | null = null;
  isLoading = false;
  stringContent = '';

  async ngOnInit() {
    this.destroyRef.onDestroy(() => {
      if (this.serverUnSub) {
        this.serverUnSub();
      }
    });
  }

  private renderCodeMirror() {
    const container = this.codeMirrorContainer()?.nativeElement;
    if (!container) return;

    const fileExtension = this.openFileNode()?.extension ?? '';

    const language = this.getLanguageExtension(fileExtension);

    const startState = EditorState.create({
      doc: this.stringContent,
      extensions: [
        basicSetup,
        this.theme,
        language,
        this.updateListener,
        externalDiagnosticsExtension(),
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

    if (!this.openFileNode()) {
      this.error = 'Could not read file';
      this.isLoading = false;
      return;
    }

    this.stringContent = (
      await this.api.fsApi.readFile(this.openFileNode()!.path)
    ).replace(/\r\n/g, '\n');

    this.languageServer = this.getLanguageServer(
      this.openFileNode()!.extension
    );
    this.inMemoryContextService.currentLanguageServer.set(this.languageServer);

    this.appContext.fileExplorerActiveFileOrFolder.set(this.openFileNode());
    this.isLoading = false;

    if (this.languageServer) {
      // open file in lan server if it has one
      this.lspService.Open(
        this.openFileNode()!.path,
        this.stringContent,
        this.languageServer
      );

      this.lspService.Error(this.openFileNode()!.path, this.languageServer!);
    }

    this.renderCodeMirror();
  }

  onRightClick(event: MouseEvent) {
    event.preventDefault();

    this.inMemoryContextService.currentActiveContextMenu.set({
      data: this.appContext.currentOpenFileInEditor(),
      key: 'text-file-editor-context-menu',
      pos: {
        mouseX: event.clientX,
        mouseY: event.clientY,
      },
    });
  }
}
