import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
} from '@angular/core';
import { ContextService } from '../app-context/app-context.service';
import { hasImageExtension } from './utils';
import { InMemoryContextService } from '../app-context/app-in-memory-context.service';
import { ImageService } from './image.service';

@Component({
  selector: 'app-image-editor',
  imports: [],
  templateUrl: './image-editor.component.html',
  styleUrl: './image-editor.component.css',
})
export class ImageEditorComponent implements OnInit {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly inMemoryContextService = inject(InMemoryContextService);
  private readonly imageService = inject(ImageService);

  currentActiveFileNode = computed(() =>
    this.appContext.currentOpenFileInEditor()
  );
  imgSrc: string | null = null;
  isLoading = false;
  error: string | null = null;
  private currentObjectUrl: string | null = null;

  constructor() {
    effect(async () => {
      this.currentActiveFileNode();
      await this.render();
    });
  }

  ngOnInit() {
    this.destroyRef.onDestroy(() => {
      if (this.currentObjectUrl) {
        URL.revokeObjectURL(this.currentObjectUrl);
        this.currentObjectUrl = null;
      }
    });
  }

  /**
   * Loads and displays the current image file
   */
  private async render() {
    this.isLoading = true;
    this.error = null;

    try {
      const node = this.currentActiveFileNode();
      if (!node) {
        this.error = 'No file selected';
        return;
      }

      const isImage = hasImageExtension(node.path);
      if (!isImage) {
        this.error = 'Not an image file';
        return;
      }

      if (this.currentObjectUrl) {
        URL.revokeObjectURL(this.currentObjectUrl);
        this.currentObjectUrl = null;
      }

      let response = await this.imageService.getLocalImg(node.path);

      if (!response.ok) {
        this.error = `Failed HTTP ${response.status}`;
        return;
      }

      let blob = await response.blob();

      this.currentObjectUrl = URL.createObjectURL(blob);

      this.imgSrc = this.currentObjectUrl;
    } catch (err: any) {
      this.error = err?.message || 'Unknown error';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Runs when the user right-clicks the img tag
   */
  onRightClick(event: MouseEvent) {
    event.preventDefault();

    this.inMemoryContextService.currentActiveContextMenu.set({
      data: this.currentActiveFileNode(),
      key: 'image-editor-img-context-menu',
      pos: {
        mouseX: event.clientX,
        mouseY: event.clientY,
      },
    });
  }
}
