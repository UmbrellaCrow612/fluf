import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  Signal,
  signal,
  Type,
} from '@angular/core';
import { ContextService } from '../../app-context/app-context.service';
import { fileEditorBottomActiveElement } from '../../app-context/type';
import { TerminalComponent } from '../../terminal/terminal.component';
import { NgComponentOutlet } from '@angular/common';
import { ProblemsComponent } from '../../problems/problems.component';

type btn = {
  label: string;
  element: fileEditorBottomActiveElement;
};

@Component({
  selector: 'app-open-file-container-bottom',
  imports: [NgComponentOutlet],
  templateUrl: './open-file-container-bottom.component.html',
  styleUrl: './open-file-container-bottom.component.css',
})
export class OpenFileContainerBottomComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly appContext = inject(ContextService);

  readonly activeElement = signal<fileEditorBottomActiveElement | null>(null);

  renderComponents: {
    component: Type<any>;
    condition: Signal<boolean>;
  }[] = [
    {
      component: TerminalComponent,
      condition: computed(() => this.activeElement() === 'terminal'),
    },
       {
      component: ProblemsComponent,
      condition: computed(() => this.activeElement() === 'problems'),
    },
  ];

  ngOnInit(): void {
    const init = this.appContext.getSnapshot();
    this.activeElement.set(init.fileEditorBottomActiveElement);

    this.appContext.autoSub(
      'fileEditorBottomActiveElement',
      (ctx) => {
        this.activeElement.set(ctx.fileEditorBottomActiveElement);
      },
      this.destroyRef
    );
  }

  /**
   * Returns the current active component who's condition's are met to be rendered
   */
  readonly activeComponent = computed<Type<any> | null>(() => {
    for (const item of this.renderComponents) {
      if (item.condition()) {
        return item.component;
      }
    }
    return null;
  });

  btnsList: btn[] = [
    {
      element: 'problems',
      label: 'Problems',
    },
    {
      element: 'terminal',
      label: 'Terminal',
    },
  ];

  buttonClicked(option: btn) {
    this.appContext.update('fileEditorBottomActiveElement', option.element);
  }
}
