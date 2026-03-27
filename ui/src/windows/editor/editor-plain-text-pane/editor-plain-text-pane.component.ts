import { Extension } from "@codemirror/state";
import { history, historyField } from "@codemirror/commands";
import {
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  Signal,
  viewChild,
} from "@angular/core";
import { getElectronApi } from "../../../shared/electron";
import { fileNode, languageId, voidCallback } from "../../../gen/type";
import { EditorStateService } from "../core/state/editor-state.service";
import { basicSetup, EditorView } from "codemirror";
import { useEffect } from "../../../lib/useEffect";
import { editorPlainTextPaneThemeExtension } from "./extensions/theme";
import { EditorFileStateService } from "../core/services/editor-file-state.service";
import { EditorSessionStateService } from "../core/services/editor-session-state.service";
import { EditorPathBreadcrumbBarComponent } from "../editor-path-breadcrumb-bar/editor-path-breadcrumb-bar.component";
import { EditorInMemoryStateService } from "../core/state/editor-in-memory-state.service";
import {
  linter,
  Diagnostic as CmDiagnostic,
  lintGutter,
} from "@codemirror/lint";
import { EditorLanguageServerProtocolService } from "../core/lsp/editor-language-server-protocol.service";
import { getLanguageId } from "../core/lsp/languageId";
import { EditorDocumentVersionService } from "../core/lsp/editor-document-version.service";
import { PublishDiagnosticsParams } from "vscode-languageserver-protocol";
import { vscodeToCodeMirrorDiagnostic } from "../core/lsp/diagnostic";
import { ViewUpdate } from "@codemirror/view";
import { viewUpdateToLSPChanges } from "../core/lsp/change";

/**
 * Shows a editor for plain text documents such as txt or code files such as .js ts etc basically any document with text
 */
@Component({
  selector: "app-editor-plain-text-pane",
  imports: [EditorPathBreadcrumbBarComponent],
  templateUrl: "./editor-plain-text-pane.component.html",
  styleUrl: "./editor-plain-text-pane.component.css",
})
export class EditorPlainTextPaneComponent implements OnDestroy {
  private readonly editorStateService = inject(EditorStateService);
  private readonly editorInMemoryStateService = inject(
    EditorInMemoryStateService,
  );
  private readonly electronApi = getElectronApi();
  private readonly editorFileStateService = inject(EditorFileStateService);
  private readonly editorSessionStateService = inject(
    EditorSessionStateService,
  );
  private readonly editorLanguageServerProtocolService = inject(
    EditorLanguageServerProtocolService,
  );
  private readonly editorDocumentVersionService = inject(
    EditorDocumentVersionService,
  );

  /**
   * Keeps track of the current open file in the editor
   */
  public readonly activeNode: Signal<fileNode | null> = computed(() =>
    this.editorStateService.currentOpenFileInEditor(),
  );

  /**
   * Holds the editor view
   */
  private editorView: EditorView | null = null;

  /**
   * Refrence to the container to render the editor
   */
  private readonly editorPlaneTextPaneContainer = viewChild<
    ElementRef<HTMLDivElement>
  >("editorPlainTextPane");

  /**
   * Holds loading state
   */
  public readonly isLoading = signal(false);

  /**
   * Holds error state
   */
  public readonly error = signal<string | null>(null);

  /**
   * Holds the normlized path of the current open file
   */
  private readonly normalizedFilePath = signal<string | null>(null);

  /**
   * Contains the current diagnostics for the file
   */
  private readonly diagnostics = signal<CmDiagnostic[]>([]);

  /**
   * Contains the current language ID
   */
  private readonly languageId = signal<languageId | null>(null);

  /**
   * Contains list of unsub callbacks to clean up state
   */
  private unsubCallbacks: voidCallback[] = [];

  /**
   * Keeps track of the selected directory in the editor
   */
  private readonly selectedDirectory = computed(() =>
    this.editorStateService.selectedDirectoryPath(),
  );

  constructor() {
    useEffect(
      async (_, fileNode) => {
        if (!fileNode) {
          this.error.set("No open file");
          return;
        }

        this.cleanUpState();
        await this.displayPlainTextEditor(fileNode);
      },
      [this.activeNode],
    );
  }

  ngOnDestroy(): void {
    this.cleanUpState();
  }

  /**
   * Keeps track if auto save is on
   */
  private readonly autoSaveOn = computed(() =>
    this.editorStateService.autoSave(),
  );

