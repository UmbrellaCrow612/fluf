import { Component, signal, Signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

type QuickAccessButton = {
  label: string;
  iconName: string;
};

/**
 * Renders on the left and shows folders like home, places, downloads etc
 */
@Component({
  selector: 'app-file-x-quick-access-folders',
  imports: [MatIcon],
  templateUrl: './file-x-quick-access-folders.component.html',
  styleUrl: './file-x-quick-access-folders.component.css',
})
export class FileXQuickAccessFoldersComponent {
  /**
   * The default places to show
   */
  defaultPlaces: Signal<QuickAccessButton[]> = signal([
    { label: 'Home', iconName: 'home' },
    { label: 'Desktop', iconName: 'desktop_windows' },
    { label: 'Documents', iconName: 'description' },
    { label: 'Downloads', iconName: 'download' },
    { label: 'Pictures', iconName: 'image' },
    { label: 'Music', iconName: 'music_note' },
    { label: 'Videos', iconName: 'video_library' },
    { label: 'Trash', iconName: 'delete' },
  ]);

  /**
   * The default remote netwrosk to show
   */
  defaultRemotes: Signal<QuickAccessButton[]> = signal([
    { label: 'Network', iconName: 'wifi' },
  ]);

  /**
   * The default recents to show
   */
  defaultRecents: Signal<QuickAccessButton[]> = signal([
    { label: 'Recent files', iconName: 'history' },
  ]);
}
