import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { getElectronApi } from '../../../utils';

@Component({
  selector: 'app-explorer-item',
  imports: [MatIconModule],
  templateUrl: './explorer-item.component.html',
  styleUrl: './explorer-item.component.css',
})
export class ExplorerItemComponent {
  private readonly _api = getElectronApi();

  node = input.required<fileNode>();
  depth = input.required<number>();

  expanded = false;

  async itemClicked(event: Event) {
    event.preventDefault();
    if (this.node().isDirectory && !this.expanded) {
      let nodes = await this._api.readDir(undefined, this.node().path);
      this.node().children = nodes;
      this.expanded = true;
    } else {
      this.expanded = false;
    }
  }
}
