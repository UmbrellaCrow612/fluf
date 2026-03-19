import { Component, computed, inject, signal, Signal } from '@angular/core';
import { EditorAudioService } from '../core/services/editor-audio.service';
import { EditorStateService } from '../core/state/editor-state.service';
import { useEffect } from '../../../lib/useEffect';
import { fileNode } from '../../../gen/type';
import { getElectronApi } from '../../../utils';
import { LocalFileUrlService } from '../core/services/editor-local-file-url.service';

/**
 * Allows users to view audio files
 */
@Component({
  selector: 'app-editor-audio-pane',
  imports: [],
  templateUrl: './editor-audio-pane.component.html',
  styleUrl: './editor-audio-pane.component.css',
})
export class EditorAudioPaneComponent {
  private readonly editorAudioService = inject(EditorAudioService);
  private readonly editorStateService = inject(EditorStateService);
  private readonly localFileUrlService = inject(LocalFileUrlService);
  private readonly electronApi = getElectronApi();

  /**
   * Holds loading state
   */
  public readonly isLoading = signal(false);

  /**
   * Holds error state
   */
  public readonly error = signal<string | null>(null);
  /**
   * Current open file in the editor
   */
  public readonly activeNode: Signal<fileNode | null> = computed(() =>
    this.editorStateService.currentOpenFileInEditor(),
  );

  /**
   * Holds refrence to the audio source
   */
  public readonly audioSrc = signal('');

  constructor() {
    useEffect(
      async (_, fileNode) => {
        if (!fileNode) {
          this.error.set(`Could not load file`);
          return;
        }

        await this.showAudioPane(fileNode);
      },
      [this.activeNode],
    );
  }

  /**
   * Show the audio panel
   * @param node The file to show
   */
  private async showAudioPane(node: fileNode) {
    this.error.set(null);
    this.isLoading.set(true);

    try {
      if (!this.editorAudioService.isSupportedExtension(node.extension)) {
        throw new Error(
          `File is not s supported audo file type supported audio types are ${JSON.stringify(this.editorAudioService.supportedAudioExtensions)}`,
        );
      }

      const norm = await this.electronApi.pathApi.normalize(node.path);
      const src = this.localFileUrlService.toUrl(norm);
      this.audioSrc.set(src);
    } catch (error: any) {
      console.error('Failed to load audio file ', error);
      this.error.set(`Failed to show audio file ${error?.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }
}
