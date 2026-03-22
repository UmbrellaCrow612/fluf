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

/**
 * Shows a editor for plain text documents
 */
@Component({
  selector: 'app-editor-plain-text-pane',
  imports: [],
  templateUrl: './editor-plain-text-pane.component.html',
  styleUrl: './editor-plain-text-pane.component.css',
})
export class EditorPlainTextPaneComponent implements OnDestroy {
  private readonly editorStateService = inject(EditorStateService);
  private readonly electronApi = getElectronApi();
  private readonly editorFileStateService = inject(EditorFileStateService);
  private readonly editorSessionStateService = inject(
    EditorSessionStateService,
  );

  /**
   * Keeps track of the current open file in the editor
   */
  private readonly activeNode: Signal<fileNode | null> = computed(() =>
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

  ngOnDestroy(): void {
    this.cleanUpState();
  }

  /**
   * Extension that listens to changes and runs logic
   */
  private updateListener = EditorView.updateListener.of(async (update) => {
    const normalizedPath = this.normalizedFilePath();
    if (normalizedPath && update.docChanged) {
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

    this.editorSessionStateService.setChace(currentPath, {
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
      this.normalizedFilePath.set(normalizedPath);

      const cachedView = this.editorSessionStateService.restoreChace(
        normalizedPath,
        container,
        this.createExtensions,
      );
      if (cachedView) {
        this.editorView = cachedView;
        this.isLoading.set(false);
        this.editorView.focus();
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
