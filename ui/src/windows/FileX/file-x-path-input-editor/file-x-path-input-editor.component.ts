import {
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FileXContextService } from '../file-x-context/file-x-context.service';
import { fileNode } from '../../../gen/type';

/**
 * Input that displays the current active directory and when editing it displays possible other directorys that it can be changed to
 */
@Component({
  selector: 'app-file-x-path-input-editor',
  imports: [],
  templateUrl: './file-x-path-input-editor.component.html',
  styleUrl: './file-x-path-input-editor.component.css',
})
export class FileXPathInputEditorComponent implements OnInit {
  private readonly fileXContextService = inject(FileXContextService);

  ngOnInit(): void {
    const input = this.pathEditorInput()?.nativeElement;
    if (!input) {
      throw new Error('Failed to locate input');
    }

    input.value = this.activeDirectory();

    setTimeout(() => {
      input.focus();
    }, 1);
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
   * Holds search state
   */
  isSearching = signal(false);

  /**
   * Holds error state
   */
  errorMessage = signal<string | null>(null);

  /**
   * Holds list of items fetched for the given active dir
   */
  items = signal<fileNode[]>([]);

  /**
   * Event is emitted from user blurs / un focus the input - means it should unrender this component
   */
  userFocusLostEvent = output()

  /**
   * On call trigger a search for other paths to directorys within the current active dir and display them
   */
  searchCurrentActiveDirectory() {
    if (this.isSearching()) {
      return;
    }

    this.search();
  }


  /**
   * Runs the actual search to get av folders
   */
  private async search() {
    try {
      this.isSearching.set(true);
      this.errorMessage.set(null);
    } catch (error) {
      console.error('Failed to searhc: ', error);
      this.errorMessage.set('Failed to search');
    } finally {
      this.isSearching.set(false);
    }
  }
}
