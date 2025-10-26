import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-side-search-item',
  imports: [MatIconModule , MatButtonModule, MatTooltipModule],
  templateUrl: './side-search-item.component.html',
  styleUrl: './side-search-item.component.css'
})
export class SideSearchItemComponent {
  result = input.required<ripGrepResult>();

  showChildren = true;
  toggleChildren(){
    this.showChildren = !this.showChildren
  }
}
