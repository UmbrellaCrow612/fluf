import { Component, ElementRef, OnInit, viewChild } from '@angular/core';

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
  /**
   * Refrence to the views dialog html element
   */
  dialog = viewChild<ElementRef<HTMLDialogElement>>('cmdPaletteDialog');

  ngOnInit(): void {
    let element = this.dialog()?.nativeElement
    if(!element){
      console.error("Dialog element not found")
      return;
    }
    element.showModal()
  }
}
