import {
  Component,
  ElementRef,
  inject,
  OnInit,
  viewChild,
} from '@angular/core';
import { InMemoryContextService } from '../app-context/app-in-memory-context.service';

/**
 * Component that will be used for multiple purpose's, such as quick file search and go to, open other parts of the editor and basically all other
 * features quick acesses.
 */
@Component({
  selector: 'app-command-palette',
  imports: [],
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.css',
})
export class CommandPaletteComponent implements OnInit {
  private readonly inMemoryContextService = inject(InMemoryContextService);

  /**
   * Refrence to the views dialog html element
   */
  dialog = viewChild<ElementRef<HTMLDialogElement>>('cmdPaletteDialog');

  ngOnInit(): void {
    let element = this.dialog()?.nativeElement;
    if (!element) {
      console.error('Dialog element not found');
      return;
    }

    element.addEventListener('click', (event) => {
      if (event.target === element) {
        element.close();
      }
    });

    element.addEventListener('close', () => {
      this.inMemoryContextService.showCommandPalette.update((x) => !x);
    });

    element.showModal();
  }
}
