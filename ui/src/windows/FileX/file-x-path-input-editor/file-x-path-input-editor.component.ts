import {
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FileXContextService } from '../file-x-context/file-x-context.service';
import { getElectronApi } from '../../../utils';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FileXTab } from '../types';
import { ChangeActiveDirectory } from '../utils';

/**
 * Input that displays the current active directory and when editing it displays possible other directorys that it can be changed to
 */
@Component({
  selector: 'app-file-x-path-input-editor',
  imports: [MatAutocompleteModule],
  templateUrl: './file-x-path-input-editor.component.html',
  styleUrl: './file-x-path-input-editor.component.css',
})
export class FileXPathInputEditorComponent implements OnInit, OnDestroy {
  private readonly fileXContextService = inject(FileXContextService);
  private readonly api = getElectronApi();

  ngOnInit(): void {
    const input = this.pathEditorInput()?.nativeElement;
    if (!input) {
      throw new Error('Failed to locate input');
    }

    setTimeout(() => {
      input.value = this.activeDirectory();
      input.focus();
    }, 1);
  }

  ngOnDestroy(): void {
    this.stopSearchTimeout();
  }

  /**
   * Ref to the HTML input
   */
  private pathEditorInput =
    viewChild<ElementRef<HTMLInputElement>>('pathEditorInput');

  /**
   * Tracks the current active directory
   */
  activeDirectory = computed(() => this.fileXContextService.activeDirectory());

  /**
   * Holds error state
   */
  errorMessage = signal<string | null>(null);

  /**
   * Holds list of items fetched for the given active dir - which are paths to directorys match the search term
   */
  items = signal<string[]>([]);

  /**
   * Event is emitted from user blurs / un focus the input - means it should unrender this component
   */
  userFocusLostEvent = output();

  /**
   * Holds loading items state
   */
  isLoading = signal<boolean>(false);

  /**
   * Holds timeout to run the search logic
   */
  private searchTimeout: NodeJS.Timeout | null = null;

  /** Clears the timout made for search */
  private stopSearchTimeout() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }
  }

  /** Creates a new timeout */
  private startSearchTimeout() {
    if (this.searchTimeout) return;

    this.searchTimeout = setTimeout(() => {
      this.search();
    }, 500);
  }

  /**
   * On call trigger a search for other paths to directorys within the current active dir and display them
   */
  searchCurrentActiveDirectory() {
    this.stopSearchTimeout();
    this.startSearchTimeout();
  }

  /**
   * Runs the actual search to get av folders
   */
  private async search() {
    try {
      console.log('Searching for directory item for: ', this.activeDirectory());
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const searchTerm = this.pathEditorInput()?.nativeElement.value;
      if (!searchTerm) {
        this.errorMessage.set('Input not found');
        return;
      }

      const dirItems = await this.api.fsApi.fuzzyFindDirectorys(searchTerm);

      this.items.set(dirItems);
    } catch (error) {
      console.error('Failed to searhc: ', error);
      this.errorMessage.set('Failed to search');
    } finally {
      this.isLoading.set(false);
      this.stopSearchTimeout();
    }
  }

  /**
   * Changes the active directory for the given tab thats active and jhaving it's path edityed via the input changed to the new value selected
   */
  async changeActiveDirectory() {
    const newDir = this.pathEditorInput()?.nativeElement.value;
    if (!newDir) {
      this.errorMessage.set('Failed to set new active directory');
      return;
    }

    ChangeActiveDirectory(newDir, this.fileXContextService);

    this.userFocusLostEvent.emit();
  }
}
