import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { getElectronApi } from '../../utils';
import { debounceTime, fromEvent, Subscription } from 'rxjs';

@Component({
  selector: 'app-top-bar',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.css',
})
export class TopBarComponent implements OnInit, OnDestroy {
  private readonly _api = getElectronApi();

  /**
   * Holds window maximized state
   */
  isMaximized = false;
  resizeSub: Subscription | null = null;

  ngOnInit(): void {
    this.resizeSub = fromEvent(window, 'resize')
      .pipe(debounceTime(250)) 
      .subscribe(() => {
        this.reloadMaxState();
      });
  }

  ngOnDestroy(): void {
    this.resizeSub?.unsubscribe();
  }

  /**
   * Re checks if a window is maximized for reestore
   */
  async reloadMaxState() {
    this.isMaximized = await this._api.isMaximized();
  }
  /**
   * Minimizes screen window
   */
  async minimize() {
    this._api.minimize();
  }

  /**
   * Maximizes screen window
   */
  async maximize() {
    this._api.maximize();
  }

  async restore() {
    this._api.restore();
  }

  /**
   * Closes screen window
   */
  close() {
    this._api.close();
  }
}
