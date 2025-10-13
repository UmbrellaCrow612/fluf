import {
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ContextService,
} from '../app-context/app-context.service';
import { sideBarActiveElement } from '../app-context/type';

@Component({
  selector: 'app-side-bar',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css',
})
export class SideBarComponent implements OnInit {
  private readonly _appCtx = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Keeps track of the current active side bar element
   */
  activeElement: sideBarActiveElement | null = null;

  ngOnInit(): void {
    this.activeElement = this._appCtx.getSnapShot().sideBarActiveElement;
    
    this._appCtx.autoSub(
      'side-bar-active-element',
      (ctx) => {
        this.activeElement = ctx.sideBarActiveElement;
      },
      this.destroyRef
    );
  }

  private toggleElement(element: sideBarActiveElement) {
    const newValue = this.activeElement === element ? null : element;

    this._appCtx.update(
      'sideBarActiveElement',
      newValue,
      'side-bar-active-element'
    );
  }

  toggleFileExplorer() {
    this.toggleElement('file-explorer');
  }

  toggleSearch() {
    this.toggleElement('search');
  }

  toggleSourceControl() {
    this.toggleElement('source-control');
  }

  toggleRunAndDebug() {
    this.toggleElement('run-and-debug');
  }

  toggleExtensions() {
    this.toggleElement('extensions');
  }
}
