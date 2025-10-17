import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-file-tab-item',
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './file-tab-item.component.html',
  styleUrl: './file-tab-item.component.css'
})
export class FileTabItemComponent {

}
