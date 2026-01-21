import { Diagnostic, linter, lintGutter } from '@codemirror/lint';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  OnInit,
  untracked,
  viewChild,
} from '@angular/core';
import { basicSetup } from 'codemirror';
import { EditorView, hoverTooltip } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import {
  autocompletion,
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete';
import { ContextService } from '../app-context/app-context.service';
import { getElectronApi } from '../../utils';
import { fileNode, languageId, voidCallback } from '../../gen/type';
import { InMemoryContextService } from '../app-context/app-in-memory-context.service';
import { codeEditorTheme } from './theme';
import { getLanguageExtension } from './language';
import { getLanguageId } from '../lsp/utils';
import {
  codeMirrorEditToJsonRpcEdits,
  lspDiagnosticsToCodeMirror,
} from '../lsp/conversion';
import { DocumentVersionsService } from '../lsp/document-versions.service';
import { PublishDiagnosticsParams } from 'vscode-languageserver-protocol';
import { uriToFilePath } from '../lsp/uri';
import { normalizeElectronPath } from '../path/utils';

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
    'code_mirror_container',
  );
  private readonly inMemoryContextService = inject(InMemoryContextService);

  private readonly workSpaceFolder = computed(() =>
    this.appContext.selectedDirectoryPath(),
  );
  private readonly documentVersionsService = inject(DocumentVersionsService);

  constructor() {
    effect(async () => {
      let node = this.appContext.currentOpenFileInEditor();

      await this.displayFile();
      await this.initLangServer(node);
    });
  }

  /** List of callbacks that unsub callbacks registred */
  private serverUnSubs: voidCallback[] = [];

  private languageId: languageId | null = null;

  /** Holds the current diagnostics for the file */
  private currentDiagnostics: Diagnostic[] = [];

  /**
   * Async completion source
   */
  private completionSource = async (
    context: CompletionContext,
  ): Promise<CompletionResult> => {
    // Get the word before cursor
    const word = context.matchBefore(/\w*/);

    if (!word || (word.from === word.to && !context.explicit)) {
      return {
        from: word?.from ?? 1,
        options: [],
      };
    }

    // Simulate async operation (replace with actual LSP completion call)
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      from: word.from,
      options: [
        {
          label: 'exampleFunction',
          type: 'function',
          detail: 'Example completion',
          info: 'This is an example completion item',
        },
        {
          label: 'exampleVariable',
          type: 'variable',
          detail: 'Example variable',
        },
        {
          label: 'exampleClass',
          type: 'class',
          detail: 'Example class',
        },
      ],
    };
  };

  /**
   * Hover tooltip that uses LSP to get hover information
   */
  private wordHoverExtension = hoverTooltip(async (view, pos, side) => {
    const { from, to, text } = view.state.doc.lineAt(pos);
    let start = pos;
    let end = pos;

    // Find word boundaries
    while (start > from && /\w/.test(text[start - from - 1])) start--;
    while (end < to && /\w/.test(text[end - from])) end++;

    // Check if pointer is inside a word
    if ((start === pos && side < 0) || (end === pos && side > 0)) {
      return null;
    }

    const word = text.slice(start - from, end - from);
    console.log('Hovered word:', word);

    // Get workspace folder, language ID, and file path
    const wsf = this.workSpaceFolder();
    const filePath = this.openFileNode()?.path;

    if (!wsf || !filePath || !this.languageId) {
      return null;
    }

    // Convert CodeMirror position to LSP position
    const line = view.state.doc.lineAt(pos);
    const lspPosition = {
      line: line.number - 1, // LSP uses 0-based line numbers
      character: pos - line.from,
    };

    try {
      // Call LSP hover
      const hoverResult = await this.api.lspClient.hover(
        wsf,
        this.languageId,
        filePath,
        lspPosition,
      );

      console.log('LSP Hover result:', hoverResult);

      // Check if we got hover information
      if (!hoverResult || !hoverResult.contents) {
        return null;
      }

      return {
        pos: start,
        end,
        above: true,
        create() {
          const dom = document.createElement('div');
          dom.className = 'cm-tooltip-hover';

          // Handle different content types
          if (typeof hoverResult.contents === 'string') {
            dom.textContent = hoverResult.contents;
          } else if ('kind' in hoverResult.contents) {
            // MarkupContent
            dom.textContent = hoverResult.contents.value;
          } else if (Array.isArray(hoverResult.contents)) {
            // MarkedString[]
            dom.textContent = hoverResult.contents
              .map((c) => (typeof c === 'string' ? c : c.value))
              .join('\n');
          } else {
            // MarkedString
            dom.textContent =
              'language' in hoverResult.contents
                ? hoverResult.contents.value
                : hoverResult.contents;
          }

          return { dom };
        },
      };
    } catch (error) {
      console.error('Error fetching hover info:', error);
      return null;
    }
  });

  /**
   * Sends the open file request to LSP
   */
  private openFileInLanguageServer() {
    let wsf = this.workSpaceFolder();
    let fp = this.openFileNode()?.path;

    if (!wsf || !fp || !this.stringContent || !this.languageId) return;

    this.api.lspClient.didOpenTextDocument(
      wsf,
      this.languageId,
      fp,
      1,
      this.stringContent,
    );
  }

  /**
   * Launch the language server - AFTER - rendering the UI for the given node in the UI
   * @param fileNode The current open file node in the editor view
   */
  private async initLangServer(fileNode: fileNode | null) {
    console.log('Language server being started');
    if (!fileNode) {
      console.warn('No file selected cannot start language server');
      return;
    }

    if (!this.codeMirrorView) {
      console.warn('No code mirror view init');
      return;
    }

    this.serverUnSubs.forEach((cb) => cb());

    this.languageId = getLanguageId(fileNode.extension);
    if (!this.languageId) {
      console.warn('No language server found for ' + fileNode.extension);
      return;
    }

    this.documentVersionsService.docs.set(fileNode.path, 1);

    const isStartedAlready = await this.api.lspClient.isRunning(
      this.workSpaceFolder()!,
      this.languageId,
    );

    this.serverUnSubs.push(
      this.api.lspClient.onReady((langId, wsf) => {
        console.log(`On ready called languageId ${langId} workspace: ${wsf}`);
        this.openFileInLanguageServer(); // called on first time starts
      }),
    );

    if (isStartedAlready) {
      this.openFileInLanguageServer(); // Re open file request in LSP for new file
    }

    await this.api.lspClient.start(this.workSpaceFolder()!, this.languageId); // try to start

    this.serverUnSubs.push(
      this.api.lspClient.onData((obj) => {
        console.log('On data response');
        console.log(JSON.stringify(obj));
      }),
    );

    this.serverUnSubs.push(
      this.api.lspClient.onNotification(
        'textDocument/publishDiagnostics',
        (data) => {
          console.log('diagnostics published');
          console.log(data.params);

          let params = data.params as any as PublishDiagnosticsParams;
          this.currentDiagnostics = lspDiagnosticsToCodeMirror(
            params,
            this.codeMirrorView!,
          );

          let fp = normalizeElectronPath(uriToFilePath(params.uri));
          let problems = untracked(() => {
            return this.inMemoryContextService.problems();
          });

          problems.set(fp, this.currentDiagnostics);

          this.inMemoryContextService.problems.set(structuredClone(problems));
        },
      ),
    );

    console.log('Language server started for ' + this.languageId);
  }

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
      this.stringContent.replace(/\n/g, '\r\n'),
    );
  }

  codeMirrorView: EditorView | null = null;

  /**
   * Keeps state updated whenever doc changes and run custom logic when it changes
   */
  updateListener = EditorView.updateListener.of((update) => {
    let node = this.openFileNode();
    if (!node) return;

    if (this.languageId && update.docChanged) {
      let currentVersion =
        this.documentVersionsService.docs.get(node.path) ?? 1;
      let newVersion = currentVersion + 1;
      this.documentVersionsService.docs.set(node.path, newVersion);

      this.api.lspClient.didChangeTextDocument(
        this.workSpaceFolder()!,
        this.languageId,
        node.path,
        newVersion,
        codeMirrorEditToJsonRpcEdits(update),
      );
    }

    if (update.docChanged) {
      this.stringContent = update.state.doc.toString();
      this.onSaveEvent();
    }
  });

  openFileNode = computed(() => this.appContext.currentOpenFileInEditor());
  error: string | null = null;
  isLoading = false;
  stringContent = '';

  async ngOnInit() {
    this.destroyRef.onDestroy(() => {
      this.serverUnSubs.forEach((x) => x());
    });
  }

  private renderCodeMirror() {
    const container = this.codeMirrorContainer()?.nativeElement;
    if (!container) return;

    const fileExtension = this.openFileNode()?.extension ?? '';

    const language = getLanguageExtension(fileExtension);

    const startState = EditorState.create({
      doc: this.stringContent,
      extensions: [
        basicSetup,
        codeEditorTheme,
        language,
        this.updateListener,
        linter(() => this.currentDiagnostics),
        lintGutter(),
        this.wordHoverExtension,
        autocompletion({ override: [this.completionSource] }),
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
    console.log('File being rendered');

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

    this.appContext.fileExplorerActiveFileOrFolder.set(this.openFileNode());
    this.isLoading = false;

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
