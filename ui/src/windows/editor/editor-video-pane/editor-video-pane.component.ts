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
import { EditorVideoService } from '../core/services/editor-video.service';
import { EditorStateService } from '../core/state/editor-state.service';
import { fileNode } from '../../../gen/type';
import { useEffect } from '../../../lib/useEffect';
import { getElectronApi } from '../../../utils';
import { LocalFileUrlService } from '../../../shared/services/local-file-url.service';

/**
 * Allows user to view video file formatts
 */
@Component({
  selector: 'app-editor-video-pane',
  imports: [],
  templateUrl: './editor-video-pane.component.html',
  styleUrl: './editor-video-pane.component.css',
})
export class EditorVideoPaneComponent implements OnDestroy {
  private readonly editorVideoService = inject(EditorVideoService);
  private readonly editorStateService = inject(EditorStateService);
  private readonly localFileUrlService = inject(LocalFileUrlService);
  private readonly electronApi = getElectronApi();

  /**
   * Reference to the video element
   */
  private readonly videoElement =
    viewChild<ElementRef<HTMLVideoElement>>('videoPlayer');

  /**
   * Keeps track of the current open file in the editor
   */
  public readonly activeNode: Signal<fileNode | null> = computed(() =>
    this.editorStateService.currentOpenFileInEditor(),
  );

  /**
   * Holds loading state
   */
  public readonly isLoading = signal(false);

  /**
   * Holds error state
   */
  public readonly error = signal<string | null>(null);

  /**
   * Holds the file source path to the video to show in the UI
   */
  public readonly videoSrc = signal('');

  constructor() {
    useEffect(
      async (_, fileNode) => {
        this.cleanUpState();

        if (!fileNode) {
          this.error.set(`No file selected`);
          return;
        }

        await this.showVideoPane(fileNode);
      },
      [this.activeNode],
    );
  }
  ngOnDestroy() {
    this.cleanUpState();
  }

  /**
   * Cleans up the state of the editor beofre and after close
   */
  private cleanUpState() {
    const video = this.videoElement()?.nativeElement;
    if (!video) {
      console.error('Could not find video element');
      return;
    }

    if (document.pictureInPictureElement === video) {
      document.exitPictureInPicture().catch((err) => {
        console.error('Failed to exit Picture-in-Picture:', err);
      });
    }

    // Pause and clear source to stop buffering
    video.pause();
    video.removeAttribute('src');
    video.load();
  }

  /**
   * Renders the video editor pane to view video files
   * @param node The file to show it for
   */
  private async showVideoPane(node: fileNode) {
    this.error.set(null);
    this.isLoading.set(true);

    try {
      if (!this.editorVideoService.isSupportedExtension(node.extension)) {
        throw new Error(
          `File type is not a supported video format valid formatts are ${JSON.stringify(this.editorVideoService.supportedVideoExtensions)}`,
        );
      }

      const norm = await this.electronApi.pathApi.normalize(node.path);
      const path = this.localFileUrlService.toUrl(norm);
      this.videoSrc.set(path);
    } catch (error: any) {
      console.error('Failed to show video pane ', error);
      this.error.set(`Failed to show video editor panel ${error?.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }
}
