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

import { form, Field, required, email } from '@angular/forms/signals';
import { SearchFileCommandComponent } from './search-file-command/search-file-command.component';

/**
 * Represents a command that can be selected for auto complete
 */
type Command = {
  /** The name of the command */
  label: string;

  /** Information about what the cmd does */
  description: string;

  /** Whats needed to match int the search term for it to be shown */
  prefix: string;

  /**
   * Computed signal to show the component to render for this cmd
   */
  component: Type<any>;
};

/**
 * Component that will be used for multiple purpose's, such as quick file search and go to, open other parts of the editor and basically all other
 * features quick acesses.
 */
@Component({
  selector: 'app-command-palette',
  imports: [Field],
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
  searchFrom = form(this.searchCommandModal, (schemaPath) => {
    required(schemaPath.term, { message: 'Term is required' });
  });

  /** If the auto complete drop down should be shown */
  showDropDown = signal(false)

  /** Holds for invalid state  */
  formInvalid = computed(() => this.searchFrom.term().invalid());

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
  currentActiveCommand = signal<Type<any> | null>(null);

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
    this.showDropDown.set(false)
    this.currentActiveCommand.set(command.component);
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
  ];
}
