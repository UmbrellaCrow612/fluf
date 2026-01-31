import {
  Component,
  computed,
  ElementRef,
  inject,
  Signal,
  signal,
  viewChild,
} from '@angular/core';
import { FileXContextService } from '../file-x-context/file-x-context.service';

/**
 * Displays the current active directory as a clickable input and enter new path or see how nested you've gone
 */
@Component({
  selector: 'app-file-x-tool-bar-directory-path-viewer',
  imports: [],
  templateUrl: './file-x-tool-bar-directory-path-viewer.component.html',
  styleUrl: './file-x-tool-bar-directory-path-viewer.component.css',
})
export class FileXToolBarDirectoryPathViewerComponent {
  private readonly fileXContext = inject(FileXContextService);

  /**
   * Tracks the current actiev directory
   */
  activeDirectory: Signal<string> = computed(() =>
    this.fileXContext.activeDirectory(),
  );

  /** Indicates it it should show the input to edit the directory path */
  showDirectoryPathEditor = signal(false);

  /** Points to the input that allows users to edit the directory path */
  directoryPathEditorInput = viewChild<ElementRef<HTMLInputElement>>('input');

  /**
   * Runs when the direcvtory shown is clicked - display the input to change it's content - or hides it
   */
  switchEditor() {
    this.showDirectoryPathEditor.update((x) => !x);

    setTimeout(() => {
      let input = this.directoryPathEditorInput()?.nativeElement;
      if (input) {
        input.value = this.activeDirectory();
        input.focus();
      }
    }, 10); // delay for angular to render it
  }
}
