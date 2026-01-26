import { Component, computed, inject, Signal, Type } from '@angular/core';
import { ContextService } from '../../app-context/app-context.service';
import { fileEditorBottomActiveElement } from '../../app-context/type';
import { TerminalComponent } from '../../terminal/terminal.component';
import { NgComponentOutlet } from '@angular/common';
import { ProblemsComponent } from '../../problems/problems.component';
import { Renderable } from '../../ngComponentOutlet/type';

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
export class OpenFileContainerBottomComponent {
  private readonly appContext = inject(ContextService);

  activeEl = computed(() => this.appContext.fileEditorBottomActiveElement());

  renderComponents: Renderable[] = [
    {
      component: TerminalComponent,
      condition: computed(() => this.activeEl() == 'terminal'),
    },
    {
      component: ProblemsComponent,
      condition: computed(() => this.activeEl() === 'problems'),
    },
  ];

  renderCompo: Signal<Type<any> | null> = computed(
    () => this.renderComponents.find((x) => x.condition())?.component ?? null,
  );

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
    this.appContext.fileEditorBottomActiveElement.set(option.element);
  }
}
