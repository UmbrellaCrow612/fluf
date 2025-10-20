import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ContextService } from '../../app-context/app-context.service';
import { getElectronApi } from '../../../utils';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';

type anonCallback = () => void;

@Component({
  selector: 'app-terminal-editor',
  imports: [ReactiveFormsModule],
  templateUrl: './terminal-editor.component.html',
  styleUrl: './terminal-editor.component.css',
})
export class TerminalEditorComponent implements OnInit, OnDestroy {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = getElectronApi();

  currentActiveTerminal: terminalInformation | null = null;
  currentActiveTerminalId: string | null = null;

  error: string | null = null;
  isLoading = false;

  cmdInputControl = new FormControl('', {
    validators: [Validators.required],
  });

  outputStr: string[] = [];
  unSub: anonCallback | null = null;

  async ngOnInit() {
    let init = this.appContext.getSnapshot();

    this.currentActiveTerminalId = init.currentActiveTerminald;
    this.currentActiveTerminal =
      init.terminals?.find((x) => x.id == this.currentActiveTerminalId) ?? null;

    this.initTerm();

    this.appContext.autoSub(
      'currentActiveTerminald',
      async (ctx) => {
        this.currentActiveTerminalId = ctx.currentActiveTerminald;
        this.currentActiveTerminal =
          ctx.terminals?.find((x) => x.id == this.currentActiveTerminalId) ??
          null;

        this.initTerm();
      },
      this.destroyRef
    );
  }

  ngOnDestroy() {
    if (this.unSub) {
      this.unSub();
    }
  }

  /**
   * Loads and binds ui to the terminal thats active and other state
   */
  initTerm() {
    this.error = null;
    this.isLoading = true;

    if (!this.currentActiveTerminal) {
      this.error = 'No terminal found';
      this.isLoading = false;
      this.outputStr = [];
      return;
    }

    if (this.unSub) {
      this.unSub();
    }

    this.unSub = this.api.onTerminalChange((data) => {
      if (data.id == this.currentActiveTerminalId) {
        this.outputStr.push(data.chunk);
      }
      console.log(data);
    });

    this.isLoading = false;
  }

  /**
   * Runs a custom cmd wants to be run
   */
  async onSubmit(event: Event) {
    event.preventDefault();

    if (!this.cmdInputControl.valid) {
      return;
    }

    let cmd = this.cmdInputControl.value;

    await this.api.runCmdsInTerminal(
      undefined,
      this.currentActiveTerminalId!,
      cmd!
    );

    this.cmdInputControl.setValue('');
  }
}
