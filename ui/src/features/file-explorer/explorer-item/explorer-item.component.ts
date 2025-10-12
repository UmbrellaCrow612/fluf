import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-explorer-item',
  imports: [MatIconModule],
  templateUrl: './explorer-item.component.html',
  styleUrl: './explorer-item.component.css',
})
export class ExplorerItemComponent {
  node = input.required<fileNode>();
  depth = input.required<number>();

  readChildren = output(); // pass read childrne to parent to update state

  expanded = false;

  itemClicked() {
    // expand if dir
    // push to ctx as file to open or show in file explorer
  }
}
