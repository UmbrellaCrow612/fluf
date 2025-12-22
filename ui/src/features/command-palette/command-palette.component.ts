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


  // make a list of items that have label thats fuxxy matched and then a user types what want renders a item component like vscode 
  // default have preface search:file:term
  // terminal:open
  // so we have it like that with auto complete
  // like how h sites do it when you type the tag like it auto completes fill tag in them they put there search term

  // design will be action:..action..:<any> match fuzy based on it 
  // for example a user types terminal:lists cmds like opne close then they slowly fill it in and press eneter 
  // default it will be search:file:term:
  // there wont be a bottom just the search input and auto completes below
  // or based on that it renders difrent component outlet like 
  // terminal: - then render terminal-cmd-component whichj display list of all of it's cmds then as they type more it filters them so you pass
  // <terminal-cmd searchTerm />
  /**
   * each renderable component would be 
   * {
   *  component
   *  signalRender computed => searchTerm contains -> input search term
   * }
   */
}
