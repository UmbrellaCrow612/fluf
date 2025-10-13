import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { ContextService } from '../app-context/app-context.service';

@Component({
  selector: 'app-editor',
  imports: [TopBarComponent, SideBarComponent],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css',
})
export class EditorComponent implements OnInit {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);

  leftFlex = 1;
  rightFlex = 1;
  isResizing = false;
  initResizer(event: MouseEvent) {
    event.preventDefault();
    this.isResizing = true;
    let previousX = event.clientX;
    const container = document.getElementById('resizer_container')!;

    const MIN_FLEX = 0.2;
    const sensitivity = (1 / container?.clientWidth) * 2;

    const mouseMove = (mouseMove: MouseEvent) => {
      if (!this.isResizing) return;

      const currentX = mouseMove.clientX;
      const deltaX = currentX - previousX;

      const total = this.leftFlex + this.rightFlex;

      if (deltaX > 0) {
        // moved right -> shrink RIGHT, grow LEFT
        const change = deltaX * sensitivity;
        this.rightFlex = Math.max(MIN_FLEX, this.rightFlex - change);
        this.leftFlex = Math.max(MIN_FLEX, this.leftFlex + change);
      } else if (deltaX < 0) {
        // moved left -> shrink LEFT, grow RIGHT
        const change = Math.abs(deltaX) * sensitivity;
        this.leftFlex = Math.max(MIN_FLEX, this.leftFlex - change);
        this.rightFlex = Math.max(MIN_FLEX, this.rightFlex + change);
      }

      // Re-normalise so leftFlex + rightFlex === total (keeps overall ratio consistent)
      const currentTotal = this.leftFlex + this.rightFlex;
      if (currentTotal !== 0) {
        this.leftFlex = (this.leftFlex / currentTotal) * total;
        this.rightFlex = (this.rightFlex / currentTotal) * total;
      }

      previousX = currentX;
    };

    const mouseUp = () => {
      this.isResizing = false;
      document.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('mouseup', mouseUp);
    };

    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('mouseup', mouseUp);
  }

  isLeftActive = false;

  ngOnInit(): void {
    // set stored state
    this.isLeftActive =
      this.appContext.getSnapShot().sideBarActiveElement != null;

    // subs
    this.appContext.autoSub(
      'side-bar-active-element',
      (ctx) => {
        this.isLeftActive = ctx.sideBarActiveElement != null;
      },
      this.destroyRef
    );
  }
}