  /**
   * Extension that listens to changes and runs logic
   */
  private updateListener = EditorView.updateListener.of(async (update) => {
    this.hydrateDataOnChange(update.view);

    const normalizedPath = this.normalizedFilePath();
    if (!normalizedPath) {
      console.error("The current file opened in UI has not set it's file path");
      return;
    }
    const workspaceFolder = this.selectedDirectory();
    if (!workspaceFolder) {
      console.error("There is not a workspace / selected directory in UI");
      return;
    }

    const languageId = this.languageId();

    if (update.docChanged) {
      this.editorDocumentVersionService.updateVersion(normalizedPath);

      this.editorFileStateService.trackChange(
        normalizedPath,
        update.state.doc.toString(),
      );

      this.sendDidChangeTextDocument(
        workspaceFolder,
        languageId,
        normalizedPath,
        update,
      );

      if (this.autoSaveOn()) {
        await this.editorFileStateService.save(normalizedPath);
      }
    }
  });

  /**
   * Hydrates global data and editor state based on local data and shared data
   * @param view The editor view
   */
  private async hydrateDataOnChange(view: EditorView): Promise<void> {
    this.hydrateCursorPosition(view);
    await this.hydrateGitBlameLine(view);
  }

  /**
   * Hydrates the editor state memeory to have up to date cursor positon
   * @param view The editor view
   */
  private hydrateCursorPosition(view: EditorView) {
    const cursorPos = this.getCursorPosition(view);
    this.editorInMemoryStateService.selectedLineAndColumn.set({
      line: cursorPos.line,
      column: cursorPos.col,
    });
  }

  /**
   * Fire and forget: Updates the blame information for the current line the cursor is at
   * @param view The editor view
   */
  private async hydrateGitBlameLine(view: EditorView) {
    try {
      const lineNumber = this.getCursorPosition(view).line;
      const directory = this.selectedDirectory();
      const filePath = this.activeNode()?.path;
      if (!directory) {
        throw new Error("No selected directory");
      }
      if (!filePath) {
        throw new Error("No file path");
      }

      const result = await this.electronApi.gitApi.gitBlameLine(
        directory,
        filePath,
        lineNumber,
        lineNumber,
      );

      this.editorInMemoryStateService.gitBlameLineInformation.set(result);
    } catch (error) {
      console.error("Failed to hydrate git blame line ", error);
    }
  }

  /**
   * Get the current editors cursor position
   * @param view The editor view
   * @returns Position
   */
  private getCursorPosition = (view: EditorView) => {
    const selection = view.state.selection.main;
    const pos = selection.head; // cursor position (anchor if you want selection start)

    // Get line information
    const line = view.state.doc.lineAt(pos);

    // Calculate column (0-indexed from start of line)
    const col = pos - line.from;

    return {
      line: line.number, // 1-indexed line number
      col: col, // 0-indexed column
      col1Indexed: col + 1, // 1-indexed column if preferred
    };
  };

  /**
   * Saves current editor state to cache before switching files
   */
  private saveCurrentState(): void {
    const currentPath = this.normalizedFilePath();
    const view = this.editorView;

    if (!currentPath || !view || currentPath.trim() === "") return;

    const editorStateJSON = view.state.toJSON({
      history: historyField,
    });
    const scrollTop = view.scrollDOM.scrollTop;
    const scrollLeft = view.scrollDOM.scrollLeft;

    this.editorSessionStateService.setCache(currentPath, {
      editorStateJSON,
      scrollTop,
      scrollLeft,
      lastAccessed: Date.now(),
    });
  }

