import { Extension } from '@codemirror/state';
import { history, historyField } from '@codemirror/commands';
import {
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  Signal,
  viewChild,
} from '@angular/core';
import { getElectronApi } from '../../../shared/electron';
import { fileNode } from '../../../gen/type';
import { EditorStateService } from '../core/state/editor-state.service';
import { basicSetup, EditorView } from 'codemirror';
import { useEffect } from '../../../lib/useEffect';
import { editorPlainTextPaneExtension } from './extensions/theme';
import { EditorFileStateService } from '../core/services/editor-file-state.service';
import { EditorSessionStateService } from '../core/services/editor-session-state.service';
import { EditorPathBreadcrumbBarComponent } from '../editor-path-breadcrumb-bar/editor-path-breadcrumb-bar.component';
import { EditorInMemoryStateService } from '../core/state/editor-in-memory-state.service';

/**
 * Shows a editor for plain text documents
 */
@Component({
  selector: 'app-editor-plain-text-pane',
  imports: [EditorPathBreadcrumbBarComponent],
  templateUrl: './editor-plain-text-pane.component.html',
  styleUrl: './editor-plain-text-pane.component.css',
})
export class EditorPlainTextPaneComponent {
  private readonly editorStateService = inject(EditorStateService);
  private readonly editorInMemoryStateService = inject(
    EditorInMemoryStateService,
  );
  private readonly electronApi = getElectronApi();
  private readonly editorFileStateService = inject(EditorFileStateService);
  private readonly editorSessionStateService = inject(
    EditorSessionStateService,
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
  >('editorPlainTextPane');

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

  constructor() {
    useEffect(
      async (_, fileNode) => {
        this.cleanUpState();

        if (!fileNode) {
          this.error.set('No open file');
          return;
        }

        await this.displayPlainTextEditor(fileNode);
      },
      [this.activeNode],
    );
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
    const normalizedPath = this.normalizedFilePath();
    if (normalizedPath && update.docChanged) {
      this.hydrateCursorPosition(update.view);

      this.editorFileStateService.trackChange(
        normalizedPath,
        update.state.doc.toString(),
      );

      if (this.autoSaveOn()) {
        await this.editorFileStateService.save(normalizedPath);
      }
    }
  });

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

    if (!currentPath || !view || currentPath.trim() === '') return;

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
    const extension = node.extension.trim();
    if (node.isDirectory || (extension !== '' && extension !== '.txt')) {
      this.error.set('File is not a text file or has a extension');
      return;
    }

    try {
      this.isLoading.set(true);
      this.error.set(null);
      this.normalizedFilePath.set(null);

      const container = this.editorPlaneTextPaneContainer()?.nativeElement;
      if (!container) {
        throw new Error('Could not find target container');
      }

      const normalizedPath = await this.electronApi.pathApi.normalize(
        node.path,
      );
      const filePathExists =
        await this.electronApi.fsApi.exists(normalizedPath);
      if (!filePathExists) {
        throw new Error('File path does not exit');
      }
      this.normalizedFilePath.set(normalizedPath);

      const cachedView = this.editorSessionStateService.restoreCache(
        normalizedPath,
        container,
        this.createExtensions,
      );
      if (cachedView) {
        this.editorView = cachedView;
        this.editorView.focus();

        this.hydrateCursorPosition(cachedView);
        return;
      }

      /**
       * Holds the content we show in the pane editor
       */
      let docString: string = '';

      const draft = this.editorFileStateService.getDraft(normalizedPath);
      if (draft) {
        docString = draft;
      } else {
        docString = await this.electronApi.fsApi.readFile(normalizedPath);
      }

      this.editorView = new EditorView({
        doc: docString,
        parent: container,
        extensions: this.createExtensions(),
      });

      this.editorView.focus();
      this.hydrateCursorPosition(this.editorView);
    } catch (error: any) {
      console.error('Failed to load file ', error);
      this.error.set(`Failed to load file ${error?.message}`);
    } finally {
      this.isLoading.set(false);
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
      editorPlainTextPaneExtension,
      history(),
    ];
  };

  /**
   * Cleans up the state between file changes or destroy
   * Saves current state to cache before cleanup
   */
  private cleanUpState(): void {
    this.saveCurrentState();

    const editorView = this.editorView;
    if (editorView) {
      editorView.destroy();
      this.editorView = null;
    }
  }
}
