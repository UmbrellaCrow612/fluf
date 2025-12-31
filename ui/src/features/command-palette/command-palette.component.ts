import {
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  Signal,
  signal,
  Type,
  viewChild,
} from '@angular/core';
import { InMemoryContextService } from '../app-context/app-in-memory-context.service';

import { form, Field } from '@angular/forms/signals';
import { SearchFileCommandComponent } from './search-file-command/search-file-command.component';
import { NgComponentOutlet } from '@angular/common';
import { Command } from './type';
import { themeCommands } from '../theme/commands/commands';

/**
 * Component that will be used for multiple purpose's, such as quick file search and go to, open other parts of the editor and basically all other
 * features quick acesses.
 */
@Component({
  selector: 'app-command-palette',
  imports: [Field, NgComponentOutlet],
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.css',
})
export class CommandPaletteComponent implements OnInit {
  private readonly inMemoryContextService = inject(InMemoryContextService);

  /** Model that is the shape of the form */
  searchCommandModal = signal({
    term: '',
  });

  /** Form holds model with validation rules */
  searchFrom = form(this.searchCommandModal);

  /** If the auto complete drop down should be shown */
  showDropDown = signal(false);

  /**
   * Refrence to the views dialog html element
   */
  dialog = viewChild<ElementRef<HTMLDialogElement>>('cmdPaletteDialog');

  /** Computed a filtered list of commands based on the search term  */
  filteredCommandList: Signal<Command[]> = computed(() => {
    const term = this.searchFrom.term().value().toLowerCase().trim();

    if (!term) {
      return this.commandList;
    }

    return this.commandList.filter((cmd) => {
      // Check if term matches the prefix
      const matchesPrefix = cmd.prefix.toLowerCase().includes(term);

      // Check if term matches the label
      const matchesLabel = cmd.label.toLowerCase().includes(term);

      // Check if term matches the description
      const matchesDescription = cmd.description.toLowerCase().includes(term);

      return matchesPrefix || matchesLabel || matchesDescription;
    });
  });

  /**
   * Holds the current command chosen and renders it's component for itF
   */
  currentActiveCommandComponent = signal<Type<any> | null>(null);

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

  commandClicked(command: Command) {
    this.searchFrom.term().setControlValue('');
    this.showDropDown.set(false);
    this.currentActiveCommandComponent.set(command.component);
  }

  onInput() {
    this.showDropDown.set(true);
  }

  /**
   * List of all commands available
   */
  commandList: Command[] = [
    {
      prefix: 'file:search',
      description: 'Search for a specific file',
      label: 'File search',
      component: SearchFileCommandComponent,
    },
    ...themeCommands,
  ];
}
