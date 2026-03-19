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

  ngOnDestroy(): void {
    this.cleanUpState();
  }

  /**
   * Extension that listens to changes and runs logic
   */
  private updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      // Iterate through changes
      update.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
        console.warn(`Replaced ${fromA}-${toA} with "${inserted}"`);
      }, true);
    }
  });

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

      const container = this.editorPlaneTextPaneContainer()?.nativeElement;
      if (!container) {
        throw new Error('Could not find target container');
      }

      const normalizedPath = await this.electronApi.pathApi.normalize(
        node.path,
      );
      const fileContent = await this.electronApi.fsApi.readFile(normalizedPath);

      this.editorView = new EditorView({
        doc: fileContent,
        parent: container,
        extensions: [
          basicSetup,
          this.updateListener,
          editorPlainTextPaneExtension,
        ],
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
   * Cleans up the state between file changes or destroy
   */
  private cleanUpState() {
    const editorView = this.editorView;
    if (editorView) {
      // save history state
      editorView.destroy();
      this.editorView = null;
    }
  }
}
