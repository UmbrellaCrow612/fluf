import { Compartment, Extension } from "@codemirror/state";
import { history, historyField } from "@codemirror/commands";
import {
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
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
import { EditorDocumentStateService } from "../core/lsp/editor-document-state.service";
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
import {
  Location as vsCodeLocation,
  Position as vscodePosition,
  Diagnostic as vscodeDiagnostic,
} from "vscode-languageserver-protocol";
import { Tooltip, ViewUpdate, hoverTooltip } from "@codemirror/view";
import { viewUpdateToLSPChanges } from "../core/lsp/change";
import { marked } from "marked";
import { autocompletion, CompletionSource } from "@codemirror/autocomplete";
import { lspCompletionListToCodeMirror } from "../core/lsp/completion";
import { EditorDocumentOpenerService } from "../core/services/editor-document-opener.service";
import { createGoToDefinitionHoverStyles } from "./extensions/hover";
import {
  goToDefinitionInEditor,
  scrollToVSCodeLocation,
} from "../core/lsp/definition";
import { EditorLanguageServerProtocolLifecycleTracker } from "../core/lsp/editor-language-server-protocol-lifecycle-tracker";
import { EditorPendingChangesQueueService } from "../core/lsp/editor-pending-changes-queue.service";
import { EditorDocumentDiagnosticService } from "../core/lsp/editor-document-diagnostic.service";
import { EditorDocumentLanguageIdService } from "../core/lsp/editor-document-language-id.service";
import { EditorDocumentOpenTrackerService } from "../core/lsp/editor-document-open-tracker.service";
import { vscodeToCodeMirrorDiagnostic } from "../core/lsp/diagnostic";
import { EditorWorkspaceService } from "../core/workspace/editor-workspace.service";

/**
 * Shows a editor for plain text documents such as txt or code files such as .js ts etc basically any document with text
 */
@Component({
  selector: "app-editor-plain-text-pane",
  imports: [EditorPathBreadcrumbBarComponent],
  templateUrl: "./editor-plain-text-pane.component.html",
  styleUrl: "./editor-plain-text-pane.component.css",
})
export class EditorPlainTextPaneComponent implements OnDestroy, OnInit {
  private readonly editorStateService = inject(EditorStateService);
  private readonly editorInMemoryStateService = inject(
    EditorInMemoryStateService,
  );
  private readonly electronApi = getElectronApi();
  private readonly editorDocumentStateService = inject(
    EditorDocumentStateService,
  );
  private readonly editorSessionStateService = inject(
    EditorSessionStateService,
  );
  private readonly editorLanguageServerProtocolService = inject(
    EditorLanguageServerProtocolService,
  );
  private readonly editorDocumentVersionService = inject(
    EditorDocumentVersionService,
  );
  private readonly editorDocumentOpenerService = inject(
    EditorDocumentOpenerService,
  );
  private readonly editorLanguageServerProtocolLifecycleTracker = inject(
    EditorLanguageServerProtocolLifecycleTracker,
  );
  private readonly editorPendingChangesQueueService = inject(
    EditorPendingChangesQueueService,
  );
  private readonly editorDocumentDiagnosticService = inject(
    EditorDocumentDiagnosticService,
  );
  private readonly editorDocumentLanguageIdService = inject(
    EditorDocumentLanguageIdService,
  );
  private readonly editorDocumentOpenTrackerService = inject(
    EditorDocumentOpenTrackerService,
  );
  private readonly editorWorkspaceService = inject(EditorWorkspaceService);

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
  private readonly selectedDirectory = this.editorWorkspaceService.workspace;

  /**
   * Holds if the user has control pressed
   */
  private readonly isControlPressed = signal(false);

  /**
   * Linter compartment
   */
  private readonly linterCompartment = new Compartment();

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

    useEffect(
      (_, location) => {
        const view = this.editorView;
        if (location && view) {
          scrollToVSCodeLocation(view, location);
        }
      },
      [this.editorStateService.scrollToDefinitionLocation],
    );

    useEffect(() => {
      const view = this.editorView;
      if (!view) {
        return;
      }

      const filePath = this.normalizedFilePath();
      if (!filePath) {
        return;
      }

      this.hydrateDiagnostics(filePath, view);
    }, [this.editorDocumentDiagnosticService.valueChanged]);
  }

  /**
   * Hydrate the diagnostics to the UI
   * @param filePath - the current document
   * @param view The UI
   */
  private hydrateDiagnostics = (filePath: string, view: EditorView) => {
    const codeMirrorDiags: CmDiagnostic[] = [];
    const storedDiags =
      this.editorDocumentDiagnosticService.getDiagnostics(filePath);

    view.dispatch({
      // reset
      effects: this.linterCompartment.reconfigure(
        this.buildLinterExtension([]),
      ),
    });

    for (const vscodeDiag of storedDiags) {
      const mappedDiag = vscodeToCodeMirrorDiagnostic(vscodeDiag, view.state);
      if (mappedDiag) {
        codeMirrorDiags.push(mappedDiag);
      } else {
        console.error("Failed to map vscode diagnostic to editor diagnostic");
      }
    }

    view.dispatch({
      effects: this.linterCompartment.reconfigure(
        this.buildLinterExtension(codeMirrorDiags),
      ),
    });

    console.log("Rendering code mirror diags in UI");
  };

  private onControlPressed = (event: KeyboardEvent) => {
    if (event.key !== "Control") {
      return;
    }

    this.isControlPressed.set(true);
  };

  private onControlPressReleased = (event: KeyboardEvent) => {
    if (event.key === "Control") {
      this.isControlPressed.set(false);
    }
  };

  private createControlListerners = () => {
    document.addEventListener("keydown", this.onControlPressed);
    document.addEventListener("keyup", this.onControlPressReleased);
  };

  private disposeControlListerners = () => {
    document.removeEventListener("keydown", this.onControlPressed);
    document.removeEventListener("keyup", this.onControlPressReleased);
  };

  ngOnInit(): void {
    this.createControlListerners();
  }

  ngOnDestroy(): void {
    this.cleanUpState();
    this.disposeControlListerners();
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

      this.editorDocumentStateService.trackChange(
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
        await this.editorDocumentStateService.save(normalizedPath);
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
        this.hydrateDiagnostics(normalizedPath, this.editorView);

        void this.initLanguageServer(
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

      const draft = this.editorDocumentStateService.getDraft(normalizedPath);
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
      this.hydrateDiagnostics(normalizedPath, this.editorView);

      void this.initLanguageServer(node, docString, this.editorView);
    } catch (error: any) {
      console.error("Failed to load file ", error);
      this.error.set(`Failed to load file ${error?.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Creates a extension that handles go to definition
   * @returns Extension that handles hover go to definition
   */
  private readonly goToDefinitionExtension = (): Extension => {
    return EditorView.domEventHandlers({
      click: (pointerEvent, view) => {
        const languageId = this.languageId();
        if (!languageId) {
          return;
        }

        const isReady =
          this.editorLanguageServerProtocolLifecycleTracker.isReady(languageId);
        if (!isReady) {
          console.warn("LSP not reayd cannot go to definition");
          return;
        }

        const workspaceFolder = this.selectedDirectory();
        if (!workspaceFolder) {
          throw new Error("Workspace folder is undefined");
        }

        const filePath = this.normalizedFilePath();
        if (!filePath) {
          throw new Error("Current file path is null");
        }

        if (!pointerEvent.ctrlKey) {
          return;
        }

        const cursorPos = view.state.selection.main.head;

        // Get line and column info
        const line = view.state.doc.lineAt(cursorPos);

        const position: vscodePosition = {
          line: line.number - 1, // CodeMirror is 1-based, LSP expects 0-based
          character: cursorPos - line.from, // column offset from start of line
        };

        const click = async () => {
          try {
            const result =
              await this.editorLanguageServerProtocolService.definition(
                workspaceFolder,
                languageId,
                filePath,
                position,
              );

            if (!result) {
              return null;
            }

            await goToDefinitionInEditor(
              result,
              this.editorDocumentOpenerService,
              this.editorStateService,
            );

            return null;
          } catch (error: any) {
            console.error("Failed to get go to definition ", error.message);
            return null;
          }
        };

        click();
      },
    });
  };

  /**
   * Creates the hover tooltip extension to get hover information
   * @returns Extension that allows tooltip hover information
   */
  private readonly hoverTooltipExtension = (): Extension => {
    return hoverTooltip((view, pos, side) => {
      try {
        const languageId = this.languageId();
        if (!languageId) {
          return null;
        }

        const workspaceFolder = this.selectedDirectory();
        if (!workspaceFolder) {
          throw new Error("Workspace folder is undefined");
        }

        const filePath = this.normalizedFilePath();
        if (!filePath) {
          throw new Error("Current file path is null");
        }

        const { from, to, text, number } = view.state.doc.lineAt(pos);
        let start = pos,
          end = pos;
        while (start > from && /\w/.test(text[start - from - 1])) start--;
        while (end < to && /\w/.test(text[end - from])) end++;
        if ((start == pos && side < 0) || (end == pos && side > 0)) return null;

        const isReady =
          this.editorLanguageServerProtocolLifecycleTracker.isReady(languageId);
        if (!isReady) {
          return {
            pos: start,
            end,
            above: true,
            create(view) {
              let dom = document.createElement("div");
              dom.textContent = "Loading LSP not ready yet";
              return { dom };
            },
          };
        }

        const position: vscodePosition = {
          line: number - 1, // CodeMirror is 1-based, LSP expects 0-based
          character: pos - from, // offset from the start of the line
        };

        /**
         * Used to return a promise that resolves to a toltip, we do this as the callback passed to `hoverTooltip` cannot be async itself, but we can return a promise
         * that resolve to a tooltip
         * @returns Promise that resolve to a tooltip or not
         */
        const tooltTipPromise = async (): Promise<Tooltip | null> => {
          const result = await this.editorLanguageServerProtocolService.hover(
            workspaceFolder,
            languageId,
            filePath,
            position,
          );

          if (!result) {
            console.warn("Could not get hover information");
            return null;
          }

          return {
            pos: start,
            end,
            above: true,
            create(view) {
              const dom = document.createElement("div");
              const contents = result.contents as any;

              if (contents.king === "markdown") {
                dom.innerHTML = marked.parse(contents.value, {
                  async: false,
                }) as string;
              } else {
                dom.textContent = contents.value;
              }

              return { dom };
            },
          };
        };

        return tooltTipPromise();
      } catch (error) {
        console.error("Could not get hover information ", error);
        return null;
      }
    });
  };

  /**
   * Fire and forget - Initlizes language server logic
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
    this.editorDocumentLanguageIdService.setLanguageId(node.path, languageId);

    const workspaceFolder = this.selectedDirectory();
    if (!workspaceFolder) {
      return;
    }

    try {
      void this.editorLanguageServerProtocolService.start(
        // fire and forget dont wait
        workspaceFolder,
        languageId,
      );
    } catch (error) {
      console.error("Failed to start LSP ", error);
      return;
    }

    let lspAlreadyRunning = false;
    try {
      lspAlreadyRunning =
        await this.editorLanguageServerProtocolService.isRunning(
          workspaceFolder,
          languageId,
        );
    } catch (error) {
      console.error("Failed to check if LSP is running ", error);
    }

    if (lspAlreadyRunning) {
      this.editorLanguageServerProtocolLifecycleTracker.markReady(languageId);
      this.sendOpenTextDocument(workspaceFolder, languageId, node, docString);
      this.editorPendingChangesQueueService.runChangeCallbacks(languageId);
    } else {
      this.unsubCallbacks.push(
        this.editorLanguageServerProtocolService.onReady(() => {
          console.log("On ready ran");
          this.editorLanguageServerProtocolLifecycleTracker.markReady(
            languageId,
          );
          this.sendOpenTextDocument(
            workspaceFolder,
            languageId,
            node,
            docString,
          );
          this.editorPendingChangesQueueService.runChangeCallbacks(languageId);
        }),
      );
    }
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

      const isReady =
        this.editorLanguageServerProtocolLifecycleTracker.isReady(languageId);
      if (!isReady) {
        this.editorPendingChangesQueueService.addChangeCallback(
          languageId,
          () => {
            this.editorLanguageServerProtocolService.didChangeTextDocument(
              workspaceFolder,
              languageId,
              filePath,
              version,
              changes,
            );
          },
        );
        return;
      }

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

      const isAlreadyOpen =
        this.editorDocumentOpenTrackerService.isOpend(filePath);
      if (isAlreadyOpen) {
        return;
      }

      this.editorLanguageServerProtocolService.didOpenTextDocument(
        workspaceFolder,
        languageId,
        filePath,
        version,
        docString,
      );
      this.editorDocumentOpenTrackerService.opened(filePath);

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
      this.linterCompartment.of(this.buildLinterExtension()),
      lintGutter(),
      this.hoverTooltipExtension(),
      this.autoCompleteExtension(),
      this.goToDefinitionExtension(),
      createGoToDefinitionHoverStyles(this.isControlPressed),
    ];
  };

  /**
   * Builds linter extension
   * @param diags The diagnostics
   * @returns Extension
   */
  private readonly buildLinterExtension = (
    diags: CmDiagnostic[] = [],
  ): Extension => {
    return linter(() => diags);
  };

  /**
   * Create a auto complete extension
   * @returns Extension that enables auto complete
   */
  private readonly autoCompleteExtension = (): Extension => {
    return autocompletion({
      override: [this.autoCompleteOverrideSource],
      activateOnTyping: true,
    });
  };

  /**
   * Runs the actual logic to get completions based on the current context
   * @param ctx The editor context
   * @returns Completion list of items to show in the UI
   */
  private readonly autoCompleteOverrideSource: CompletionSource = async (
    ctx,
  ) => {
    try {
      const languageId = this.languageId();
      if (!languageId) {
        return null; // no lsp
      }

      const workspaceFolder = this.selectedDirectory();
      if (!workspaceFolder) {
        console.error("Could not workspace folder");
        return null;
      }

      const filePath = this.normalizedFilePath();
      if (!filePath) {
        console.error("Could not find files path");
        return null;
      }

      const isReady =
        this.editorLanguageServerProtocolLifecycleTracker.isReady(languageId);
      if (!isReady) {
        console.warn("LSP not ready for auto completes");
        return null;
      }

      const line = ctx.state.doc.lineAt(ctx.pos);

      const position: vscodePosition = {
        line: line.number - 1, // CodeMirror lines are 1-based, LSP is 0-based
        character: ctx.pos - line.from, // offset from start of line
      };

      const result = await this.editorLanguageServerProtocolService.completion(
        workspaceFolder,
        languageId,
        filePath,
        position,
      );
      if (!result) {
        return null;
      }

      console.log(result);

      const word = ctx.matchBefore(/\w*/);
      return lspCompletionListToCodeMirror(result, word?.from ?? ctx.pos);
    } catch (error) {
      console.log("Could not get completions ", error);
      return null;
    }
  };

  /**
   * Cleans up the state between file changes or destroy
   * Saves current state to cache before cleanup
   */
  private cleanUpState(): void {
    this.saveCurrentState();

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
