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
import { FileXDirectoryViewChild } from '../types';
import { FileXToolBarDirectoryPathViewerChildComponent } from '../file-x-tool-bar-directory-path-viewer-child/file-x-tool-bar-directory-path-viewer-child.component';

/**
 * Displays the current active directory as a clickable input and enter new path or see how nested you've gone
 */
@Component({
  selector: 'app-file-x-tool-bar-directory-path-viewer',
  imports: [FileXToolBarDirectoryPathViewerChildComponent],
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
   * Tracks the active directory then splits it into children
   */
  children: Signal<FileXDirectoryViewChild[]> = computed(() => {
    let baseDir = this.fileXContext.activeDirectory();
    let parts = this.extractPathToParts(baseDir);

    return parts;
  });

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

  /**
   * Convert the base path into each sub child directory
   * @param path The base path
   * @returns List of sub children route directory children
   */
  extractPathToParts = (path: string): FileXDirectoryViewChild[] => {
    if (!path || path.trim() === '') {
      return [];
    }

    // Normalize path separators to forward slashes
    const normalizedPath = path.replace(/\\/g, '/');

    // Split the path by forward slashes and filter out empty strings
    const parts = normalizedPath.split('/').filter((part) => part !== '');

    if (parts.length === 0) {
      return [];
    }

    const children: FileXDirectoryViewChild[] = [];
    let accumulatedPath = '';

    // Handle root directory for Windows (e.g., 'C:') or Unix ('/')
    const startsWithRoot = normalizedPath.startsWith('/');
    const windowsDrive = parts[0]?.includes(':');

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (i === 0) {
        // First part handling
        if (windowsDrive) {
          // Windows path: C:
          accumulatedPath = part;
        } else if (startsWithRoot) {
          // Unix absolute path: /
          accumulatedPath = `/${part}`;
        } else {
          // Relative path
          accumulatedPath = part;
        }
      } else {
        // Subsequent parts
        accumulatedPath += `/${part}`;
      }

      children.push({
        name: part,
        path: accumulatedPath,
      });
    }

    return children;
  };
}
