import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-side-search',
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './side-search.component.html',
  styleUrl: './side-search.component.css'
})
export class SideSearchComponent {

  showExtraSearchOptions = true;
}
