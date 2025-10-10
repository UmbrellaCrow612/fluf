import { Component, input, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-item',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './file-item.component.html',
  styleUrls: ['./file-item.component.css'],
})
export class FileItemComponent {
  readDirObject = input.required<ReadDirObject>();

  level = input.required<number>();

  expanded = false;

  toggleExpanded(event: MouseEvent) {
    // Prevent folder toggle from triggering on child clicks
    event.stopPropagation();

    if (!this.readDirObject().isFile) {
      this.expanded = !this.expanded;
    }
  }
}
