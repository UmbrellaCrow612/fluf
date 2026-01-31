import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

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

  /** Displays the search input */
  activeSearchInput = () => {
    this.isSearchInputActive.set(true);

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
  };
}
