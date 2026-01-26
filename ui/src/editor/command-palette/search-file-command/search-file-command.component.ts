import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { getElectronApi } from '../../../utils';
import { ContextService } from '../../app-context/app-context.service';
import { fsearchResult } from '../../../gen/type';
import { OpenFileOrFolderInExplorer } from '../../file-explorer/helper';
import { InMemoryContextService } from '../../app-context/app-in-memory-context.service';

@Component({
  selector: 'app-search-file-command',
  imports: [],
  templateUrl: './search-file-command.component.html',
  styleUrl: './search-file-command.component.css',
})
export class SearchFileCommandComponent implements AfterViewInit {
  private readonly api = getElectronApi();
  private readonly contextService = inject(ContextService);
  private readonly inMemoryContextService = inject(InMemoryContextService);

  private readonly selectedDir = computed(() =>
    this.contextService.selectedDirectoryPath(),
  );

  /** Ref to the search input */
  input = viewChild<ElementRef<HTMLButtonElement>>('searchFileInput');

  isLoading = signal(false);
  error = signal<string | null>(null);
  results = signal<fsearchResult[]>([]);

  ngAfterViewInit(): void {
    this.input()?.nativeElement.focus();
  }

  timeOut: any = null;
  debounce() {
    if (this.timeOut) {
      clearTimeout(this.timeOut);
    }

    this.timeOut = setTimeout(() => {
      this.searchFiles();
    }, 300);
  }

  async searchFiles() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      let dir = this.selectedDir();
      if (!dir) {
        this.error.set('No directory selected');
        return;
      }

      let term = this.input()?.nativeElement.value.trim() ?? '';

      let res = await this.api.fsearchApi.search({
        directory: dir,
        term: term,
        hidden: true,
        partial: true,
        type: 'file',
      });

      this.results.set(res);
    } catch (error) {
      this.error.set('Failed ' + JSON.stringify(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  onInput(event: Event) {
    event.preventDefault();
    this.debounce();
  }

  async selectFile(file: fsearchResult) {
    await OpenFileOrFolderInExplorer(file.path, this.contextService);
    this.inMemoryContextService.showCommandPalette.set(false);
  }
}
