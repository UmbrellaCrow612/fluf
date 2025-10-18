import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ContextService } from '../../app-context/app-context.service';
import { fileEditorBottomActiveElement } from '../../app-context/type';
import { TerminalComponent } from "../../terminal/terminal.component";

type btn = {
  label: string;
  element: fileEditorBottomActiveElement;
};

@Component({
  selector: 'app-open-file-container-bottom',
  imports: [TerminalComponent],
  templateUrl: './open-file-container-bottom.component.html',
  styleUrl: './open-file-container-bottom.component.css',
})
export class OpenFileContainerBottomComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly appContext = inject(ContextService);

  activeElement: fileEditorBottomActiveElement | null = null;

  ngOnInit(): void {
    let init = this.appContext.getSnapshot();

    this.activeElement = init.fileEditorBottomActiveElement;

    this.appContext.autoSub(
      'fileEditorBottomActiveElement',
      (ctx) => {
        this.activeElement = ctx.fileEditorBottomActiveElement;
      },
      this.destroyRef
    );
  }

  btnsList: btn[] = [
    {
      element: 'problems',
      label: 'Problems',
    },
    {
      element: 'terminal',
      label: 'Terminal',
    },
    {
      element: 'debug-console',
      label: 'Debug console',
    },
    {
      element: 'ports',
      label: 'Ports',
    },
    {
      element: 'output',
      label: 'Output',
    },
  ];

  buttonClicked(option: btn) {
    this.appContext.update('fileEditorBottomActiveElement', option.element);
  }
}
