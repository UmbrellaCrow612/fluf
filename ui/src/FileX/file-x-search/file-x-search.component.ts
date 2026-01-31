import {
  Component,
  ElementRef,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { KeyMaster } from 'umbr-key-master';

@Component({
  selector: 'app-file-x-search',
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './file-x-search.component.html',
  styleUrl: './file-x-search.component.css',
})
export class FileXSearchComponent {
  /** Ref to the search input element Z */
  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  /** Indicates if the user has clicked search and the input should be visible */
  isSearchInputActive = signal(false);

  /** Some logic logic to bind to key board events */
  keyMaster = new KeyMaster();

  /** If the user has focus in the search input and they press escape we want to unrender the search input as they no longer want it */
  onSearchInputEscpae = () => {
    console.log('ran escpae search input');
    let input = this.searchInput()?.nativeElement;
    if (!input) {
      // not in search mode
      return;
    }

    if (document.activeElement === input) {
      this.hideSearchInput();
    }
  };

  /** Displays the search input */
  activeSearchInput = () => {
    this.isSearchInputActive.set(true);

    // we only want to bind key event when the search input is active
    this.keyMaster.add(['Escape'], this.onSearchInputEscpae);

    setTimeout(() => {
      let input = this.searchInput()?.nativeElement;
      if (!input) {
        console.error(
          'focus logic failed for search input as it is not yet rendered',
        );
        return;
      }

      input.focus();
    }, 10); // slight delay for angular to render the input
  };

  /** hides the search input if displayed */
  hideSearchInput = () => {
    this.isSearchInputActive.set(false);
    this.keyMaster.remove(this.onSearchInputEscpae);
  };
}
