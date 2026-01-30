import { Component, signal, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

type Action = {
  label: string;
  iconName: string;
};

@Component({
  selector: 'app-file-x-actions',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './file-x-actions.component.html',
  styleUrl: './file-x-actions.component.css',
})
export class FileXActionsComponent {
  defaultActions: Signal<Action[]> = signal([
    { label: 'New item', iconName: 'add' },
    { label: 'Cut item', iconName: 'content_cut' },
    { label: 'Copy item', iconName: 'content_copy' },
    { label: 'Paste item', iconName: 'content_paste' },
    { label: 'Delete item', iconName: 'delete' },
    { label: 'Rename item', iconName: 'edit' },
    { label: 'Select all', iconName: 'select_all' },
    { label: 'Refresh', iconName: 'refresh' },
  ]);
}
