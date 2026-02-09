import { FileXInMemoryContextService } from './../file-x-context/file-x-in-memory-context.service';
import { Component, effect, inject, OnDestroy, signal } from '@angular/core';
import { FileXContextService } from '../file-x-context/file-x-context.service';
import { fileNode, voidCallback } from '../../../gen/type';
import { getElectronApi } from '../../../utils';
import { FileXDirectoryContentItemComponent } from './file-x-directory-content-item/file-x-directory-content-item.component';

/**
 * Display the directorys content according to the view pattern - ushc as grid based or other formats
 */
@Component({
  selector: 'app-file-x-directory-content',
  imports: [FileXDirectoryContentItemComponent],
  templateUrl: './file-x-directory-content.component.html',
  styleUrl: './file-x-directory-content.component.css',
})
export class FileXDirectoryContentComponent implements OnDestroy {
  private readonly fileXContextService = inject(FileXContextService);
  private readonly fileXInMemoryContextService = inject(
    FileXInMemoryContextService,
  );
  private readonly api = getElectronApi();

  constructor() {
    effect(async () => {
      console.log('FileXDirectoryContentComponent effect ran');

      this.unsubs.forEach((cb) => cb()); // Unsub previous callbacks
      this.unsubs = [] // Clear previous ones

      // whenever the active dir changes re render items
      let activeDirectory = this.fileXContextService.activeDirectory();
      await this.displayDirectoryContent(activeDirectory);

      this.unsubs.push(
        this.api.fsApi.onChange(activeDirectory, () => {
          console.log("directory changed")
          this.displayDirectoryContent(activeDirectory); // keep the UI up to date with directory changes
        }),
      );

      this.unsubs.push(() => {
        this.api.fsApi.stopWatching(activeDirectory)
      })
    });
  }

  ngOnDestroy(): void {
    this.unsubs.forEach((cb) => cb());
  }

  /**
   * List of unsub callbacks to run
   */
  private unsubs: voidCallback[] = [];

  /** Holds loading state */
  isLoading = signal(false);

  /** Holds error state  */
  errorMessage = signal<string | null>(null);

  /** Holds the list of children read from the directory */
  directoryFileNodes = signal<fileNode[]>([]);

  /**
   * Trys to read the active directory and display it's content by reading it
   * @param path The dir path of who's content we want to render
   */
  async displayDirectoryContent(path: string) {
    try {
      this.fileXInMemoryContextService.selectedItems.set([]); // reset selected items
      this.isLoading.set(true);
      this.errorMessage.set(null);

      let items = await this.api.fsApi.readDir(path);
      this.directoryFileNodes.set(items);
    } catch (error) {
      console.error(error);
      this.errorMessage.set('Failed to load directory');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Runs when the backdrop of the container is clicked i.e
   * not a item, doing so will unselect all current selected items etc
   */
  backDropClicked() {
    console.log('backdrop clicked');
    this.fileXInMemoryContextService.selectedItems.set([]);
  }
}
