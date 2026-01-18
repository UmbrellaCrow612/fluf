import { linter, lintGutter } from '@codemirror/lint';
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
import { ContextService } from '../app-context/app-context.service';
import { getElectronApi } from '../../utils';
import { fileNode, languageId, voidCallback } from '../../gen/type';
import { InMemoryContextService } from '../app-context/app-in-memory-context.service';
import { getLanguageId } from '../lsp/utils';
import { codeEditorTheme } from './theme';
import { getLanguageExtension } from './language';
import { applyExternalDiagnostics } from './lint';
import { FlufDiagnostic } from '../diagnostic/type';
import { normalizeElectronPath } from '../path/utils';
import {
  autocompletion,
  Completion,
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete';
import { Position } from 'vscode-languageserver-protocol';

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

  constructor() {
    effect(async () => {
      let node = this.appContext.currentOpenFileInEditor();

      await this.displayFile();
      await this.initLangServer(node);
    });
  }

  getWordAt(doc: import('@codemirror/state').Text, pos: number) {
    const line = doc.lineAt(pos);
    const lineText = line.text;

    let start = pos - line.from;
    let end = start;

    // Expand left
    while (start > 0 && /\w/.test(lineText[start - 1])) start--;
    // Expand right
    while (end < lineText.length && /\w/.test(lineText[end])) end++;

    if (start === end) return null;

    return {
      from: line.from + start,
      to: line.from + end,
    };
  }

  private serverUnSubs: voidCallback[] = [];

  private languageId: languageId | null = null;

  /** Holds the current diagnostics for the file */
  private currentDiagnostics: FlufDiagnostic[] = [];

  /** Holds the current completion from the server */
  private completions: Completion[] = [];

  private completionSource = async (
    context: CompletionContext,
  ): Promise<CompletionResult | null> => {
    // Always return completions if we have any, even without explicit trigger
    if (this.completions.length === 0) {
      return null;
    }

    // Get the word before cursor - more lenient matching
    const word = context.matchBefore(/\w*/);

    // Return completions even if there's no word yet (for triggering on every keystroke)
    return {
      from: word?.from ?? context.pos,
      options: this.completions,
      validFor: /^\w*$/,
    };
  };

  /** Holds he current hover information */
  private hoverInformation: string = '';
  hoverExtension = hoverTooltip((view, pos, side) => {
    const doc = view.state.doc;

    const word = this.getWordAt(doc, pos);
    if (!word) return null;

    const wordText = doc.sliceString(word.from, word.to);

    const line = doc.lineAt(pos);
    const position: Position = {
      line: line.number - 1, // zero-based
      character: pos - line.from, // zero-based
    };

    console.log('Hovered word:', wordText);

    const node = this.openFileNode();
    if (node && this.languageId) {
      // this.lspService.hover(node, position, this.languageServer);
    }

    let info = this.hoverInformation.trim();
    if (info.length > 0) {
      console.log('Rendering tooltip');
      return {
        pos: word.from,
        end: word.to,
        above: true,
        create(view) {
          const dom = document.createElement('div');
          dom.textContent = info;
          return { dom };
        },
      };
    }

    return null;
  });

  /**
   * Sends the file and a get error to the server for the given file node
   */
  private openFileInLanguageServer() {
    // this.lspService.Open(
    //   this.openFileNode()!.path,
    //   this.stringContent,
    //   this.languageServer!,
    // );
    // this.lspService.Error(this.openFileNode()!.path, this.languageServer!);
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
    this.inMemoryContextService.currentLanguageServer.set(this.languageId);
    if (!this.languageId) {
      console.warn('No language server found for ' + fileNode.extension);
      return;
    }

    let res = await this.api.lspClient.start(
      this.workSpaceFolder()!,
      this.languageId,
    );
    console.log('Backend response ' + res);

    this.serverUnSubs.push(
      await this.api.lspClient.onData(
        this.workSpaceFolder()!,
        this.languageId,
        (res) => {
          console.log('Server responded');
          console.log(res);
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

    // if (this.languageServer && update.docChanged) {
    //   this.lspService.Edit(update, node, this.languageServer);
    //   this.lspService.Completion(update, node, this.languageServer);
    //   this.diagnosticsEvent();
    // }

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
      // if (!this.openFileNode() || !this.languageServer) return;
      // this.lspService.Error(this.openFileNode()!.path, this.languageServer);
    }, 200);
  }

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
        autocompletion({
          override: [this.completionSource],
          activateOnTyping: true,
          maxRenderedOptions: 50,
          defaultKeymap: true,
        }),
        this.hoverExtension,
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
