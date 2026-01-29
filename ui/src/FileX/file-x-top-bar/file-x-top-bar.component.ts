import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { getElectronApi } from '../../utils';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-file-x-top-bar',
  imports: [MatButtonModule, MatIconModule, MatTooltip],
  templateUrl: './file-x-top-bar.component.html',
  styleUrl: './file-x-top-bar.component.css',
})
export class FileXTopBarComponent implements OnInit, OnDestroy {
  private readonly electronApi = getElectronApi();

  ngOnInit(): void {
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onResize);
  }

  /** Rusn when `window` is resized */
  private onResize = async () => {
    let ismax = await this.electronApi.chromeWindowApi.isMaximized();
    this.isMaximized.set(ismax);
  };

  /**
   * Holds if the window is maximized
   */
  isMaximized = signal(false);

  /**
   * Minizes `this` window
   */
  minimize() {
    this.electronApi.chromeWindowApi.minimize();
  }

  /**
   * Used to close `this` window
   */
  close() {
    window.removeEventListener('resize', this.onResize);
    this.electronApi.chromeWindowApi.close();
  }

  /**
   * Either maximizes the `this` window if cropped or restore / full screen it
   */
  restoreOrMaximize() {
    if (this.isMaximized()) {
      this.electronApi.chromeWindowApi.restore();
    } else {
      this.electronApi.chromeWindowApi.maximize();
    }
  }
}
