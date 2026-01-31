import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-file-x-tabs',
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './file-x-tabs.component.html',
  styleUrl: './file-x-tabs.component.css',
})
export class FileXTabsComponent {

}
