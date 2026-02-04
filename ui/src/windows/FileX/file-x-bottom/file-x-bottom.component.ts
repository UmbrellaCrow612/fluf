import {
  Component,
  computed,
  effect,
  inject,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { FileXContextService } from '../file-x-context/file-x-context.service';
import { FileXInMemoryContextService } from '../file-x-context/file-x-in-memory-context.service';
import { getElectronApi } from '../../../utils';

@Component({
  selector: 'app-file-x-bottom',
  imports: [],
  templateUrl: './file-x-bottom.component.html',
  styleUrl: './file-x-bottom.component.css',
})
export class FileXBottomComponent {
  private readonly fileXContextService = inject(FileXContextService);
  private readonly fileXInMemoryContextService = inject(
    FileXInMemoryContextService,
  );
  private readonly api = getElectronApi();

  constructor() {
    effect(async () => {
      console.log('FileXBottomComponent effect ran');
      // whenever active dir changes re computed
      let activeDirectory = this.fileXContextService.activeDirectory();
      let count = await this.api.fsApi.countItemsInDirectory(activeDirectory);
      this.currentItemCountOfDirectory.set(count);
    });
  }

  /**
   * Holds the number of items the current directory has to display in the UI
   */
  currentItemCountOfDirectory: WritableSignal<number> = signal(0);

  /**
   * Holds the number of items selected
   */
  selectedItemsCount: Signal<number> = computed(
    () => this.fileXInMemoryContextService.selectedItems().length,
  );

  /**
   * Keeps track of the total size of items put together
   */
  totalSizeOfSelectedItems: Signal<string> = computed(() => {
    let items = this.fileXInMemoryContextService.selectedItems();
    let totalSize = 0;
    items.forEach((x) => {
      totalSize += x.size;
    });

    return this.formatFileSize(totalSize);
  });

  formatFileSize(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