  /**
   * Shows the current open file and shows the editor pane
   * @param node The file to show
   */
  private async displayPlainTextEditor(node: fileNode): Promise<void> {
    if (node.isDirectory) {
      this.error.set("Node must be a file not a directory");
      return;
    }

    try {
      this.isLoading.set(true);
      this.error.set(null);
      this.normalizedFilePath.set(null);

      const container = this.editorPlaneTextPaneContainer()?.nativeElement;
      if (!container) {
        throw new Error("Could not find target container");
      }

      const normalizedPath = await this.electronApi.pathApi.normalize(
        node.path,
      );
      const filePathExists =
        await this.electronApi.fsApi.exists(normalizedPath);
      if (!filePathExists) {
        throw new Error("File path does not exit");
      }
      this.normalizedFilePath.set(normalizedPath);

      const cachedView = this.editorSessionStateService.restoreCache(
        normalizedPath,
        container,
        this.createExtensions,
      );
      if (cachedView) {
        console.log("Using cahche view");
        this.editorView = cachedView;
        this.editorView.focus();
        this.hydrateDataOnChange(cachedView);

        await this.initLanguageServer(
          node,
          cachedView.state.doc.toString(),
          cachedView,
        );
        return;
      }

      console.log("Creating new cahche view");

      /**
       * Holds the content we show in the pane editor
       */
      let docString: string = "";

      const draft = this.editorFileStateService.getDraft(normalizedPath);
      if (draft) {
        docString = draft;
        console.log("Using saved draft");
      } else {
        docString = await this.electronApi.fsApi.readFile(normalizedPath);
      }

      this.editorView = new EditorView({
        doc: docString,
        parent: container,
        extensions: this.createExtensions(),
      });
      this.editorView.focus();
      this.hydrateDataOnChange(this.editorView);

      await this.initLanguageServer(node, docString, this.editorView);
    } catch (error: any) {
      console.error("Failed to load file ", error);
      this.error.set(`Failed to load file ${error?.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Gets the linter extension to display linting in the UI
   * @returns A extension that returns linting for the UI display
   */
  private readonly linterExtension = (): Extension => {
    return linter((view) => {
      return this.diagnostics();
    });
  };

  /**
   * Initlizes language server logic
   * @param node - The open file
   * @param docString The documents content
   */
  private initLanguageServer = async (
    node: fileNode,
    docString: string,
    view: EditorView,
  ): Promise<void> => {
    this.languageId.set(getLanguageId(node.extension));

    const languageId = this.languageId();
    if (!languageId) {
      return;
    }

    const workspaceFolder = this.selectedDirectory();
    if (!workspaceFolder) {
      return;
    }

    let lspStarted: boolean = false;
    try {
      lspStarted = await this.editorLanguageServerProtocolService.start(
        workspaceFolder,
        languageId,
      );
    } catch (error) {
      lspStarted = false;
      console.error("Failed to start LSP ", error);
    }

    if (!lspStarted) {
      this.unsubCallbacks.push(
        this.editorLanguageServerProtocolService.onReady(() => {
          this.sendOpenTextDocument(
            workspaceFolder,
            languageId,
            node,
            docString,
          );
        }),
      );
    } else {
      this.sendOpenTextDocument(workspaceFolder, languageId, node, docString);
    }

    this.unsubCallbacks.push(
      this.editorLanguageServerProtocolService.onNotification(
        "textDocument/publishDiagnostics",
        (message) => {
          console.log("Backend diagnostic ", message);

          const params = message?.params as
            | undefined
            | PublishDiagnosticsParams;

          if (!params || !params?.diagnostics) {
            console.error(
              "textDocument/publishDiagnostics produced a none matching object notification",
            );
            return;
          }

          const diags: CmDiagnostic[] = [];

          for (const vscodeDiag of params?.diagnostics) {
            const mappedDiag = vscodeToCodeMirrorDiagnostic(
              vscodeDiag,
              view.state,
            );
            if (mappedDiag) {
              diags.push(mappedDiag);
            } else {
              console.error(
                "Failed to map vscode diagnostic to editor diagnostic",
              );
            }
          }

          this.diagnostics.set(diags);
        },
      ),
    );
  };

  /**
   * Send document change to sync backend document view with view changes in the UI
   * @param workspaceFolder The workspace folder
   * @param languageId The language server to send it to if null then it means there isnt a language server to send it to
   * @param filePath The file being updated
   * @param update The changes
   */
  private sendDidChangeTextDocument = async (
    workspaceFolder: string,
    languageId: languageId | null,
    filePath: string,
    update: ViewUpdate,
  ): Promise<void> => {
    try {
      if (!languageId) {
        console.warn("No LSP to send changes to");
        return; // no lsp for the document extension
      }
      const version = this.editorDocumentVersionService.getVersion(filePath);
      const changes = viewUpdateToLSPChanges(update);

      this.editorLanguageServerProtocolService.didChangeTextDocument(
        workspaceFolder,
        languageId,
        filePath,
        version,
        changes,
      );
    } catch (error) {
      console.error("Failed to send text document did change ", error);
    }
  };

  /**
   * Sends a text document open LSP
   * @param workspaceFolder The workspace folder
   * @param languageId The lnaguage ID
   * @param node The selected node in the editor
   */
  private async sendOpenTextDocument(
    workspaceFolder: string,
    languageId: languageId,
    node: fileNode,
    docString: string,
  ) {
    try {
      const filePath = node.path;
      const version = this.editorDocumentVersionService.getVersion(filePath);

      this.editorLanguageServerProtocolService.didOpenTextDocument(
        workspaceFolder,
        languageId,
        filePath,
        version,
        docString,
      );

      console.log("Sent text document open lsp");
    } catch (error) {
      console.error("Failed to open did open document ", error);
    }
  }

  /**
   * Creates editor extensions
   * @returns Array of extensions for new editor instances
   */
  private createExtensions = (): Extension[] => {
    return [
      basicSetup,
      this.updateListener,
      editorPlainTextPaneThemeExtension,
      history(),
      this.linterExtension(),
      lintGutter(),
    ];
  };

  /**
   * Cleans up the state between file changes or destroy
   * Saves current state to cache before cleanup
   */
  private cleanUpState(): void {
    this.saveCurrentState();

    this.diagnostics.set([]);
    this.languageId.set(null);

    for (const callback of this.unsubCallbacks) {
      callback();
    }
    this.unsubCallbacks = [];

    const editorView = this.editorView;
    if (editorView) {
      editorView.destroy();
      this.editorView = null;
    }
  }
}
