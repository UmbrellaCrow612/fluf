import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideSearchItemComponent } from "./side-search-item/side-search-item.component";

@Component({
  selector: 'app-side-search',
  imports: [MatIconModule, MatButtonModule, MatTooltipModule, SideSearchItemComponent],
  templateUrl: './side-search.component.html',
  styleUrl: './side-search.component.css',
})
export class SideSearchComponent {
  showExtraSearchOptions = false;

  toggleExtraSearchOptions() {
    this.showExtraSearchOptions = !this.showExtraSearchOptions;
  }
}
