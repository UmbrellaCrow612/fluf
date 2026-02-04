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
}
